import React, { useState, useEffect } from 'react';
import {
  auth,
  signInWithEmailAndPassword,
  ADMIN_EMAIL,
  sendAdminPasswordReset,
  safeStorage,
} from '../firebase';
import { translations, type Language } from '../i18n';
import {
  X,
  ShieldCheck,
  Mail,
  KeyRound,
  AlertCircle,
  CheckCircle,
  Loader2,
  Lock,
} from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  siteName: string;
  lang: Language;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  siteName,
  lang,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);

  const t = translations[lang] || translations.ku;

  // Check lockout on open
  useEffect(() => {
    if (!isOpen) return;
    const lk = Number(safeStorage.get('lk') || 0);
    const left = Math.max(0, Math.ceil((lk - Date.now()) / 1000));
    if (left > 0) {
      setIsLocked(true);
      setLockSeconds(left);
    } else {
      setIsLocked(false);
      setLockSeconds(0);
    }
  }, [isOpen]);

  // Lockout timer
  useEffect(() => {
    if (!isLocked || lockSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockSeconds((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          safeStorage.remove('lk');
          safeStorage.set('f', '0');
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLocked, lockSeconds]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPw = password.trim();

    if (!trimmedEmail || !trimmedPw) {
      setError(lang === 'en' ? 'Please enter email and password' : lang === 'ar' ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'تکایە ئیمەیڵ و وشەی تێپەڕ بنووسە');
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');

    // Admin email check
    if (trimmedEmail !== ADMIN_EMAIL.toLowerCase()) {
      const f = Number(safeStorage.get('f') || 0) + 1;
      safeStorage.set('f', String(f));
      setError(t.admin_email_invalid);
      setLoading(false);
      return;
    }

    // Master PIN Check
    if (trimmedPw === '224080') {
      safeStorage.set('ayoub_admin_auth', '1');
      safeStorage.set('f', '0');
      setLoading(false);
      setPassword('');
      onSuccess();
      return;
    }

    try {
      if (auth) {
        await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPw);
      }
      safeStorage.set('ayoub_admin_auth', '1');
      safeStorage.set('f', '0');
      setPassword('');
      onSuccess();
    } catch (err: unknown) {
      const f = Number(safeStorage.get('f') || 0) + 1;
      safeStorage.set('f', String(f));

      if (f >= 3) {
        const lockoutTime = Date.now() + 45000;
        safeStorage.set('lk', String(lockoutTime));
        setIsLocked(true);
        setLockSeconds(45);
        setError(t.admin_lockout_msg);
      } else {
        setError(`${t.admin_pw_wrong} (${3 - f} ${t.admin_attempts_left})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const targetEmail = email.trim() || ADMIN_EMAIL;
    setResetLoading(true);
    setError('');
    setInfo('');

    try {
      await sendAdminPasswordReset(targetEmail);
      setInfo(lang === 'en' ? `Password reset link sent to ${targetEmail}` : lang === 'ar' ? `تم إرسال رابط إعادة التعيين إلى ${targetEmail}` : `لینکی ڕیسێتکردنی وشەی تێپەڕ نێردرا بۆ ${targetEmail}`);
    } catch {
      setError(lang === 'en' ? 'Could not send reset link' : lang === 'ar' ? 'تعذر إرسال الرابط، تحقق من البريد' : 'نەتوانرا لینکی ڕیسێت بنێردرێت');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(3, 6, 14, 0.82)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '32px 28px',
          borderRadius: '24px',
          position: 'relative',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          border: '1px solid var(--line2)',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            left: lang === 'en' ? 'auto' : '18px',
            right: lang === 'en' ? '18px' : 'auto',
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--muted)',
            border: 'none',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          title="داخستن"
        >
          <X size={17} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--ice), var(--vio))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#05080f',
              marginBottom: '12px',
              boxShadow: '0 8px 24px rgba(94, 200, 255, 0.25)',
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text)' }}>
            {t.admin_modal_title}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.84rem', margin: 0 }}>
            {t.admin_modal_subtitle} - {siteName}
          </p>
        </div>

        {/* Lockout Banner */}
        {isLocked && (
          <div
            style={{
              background: 'rgba(255, 123, 138, 0.12)',
              border: '1px solid rgba(255, 123, 138, 0.3)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#ff7b8a',
              fontSize: '0.86rem',
            }}
          >
            <Lock size={18} />
            <div>
              <div style={{ fontWeight: 700 }}>سیستەم قفڵ کراوە!</div>
              <div style={{ fontSize: '0.78rem' }}>
                تکایە {lockSeconds} چرکە چاوەڕێ بکە پێش هەوڵدانەوە.
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Email input */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
              {t.admin_email_label}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kooora.taqana@gmail.com"
                dir="ltr"
                disabled={isLocked || loading}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 38px',
                  borderRadius: '12px',
                  border: '1px solid var(--line2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text)',
                  fontFamily: 'inherit',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                }}
              />
            </div>
          </div>

          {/* Password / PIN input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
              {t.admin_pw_label}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                disabled={isLocked || loading}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 38px',
                  borderRadius: '12px',
                  border: '1px solid var(--line2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text)',
                  fontFamily: 'inherit',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
              <KeyRound
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                }}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ff7b8a',
                fontSize: '0.84rem',
                marginBottom: '14px',
                background: 'rgba(255, 123, 138, 0.1)',
                padding: '8px 12px',
                borderRadius: '8px',
              }}
            >
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Info Message */}
          {info && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--s)',
                fontSize: '0.84rem',
                marginBottom: '14px',
                background: 'rgba(158, 230, 181, 0.1)',
                padding: '8px 12px',
                borderRadius: '8px',
              }}
            >
              <CheckCircle size={15} />
              <span>{info}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLocked || loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: isLocked ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, var(--ice), var(--vio))',
              color: isLocked ? 'var(--muted)' : '#05080f',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              boxShadow: isLocked ? 'none' : '0 6px 20px rgba(94, 200, 255, 0.2)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>چاوەڕێ بکە...</span>
              </>
            ) : (
              <span>{t.admin_btn_login}</span>
            )}
          </button>
        </form>

        {/* Forgot password */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={resetLoading || isLocked}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontFamily: 'inherit',
            }}
          >
            {resetLoading ? 'ناردنی لینک...' : t.admin_forgot_pw}
          </button>
        </div>
      </div>
    </div>
  );
};
