import React, { useState } from 'react';
import { Globe, Clock } from 'lucide-react';
import { TradingViewTickerTape, TradingViewAdvancedChart } from './TradingViewWidgets';

interface MarketInstrument {
  label: string;
  symbol: string;
  tvSymbol: string;
  category: string;
}

const MARKET_INSTRUMENTS: MarketInstrument[] = [
  { label: 'Gold', symbol: 'XAUUSD', tvSymbol: 'OANDA:XAUUSD', category: 'Metals' },
  { label: 'Silver', symbol: 'XAGUSD', tvSymbol: 'OANDA:XAGUSD', category: 'Metals' },
  { label: 'Euro', symbol: 'EURUSD', tvSymbol: 'OANDA:EURUSD', category: 'Majors' },
  { label: 'Pound', symbol: 'GBPUSD', tvSymbol: 'OANDA:GBPUSD', category: 'Majors' },
  { label: 'Dollar/Yen', symbol: 'USDJPY', tvSymbol: 'OANDA:USDJPY', category: 'Majors' },
  { label: 'Pound/Yen', symbol: 'GBPJPY', tvSymbol: 'OANDA:GBPJPY', category: 'Crosses' },
  { label: 'Aussie', symbol: 'AUDUSD', tvSymbol: 'OANDA:AUDUSD', category: 'Majors' },
  { label: 'Bitcoin', symbol: 'BTCUSD', tvSymbol: 'BITSTAMP:BTCUSD', category: 'Crypto' },
];

const TIMEFRAMES = [
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: 'D' },
];

export const MarketTab: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('OANDA:XAUUSD');
  const [interval, setInterval] = useState<string>('60');

  const activeInstrument =
    MARKET_INSTRUMENTS.find((item) => item.tvSymbol === selectedSymbol) || MARKET_INSTRUMENTS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Live TradingView Ticker Tape */}
      <TradingViewTickerTape />

      {/* Header & Timeframe Selector */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} style={{ color: 'var(--tr-buy)' }} />
            <h1 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#F8FAFC' }}>
              Live Market Prices
            </h1>
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--tr-muted)', marginTop: '2px' }}>
            {activeInstrument.label} ({activeInstrument.symbol}) · Real-time TradingView stream
          </div>
        </div>

        <div className="tr-segmented" role="group" aria-label="Chart timeframe">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0 6px',
              color: 'var(--tr-muted)',
            }}
          >
            <Clock size={13} />
          </span>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              type="button"
              onClick={() => setInterval(tf.value)}
              className={`tr-seg-btn tr-mono tr-press ${interval === tf.value ? 'active' : ''}`}
              style={{ minHeight: '34px', padding: '4px 10px' }}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pair Switcher Strip */}
      <div className="tr-scroll-x" style={{ display: 'flex', gap: '8px', paddingBottom: '2px' }}>
        {MARKET_INSTRUMENTS.map((inst) => {
          const isActive = inst.tvSymbol === selectedSymbol;
          return (
            <button
              key={inst.tvSymbol}
              type="button"
              onClick={() => setSelectedSymbol(inst.tvSymbol)}
              className="tr-press"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                minWidth: '106px',
                padding: '10px 13px',
                borderRadius: '12px',
                border: isActive
                  ? '1px solid var(--tr-buy-border)'
                  : '1px solid var(--tr-border)',
                background: isActive ? 'var(--tr-buy-soft)' : 'var(--tr-surface-glass)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <span
                className="tr-mono"
                style={{
                  fontSize: '13.5px',
                  fontWeight: 800,
                  color: isActive ? '#6EE7B7' : '#F8FAFC',
                }}
              >
                {inst.symbol}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--tr-muted)', marginTop: '1px' }}>
                {inst.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Full Interactive TradingView Advanced Chart */}
      <div style={{ width: '100%' }}>
        <TradingViewAdvancedChart symbol={selectedSymbol} interval={interval} height={540} />
      </div>
    </div>
  );
};
