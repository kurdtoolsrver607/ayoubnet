import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Info,
  Clock,
  Plus,
} from 'lucide-react';
import { formatShortTimestamp, type TradingUserProfile } from '../tradingFirebase';
import type { TradingAnalytics } from '../analytics';

interface AnalysisTabProps {
  profile: TradingUserProfile;
  analytics: TradingAnalytics;
  baseEquity: number;
  onOpenJournal: () => void;
}

const EquitySparkline: React.FC<{ points: number[]; positive: boolean }> = ({ points, positive }) => {
  const safePoints = points.length >= 2 ? points : [points[0] || 10000, points[0] || 10000];
  const min = Math.min(...safePoints);
  const max = Math.max(...safePoints);
  const range = max - min || 1;
  const width = 480;
  const height = 112;
  const padY = 12;

  const coords = safePoints.map((val, idx) => {
    const x = (idx / Math.max(1, safePoints.length - 1)) * width;
    const y = height - padY - ((val - min) / range) * (height - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePath = `M ${coords.join(' L ')}`;
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;
  const stroke = positive ? '#10B981' : '#EF4444';
  const gradId = positive ? 'trEqPos' : 'trEqNeg';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: '112px', display: 'block' }}
      aria-label="Account equity curve"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const AnalysisTab: React.FC<AnalysisTabProps> = ({
  profile,
  analytics,
  baseEquity,
  onOpenJournal,
}) => {
  const isPositiveGrowth = analytics.growthPercent >= 0;
  const currentEquity =
    analytics.equityCurve.length > 0
      ? analytics.equityCurve[analytics.equityCurve.length - 1]
      : baseEquity;

  const winShare =
    analytics.closedTrades > 0 ? Math.round((analytics.wins / analytics.closedTrades) * 100) : 0;
  const lossShare = analytics.closedTrades > 0 ? 100 - winShare : 0;

  const initials = (profile.displayName || profile.email || 'T')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Account Status Header Card */}
      <section className="tr-card" style={{ padding: '20px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(20,184,166,0.12))',
                border: '1px solid var(--tr-buy-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6EE7B7',
                fontWeight: 800,
                fontSize: '16px',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: '19px',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: '#F8FAFC',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {profile.displayName}
                </h1>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 9px',
                    borderRadius: '999px',
                    background: 'var(--tr-buy-soft)',
                    border: '1px solid var(--tr-buy-border)',
                    color: '#6EE7B7',
                    fontSize: '11.5px',
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={12} />
                  Up to date
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '4px',
                  fontSize: '12.5px',
                  color: 'var(--tr-muted)',
                }}
              >
                <span>
                  Active record: <strong style={{ color: 'var(--tr-text-secondary)' }}>{analytics.recordDays}d</strong>
                </span>
                <span>·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  Updated {formatShortTimestamp(analytics.lastUpdatedMs)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenJournal}
            className="tr-btn tr-btn-primary tr-btn-sm tr-press"
          >
            <Plus size={16} />
            <span>Log Trade</span>
          </button>
        </div>

        {/* Hero Growth & Equity Curve Strip */}
        <div
          style={{
            marginTop: '18px',
            paddingTop: '16px',
            borderTop: '1px solid var(--tr-border)',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: 'var(--tr-muted)', fontWeight: 600 }}>
                Account Growth (Base ${baseEquity.toLocaleString()})
              </div>
              <div
                className="tr-mono"
                style={{
                  fontSize: '30px',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: isPositiveGrowth ? 'var(--tr-buy)' : 'var(--tr-sell)',
                  marginTop: '2px',
                }}
              >
                {isPositiveGrowth ? '+' : ''}
                {analytics.growthPercent.toFixed(2)}%
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: 'var(--tr-muted)', fontWeight: 600 }}>
                Estimated Equity
              </div>
              <div
                className="tr-mono"
                style={{ fontSize: '18px', fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}
              >
                ${currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div
                className="tr-mono"
                style={{
                  fontSize: '12px',
                  color: analytics.netPips >= 0 ? '#6EE7B7' : '#FCA5A5',
                }}
              >
                {analytics.netPips >= 0 ? '+' : ''}
                {analytics.netPips} net pips
              </div>
            </div>
          </div>

          <div
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
              background: 'rgba(11, 15, 23, 0.72)',
              border: '1px solid var(--tr-border)',
              padding: '8px 6px 0',
            }}
          >
            <EquitySparkline points={analytics.equityCurve} positive={isPositiveGrowth} />
          </div>
        </div>
      </section>

      {/* Smart Rule-Based Guidance Box */}
      <section className="tr-card" style={{ padding: '18px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>
            Desk Discipline Guidance
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--tr-muted)' }}>
            Auto-analyzed from your journal
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {analytics.guidance.map((item) => {
            const palette =
              item.tone === 'positive'
                ? {
                    bg: 'var(--tr-buy-soft)',
                    border: 'var(--tr-buy-border)',
                    iconColor: 'var(--tr-buy)',
                    Icon: CheckCircle2,
                  }
                : item.tone === 'danger'
                ? {
                    bg: 'var(--tr-sell-soft)',
                    border: 'var(--tr-sell-border)',
                    iconColor: 'var(--tr-sell)',
                    Icon: ShieldAlert,
                  }
                : item.tone === 'warning'
                ? {
                    bg: 'var(--tr-amber-soft)',
                    border: 'var(--tr-amber-border)',
                    iconColor: 'var(--tr-amber)',
                    Icon: AlertTriangle,
                  }
                : {
                    bg: 'var(--tr-blue-soft)',
                    border: 'rgba(56, 189, 248, 0.3)',
                    iconColor: 'var(--tr-blue)',
                    Icon: Info,
                  };

            const IconComponent = palette.Icon;

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: palette.bg,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <IconComponent
                  size={18}
                  style={{ color: palette.iconColor, flexShrink: 0, marginTop: '2px' }}
                />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--tr-text-secondary)', marginTop: '2px' }}>
                    {item.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Performance Metrics Grid */}
      <section className="tr-stats-grid" aria-label="Performance Statistics">
        {/* Growth % */}
        <div className="tr-card tr-card-hover">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--tr-muted)', fontSize: '12px', fontWeight: 600 }}>
            <span>Growth %</span>
            {isPositiveGrowth ? (
              <TrendingUp size={15} style={{ color: 'var(--tr-buy)' }} />
            ) : (
              <TrendingDown size={15} style={{ color: 'var(--tr-sell)' }} />
            )}
          </div>
          <div
            className="tr-mono"
            style={{
              fontSize: '22px',
              fontWeight: 800,
              marginTop: '8px',
              color: isPositiveGrowth ? 'var(--tr-buy)' : 'var(--tr-sell)',
            }}
          >
            {isPositiveGrowth ? '+' : ''}
            {analytics.growthPercent.toFixed(2)}%
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--tr-muted)', marginTop: '4px' }}>
            {analytics.closedTrades} closed trades
          </div>
        </div>

        {/* Max Drawdown % */}
        <div className="tr-card tr-card-hover">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--tr-muted)', fontSize: '12px', fontWeight: 600 }}>
            <span>Max Drawdown</span>
            <TrendingDown size={15} style={{ color: 'var(--tr-sell)' }} />
          </div>
          <div
            className="tr-mono"
            style={{
              fontSize: '22px',
              fontWeight: 800,
              marginTop: '8px',
              color: analytics.maxDrawdownPercent > 8 ? 'var(--tr-sell)' : '#F8FAFC',
            }}
          >
            -{analytics.maxDrawdownPercent.toFixed(2)}%
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--tr-muted)', marginTop: '4px' }}>
            Peak-to-trough
          </div>
        </div>

        {/* Win Rate % */}
        <div className="tr-card tr-card-hover">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--tr-muted)', fontSize: '12px', fontWeight: 600 }}>
            <span>Win Rate</span>
            <Target size={15} style={{ color: 'var(--tr-teal)' }} />
          </div>
          <div
            className="tr-mono"
            style={{
              fontSize: '22px',
              fontWeight: 800,
              marginTop: '8px',
              color: analytics.winRate >= 50 ? 'var(--tr-buy)' : '#F8FAFC',
            }}
          >
            {analytics.winRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--tr-muted)', marginTop: '4px' }}>
            Avg R:R 1:{analytics.avgRiskReward.toFixed(2)}
          </div>
        </div>

        {/* Profit Factor */}
        <div className="tr-card tr-card-hover">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--tr-muted)', fontSize: '12px', fontWeight: 600 }}>
            <span>Profit Factor</span>
            <Activity size={15} style={{ color: 'var(--tr-blue)' }} />
          </div>
          <div
            className="tr-mono"
            style={{
              fontSize: '22px',
              fontWeight: 800,
              marginTop: '8px',
              color: analytics.profitFactor >= 1.5 ? 'var(--tr-buy)' : '#F8FAFC',
            }}
          >
            {analytics.profitFactor.toFixed(2)}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--tr-muted)', marginTop: '4px' }}>
            Gross win / loss
          </div>
        </div>

        {/* Total Lots */}
        <div className="tr-card tr-card-hover">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--tr-muted)', fontSize: '12px', fontWeight: 600 }}>
            <span>Total Lots</span>
            <Layers size={15} style={{ color: 'var(--tr-amber)' }} />
          </div>
          <div className="tr-mono" style={{ fontSize: '22px', fontWeight: 800, marginTop: '8px', color: '#F8FAFC' }}>
            {analytics.totalLots.toFixed(2)}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--tr-muted)', marginTop: '4px' }}>
            Logged volume
          </div>
        </div>

        {/* Total Trades */}
        <div className="tr-card tr-card-hover">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--tr-muted)', fontSize: '12px', fontWeight: 600 }}>
            <span>Total Trades</span>
            <BarChart3 size={15} style={{ color: 'var(--tr-text-secondary)' }} />
          </div>
          <div className="tr-mono" style={{ fontSize: '22px', fontWeight: 800, marginTop: '8px', color: '#F8FAFC' }}>
            {analytics.totalTrades}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--tr-muted)', marginTop: '4px' }}>
            {analytics.activeTrades} active · {analytics.pendingTrades} pending
          </div>
        </div>

        {/* Wins vs Stop Losses (Span 2 on mobile/tablet) */}
        <div className="tr-card tr-card-hover" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--tr-muted)' }}>
            <span>Wins vs. Stop Losses (SL)</span>
            <span className="tr-mono" style={{ color: 'var(--tr-text-secondary)' }}>
              +{analytics.grossWinPips} / -{analytics.grossLossPips} pips
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginTop: '10px',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="tr-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--tr-buy)' }}>
                {analytics.wins}
              </span>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#6EE7B7' }}>
                Wins ({winShare}%)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#FCA5A5' }}>
                SL Hits ({lossShare}%)
              </span>
              <span className="tr-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--tr-sell)' }}>
                {analytics.losses}
              </span>
            </div>
          </div>

          {/* Ratio Bar */}
          <div
            style={{
              height: '10px',
              width: '100%',
              borderRadius: '99px',
              overflow: 'hidden',
              background: 'rgba(148, 163, 184, 0.14)',
              display: 'flex',
            }}
          >
            {analytics.closedTrades > 0 && (
              <>
                <div
                  style={{
                    width: `${winShare}%`,
                    background: 'linear-gradient(90deg, #10B981, #14B8A6)',
                    transition: 'width 260ms ease',
                  }}
                />
                <div
                  style={{
                    width: `${lossShare}%`,
                    background: '#EF4444',
                    transition: 'width 260ms ease',
                  }}
                />
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
