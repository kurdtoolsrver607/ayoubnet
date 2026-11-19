import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  LineChart,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Trash2,
  Edit3,
  X,
  AlertTriangle,
} from 'lucide-react';
import {
  addTradeSignal,
  updateTradeSignal,
  deleteTradeSignal,
  formatShortTimestamp,
  type TradeDirection,
  type TradeSignal,
  type TradeStatus,
} from '../tradingFirebase';
import { calculateRiskReward, estimatePips } from '../analytics';
import { TradingViewMiniChart } from './TradingViewWidgets';

interface JournalTabProps {
  uid: string;
  trades: TradeSignal[];
  openModalSignal?: number;
}

const POPULAR_PAIRS = ['XAUUSD', 'XAGUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'AUDUSD', 'BTCUSD'];
const DIRECTIONS: TradeDirection[] = ['BUY', 'SELL', 'BUY LIMIT', 'SELL LIMIT'];
const STATUSES: TradeStatus[] = ['Pending', 'Active', 'Won', 'Lost'];

interface TradeFormState {
  pair: string;
  type: TradeDirection;
  entryPrice: string;
  stopLoss: string;
  tp1: string;
  tp2: string;
  tp3: string;
  lotSize: string;
  status: TradeStatus;
  pips: string;
  notes: string;
}

const emptyForm: TradeFormState = {
  pair: 'XAUUSD',
  type: 'BUY',
  entryPrice: '',
  stopLoss: '',
  tp1: '',
  tp2: '',
  tp3: '',
  lotSize: '0.10',
  status: 'Active',
  pips: '0',
  notes: '',
};

export const JournalTab: React.FC<JournalTabProps> = ({ uid, trades, openModalSignal = 0 }) => {
  const [filter, setFilter] = useState<'All' | TradeStatus>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCharts, setExpandedCharts] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [form, setForm] = useState<TradeFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Allow parent (Analysis tab "Log Trade" CTA) to open composer cleanly
  React.useEffect(() => {
    if (openModalSignal > 0) {
      openNewTradeModal();
    }
  }, [openModalSignal]);

  const openNewTradeModal = () => {
    setEditingTradeId(null);
    setForm(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditTradeModal = (trade: TradeSignal) => {
    setEditingTradeId(trade.id);
    setForm({
      pair: trade.pair,
      type: trade.type,
      entryPrice: String(trade.entryPrice),
      stopLoss: String(trade.stopLoss),
      tp1: String(trade.tp1),
      tp2: trade.tp2 !== null && trade.tp2 !== undefined ? String(trade.tp2) : '',
      tp3: trade.tp3 !== null && trade.tp3 !== undefined ? String(trade.tp3) : '',
      lotSize: String(trade.lotSize),
      status: trade.status,
      pips: String(trade.pips),
      notes: trade.notes || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const liveRR = useMemo(() => {
    return calculateRiskReward(
      parseFloat(form.entryPrice),
      parseFloat(form.stopLoss),
      parseFloat(form.tp1),
      form.type
    );
  }, [form.entryPrice, form.stopLoss, form.tp1, form.type]);

  const liveTp1Pips = useMemo(() => {
    return estimatePips(form.pair, parseFloat(form.entryPrice), parseFloat(form.tp1));
  }, [form.pair, form.entryPrice, form.tp1]);

  const liveSlPips = useMemo(() => {
    return estimatePips(form.pair, parseFloat(form.entryPrice), parseFloat(form.stopLoss));
  }, [form.pair, form.entryPrice, form.stopLoss]);

  const filteredTrades = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return trades.filter((t) => {
      if (filter !== 'All' && t.status !== filter) return false;
      if (!q) return true;
      return (
        t.pair.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q)
      );
    });
  }, [trades, filter, searchTerm]);

  const handleStatusChange = async (trade: TradeSignal, nextStatus: TradeStatus) => {
    setBusyId(trade.id);
    try {
      let nextPips = trade.pips;
      if (nextStatus === 'Won' && (!nextPips || nextPips <= 0)) {
        nextPips = estimatePips(trade.pair, trade.entryPrice, trade.tp1);
      } else if (nextStatus === 'Lost') {
        const slPips = estimatePips(trade.pair, trade.entryPrice, trade.stopLoss);
        nextPips = slPips > 0 ? -slPips : -Math.abs(nextPips || 0);
      }
      await updateTradeSignal(uid, trade.id, { status: nextStatus, pips: nextPips });
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (tradeId: string) => {
    setBusyId(tradeId);
    try {
      await deleteTradeSignal(uid, tradeId);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Failed to delete trade:', err);
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const pair = form.pair.trim().toUpperCase();
    const entryPrice = parseFloat(form.entryPrice);
    const stopLoss = parseFloat(form.stopLoss);
    const tp1 = parseFloat(form.tp1);
    const tp2 = form.tp2.trim() ? parseFloat(form.tp2) : null;
    const tp3 = form.tp3.trim() ? parseFloat(form.tp3) : null;
    const lotSize = parseFloat(form.lotSize);
    let pips = parseFloat(form.pips);

    if (!pair) {
      setFormError('Please enter a trading pair (e.g. XAUUSD).');
      return;
    }
    if (Number.isNaN(entryPrice) || Number.isNaN(stopLoss) || Number.isNaN(tp1)) {
      setFormError('Entry Price, Stop Loss, and TP1 must be valid numbers.');
      return;
    }
    if (Number.isNaN(lotSize) || lotSize <= 0) {
      setFormError('Lot size must be greater than 0.');
      return;
    }
    if (Number.isNaN(pips)) {
      pips = 0;
    }
    if (form.status === 'Won' && pips === 0) {
      pips = estimatePips(pair, entryPrice, tp1);
    } else if (form.status === 'Lost' && pips === 0) {
      pips = -estimatePips(pair, entryPrice, stopLoss);
    } else if (form.status === 'Lost' && pips > 0) {
      pips = -Math.abs(pips);
    }

    const riskReward = calculateRiskReward(entryPrice, stopLoss, tp1, form.type);

    setSaving(true);
    try {
      if (editingTradeId) {
        await updateTradeSignal(uid, editingTradeId, {
          pair,
          type: form.type,
          entryPrice,
          stopLoss,
          tp1,
          tp2,
          tp3,
          lotSize,
          status: form.status,
          pips,
          riskReward,
          notes: form.notes,
        });
      } else {
        await addTradeSignal(uid, {
          pair,
          type: form.type,
          entryPrice,
          stopLoss,
          tp1,
          tp2,
          tp3,
          lotSize,
          status: form.status,
          pips,
          riskReward,
          notes: form.notes,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save trade signal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header & Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#F8FAFC' }}>
            Private Trading Journal
          </h1>
          <div style={{ fontSize: '12.5px', color: 'var(--tr-muted)', marginTop: '2px' }}>
            {trades.length} private signal{trades.length === 1 ? '' : 's'} · Visible only to your account
          </div>
        </div>

        <button
          type="button"
          onClick={openNewTradeModal}
          className="tr-btn tr-btn-primary tr-btn-sm tr-press"
        >
          <Plus size={16} />
          <span>New Signal</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <div className="tr-segmented" role="tablist" aria-label="Filter trades by status">
          {(['All', 'Active', 'Pending', 'Won', 'Lost'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={filter === tab}
              className={`tr-seg-btn tr-press ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--tr-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="search"
            className="tr-input"
            style={{ paddingLeft: '36px', minHeight: '42px' }}
            placeholder="Search pair or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Signal Cards List */}
      {filteredTrades.length === 0 ? (
        <div
          className="tr-card"
          style={{
            textAlign: 'center',
            padding: '44px 20px',
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>
            {trades.length === 0 ? 'No trades logged yet' : 'No trades match your filter'}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--tr-muted)', margin: '6px auto 18px', maxWidth: '340px' }}>
            {trades.length === 0
              ? 'Tap the + button to record your first BUY or SELL setup with Entry, SL, and TP targets.'
              : 'Try switching the status filter or clearing your search query.'}
          </p>
          {trades.length === 0 && (
            <button
              type="button"
              onClick={openNewTradeModal}
              className="tr-btn tr-btn-primary tr-press"
            >
              <Plus size={17} />
              <span>Log First Setup</span>
            </button>
          )}
        </div>
      ) : (
        <div className="tr-signals-grid">
          {filteredTrades.map((trade) => {
            const isBuy = trade.type.startsWith('BUY');
            const chartOpen = Boolean(expandedCharts[trade.id]);
            const rr =
              trade.riskReward > 0
                ? trade.riskReward
                : calculateRiskReward(trade.entryPrice, trade.stopLoss, trade.tp1, trade.type);

            const statusBadge =
              trade.status === 'Won'
                ? { bg: 'var(--tr-buy-soft)', border: 'var(--tr-buy-border)', color: '#6EE7B7', Icon: CheckCircle2 }
                : trade.status === 'Lost'
                ? { bg: 'var(--tr-sell-soft)', border: 'var(--tr-sell-border)', color: '#FCA5A5', Icon: XCircle }
                : trade.status === 'Active'
                ? { bg: 'var(--tr-blue-soft)', border: 'rgba(56,189,248,0.34)', color: '#7DD3FC', Icon: Activity }
                : { bg: 'var(--tr-amber-soft)', border: 'var(--tr-amber-border)', color: '#FCD34D', Icon: Clock };

            const StatusIcon = statusBadge.Icon;

            return (
              <article key={trade.id} className="tr-card tr-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Card Top Header: Pair + Direction + Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span
                      className="tr-mono"
                      style={{
                        fontSize: '16px',
                        fontWeight: 800,
                        letterSpacing: '0.01em',
                        color: '#F8FAFC',
                      }}
                    >
                      {trade.pair}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 9px',
                        borderRadius: '8px',
                        background: isBuy ? 'var(--tr-buy-soft)' : 'var(--tr-sell-soft)',
                        border: `1px solid ${isBuy ? 'var(--tr-buy-border)' : 'var(--tr-sell-border)'}`,
                        color: isBuy ? '#6EE7B7' : '#FCA5A5',
                        fontSize: '11.5px',
                        fontWeight: 800,
                      }}
                    >
                      {isBuy ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {trade.type}
                    </span>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: statusBadge.bg,
                      border: `1px solid ${statusBadge.border}`,
                      color: statusBadge.color,
                      fontSize: '11.5px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    <StatusIcon size={12} />
                    {trade.status}
                  </span>
                </div>

                {/* Telegram-Style Entry / SL / TP Grid */}
                <div className="tr-price-grid">
                  <div className="tr-price-cell">
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--tr-muted)' }}>ENTRY</span>
                    <span className="tr-mono" style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>
                      {trade.entryPrice}
                    </span>
                  </div>
                  <div className="tr-price-cell" style={{ borderColor: 'rgba(239, 68, 68, 0.25)' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#FCA5A5' }}>SL</span>
                    <span className="tr-mono" style={{ fontSize: '13.5px', fontWeight: 700, color: '#FCA5A5' }}>
                      {trade.stopLoss}
                    </span>
                  </div>
                  <div className="tr-price-cell" style={{ borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#6EE7B7' }}>TP1</span>
                    <span className="tr-mono" style={{ fontSize: '13.5px', fontWeight: 700, color: '#6EE7B7' }}>
                      {trade.tp1}
                    </span>
                  </div>
                  <div className="tr-price-cell">
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--tr-muted)' }}>TP2</span>
                    <span className="tr-mono" style={{ fontSize: '13.5px', fontWeight: 600, color: trade.tp2 ? '#A7F3D0' : 'var(--tr-muted)' }}>
                      {trade.tp2 ?? '—'}
                    </span>
                  </div>
                  <div className="tr-price-cell">
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--tr-muted)' }}>TP3</span>
                    <span className="tr-mono" style={{ fontSize: '13.5px', fontWeight: 600, color: trade.tp3 ? '#A7F3D0' : 'var(--tr-muted)' }}>
                      {trade.tp3 ?? '—'}
                    </span>
                  </div>
                </div>

                {/* Compact Unboxed Metadata Row */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    fontSize: '12.5px',
                    color: 'var(--tr-muted)',
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                    <span>
                      Lot <strong className="tr-mono" style={{ color: '#F8FAFC' }}>{trade.lotSize.toFixed(2)}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      R:R <strong className="tr-mono" style={{ color: '#F8FAFC' }}>1:{rr.toFixed(2)}</strong>
                    </span>
                    <span>·</span>
                    <span
                      className="tr-mono"
                      style={{
                        fontWeight: 700,
                        color:
                          trade.pips > 0
                            ? 'var(--tr-buy)'
                            : trade.pips < 0
                            ? 'var(--tr-sell)'
                            : 'var(--tr-text-secondary)',
                      }}
                    >
                      {trade.pips > 0 ? `+${trade.pips}` : trade.pips} pips
                    </span>
                  </div>
                  <span style={{ fontSize: '11.5px' }}>{formatShortTimestamp(trade.createdAt)}</span>
                </div>

                {trade.notes && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: '12.5px',
                      color: 'var(--tr-text-secondary)',
                      background: 'rgba(11, 15, 23, 0.55)',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--tr-border)',
                    }}
                  >
                    {trade.notes}
                  </p>
                )}

                {/* Toggleable TradingView Mini-Chart */}
                {chartOpen && <TradingViewMiniChart pair={trade.pair} height={210} />}

                {/* Action Footer */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--tr-border)',
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <button
                      type="button"
                      className="tr-btn tr-btn-sm tr-press"
                      onClick={() =>
                        setExpandedCharts((prev) => ({ ...prev, [trade.id]: !prev[trade.id] }))
                      }
                    >
                      <LineChart size={14} />
                      <span>{chartOpen ? 'Hide Chart' : 'Chart'}</span>
                    </button>

                    {trade.status !== 'Won' && (
                      <button
                        type="button"
                        disabled={busyId === trade.id}
                        className="tr-btn tr-btn-buy tr-btn-sm tr-press"
                        onClick={() => handleStatusChange(trade, 'Won')}
                      >
                        <CheckCircle2 size={14} />
                        <span>Hit TP</span>
                      </button>
                    )}

                    {trade.status !== 'Lost' && (
                      <button
                        type="button"
                        disabled={busyId === trade.id}
                        className="tr-btn tr-btn-danger tr-btn-sm tr-press"
                        onClick={() => handleStatusChange(trade, 'Lost')}
                      >
                        <XCircle size={14} />
                        <span>Hit SL</span>
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {confirmDeleteId === trade.id ? (
                      <>
                        <button
                          type="button"
                          disabled={busyId === trade.id}
                          className="tr-btn tr-btn-danger tr-btn-sm tr-press"
                          onClick={() => handleDelete(trade.id)}
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          className="tr-btn tr-btn-sm tr-press"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          aria-label="Edit trade"
                          className="tr-btn tr-btn-sm tr-press"
                          style={{ padding: '7px 10px' }}
                          onClick={() => openEditTradeModal(trade)}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete trade"
                          className="tr-btn tr-btn-sm tr-press"
                          style={{ padding: '7px 10px', color: '#FCA5A5' }}
                          onClick={() => setConfirmDeleteId(trade.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Floating + Action Button */}
      <button
        type="button"
        aria-label="Log new trade signal"
        onClick={openNewTradeModal}
        className="tr-fab tr-press"
      >
        <Plus size={26} strokeWidth={2.6} />
      </button>

      {/* Bottom Sheet / Modal for Logging or Editing Trade */}
      {isModalOpen && (
        <div
          className="tr-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="tr-sheet" role="dialog" aria-modal="true" aria-labelledby="tr-signal-modal-title">
            <div className="tr-sheet-handle" />
            <div className="tr-sheet-header">
              <div>
                <h2 id="tr-signal-modal-title" style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#F8FAFC' }}>
                  {editingTradeId ? 'Edit Trade Signal' : 'Log Private Trade Signal'}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--tr-muted)' }}>
                  Auto-calculates Risk:Reward &amp; account metrics
                </div>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setIsModalOpen(false)}
                className="tr-btn tr-btn-sm tr-press"
                style={{ padding: '6px 8px', minHeight: '36px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="tr-sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {formError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'var(--tr-sell-soft)',
                      border: '1px solid var(--tr-sell-border)',
                      color: '#FECACA',
                      fontSize: '12.5px',
                    }}
                  >
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Quick Pair Picker */}
                <div>
                  <label className="tr-label" htmlFor="tr-pair-input">
                    Instrument / Pair
                  </label>
                  <input
                    id="tr-pair-input"
                    type="text"
                    className="tr-input tr-mono"
                    value={form.pair}
                    onChange={(e) => setForm({ ...form, pair: e.target.value.toUpperCase() })}
                    placeholder="XAUUSD"
                    required
                  />
                  <div className="tr-scroll-x" style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    {POPULAR_PAIRS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm({ ...form, pair: p })}
                        className="tr-seg-btn tr-mono tr-press"
                        style={{
                          minHeight: '32px',
                          padding: '4px 10px',
                          border:
                            form.pair === p
                              ? '1px solid var(--tr-buy-border)'
                              : '1px solid var(--tr-border)',
                          background: form.pair === p ? 'var(--tr-buy-soft)' : 'rgba(11,15,23,0.7)',
                          color: form.pair === p ? '#6EE7B7' : 'var(--tr-muted)',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order Type Selector */}
                <div>
                  <label className="tr-label">Order Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {DIRECTIONS.map((dir) => {
                      const active = form.type === dir;
                      const buyDir = dir.startsWith('BUY');
                      return (
                        <button
                          key={dir}
                          type="button"
                          onClick={() => setForm({ ...form, type: dir })}
                          className="tr-btn tr-btn-sm tr-press"
                          style={{
                            borderColor: active
                              ? buyDir
                                ? 'var(--tr-buy-border)'
                                : 'var(--tr-sell-border)'
                              : 'var(--tr-border)',
                            background: active
                              ? buyDir
                                ? 'var(--tr-buy-soft)'
                                : 'var(--tr-sell-soft)'
                              : 'rgba(11,15,23,0.7)',
                            color: active ? (buyDir ? '#6EE7B7' : '#FCA5A5') : 'var(--tr-muted)',
                          }}
                        >
                          {dir}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Levels Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div>
                    <label className="tr-label" htmlFor="tr-entry">Entry Price *</label>
                    <input
                      id="tr-entry"
                      type="number"
                      step="any"
                      className="tr-input tr-mono"
                      placeholder="2645.50"
                      value={form.entryPrice}
                      onChange={(e) => setForm({ ...form, entryPrice: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="tr-label" htmlFor="tr-sl">Stop Loss (SL) *</label>
                    <input
                      id="tr-sl"
                      type="number"
                      step="any"
                      className="tr-input tr-mono"
                      placeholder="2638.00"
                      value={form.stopLoss}
                      onChange={(e) => setForm({ ...form, stopLoss: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="tr-label" htmlFor="tr-tp1">TP 1 *</label>
                    <input
                      id="tr-tp1"
                      type="number"
                      step="any"
                      className="tr-input tr-mono"
                      placeholder="2660.50"
                      value={form.tp1}
                      onChange={(e) => setForm({ ...form, tp1: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="tr-label" htmlFor="tr-tp2">TP 2 (optional)</label>
                    <input
                      id="tr-tp2"
                      type="number"
                      step="any"
                      className="tr-input tr-mono"
                      placeholder="2675.00"
                      value={form.tp2}
                      onChange={(e) => setForm({ ...form, tp2: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="tr-label" htmlFor="tr-tp3">TP 3 (optional)</label>
                    <input
                      id="tr-tp3"
                      type="number"
                      step="any"
                      className="tr-input tr-mono"
                      placeholder="2695.00"
                      value={form.tp3}
                      onChange={(e) => setForm({ ...form, tp3: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="tr-label" htmlFor="tr-lots">Lot Size *</label>
                    <input
                      id="tr-lots"
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="tr-input tr-mono"
                      value={form.lotSize}
                      onChange={(e) => setForm({ ...form, lotSize: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Live Risk:Reward Preview Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(11, 15, 23, 0.85)',
                    border: '1px solid var(--tr-border-strong)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--tr-muted)', fontWeight: 600 }}>
                      Auto Risk : Reward (TP1)
                    </div>
                    <div
                      className="tr-mono"
                      style={{
                        fontSize: '18px',
                        fontWeight: 800,
                        color: liveRR >= 2 ? 'var(--tr-buy)' : liveRR > 0 ? 'var(--tr-amber)' : 'var(--tr-muted)',
                      }}
                    >
                      {liveRR > 0 ? `1 : ${liveRR.toFixed(2)}` : '—'}
                    </div>
                  </div>
                  <div className="tr-mono" style={{ fontSize: '12px', color: 'var(--tr-text-secondary)', textAlign: 'right' }}>
                    <div>SL risk: {liveSlPips} pips</div>
                    <div style={{ color: '#6EE7B7' }}>TP1 reward: +{liveTp1Pips} pips</div>
                  </div>
                </div>

                {/* Status & Pips */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div>
                    <label className="tr-label" htmlFor="tr-status">Status</label>
                    <select
                      id="tr-status"
                      className="tr-select"
                      value={form.status}
                      onChange={(e) => {
                        const nextStatus = e.target.value as TradeStatus;
                        let nextPips = form.pips;
                        if (nextStatus === 'Won' && liveTp1Pips > 0) {
                          nextPips = String(liveTp1Pips);
                        } else if (nextStatus === 'Lost' && liveSlPips > 0) {
                          nextPips = String(-liveSlPips);
                        }
                        setForm({ ...form, status: nextStatus, pips: nextPips });
                      }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} style={{ background: '#111827' }}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="tr-label" htmlFor="tr-pips">Pips Result</label>
                    <input
                      id="tr-pips"
                      type="number"
                      step="any"
                      className="tr-input tr-mono"
                      placeholder="e.g. 120 or -45"
                      value={form.pips}
                      onChange={(e) => setForm({ ...form, pips: e.target.value })}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="tr-label" htmlFor="tr-notes">Setup Notes</label>
                  <textarea
                    id="tr-notes"
                    className="tr-textarea"
                    placeholder="London session liquidity sweep, H4 order block confirmation..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    maxLength={1000}
                  />
                </div>
              </div>

              <div className="tr-sheet-footer">
                <button
                  type="button"
                  className="tr-btn tr-press"
                  style={{ flex: 1 }}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="tr-btn tr-btn-primary tr-press"
                  style={{ flex: 2 }}
                >
                  {saving ? 'Saving...' : editingTradeId ? 'Save Changes' : 'Save Trade Signal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
