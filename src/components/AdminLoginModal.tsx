import React, { useState, useEffect, useRef } from 'react';
import {
  auth,
  ADMIN_EMAIL,
  signInWithEmailAndPassword,
} from '../firebase';

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
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getLockLeft = (): number => {
    const lk = Number(localStorage.getItem('lk') || 0);
    return Math.max(0, Math.ceil((lk - Date.now()) / 1000));
  };

  useEffect(() => {
    if (!isOpen) return;

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
      setErrorMsg('نەتوانرا سیستەمی Firebase دەستپێبکات');
      return;
    }

    const left = getLockLeft();
    if (left > 0) return;

    if (!password) return;

    setLoading(true);
    setErrorMsg('');

    try {
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
      localStorage.setItem('f', '0');
      setPassword('');
      onLoginSuccess();
    } catch (err: unknown) {
      const cd = (err && typeof err === 'object' && 'code' in err ? String(err.code) : '') || '';
      const msg = err instanceof Error ? err.message : String(err);

      if (!/invalid-credential|wrong-password|user-not-found|invalid-login/.test(cd)) {
        setErrorMsg(`هەڵە: ${cd || msg}`);
        setLoading(false);
        setPassword('');
        return;
      }

      const f = Number(localStorage.getItem('f') || 0) + 1;
      localStorage.setItem('f', String(f));

      if (f >= 3) {
        const lockoutTime = Date.now() + (f === 3 ? 30000 : 60000);
        localStorage.setItem('lk', String(lockoutTime));
        const rem = Math.ceil((lockoutTime - Date.now()) / 1000);
        setIsLocked(true);
        setLockSeconds(rem);
        setErrorMsg(`هەوڵی زۆرت دا، ${rem} چرکە چاوەڕێ بکە`);
      } else {
        setErrorMsg(`پاسۆردەکە هەڵەیە (${3 - f} هەوڵ ماوە)`);
      }
    } finally {
      setLoading(false);
      setPassword('');
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
      >
        <h3>چوونەژوورەوەی ئەدمین</h3>
        <input
          ref={inputRef}
          id="pw"
          type="password"
          placeholder="پاسۆرد"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLocked || loading}
        />
        <div className="err" id="er">
          {errorMsg}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn pri"
            id="lb"
            type="submit"
            style={{ flex: 1 }}
            disabled={isLocked || loading}
          >
            {loading ? 'چاوەڕوان بە...' : 'چوونەژوورەوە'}
          </button>
          <button
            className="btn"
            type="button"
            onClick={onClose}
          >
            داخستن
          </button>
        </div>
      </form>
    </div>
  );
};
