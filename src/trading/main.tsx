import React from 'react';
import ReactDOM from 'react-dom/client';
import TradingApp from './TradingApp';

class TradingErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected error occurred.' };
  }

  componentDidCatch(error: Error) {
    console.error('TradingApp runtime error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            background: '#0B0F17',
            color: '#F1F5F9',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
          }}
        >
          <h2 style={{ margin: '0 0 8px', fontSize: '18px' }}>Workspace Error</h2>
          <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#94A3B8', maxWidth: '380px' }}>
            {this.state.message}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#10B981',
              color: '#04130D',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reload Workspace
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const mountEl = document.getElementById('trading-root') || document.getElementById('root');

if (mountEl) {
  ReactDOM.createRoot(mountEl).render(
    <React.StrictMode>
      <TradingErrorBoundary>
        <TradingApp />
      </TradingErrorBoundary>
    </React.StrictMode>
  );
}
