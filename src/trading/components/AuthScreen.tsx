import React, { useState } from 'react';
import {
  Shield,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Ban,
  LogOut,
  TrendingUp,
} from 'lucide-react';
import {
  loginTradingUser,
  registerTradingUser,
  resetTradingPassword,
  logoutTradingUser,
  mapAuthErrorMessage,
} from '../tradingFirebase';

type AuthMode = 'login' | 'signup' | 'reset';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        if (!password) {
          setError('Please enter your password.');
          setSubmitting(false);
          return;
        }
        await loginTradingUser(trimmedEmail, password);
      } else if (mode === 'signup') {
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setSubmitting(false);
          return;
        }
        await registerTradingUser(trimmedEmail, password, displayName);
      } else if (mode === 'reset') {
        await resetTradingPassword(trimmedEmail);
        setSuccessMsg(
          'Password reset link sent. Check your inbox (and spam folder) to set a new password.'
        );
      }
    } catch (err) {
      setError(mapAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background:
          'radial-gradient(680px 420px at 80% 0%, rgba(16, 185, 129, 0.12), transparent 68%), radial-gradient(520px 360px at 10% 100%, rgba(20, 184, 166, 0.08), transparent 68%), #0B0F17',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Compact Brand Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div className="tr-brand-mark" style={{ width: 42, height: 42, borderRadius: 12 }}>
            <TrendingUp size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#F8FAFC' }}>
              FX Desk Terminal
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--tr-muted)' }}>
              Private Trading Journal &amp; Market Analytics
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <div
          className="tr-card"
          style={{
            padding: '24px 22px',
            background: 'rgba(17, 24, 39, 0.92)',
            borderColor: 'var(--tr-border-strong)',
          }}
        >
          {/* Mode Tabs (Login / Sign Up) */}
          {mode !== 'reset' && (
            <div
              className="tr-segmented"
              style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: '20px' }}
            >
              <button
                type="button"
                className={`tr-seg-btn tr-press ${mode === 'login' ? 'active' : ''}`}
                onClick={() => switchMode('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`tr-seg-btn tr-press ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => switchMode('signup')}
              >
                Create Account
              </button>
            </div>
          )}

          {mode === 'reset' && (
            <div style={{ marginBottom: '18px' }}>
              <button
                type="button"
                className="tr-press"
                onClick={() => switchMode('login')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--tr-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 0',
                  marginBottom: '10px',
                }}
              >
                <ArrowLeft size={15} /> Back to Sign In
              </button>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>
                Reset Password
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--tr-muted)', margin: '6px 0 0' }}>
                Enter your account email to receive a secure Firebase password reset link.
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--tr-sell-soft)',
                border: '1px solid var(--tr-sell-border)',
                color: '#FECACA',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--tr-sell)' }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--tr-buy-soft)',
                border: '1px solid var(--tr-buy-border)',
                color: '#A7F3D0',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--tr-buy)' }} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'signup' && (
              <div>
                <label className="tr-label" htmlFor="tr-auth-name">
                  Trader Name
                </label>
                <div style={{ position: 'relative' }}>
                  <UserIcon
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '13px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--tr-muted)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    id="tr-auth-name"
                    type="text"
                    className="tr-input"
                    style={{ paddingLeft: '38px' }}
                    placeholder="Your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="name"
                    maxLength={80}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="tr-label" htmlFor="tr-auth-email">
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--tr-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="tr-auth-email"
                  type="email"
                  className="tr-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <label className="tr-label" htmlFor="tr-auth-password" style={{ marginBottom: 0 }}>
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('reset')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--tr-buy)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '2px 0',
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '13px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--tr-muted)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    id="tr-auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="tr-input"
                    style={{ paddingLeft: '38px', paddingRight: '42px' }}
                    placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Enter password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{
                      position: 'absolute',
                      right: '6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '34px',
                      height: '34px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--tr-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="tr-label" htmlFor="tr-auth-confirm">
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '13px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--tr-muted)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    id="tr-auth-confirm"
                    type={showPassword ? 'text' : 'password'}
                    className="tr-input"
                    style={{ paddingLeft: '38px' }}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="tr-btn tr-btn-primary tr-press"
              style={{ width: '100%', marginTop: '6px', height: '48px' }}
            >
              {submitting ? (
                <span>Please wait...</span>
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? 'Access Terminal'
                      : mode === 'signup'
                      ? 'Create Private Account'
                      : 'Send Reset Email'}
                  </span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Note */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '18px',
            color: 'var(--tr-muted)',
            fontSize: '12px',
          }}
        >
          <Shield size={14} style={{ color: 'var(--tr-buy)', flexShrink: 0 }} />
          <span>End-to-end Firebase Auth · Strictly isolated private trade records</span>
        </div>
      </div>
    </div>
  );
};

interface BlockedScreenProps {
  email: string;
}

export const BlockedScreen: React.FC<BlockedScreenProps> = ({ email }) => {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logoutTradingUser();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background:
          'radial-gradient(560px 360px at 50% 10%, rgba(239, 68, 68, 0.1), transparent 70%), #0B0F17',
      }}
    >
      <div
        className="tr-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          textAlign: 'center',
          padding: '32px 24px',
          borderColor: 'var(--tr-sell-border)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--tr-sell-soft)',
            border: '1px solid var(--tr-sell-border)',
            color: 'var(--tr-sell)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
          }}
        >
          <Ban size={28} />
        </div>
        <h1 style={{ fontSize: '21px', fontWeight: 800, margin: '0 0 8px', color: '#F8FAFC' }}>
          Account Suspended
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--tr-text-secondary)', margin: '0 0 10px' }}>
          Access to this trading desk has been restricted by the administrator for{' '}
          <strong style={{ color: '#F8FAFC' }}>{email}</strong>.
        </p>
        <p style={{ fontSize: '12.5px', color: 'var(--tr-muted)', margin: '0 0 24px' }}>
          If you believe this is a mistake, contact the desk administrator to restore your access.
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="tr-btn tr-btn-danger tr-press"
          style={{ width: '100%' }}
        >
          <LogOut size={16} />
          <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  );
};
