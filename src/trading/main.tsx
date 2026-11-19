import React from 'react';
import ReactDOM from 'react-dom/client';
import TradingApp from './TradingApp';

const mountEl = document.getElementById('trading-root') || document.getElementById('root');

if (mountEl) {
  ReactDOM.createRoot(mountEl).render(
    <React.StrictMode>
      <TradingApp />
    </React.StrictMode>
  );
}
