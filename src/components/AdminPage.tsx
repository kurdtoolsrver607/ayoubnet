import React, { useState, useRef, useEffect } from 'react';
import {
  auth,
  ADMIN_EMAIL,
  signInWithEmailAndPassword,
  sendAdminPasswordReset,
  signOut,
  createPost,
  deletePost,
  safeStorage,
  formatPostDate,
  type VisitorStats,
  type DayStats,
  type Post,
  type SiteSettings,
} from '../firebase';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Code2,
  Trash2,
  UploadCloud,
  LogOut,
  Users,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  Search,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Mail,
  RefreshCw,
  Clock,
  Settings,
  PlusCircle,
  LayoutGrid,
} from 'lucide-react';
import { DriveImage } from './DriveImage';

interface AdminPageProps {
  stats: {
    total: VisitorStats;
    today: DayStats;
  };
  posts: Post[];
  siteSettings: SiteSettings;
  onSaveSettings: (settings: SiteSettings) => Promise<void>;
  onBackToHome: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  stats,
  posts,
  siteSettings,
  onSaveSettings,
  onBackToHome,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return safeStorage.get('ayoub_admin_auth') === '1' || (auth?.currentUser && !auth.currentUser.isAnonymous) === true;
  });

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginInfo, setLoginInfo] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);

  // Admin Dashboard State
  const [activeTab, setActiveTab] = useState<'create' | 'posts' | 'settings'>('create');
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'code'>('image');
  const [category, setCategory] = useState<'general' | 'programming' | 'posts' | 'electronics'>('general');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploadedDriveData, setUploadedDriveData] = useState<{
    url: string;
    fileId?: string;
    backupUrl?: string;
  } | null>(null);
  const [isDriveUploading, setIsDriveUploading] = useState(false);
  const [driveUploadProgress, setDriveUploadProgress] = useState<number | null>(null);
  const [driveUploadStatus, setDriveUploadStatus] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [isSuccessMsg, setIsSuccessMsg] = useState(false);

  // Settings State
  const [editSiteName, setEditSiteName] = useState(siteSettings.name || 'Ayoubi');
  const [editSubtitle, setEditSubtitle] = useState(siteSettings.subtitle || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  // Posts Management State
  const [localPosts, setLocalPosts] = useState<Post[]>(posts);
  const [postsFilter, setPostsFilter] = useState<'all' | 'general' | 'programming' | 'posts' | 'electronics'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const num = new Intl.NumberFormat('en-US');

  // Check lockout on mount
  useEffect(() => {
    const lk = Number(safeStorage.get('lk') || 0);
    const left = Math.max(0, Math.ceil((lk - Date.now()) / 1000));
    if (left > 0) {
      setIsLocked(true);
      setLockSeconds(left);
    }
  }, []);

  // Lockout timer
  useEffect(() => {
    if (!isLocked || lockSeconds <= 0) return;
    const t = setInterval(() => {
      setLockSeconds((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          safeStorage.remove('lk');
          safeStorage.set('f', '0');
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isLocked, lockSeconds]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    const trimmedEmail = loginEmail.trim().toLowerCase();
    const trimmedPw = loginPw.trim();

    if (!trimmedEmail || !trimmedPw) {
      setLoginError('تکایە ئیمەیڵ و وشەی تێپەڕ بنووسە');
      return;
    }

    setLoginLoading(true);
    setLoginError('');
    setLoginInfo('');

    // Admin email check
    if (trimmedEmail !== ADMIN_EMAIL.toLowerCase()) {
      const f = Number(safeStorage.get('f') || 0) + 1;
      safeStorage.set('f', String(f));
      setLoginError('ئەم ئیمەیڵە ڕێگەپێدراو نییە یان هەڵەیە');
      setLoginLoading(false);
      return;
    }

    // Master PIN Check
    if (trimmedPw === '224080') {
      safeStorage.set('ayoub_admin_auth', '1');
      safeStorage.set('f', '0');
      setIsAuthenticated(true);
      setLoginLoading(false);
      setLoginPw('');
      return;
    }

    try {
      if (auth) {
        await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPw);
      }
      safeStorage.set('ayoub_admin_auth', '1');
      safeStorage.set('f', '0');
      setIsAuthenticated(true);
      setLoginPw('');
    } catch (err: unknown) {
      const cd = (err && typeof err === 'object' && 'code' in err ? String(err.code) : '') || '';
      const msg = err instanceof Error ? err.message : String(err);

      const f = Number(safeStorage.get('f') || 0) + 1;
      safeStorage.set('f', String(f));

      if (f >= 3) {
        const lockoutTime = Date.now() + 45000;
        safeStorage.set('lk', String(lockoutTime));
        setIsLocked(true);
        setLockSeconds(45);
        setLoginError('٣ جار هەوڵی هەڵەت دا! کەمێک چاوەڕێ بکە یان پاسۆرد نوێبکەرەوە.');
      } else {
        setLoginError(`وشەی نهێنی هەڵەیە (${3 - f} هەوڵی تر ماوە)`);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async () => {
    const targetEmail = loginEmail.trim() || ADMIN_EMAIL;
    setResetLoading(true);
    setLoginError('');
    setLoginInfo('');

    try {
      await sendAdminPasswordReset(targetEmail);
      setLoginInfo(`لینکی ڕیسێتکردنی وشەی تێپەڕ بە سەرکەوتوویی بۆ ${targetEmail} نێردرا.`);
    } catch (err: unknown) {
      setLoginError('نەتوانرا لینکی ڕیسێت بنێردرێت، دڵنیابە لە ئیمەیڵەکەت.');
    } finally {
      setResetLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    safeStorage.remove('ayoub_admin_auth');
    if (auth) {
      try {
        await signOut(auth);
      } catch {}
    }
    setIsAuthenticated(false);
  };

  // File selection with automatic Google Drive upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadedDriveData(null);
      if (file.type.startsWith('image/')) {
        setFilePreviewUrl(URL.createObjectURL(file));
      } else {
        setFilePreviewUrl(null);
      }

      // Automatically upload to Google Drive in the background!
      setIsDriveUploading(true);
      setDriveUploadProgress(15);
      setDriveUploadStatus('پەیوەستبوون بە گووگڵ درایڤ...');

      try {
        const uploadRes = await uploadToGoogleDrive(file, (pct) => {
          setDriveUploadProgress(pct);
          if (pct < 45) {
            setDriveUploadStatus('ئامادەکردن و پێوانەکردنی قەبارەی فایل...');
          } else if (pct < 85) {
            setDriveUploadStatus('بارکردن بۆ گووگڵ درایڤ...');
          } else {
            setDriveUploadStatus('پاشەکەوتکردن لە درایڤ...');
          }
        });
        setUploadedDriveData(uploadRes);
        setIsDriveUploading(false);
        setDriveUploadProgress(100);
        setDriveUploadStatus('✅ بە سەرکەوتوویی لە گووگڵ درایڤ خەزن کرا');
      } catch (err: unknown) {
        console.warn('Auto drive upload error:', err);
        setIsDriveUploading(false);
        setDriveUploadStatus('⚠️ بارکردن لە کاتی پەڕاندن هەوڵدەدرێتەوە');
      }
    } else {
      setSelectedFile(null);
      setFilePreviewUrl(null);
      setUploadedDriveData(null);
      setIsDriveUploading(false);
      setDriveUploadProgress(null);
      setDriveUploadStatus('');
    }
  };

  // Handle Post Creation
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = text.trim();
    const trimmedTitle = title.trim();
    const trimmedUrl = directUrl.trim();

    if (!trimmedText && !selectedFile && !trimmedUrl && !uploadedDriveData) {
      setIsSuccessMsg(false);
      setStatusMsg('تکایە دەق، فایل، یان وێنەیەک دیاریبکە پێش بڵاوکردنەوە');
      return;
    }

    setIsPublishing(true);
    setStatusMsg('');

    try {
      let finalDriveData = uploadedDriveData;

      // If user clicked publish while file was still uploading or not uploaded yet
      if (selectedFile && !finalDriveData && (postType === 'image' || postType === 'video')) {
        setUploadPercent(25);
        setStatusMsg('تەواوکردنی بارکردن بۆ گووگڵ درایڤ...');
        finalDriveData = await uploadToGoogleDrive(selectedFile, (pct) => setUploadPercent(pct));
      }

      await createPost(
        postType,
        trimmedText,
        trimmedTitle,
        category,
        selectedFile,
        (pct) => setUploadPercent(pct),
        trimmedUrl,
        finalDriveData
      );

      setTitle('');
      setText('');
      setDirectUrl('');
      setSelectedFile(null);
      setFilePreviewUrl(null);
      setUploadedDriveData(null);
      setIsDriveUploading(false);
      setDriveUploadProgress(null);
      setDriveUploadStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      setIsSuccessMsg(true);
      setStatusMsg('پۆستەکە بە سەرکەوتوویی لە ماڵپەڕەکەدا بڵاوکرایەوە ✨');
      setTimeout(() => setStatusMsg(''), 5000);
    } catch (err: unknown) {
      setIsSuccessMsg(false);
      setStatusMsg(err instanceof Error ? err.message : 'هەڵەیەک ڕوویدا لە کاتی بڵاوکردنەوە');
    } finally {
      setIsPublishing(false);
      setUploadPercent(null);
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSiteName.trim()) {
      setSettingsMsg('تکایە ناوی ماڵپەڕ بنووسە');
      return;
    }
    setIsSavingSettings(true);
    setSettingsMsg('');
    try {
      await onSaveSettings({
        name: editSiteName.trim(),
        subtitle: editSubtitle.trim(),
      });
      setSettingsMsg('ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوت کران ✅');
      setTimeout(() => setSettingsMsg(''), 4000);
    } catch {
      setSettingsMsg('هەڵەیەک لە پاشەکەوتکردن ڕوویدا');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle Post Deletion (Optimistic + Firebase)
  const handleDeletePost = async (post: Post) => {
    setDeletingId(post.id);
    setDeleteNotice(null);
    try {
      // Instantly remove from local UI list
      setLocalPosts((prev) => prev.filter((p) => p.id !== post.id));
      await deletePost(post);
      setConfirmDeleteId(null);
      setDeleteNotice({ type: 'success', msg: 'پۆستەکە بە سەرکەوتوویی سڕایەوە ✨' });
      setTimeout(() => setDeleteNotice(null), 4000);
    } catch (err: unknown) {
      // Revert if error
      setLocalPosts(posts);
      setDeleteNotice({
        type: 'error',
        msg: `نەتوانرا پۆست بسڕدرێتەوە: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Filter posts with strict category filtering
  const filteredPosts = localPosts.filter((p) => {
    if (postsFilter === 'general') return !p.category || p.category === 'general';
    if (postsFilter === 'programming') return p.category === 'programming';
    if (postsFilter === 'posts') return p.category === 'posts';
    if (postsFilter === 'electronics') return p.category === 'electronics';
    
    // postsFilter === 'all'
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (p.title || '').toLowerCase().includes(q) || (p.text || '').toLowerCase().includes(q);
  });

  // ==========================================
  // VIEW 1: ADMIN LOGIN SCREEN (If not logged in)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="wrap" style={{ paddingTop: '50px', paddingBottom: '80px' }}>
        <button
          type="button"
          className="btn"
          onClick={onBackToHome}
          style={{ fontSize: '0.84rem', padding: '7px 16px', gap: '8px', marginBottom: '24px' }}
        >
          <ArrowRight size={15} />
          گەڕانەوە بۆ ماڵپەڕ
        </button>

        <div style={{ maxWidth: '440px', margin: '0 auto' }}>
          <div className="glass" style={{ padding: '34px 28px', borderRadius: '22px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, var(--ice), var(--vio))',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#05080f',
                  marginBottom: '12px',
                }}
              >
                <ShieldCheck size={28} />
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 6px' }}>
                چوونەژوورەوەی ئەدمین
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: '0.86rem', margin: 0 }}>
                تایبەت بە بەڕێوەبەری فەرمی پلاتفۆرمی {siteSettings.name || 'Ayoubi'}
              </p>
            </div>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  ئیمەیڵی بەڕێوەبەر:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    dir="ltr"
                    disabled={isLocked || loginLoading}
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
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  وشەی تێپەڕ یان Master PIN:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    value={loginPw}
                    onChange={(e) => setLoginPw(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    disabled={isLocked || loginLoading}
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
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}
                  />
                </div>
              </div>

              {loginError && (
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
                  <span>{loginError}</span>
                </div>
              )}

              {loginInfo && (
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
                  <span>{loginInfo}</span>
                </div>
              )}

              {isLocked && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--n)',
                    fontSize: '0.84rem',
                    marginBottom: '14px',
                    background: 'rgba(255, 203, 107, 0.12)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                  }}
                >
                  <Clock size={15} />
                  <span>داخرانی کاتی: {lockSeconds} چرکە ماوە</span>
                </div>
              )}

              <button
                type="submit"
                className="btn pri"
                disabled={isLocked || loginLoading}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 700 }}
              >
                {loginLoading ? 'لە پشکنیندایە...' : 'چوونەژوورەوە بۆ ئەدمین'}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontFamily: 'inherit',
                }}
              >
                {resetLoading ? 'لە ناردندایە...' : 'وشەی تێپەڕت لەبیرچووە؟ ناردنی لینکی نوێکردنەوە'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: FULL MAIN ADMIN DASHBOARD PAGE
  // ==========================================
  return (
    <div className="wrap" style={{ paddingTop: '24px', paddingBottom: '90px' }}>
      {/* Top Admin Header Bar */}
      <div
        className="glass"
        style={{
          padding: '18px 24px',
          borderRadius: '18px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--ice), var(--vio))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#05080f',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
              پەڕەی بەڕێوەبەرایەتی (Admin Panel)
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--ice)' }}>
              بەستراوە بە گووگڵ درایڤ و داتابەیسی فایربەیس
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn"
            onClick={onBackToHome}
            style={{ fontSize: '0.84rem', padding: '8px 16px', gap: '6px' }}
          >
            <ArrowRight size={15} />
            <span>گەڕانەوە بۆ ماڵپەڕ</span>
          </button>

          <button
            type="button"
            className="btn"
            onClick={handleLogout}
            style={{ fontSize: '0.84rem', padding: '8px 16px', gap: '6px', color: '#ff7b8a' }}
          >
            <LogOut size={15} />
            <span>چوونەدەرەوە</span>
          </button>
        </div>
      </div>

      {/* Visitor Analytics Stats Overview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginBottom: '26px',
        }}
      >
        <div className="glass" style={{ padding: '18px 20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ice)', marginBottom: '6px' }}>
            <Users size={18} />
            <span style={{ fontSize: '0.84rem' }}>کۆی سەردانیکەرانی جیاواز</span>
          </div>
          <b style={{ fontSize: '1.6rem', fontFamily: 'Space Grotesk' }}>
            {num.format(stats.total.unique || 0)}
          </b>
        </div>

        <div className="glass" style={{ padding: '18px 20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--s)', marginBottom: '6px' }}>
            <Calendar size={18} />
            <span style={{ fontSize: '0.84rem' }}>سەردانیکەرانی ئەمڕۆ</span>
          </div>
          <b style={{ fontSize: '1.6rem', fontFamily: 'Space Grotesk' }}>
            {num.format(stats.today.unique || 0)}
          </b>
        </div>

        <div className="glass" style={{ padding: '18px 20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--k)', marginBottom: '6px' }}>
            <Eye size={18} />
            <span style={{ fontSize: '0.84rem' }}>کۆی جارەکانی کردنەوە</span>
          </div>
          <b style={{ fontSize: '1.6rem', fontFamily: 'Space Grotesk' }}>
            {num.format(stats.total.opens || 0)}
          </b>
        </div>

        <div className="glass" style={{ padding: '18px 20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--n)', marginBottom: '6px' }}>
            <Layers size={18} />
            <span style={{ fontSize: '0.84rem' }}>کۆی پۆستە بڵاوکراوەکان</span>
          </div>
          <b style={{ fontSize: '1.6rem', fontFamily: 'Space Grotesk' }}>
            {num.format(posts.length)}
          </b>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          style={{
            background: activeTab === 'create' ? 'linear-gradient(135deg, var(--ice), var(--vio))' : 'var(--glass)',
            color: activeTab === 'create' ? '#05080f' : 'var(--text)',
            border: 'none',
            padding: '10px 22px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        >
          <PlusCircle size={17} />
          <span>بڵاوکردنەوەی پۆست و فایل</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('posts')}
          style={{
            background: activeTab === 'posts' ? 'linear-gradient(135deg, var(--ice), var(--vio))' : 'var(--glass)',
            color: activeTab === 'posts' ? '#05080f' : 'var(--text)',
            border: 'none',
            padding: '10px 22px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        >
          <LayoutGrid size={17} />
          <span>لیستی پۆستەکان ({posts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          style={{
            background: activeTab === 'settings' ? 'linear-gradient(135deg, var(--ice), var(--vio))' : 'var(--glass)',
            color: activeTab === 'settings' ? '#05080f' : 'var(--text)',
            border: 'none',
            padding: '10px 22px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        >
          <Settings size={17} />
          <span>ڕێکخستنەکانی ماڵپەڕ</span>
        </button>
      </div>

      {/* TAB 1: CREATE POST */}
      {activeTab === 'create' && (
        <div className="glass" style={{ padding: '30px', borderRadius: '22px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={20} style={{ color: 'var(--ice)' }} />
            بڵاوکردنەوەی پۆستێکی نوێ
          </h2>

          <form onSubmit={handlePublish}>
            {/* Category selection */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '8px' }}>
                بەشی پۆست (Category) - دیاریبکە پۆستەکە لە کام بەش دەربکەوێت:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                {[
                  { id: 'general', label: 'عام (سەرەکی)', desc: 'تەنها لە پەڕەی سەرەکی دەردەکەوێت' },
                  { id: 'programming', label: 'بەرنامەسازی', desc: 'تەنها لە بەشی بەرنامەسازی دەردەکەوێت' },
                  { id: 'posts', label: 'پۆستەکان', desc: 'تەنها لە بەشی پۆستەکان دەردەکەوێت' },
                  { id: 'electronics', label: 'ئەلیکترۆن', desc: 'تەنها لە بەشی ئەلیکترۆن دەردەکەوێت' },
                ].map((c) => {
                  const isSelected = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id as any)}
                      style={{
                        background: isSelected ? 'linear-gradient(135deg, rgba(94, 200, 255, 0.2), rgba(123, 109, 255, 0.2))' : 'rgba(255, 255, 255, 0.04)',
                        color: isSelected ? 'var(--ice)' : 'var(--text)',
                        border: isSelected ? '1.5px solid var(--ice)' : '1px solid var(--line2)',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'right',
                        fontFamily: 'inherit',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.label}</span>
                      <span style={{ fontSize: '0.74rem', color: isSelected ? 'var(--text)' : 'var(--muted)' }}>
                        {c.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Post Type Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.84rem', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                جۆری ناوەڕۆک (Content Type):
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'image', label: 'وێنە', icon: <ImageIcon size={15} /> },
                  { id: 'text', label: 'دەقی نووسراو', icon: <FileText size={15} /> },
                  { id: 'video', label: 'ڤیدیۆ', icon: <Video size={15} /> },
                  { id: 'code', label: 'کۆدی پڕۆگرامسازی', icon: <Code2 size={15} /> },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPostType(t.id as any)}
                    style={{
                      background: postType === t.id ? 'linear-gradient(135deg, var(--ice), var(--vio))' : 'rgba(255, 255, 255, 0.05)',
                      color: postType === t.id ? '#05080f' : 'var(--text)',
                      border: '1px solid var(--line2)',
                      padding: '8px 18px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '0.86rem',
                      fontWeight: postType === t.id ? 700 : 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: 'inherit',
                    }}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Post Title */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.84rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                ناونیشانی پۆست (ئارەزوومەندانە):
              </label>
              <input
                type="text"
                placeholder="ناونیشانێکی سەرنجڕاکێش بنووسە..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--line2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text)',
                  fontFamily: 'inherit',
                  fontSize: '0.94rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Post Text / Code */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.84rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                {postType === 'code' ? 'کۆدی پڕۆگرامسازی بنووسە:' : 'ناوەڕۆک / دەقی پۆست:'}
              </label>
              <textarea
                placeholder={postType === 'code' ? 'function myApp() {\n  return "Ayoubi";\n}' : 'لێرە دەقی تەواوی پۆستەکە بنووسە...'}
                value={text}
                onChange={(e) => setText(e.target.value)}
                dir={postType === 'code' ? 'ltr' : 'auto'}
                style={{
                  width: '100%',
                  minHeight: '140px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--line2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text)',
                  fontFamily: postType === 'code' ? "'JetBrains Mono', monospace" : 'inherit',
                  fontSize: '0.92rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* File Upload Area for Image or Video */}
            {(postType === 'image' || postType === 'video') && (
              <div
                style={{
                  padding: '22px',
                  borderRadius: '18px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1.5px dashed var(--line2)',
                  marginBottom: '18px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                    {postType === 'image' ? 'هەڵبژاردنی وێنە (بارکردنی خۆکار بۆ گووگڵ درایڤ):' : 'فایلی ڤیدیۆ:'}
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--ice)', background: 'rgba(94,200,255,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                    Google Drive Auto Upload
                  </span>
                </div>

                <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '0 0 14px', lineHeight: 1.6 }}>
                  هەر وێنەیەک هەڵبژێریت، دەستبەجێ بەرزدەکرێتەوە بۆ درایڤەکەت و بە جوانترین کوالێتی لە ماڵپەڕەکەدا دەردەکەوێت، بەبێ ئەوەی پێویست بە هێنانی لینک بکات.
                </p>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept={postType === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileChange}
                    style={{ fontSize: '0.86rem', color: 'var(--text)' }}
                  />

                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreviewUrl(null);
                        setUploadedDriveData(null);
                        setIsDriveUploading(false);
                        setDriveUploadProgress(null);
                        setDriveUploadStatus('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ff7b8a',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        padding: '4px 8px',
                      }}
                    >
                      سڕینەوەی هەڵبژاردن
                    </button>
                  )}
                </div>

                {/* Real-time Google Drive Auto-Upload Progress */}
                {(isDriveUploading || driveUploadProgress !== null) && (
                  <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--line2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--ice)', fontWeight: 600 }}>
                        {driveUploadStatus || 'بارکردن بۆ گووگڵ درایڤ...'}
                      </span>
                      {driveUploadProgress !== null && (
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.84rem', color: 'var(--ice)' }}>
                          {driveUploadProgress}%
                        </span>
                      )}
                    </div>
                    <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${driveUploadProgress || 15}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--ice), var(--s))',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Preview Selected Image */}
                {filePreviewUrl && (
                  <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img
                      src={filePreviewUrl}
                      alt="Preview"
                      style={{
                        maxWidth: '180px',
                        maxHeight: '140px',
                        borderRadius: '12px',
                        border: '1px solid var(--line)',
                        display: 'block',
                        objectFit: 'cover',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
                        {selectedFile?.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '2px' }}>
                        قەبارە: {((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB
                      </div>
                      {uploadedDriveData?.url && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--s)', marginTop: '4px' }}>
                          ✅ ئامادەیە بۆ بڵاوکردنەوە لە ماڵپەڕ
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upload Progress Bar */}
            {uploadPercent !== null && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--ice)', marginBottom: '6px' }}>
                  <span>لە بارکردن و پەستاندنی فایلەکەدایە...</span>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>{uploadPercent}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${uploadPercent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--ice), var(--vio))',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Status Message */}
            {statusMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.9rem',
                  color: isSuccessMsg ? 'var(--s)' : '#ff7b8a',
                  marginBottom: '16px',
                  background: isSuccessMsg ? 'rgba(158, 230, 181, 0.1)' : 'rgba(255, 123, 138, 0.1)',
                  padding: '10px 16px',
                  borderRadius: '10px',
                }}
              >
                {isSuccessMsg ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
                <span>{statusMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="submit"
                className="btn pri"
                disabled={isPublishing}
                style={{ padding: '12px 32px', fontSize: '0.94rem', fontWeight: 700 }}
              >
                {isPublishing ? 'لە بڵاوکردنەوەدایە...' : 'بڵاوکردنەوەی پۆست'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MANAGE POSTS */}
      {activeTab === 'posts' && (
        <div className="glass" style={{ padding: '30px', borderRadius: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LayoutGrid size={20} style={{ color: 'var(--ice)' }} />
              بەڕێوەبردنی پۆستەکان ({posts.length})
            </h2>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'هەموو' },
                { id: 'general', label: 'گشتی' },
                { id: 'programming', label: 'بەرنامەسازی' },
                { id: 'posts', label: 'پۆستەکان' },
                { id: 'electronics', label: 'ئەلیکترۆن' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPostsFilter(f.id as any)}
                  style={{
                    background: postsFilter === f.id ? 'var(--ice)' : 'rgba(255, 255, 255, 0.05)',
                    color: postsFilter === f.id ? '#05080f' : 'var(--text)',
                    border: '1px solid var(--line2)',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: postsFilter === f.id ? 700 : 500,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="گەڕان بەپێی ناونیشان یان دەق لەناو پۆستەکاندا..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 42px 11px 16px',
                borderRadius: '12px',
                border: '1px solid var(--line2)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <Search
              size={17}
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ice)' }}
            />
          </div>

          {/* Delete Feedback Notice */}
          {deleteNotice && (
            <div
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.88rem',
                color: deleteNotice.type === 'success' ? 'var(--s)' : '#ff7b8a',
                background: deleteNotice.type === 'success' ? 'rgba(158, 230, 181, 0.1)' : 'rgba(255, 123, 138, 0.1)',
              }}
            >
              {deleteNotice.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{deleteNotice.msg}</span>
            </div>
          )}

          {/* Posts List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredPosts.map((post) => {
              const isConfirming = confirmDeleteId === post.id;
              const isDeleting = deletingId === post.id;
              const dateStr = formatPostDate(post.t);

              return (
                <div
                  key={post.id}
                  className="glass"
                  style={{
                    padding: '18px 20px',
                    borderRadius: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(94, 200, 255, 0.15)',
                          color: 'var(--ice)',
                        }}
                      >
                        {post.category || 'گشتی'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: 'var(--muted)',
                        }}
                      >
                        {post.type}
                      </span>
                      {dateStr && <span style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>{dateStr}</span>}
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>
                      {post.title || (post.type === 'code' ? 'نموونە کۆد' : 'پۆست')}
                    </h3>

                    {post.text && (
                      <p
                        style={{
                          fontSize: '0.88rem',
                          color: 'var(--muted)',
                          margin: '0 0 8px',
                          maxHeight: '60px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {post.text}
                      </p>
                    )}

                    {/* Image / Video Preview */}
                    {post.type === 'image' && post.url && (
                      <div style={{ marginTop: '8px', maxWidth: '160px' }}>
                        <DriveImage url={post.url} backupUrl={post.backupUrl} alt={post.title} style={{ maxHeight: '90px' }} />
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isConfirming ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post)}
                          disabled={isDeleting}
                          style={{
                            background: '#ff7b8a',
                            color: '#05080f',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          {isDeleting ? 'دەسڕدرێتەوە...' : 'بەڵێ، بسڕەوە'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="btn"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          پاشگەزبوونەوە
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(post.id)}
                        className="btn"
                        style={{
                          padding: '7px 14px',
                          fontSize: '0.82rem',
                          gap: '6px',
                          color: '#ff7b8a',
                          borderColor: 'rgba(255, 123, 138, 0.3)',
                        }}
                      >
                        <Trash2 size={14} />
                        <span>سڕینەوە</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredPosts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                هیچ پۆستێک لەم بەشەدا نەدۆزرایەوە.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SITE SETTINGS */}
      {activeTab === 'settings' && (
        <div className="glass" style={{ padding: '30px', borderRadius: '22px', maxWidth: '640px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} style={{ color: 'var(--ice)' }} />
            ڕێکخستنەکانی ماڵپەڕ
          </h2>

          <form onSubmit={handleSaveSettings}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.84rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                ناوی براند یان ماڵپەڕ (Site Name):
              </label>
              <input
                type="text"
                value={editSiteName}
                onChange={(e) => setEditSiteName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--line2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text)',
                  fontSize: '0.94rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.84rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                پێناسەی سەرەکی و ژێرنووس (Subtitle):
              </label>
              <textarea
                value={editSubtitle}
                onChange={(e) => setEditSubtitle(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--line2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text)',
                  fontSize: '0.92rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {settingsMsg && (
              <div
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  fontSize: '0.88rem',
                  color: 'var(--s)',
                  background: 'rgba(158, 230, 181, 0.1)',
                }}
              >
                {settingsMsg}
              </div>
            )}

            <button
              type="submit"
              className="btn pri"
              disabled={isSavingSettings}
              style={{ padding: '12px 30px', fontWeight: 700 }}
            >
              {isSavingSettings ? 'لە پاشەکەوتکردندایە...' : 'پاشەکەوتکردنی ڕێکخستنەکان'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
