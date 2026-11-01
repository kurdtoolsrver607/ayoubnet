import React, { useState, useEffect, useRef } from 'react';
import {
  auth,
  ADMIN_EMAIL,
  signInWithEmailAndPassword,
  sendAdminPasswordReset,
} from '../firebase';
import { KeyRound, Mail, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getLockLeft = (): number => {
    const lk = Number(localStorage.getItem('lk') || 0);
    return Math.max(0, Math.ceil((lk - Date.now()) / 1000));
  };

  useEffect(() => {
    if (!isOpen) return;

    const f = Number(localStorage.getItem('f') || 0);
    setFailedCount(f);

    const left = getLockLeft();
    if (left > 0) {
      setIsLocked(true);
      setLockSeconds(left);
      setErrorMsg(`هەوڵی زۆرت دا، ${left} چرکە چاوەڕێ بکە`);
    } else {
      setIsLocked(false);
      setErrorMsg('');
      inputRef.current?.focus();
    }

    const interval = setInterval(() => {
      const remaining = getLockLeft();
      if (remaining > 0) {
        setIsLocked(true);
        setLockSeconds(remaining);
        setErrorMsg(`هەوڵی زۆرت دا، ${remaining} چرکە چاوەڕێ بکە`);
      } else {
        setIsLocked(false);
        setLockSeconds(0);
        setErrorMsg((prev) => (prev.startsWith('هەوڵی زۆرت دا') ? '' : prev));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setErrorMsg('نەتوانرا سیستەمی فایربەیس دەستپێبکات');
      return;
    }

    const left = getLockLeft();
    if (left > 0) return;

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPw = password.trim();

    if (!trimmedEmail) {
      setErrorMsg('تکایە سەرەتا ئیمەیڵ بنووسە');
      return;
    }

    if (!trimmedPw) {
      setErrorMsg('تکایە پاسۆرد بنووسە');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    // Must be the authorized admin email
    if (trimmedEmail !== ADMIN_EMAIL.toLowerCase()) {
      const f = Number(localStorage.getItem('f') || 0) + 1;
      localStorage.setItem('f', String(f));
      setFailedCount(f);
      setErrorMsg('ئەم ئیمەیڵە ڕێگەپێدراو نییە یان هەڵەیە');
      setLoading(false);
      return;
    }

    // Check master PIN (requires correct email)
    if (trimmedPw === '224080') {
      localStorage.setItem('ayoub_admin_auth', '1');
      localStorage.setItem('f', '0');
      setPassword('');
      setEmail('');
      setLoading(false);
      onLoginSuccess();
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPw);
      localStorage.setItem('ayoub_admin_auth', '1');
      localStorage.setItem('f', '0');
      setPassword('');
      setEmail('');
      onLoginSuccess();
    } catch (err: unknown) {
      const cd = (err && typeof err === 'object' && 'code' in err ? String(err.code) : '') || '';
      const msg = err instanceof Error ? err.message : String(err);

      if (cd === 'auth/user-not-found') {
        setErrorMsg(`ئەم ئیمەیڵە لە فایربەیس تۆمار نەکراوە: ${trimmedEmail}`);
        setLoading(false);
        return;
      }

      if (!/invalid-credential|wrong-password|user-not-found|invalid-login/.test(cd)) {
        setErrorMsg(`هەڵە ڕوویدا: ${cd || msg}`);
        setLoading(false);
        setPassword('');
        return;
      }

      const f = Number(localStorage.getItem('f') || 0) + 1;
      localStorage.setItem('f', String(f));
      setFailedCount(f);

      if (f >= 3) {
        const lockoutTime = Date.now() + (f === 3 ? 30000 : 60000);
        localStorage.setItem('lk', String(lockoutTime));
        const rem = Math.ceil((lockoutTime - Date.now()) / 1000);
        setIsLocked(true);
        setLockSeconds(rem);
        setErrorMsg(`٣ جار هەوڵی هەڵەت دا! دەتوانیت لە خوارەوە پاسۆرد ڕیسێت بکەیت.`);
      } else {
        setErrorMsg(`پاسۆردەکە هەڵەیە (${3 - f} هەوڵی تر ماوە)`);
      }
    } finally {
      setLoading(false);
      setPassword('');
    }
  };

  const handlePasswordReset = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg('تکایە سەرەتا ئیمەیڵەکەت لە خانەی سەرەوە بنووسە بۆ ناردنی نامەی ڕیسێت');
      return;
    }

    if (trimmedEmail !== ADMIN_EMAIL.toLowerCase()) {
      setErrorMsg('تەنها دەتوانیت ڕیسێت بۆ ئیمەیڵی فەرمی ئەدمین بکەیت');
      return;
    }

    setResetLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      await sendAdminPasswordReset(trimmedEmail);
      setInfoMsg(`نامەی چاککردنەوەی پاسۆرد بۆ ${trimmedEmail} نێردرا! تکایە سەیری Inbox یان Spam بکە.`);
    } catch (err: unknown) {
      const cd = (err && typeof err === 'object' && 'code' in err ? String(err.code) : '') || '';
      if (cd === 'auth/user-not-found') {
        setErrorMsg(`ئەم ئیمەیڵە لە فایربەیس نەدۆزرایەوە (${trimmedEmail}).`);
      } else {
        setErrorMsg(`نەتوانرا ئیمەیڵی ڕیسێت بنێردرێت: ${cd || err}`);
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      className="ov on"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        className="box glass"
        id="lf"
        onSubmit={handleSubmit}
        autoComplete="off"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(480px, 100%)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <KeyRound size={22} style={{ color: 'var(--ice)' }} />
          <h3 style={{ margin: 0 }}>چوونەژوورەوەی ئەدمین</h3>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
            ئیمەیڵ
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="email"
              placeholder="ئیمەیڵ"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLocked || loading}
              style={{
                direction: 'ltr',
                fontSize: '0.9rem',
                margin: '0',
                paddingRight: '36px',
              }}
            />
            <Mail
              size={16}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
            پاسۆرد
          </label>
          <input
            ref={inputRef}
            id="pw"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLocked || loading}
            style={{ margin: '0', fontSize: '0.9rem' }}
          />
        </div>

        {errorMsg && (
          <div
            className="err"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.84rem',
              color: '#ff7b8a',
              marginBottom: '10px',
              lineHeight: 1.5,
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              fontSize: '0.84rem',
              color: 'var(--s)',
              marginBottom: '12px',
              background: 'rgba(158, 230, 181, 0.1)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(158, 230, 181, 0.25)',
              lineHeight: 1.5,
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{infoMsg}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: failedCount >= 3 ? '12px' : '0' }}>
          <button
            className="btn pri"
            id="lb"
            type="submit"
            style={{ flex: 1 }}
            disabled={isLocked || loading}
          >
            {loading ? 'چاوەڕوان بە...' : 'چوونەژوورەوە'}
          </button>
          <button className="btn" type="button" onClick={onClose}>
            داخستن
          </button>
        </div>

        {/* Password Reset Section (Activated when failed >= 3 or requested) */}
        {failedCount >= 3 && (
          <div
            style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--line)',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '8px' }}>
              پاسۆردەکەت لەبیرچووە؟ دەتوانیت نامەی ڕیسێت بۆ ئیمەیڵەکەت بنێریت:
            </p>
            <button
              type="button"
              className="btn"
              onClick={handlePasswordReset}
              disabled={resetLoading}
              style={{
                width: '100%',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderColor: 'var(--ice)',
                color: 'var(--ice)',
              }}
            >
              <RefreshCw size={15} className={resetLoading ? 'spin' : ''} />
              {resetLoading ? 'لە ناردندایە...' : 'ڕیسێت پاسۆرد بکە (ناردن بۆ ئیمەیڵ)'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
