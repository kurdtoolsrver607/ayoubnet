import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          dir="rtl"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: '#060912',
            color: '#e8ecfa',
            fontFamily: "'K24', 'Vazirmatn', Tahoma, sans-serif",
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '32px 24px',
              borderRadius: '18px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255, 123, 138, 0.15)',
                color: '#ff7b8a',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={30} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
              کێشەیەک لە بارکردنی لاپەڕەکە ڕوویدا
            </h2>

            <p style={{ color: '#8b94b5', fontSize: '0.92rem', marginBottom: '24px', lineHeight: 1.8 }}>
              دەتوانیت دووبارە لاپەڕەکە نوێ (Refresh) بکەیتەوە، یان پەیوەندی بە بەڕێوەبەرەوە بکەیت.
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #5ec8ff, #7b6dff)',
                color: '#05080f',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                margin: '0 auto',
                fontFamily: 'inherit',
              }}
            >
              <RefreshCw size={16} />
              <span>نوێکردنەوەی لاپەڕە</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
