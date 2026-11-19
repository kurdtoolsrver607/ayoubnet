import React, { useEffect, useRef } from 'react';
import { toTradingViewSymbol } from '../analytics';

/**
 * Free real-time TradingView Ticker Tape widget covering Gold, Silver, Euro, Pound & major forex pairs.
 */
export const TradingViewTickerTape: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';

    const widgetSlot = document.createElement('div');
    widgetSlot.className = 'tradingview-widget-container__widget';
    el.appendChild(widgetSlot);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'OANDA:XAUUSD', title: 'Gold / USD' },
        { proName: 'OANDA:XAGUSD', title: 'Silver / USD' },
        { proName: 'OANDA:EURUSD', title: 'EUR / USD' },
        { proName: 'OANDA:GBPUSD', title: 'GBP / USD' },
        { proName: 'OANDA:USDJPY', title: 'USD / JPY' },
        { proName: 'OANDA:GBPJPY', title: 'GBP / JPY' },
        { proName: 'OANDA:AUDUSD', title: 'AUD / USD' },
        { proName: 'BITSTAMP:BTCUSD', title: 'BTC / USD' },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      locale: 'en',
    });

    el.appendChild(script);
    return () => {
      el.innerHTML = '';
    };
  }, []);

  return (
    <div
      className="tradingview-widget-container"
      ref={containerRef}
      style={{
        width: '100%',
        minHeight: '46px',
        overflow: 'hidden',
        borderRadius: '12px',
        border: '1px solid var(--tr-border)',
        background: 'rgba(13, 19, 31, 0.9)',
      }}
    />
  );
};

interface AdvancedChartProps {
  symbol: string;
  interval: string;
  height?: number;
}

/**
 * Interactive TradingView Advanced Chart widget.
 */
export const TradingViewAdvancedChart: React.FC<AdvancedChartProps> = ({
  symbol,
  interval,
  height = 520,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tvSymbol = toTradingViewSymbol(symbol);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';

    const widgetSlot = document.createElement('div');
    widgetSlot.className = 'tradingview-widget-container__widget';
    widgetSlot.style.height = '100%';
    widgetSlot.style.width = '100%';
    el.appendChild(widgetSlot);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(11, 15, 23, 1)',
      gridColor: 'rgba(148, 163, 184, 0.08)',
      allow_symbol_change: true,
      calendar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      support_host: 'https://www.tradingview.com',
    });

    el.appendChild(script);
    return () => {
      el.innerHTML = '';
    };
  }, [tvSymbol, interval]);

  return (
    <div
      className="tradingview-widget-container"
      ref={containerRef}
      style={{
        width: '100%',
        height: `${height}px`,
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid var(--tr-border)',
        background: '#0B0F17',
      }}
    />
  );
};

interface MiniChartProps {
  pair: string;
  height?: number;
}

/**
 * Toggleable TradingView Mini-Chart embedded inside individual trade signal cards.
 */
export const TradingViewMiniChart: React.FC<MiniChartProps> = ({ pair, height = 210 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tvSymbol = toTradingViewSymbol(pair);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';

    const widgetSlot = document.createElement('div');
    widgetSlot.className = 'tradingview-widget-container__widget';
    el.appendChild(widgetSlot);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: tvSymbol,
      width: '100%',
      height,
      locale: 'en',
      dateRange: '1M',
      colorTheme: 'dark',
      isTransparent: true,
      autosize: false,
      largeChartUrl: '',
      noTimeScale: false,
    });

    el.appendChild(script);
    return () => {
      el.innerHTML = '';
    };
  }, [tvSymbol, height]);

  return (
    <div
      className="tradingview-widget-container"
      ref={containerRef}
      style={{
        width: '100%',
        height: `${height}px`,
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--tr-border)',
        background: 'rgba(11, 15, 23, 0.9)',
      }}
    />
  );
};
