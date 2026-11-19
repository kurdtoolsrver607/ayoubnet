import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const LazyTradingApp = lazy(() => import('./trading/TradingApp'));

const isTradingPath =
  typeof window !== 'undefined' &&
  (window.location.pathname === '/trading' || window.location.pathname.startsWith('/trading/'));

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    if (isTradingPath) {
      let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
      if (!robots) {
        robots = document.createElement('meta');
        robots.name = 'robots';
        document.head.appendChild(robots);
      }
      robots.content = 'noindex, nofollow';

      ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
          <Suspense
            fallback={
              <div
                style={{
                  minHeight: '100dvh',
                  background: '#0B0F17',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                Loading workspace...
              </div>
            }
          >
            <LazyTradingApp />
          </Suspense>
        </React.StrictMode>
      );
    } else {
      ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </React.StrictMode>
      );
    }
  } catch (err) {
    console.error('Fatal initialization error:', err);
  }
}
