import { getTimestampMs, type TradeDirection, type TradeSignal } from './tradingFirebase';

export interface GuidanceItem {
  id: string;
  tone: 'positive' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
}

export interface TradingAnalytics {
  totalTrades: number;
  closedTrades: number;
  activeTrades: number;
  pendingTrades: number;
  wins: number;
  losses: number;
  winRate: number; // 0 - 100
  profitFactor: number; // gross win / gross loss
  growthPercent: number;
  maxDrawdownPercent: number;
  totalLots: number;
  netPips: number;
  grossWinPips: number;
  grossLossPips: number;
  avgRiskReward: number;
  recordDays: number;
  lastUpdatedMs: number;
  equityCurve: number[]; // cumulative equity points starting from baseEquity
  guidance: GuidanceItem[];
}

/**
 * Determine standard pip size for a trading symbol.
 */
export function getPipSize(pair: string): number {
  const p = pair.trim().toUpperCase();
  if (p.includes('XAU') || p.includes('GOLD')) return 0.1;
  if (p.includes('XAG') || p.includes('SILVER')) return 0.01;
  if (p.includes('JPY')) return 0.01;
  if (p.includes('BTC') || p.includes('US30') || p.includes('NAS') || p.includes('SPX')) return 1;
  return 0.0001;
}

/**
 * Auto-calculate Risk:Reward ratio from Entry, Stop Loss, and Take Profit 1.
 */
export function calculateRiskReward(
  entry: number,
  sl: number,
  tp1: number,
  direction?: TradeDirection
): number {
  if (!entry || !sl || !tp1 || Number.isNaN(entry) || Number.isNaN(sl) || Number.isNaN(tp1)) {
    return 0;
  }
  const isSell = direction ? direction.startsWith('SELL') : sl > entry;
  const risk = isSell ? sl - entry : entry - sl;
  const reward = isSell ? entry - tp1 : tp1 - entry;

  if (risk <= 0 || reward <= 0) {
    const absRisk = Math.abs(entry - sl);
    const absReward = Math.abs(tp1 - entry);
    if (absRisk === 0) return 0;
    return Number((absReward / absRisk).toFixed(2));
  }
  return Number((reward / risk).toFixed(2));
}

/**
 * Estimate pips between entry and target (tp1 or sl).
 */
export function estimatePips(pair: string, entry: number, target: number): number {
  if (!entry || !target || Number.isNaN(entry) || Number.isNaN(target)) return 0;
  const pipSize = getPipSize(pair);
  return Math.round(Math.abs(target - entry) / pipSize);
}

/**
 * Estimate dollar value per pip for a given lot size.
 * Standard forex / gold approximation: 1.00 lot ≈ $10 per pip.
 */
export function estimateTradePnL(trade: TradeSignal): number {
  const lots = Math.max(0.01, Number(trade.lotSize || 0.01));
  const pips = Number(trade.pips || 0);
  const signedPips =
    trade.status === 'Lost'
      ? -Math.abs(pips)
      : trade.status === 'Won'
      ? Math.abs(pips)
      : pips;
  return signedPips * lots * 10;
}

/**
 * Map a trading pair to its TradingView symbol string.
 */
export function toTradingViewSymbol(pair: string): string {
  const clean = pair.trim().toUpperCase().replace(/[^A-Z0-9:]/g, '');
  if (clean.includes(':')) return clean;
  if (clean === 'XAUUSD' || clean === 'GOLD') return 'OANDA:XAUUSD';
  if (clean === 'XAGUSD' || clean === 'SILVER') return 'OANDA:XAGUSD';
  if (clean === 'EURUSD') return 'OANDA:EURUSD';
  if (clean === 'GBPUSD') return 'OANDA:GBPUSD';
  if (clean === 'USDJPY') return 'OANDA:USDJPY';
  if (clean === 'GBPJPY') return 'OANDA:GBPJPY';
  if (clean === 'AUDUSD') return 'OANDA:AUDUSD';
  if (clean === 'USDCAD') return 'OANDA:USDCAD';
  if (clean === 'USDCHF') return 'OANDA:USDCHF';
  if (clean === 'NZDUSD') return 'OANDA:NZDUSD';
  if (clean === 'BTCUSD' || clean === 'BTCUSDT') return 'BITSTAMP:BTCUSD';
  if (clean === 'ETHUSD' || clean === 'ETHUSDT') return 'BITSTAMP:ETHUSD';
  if (clean === 'US30') return 'OANDA:US30USD';
  if (clean === 'NAS100') return 'OANDA:NAS100USD';
  return `OANDA:${clean}`;
}

/**
 * Compute full account performance metrics & dynamic rule-based guidance.
 */
export function computeTradingAnalytics(
  trades: TradeSignal[],
  baseEquity = 10000,
  accountCreatedMs = 0
): TradingAnalytics {
  const safeEquity = baseEquity > 0 ? baseEquity : 10000;
  const totalTrades = trades.length;
  const activeTrades = trades.filter((t) => t.status === 'Active').length;
  const pendingTrades = trades.filter((t) => t.status === 'Pending').length;

  const closed = trades
    .filter((t) => t.status === 'Won' || t.status === 'Lost')
    .slice()
    .sort((a, b) => getTimestampMs(a.createdAt) - getTimestampMs(b.createdAt));

  const wins = closed.filter((t) => t.status === 'Won').length;
  const losses = closed.filter((t) => t.status === 'Lost').length;
  const closedTrades = closed.length;
  const winRate = closedTrades > 0 ? (wins / closedTrades) * 100 : 0;

  let grossWinUsd = 0;
  let grossLossUsd = 0;
  let grossWinPips = 0;
  let grossLossPips = 0;
  let netPips = 0;

  let equity = safeEquity;
  let peakEquity = safeEquity;
  let maxDrawdownPercent = 0;
  const equityCurve: number[] = [safeEquity];

  for (const t of closed) {
    const pnl = estimateTradePnL(t);
    const absPips = Math.abs(Number(t.pips || 0));

    if (t.status === 'Won') {
      grossWinUsd += Math.max(0, pnl);
      grossWinPips += absPips;
      netPips += absPips;
    } else {
      grossLossUsd += Math.abs(Math.min(0, pnl));
      grossLossPips += absPips;
      netPips -= absPips;
    }

    equity += pnl;
    equityCurve.push(Number(equity.toFixed(2)));
    if (equity > peakEquity) {
      peakEquity = equity;
    }
    if (peakEquity > 0) {
      const dd = ((peakEquity - equity) / peakEquity) * 100;
      if (dd > maxDrawdownPercent) {
        maxDrawdownPercent = dd;
      }
    }
  }

  const growthPercent = ((equity - safeEquity) / safeEquity) * 100;
  const profitFactor =
    grossLossUsd > 0
      ? grossWinUsd / grossLossUsd
      : grossWinUsd > 0
      ? 9.99
      : 0;

  const totalLots = trades.reduce((acc, t) => acc + Math.max(0, Number(t.lotSize || 0)), 0);

  const rrValues = trades
    .map((t) =>
      t.riskReward > 0
        ? t.riskReward
        : calculateRiskReward(t.entryPrice, t.stopLoss, t.tp1, t.type)
    )
    .filter((v) => v > 0);
  const avgRiskReward =
    rrValues.length > 0
      ? rrValues.reduce((sum, v) => sum + v, 0) / rrValues.length
      : 0;

  const timestamps = trades.map((t) => getTimestampMs(t.createdAt)).filter(Boolean);
  const earliestMs = timestamps.length > 0 ? Math.min(...timestamps) : accountCreatedMs;
  const lastUpdatedMs = timestamps.length > 0 ? Math.max(...timestamps) : accountCreatedMs;
  const recordDays = earliestMs
    ? Math.max(1, Math.ceil((Date.now() - earliestMs) / (1000 * 60 * 60 * 24)))
    : 1;

  // Build rule-based trading discipline guidance
  const guidance: GuidanceItem[] = [];

  if (totalTrades === 0) {
    guidance.push({
      id: 'start',
      tone: 'info',
      title: 'Start your verified track record',
      message:
        'Log your first setup in My Journal with Entry, Stop Loss, and Take Profit levels to unlock live Win Rate, Drawdown, and Profit Factor analytics.',
    });
  } else {
    if (closedTrades < 5) {
      guidance.push({
        id: 'short-record',
        tone: 'warning',
        title: 'Short track record sample',
        message: `Only ${closedTrades} closed trade${closedTrades === 1 ? '' : 's'} logged so far. Keep position sizing conservative until you build at least 15–20 closed setups.`,
      });
    }

    if (closedTrades >= 3 && losses / closedTrades > 0.5) {
      guidance.push({
        id: 'high-sl',
        tone: 'danger',
        title: 'Elevated Stop Loss hit rate',
        message: `${losses} of ${closedTrades} closed trades hit SL (${(100 - winRate).toFixed(0)}%). Pause, review entry timing on higher timeframes, and avoid chasing breakouts.`,
      });
    }

    // Check recent losing streak (last 3 closed)
    if (closed.length >= 3) {
      const lastThree = closed.slice(-3);
      if (lastThree.every((t) => t.status === 'Lost')) {
        guidance.push({
          id: 'streak-loss',
          tone: 'danger',
          title: '3-trade losing streak detected',
          message:
            'Cut risk per trade in half on your next setup and wait for an A+ structure confirmation before re-entering.',
        });
      }
    }

    if (maxDrawdownPercent >= 8) {
      guidance.push({
        id: 'drawdown',
        tone: 'warning',
        title: `Drawdown caution (${maxDrawdownPercent.toFixed(1)}%)`,
        message:
          'Max drawdown is approaching institutional limits. Cap single-trade risk to 0.5%–1% until equity recovers back to peak.',
      });
    }

    if (avgRiskReward > 0 && avgRiskReward < 1.5) {
      guidance.push({
        id: 'low-rr',
        tone: 'warning',
        title: `Tight Risk:Reward (1:${avgRiskReward.toFixed(2)})`,
        message:
          'Aim for at least 1:2.0 Risk:Reward on planned entries so winning setups comfortably outweigh occasional stop outs.',
      });
    } else if (avgRiskReward >= 2.0 && winRate >= 50 && closedTrades >= 3) {
      guidance.push({
        id: 'strong-rr',
        tone: 'positive',
        title: `Strong discipline & Risk:Reward (1:${avgRiskReward.toFixed(2)})`,
        message: `Consistent execution with ${winRate.toFixed(1)}% win rate and ${profitFactor.toFixed(2)} profit factor. Stay patient and protect capital.`,
      });
    }

    if (activeTrades + pendingTrades >= 4) {
      guidance.push({
        id: 'exposure',
        tone: 'info',
        title: `${activeTrades + pendingTrades} open / pending setups`,
        message:
          'Watch correlated USD exposure (XAUUSD, EURUSD, GBPUSD) so a single news release cannot hit multiple stop losses simultaneously.',
      });
    }

    if (guidance.length === 0) {
      guidance.push({
        id: 'steady',
        tone: 'positive',
        title: 'Balanced risk profile',
        message:
          'Your logged metrics remain within healthy parameters. Continue journaling notes on every closed position to refine your edge.',
      });
    }
  }

  return {
    totalTrades,
    closedTrades,
    activeTrades,
    pendingTrades,
    wins,
    losses,
    winRate,
    profitFactor,
    growthPercent,
    maxDrawdownPercent,
    totalLots,
    netPips,
    grossWinPips,
    grossLossPips,
    avgRiskReward,
    recordDays,
    lastUpdatedMs,
    equityCurve,
    guidance: guidance.slice(0, 3),
  };
}
