import React, { useState, useRef } from 'react';
import {
  auth,
  signOut,
  createPost,
  deletePost,
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
  X,
  Users,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Settings,
  Save,
  Tag,
  FolderOpen
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    total: VisitorStats;
    today: DayStats;
  };
  posts: Post[];
  siteSettings: SiteSettings;
  onSaveSettings: (settings: SiteSettings) => Promise<void>;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  stats,
  posts,
  siteSettings,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'settings'>('posts');
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'code'>('text');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'general' | 'programming' | 'posts' | 'electronics'>('general');
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [isSuccessMsg, setIsSuccessMsg] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'general' | 'programming' | 'posts' | 'electronics'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings form state
  const [editSiteName, setEditSiteName] = useState(siteSettings.name || 'Ayoubi');
  const [editSubtitle, setEditSubtitle] = useState(siteSettings.subtitle || '');
  const [settingsMsg, setSettingsMsg] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  if (!isOpen) return null;

  const num = new Intl.NumberFormat('en-US');
  const isMedia = postType === 'image' || postType === 'video';

  const handleTypeChange = (val: 'text' | 'image' | 'video' | 'code') => {
    setPostType(val);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setStatusMsg('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setFilePreviewUrl(URL.createObjectURL(file));
      } else {
        setFilePreviewUrl(null);
      }
    } else {
      setSelectedFile(null);
      setFilePreviewUrl(null);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('ayoub_admin_auth');
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.debug('Sign out error:', err);
      }
    }
    onClose();
  };

  const handlePublish = async () => {
    const trimmedText = text.trim();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setIsSuccessMsg(false);
      setStatusMsg('تکایە تایتڵ (ناونیشان) بۆ پۆستەکە بنووسە');
      return;
    }

    if (isMedia && !selectedFile) {
      setIsSuccessMsg(false);
      setStatusMsg('تکایە سەرەتا فایلێک هەڵبژێرە');
      return;
    }

    if (!isMedia && !trimmedText) {
      setIsSuccessMsg(false);
      setStatusMsg('تکایە نووسین یان کۆدەکە بنووسە');
      return;
    }

    if (selectedFile && selectedFile.size > 35 * 1024 * 1024) {
      setIsSuccessMsg(false);
      setStatusMsg('قەبارەی فایل بۆ گووگڵ درایڤ نابێت لە 35 مێگابایت زیاتر بێت');
      return;
    }

    setIsPublishing(true);
    setStatusMsg('');
    setUploadPercent(null);

    try {
      await createPost(
        postType,
        trimmedText,
        trimmedTitle,
        category,
        selectedFile,
        (pct) => {
          setUploadPercent(pct);
        }
      );

      setTitle('');
      setText('');
      setSelectedFile(null);
      setFilePreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsSuccessMsg(true);
      setStatusMsg('پۆستەکە و فایلەکە بە سەرکەوتوویی لە گووگڵ درایڤ خەزنکرا و بڵاوکرایەوە ✨');
    } catch (err: unknown) {
      console.error('Publish error:', err);
      setIsSuccessMsg(false);
      setStatusMsg(err instanceof Error ? err.message : 'هەڵەیەک ڕوویدا لە کاتی بڵاوکردنەوە، دووبارە هەوڵبدەوە');
    } finally {
      setIsPublishing(false);
      setUploadPercent(null);
    }
  };

  const handleSaveSiteSettings = async (e: React.FormEvent) => {
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
      setSettingsMsg('ڕێکخستنەکانی ماڵپەڕ بە سەرکەوتوویی پاشەکەوت کران ✅');
    } catch {
      setSettingsMsg('هەڵە لە پاشەکەوتکردن ڕوویدا');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDelete = async (post: Post) => {
    if (!window.confirm('ئایا دڵنیایت لە سڕینەوەی ئەم پۆستە؟ ئەم کردارە ناگەڕێتەوە.')) return;
    setDeletingId(post.id);
    try {
      await deletePost(post);
    } catch (err) {
      console.error('Delete error:', err);
      alert('نەتوانرا پۆستەکە بسڕدرێتەوە');
    } finally {
      setDeletingId(null);
    }
  };

  const formatTimestamp = (post: Post) => {
    if (post.t && typeof post.t === 'object' && 'toDate' in post.t && typeof post.t.toDate === 'function') {
      try {
        const d = post.t.toDate();
        const dateStr = d.toLocaleDateString('ckb-IQ', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${dateStr} - ${timeStr}`;
      } catch {
        return 'ئەمڕۆ';
      }
    }
    return 'ئەمڕۆ';
  };

  const filteredPosts = posts.filter((p) => {
    if (filterType === 'all') return true;
    return (p.category || 'general') === filterType;
  });

  return (
    <div
      className="ov on"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="box glass"
        style={{
          width: 'min(760px, 96%)',
          maxHeight: '92vh',
          padding: '24px',
          borderRadius: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--line)',
            paddingBottom: '14px',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--ice), var(--vio))',
                display: 'grid',
                placeItems: 'center',
                color: '#05080f',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>پەڕەی بەڕێوەبردنی ئەدمین</h3>
              <small style={{ color: 'var(--muted)', display: 'block' }}>
                کۆنترۆڵکردنی ناوەڕۆک و ڕێکخستنی ماڵپەڕ
              </small>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* View Switcher */}
            <button
              type="button"
              className={`btn ${activeTab === 'posts' ? 'pri' : ''}`}
              onClick={() => setActiveTab('posts')}
              style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
            >
              <Layers size={14} />
              پۆستەکان
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'settings' ? 'pri' : ''}`}
              onClick={() => setActiveTab('settings')}
              style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
            >
              <Settings size={14} />
              ڕێکخستنەکان
            </button>

            <button
              className="btn"
              type="button"
              onClick={handleLogout}
              style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
              title="دەرچوون لە ئەژمار"
            >
              <LogOut size={14} />
              دەرچوون
            </button>
            <button
              className="btn"
              type="button"
              onClick={onClose}
              style={{ padding: '6px 10px' }}
              title="داخستن"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab 1: Settings Editor */}
        {activeTab === 'settings' && (
          <form
            onSubmit={handleSaveSiteSettings}
            className="glass"
            style={{
              padding: '20px',
              borderRadius: '14px',
              border: '1px solid var(--line2)',
              marginBottom: '20px',
            }}
          >
            <h4 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={18} style={{ color: 'var(--ice)' }} />
              گۆڕینی ناوی وێبسایت و تایتڵ
            </h4>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.84rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                ناوی وێبسایت (بۆ نموونە: Ayoubi):
              </label>
              <input
                type="text"
                value={editSiteName}
                onChange={(e) => setEditSiteName(e.target.value)}
                placeholder="Ayoubi"
                style={{ margin: 0, fontSize: '0.94rem' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.84rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                پێناسە و تایتڵی سەرەکی وێبسایت:
              </label>
              <textarea
                value={editSubtitle}
                onChange={(e) => setEditSubtitle(e.target.value)}
                placeholder="پلاتفۆرمی فەرمی ئەیوبی..."
                style={{ margin: 0, minHeight: '80px', fontSize: '0.88rem' }}
              />
            </div>

            {settingsMsg && (
              <div
                style={{
                  fontSize: '0.86rem',
                  color: settingsMsg.includes('سەرکەوتوویی') ? 'var(--s)' : '#ff7b8a',
                  marginBottom: '14px',
                }}
              >
                {settingsMsg}
              </div>
            )}

            <button
              type="submit"
              className="btn pri"
              disabled={isSavingSettings}
              style={{ gap: '8px' }}
            >
              <Save size={15} />
              {isSavingSettings ? 'پاشەکەوت دەکرێت...' : 'پاشەکەوتکردنی ڕێکخستنەکان'}
            </button>
          </form>
        )}

        {/* Tab 2: Posts & Analytics */}
        {activeTab === 'posts' && (
          <>
            {/* Live Visitor Analytics Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
                marginBottom: '18px',
              }}
            >
              <div
                className="glass"
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: '1px solid var(--line2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--ice)', marginBottom: '4px' }}>
                  <Users size={13} />
                  <small style={{ fontSize: '0.74rem' }}>سەردانیکەری گشتی</small>
                </div>
                <b style={{ fontSize: '1.2rem', fontFamily: 'Space Grotesk' }}>
                  {num.format(stats.total.unique || 0)}
                </b>
              </div>

              <div
                className="glass"
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: '1px solid var(--line2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--s)', marginBottom: '4px' }}>
                  <Calendar size={13} />
                  <small style={{ fontSize: '0.74rem' }}>ئەمڕۆ</small>
                </div>
                <b style={{ fontSize: '1.2rem', fontFamily: 'Space Grotesk' }}>
                  {num.format(stats.today.unique || 0)}
                </b>
              </div>

              <div
                className="glass"
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: '1px solid var(--line2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--k)', marginBottom: '4px' }}>
                  <Eye size={13} />
                  <small style={{ fontSize: '0.74rem' }}>کراوەتەوە</small>
                </div>
                <b style={{ fontSize: '1.2rem', fontFamily: 'Space Grotesk' }}>
                  {num.format(stats.total.opens || 0)}
                </b>
              </div>

              <div
                className="glass"
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: '1px solid var(--line2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--n)', marginBottom: '4px' }}>
                  <Layers size={13} />
                  <small style={{ fontSize: '0.74rem' }}>کۆی پۆستەکان</small>
                </div>
                <b style={{ fontSize: '1.2rem', fontFamily: 'Space Grotesk' }}>
                  {posts.length}
                </b>
              </div>
            </div>

            {/* Post Creation Studio */}
            <div
              className="glass"
              style={{
                padding: '18px',
                borderRadius: '14px',
                marginBottom: '22px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--line2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>بڵاوکردنەوەی پۆستی نوێ</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  تایتڵ بنووسە و بەشەکەی هەڵبژێرە
                </span>
              </div>

              {/* Title input */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Tag size={14} style={{ color: 'var(--ice)' }} />
                  <label style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>تایتڵی پۆست (ناونیشان):</label>
                </div>
                <input
                  type="text"
                  placeholder="ناونیشانی سەرەکی پۆستەکە بنووسە..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ margin: 0, fontSize: '0.9rem' }}
                />
              </div>

              {/* Category Selector */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FolderOpen size={14} style={{ color: 'var(--vio)' }} />
                  <label style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>لە چ بەشێک بڵاوبکرێتەوە؟</label>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'general', label: 'عام / سەرەکی' },
                    { id: 'programming', label: 'بەرنامەسازی (کۆد)' },
                    { id: 'posts', label: 'پۆستەکان' },
                    { id: 'electronics', label: 'ئەلیکترۆن' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as any)}
                      style={{
                        background: category === cat.id ? 'var(--ice)' : 'var(--glass)',
                        color: category === cat.id ? '#05080f' : 'var(--muted)',
                        border: '1px solid var(--line2)',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: category === cat.id ? 700 : 500,
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Selector Tabs */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn ${postType === 'text' ? 'pri' : ''}`}
                  onClick={() => handleTypeChange('text')}
                  style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
                >
                  <FileText size={14} />
                  تێکست
                </button>
                <button
                  type="button"
                  className={`btn ${postType === 'image' ? 'pri' : ''}`}
                  onClick={() => handleTypeChange('image')}
                  style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
                >
                  <ImageIcon size={14} />
                  وێنە
                </button>
                <button
                  type="button"
                  className={`btn ${postType === 'video' ? 'pri' : ''}`}
                  onClick={() => handleTypeChange('video')}
                  style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
                >
                  <Video size={14} />
                  ڤیدیۆ
                </button>
                <button
                  type="button"
                  className={`btn ${postType === 'code' ? 'pri' : ''}`}
                  onClick={() => handleTypeChange('code')}
                  style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
                >
                  <Code2 size={14} />
                  کۆد
                </button>
              </div>

              {/* Input text / code */}
              <textarea
                placeholder={
                  postType === 'code'
                    ? '// کۆدەکەت لێرە بنووسە یان پەیستی بکە...'
                    : isMedia
                    ? 'ڕوونکردنەوەی وێنە یان ڤیدیۆکە (دڵخوازە)...'
                    : 'ناوەڕۆکی پۆستەکە بنووسە...'
                }
                value={text}
                onChange={(e) => setText(e.target.value)}
                dir={postType === 'code' ? 'ltr' : 'auto'}
                style={{
                  fontFamily: postType === 'code' ? "'JetBrains Mono', monospace" : 'inherit',
                  minHeight: postType === 'code' ? '130px' : '85px',
                  fontSize: postType === 'code' ? '0.82rem' : '0.9rem',
                  lineHeight: 1.7,
                  marginBottom: '10px',
                }}
              />

              {/* Media File Upload Area */}
              {isMedia && (
                <div
                  style={{
                    marginBottom: '12px',
                    border: '1px dashed var(--line2)',
                    borderRadius: '12px',
                    padding: '14px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={`${postType}/*`}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="panel-file-picker"
                  />
                  <label
                    htmlFor="panel-file-picker"
                    style={{
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--ice)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                    }}
                  >
                    <UploadCloud size={18} />
                    {selectedFile ? `فایل: ${selectedFile.name}` : `هەڵبژاردنی فایلی ${postType === 'image' ? 'وێنە' : 'ڤیدیۆ'}`}
                  </label>

                  {selectedFile && (
                    <div style={{ marginTop: '6px', fontSize: '0.78rem', color: 'var(--muted)' }}>
                      قەبارە: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  )}

                  {filePreviewUrl && (
                    <div style={{ marginTop: '10px' }}>
                      <img
                        src={filePreviewUrl}
                        alt="Preview"
                        style={{
                          maxHeight: '130px',
                          borderRadius: '10px',
                          border: '1px solid var(--line)',
                          display: 'inline-block',
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Progress */}
              {uploadPercent !== null && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--ice)', marginBottom: '4px' }}>
                    <span>لە بارکردنی فایلەکەدایە...</span>
                    <span>{uploadPercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--glass)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${uploadPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--ice), var(--vio))', transition: 'width 0.2s' }} />
                  </div>
                </div>
              )}

              {statusMsg && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.86rem',
                    color: isSuccessMsg ? 'var(--s)' : '#ff7b8a',
                    marginBottom: '10px',
                    background: isSuccessMsg ? 'rgba(158, 230, 181, 0.08)' : 'rgba(255, 123, 138, 0.08)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                  }}
                >
                  {isSuccessMsg ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{statusMsg}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  className="btn pri"
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  style={{ minWidth: '130px' }}
                >
                  {isPublishing ? 'لە بڵاوکردنەوەدایە...' : 'بڵاوکردنەوەی پۆست'}
                </button>
              </div>
            </div>

            {/* Existing Posts Management */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>
                  لیستی پۆستەکان ({filteredPosts.length})
                </h4>

                {/* Filter buttons by category */}
                <div style={{ display: 'flex', gap: '4px', fontSize: '0.78rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'هەمووی' },
                    { id: 'general', label: 'عام' },
                    { id: 'programming', label: 'بەرنامەسازی' },
                    { id: 'posts', label: 'پۆستەکان' },
                    { id: 'electronics', label: 'ئەلیکترۆن' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterType(f.id as any)}
                      style={{
                        background: filterType === f.id ? 'var(--ice)' : 'var(--glass)',
                        color: filterType === f.id ? '#05080f' : 'var(--muted)',
                        border: '1px solid var(--line2)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredPosts.map((p) => {
                  const timeStr = formatTimestamp(p);
                  const isDeleting = deletingId === p.id;

                  const categoryLabel =
                    p.category === 'programming'
                      ? 'بەرنامەسازی'
                      : p.category === 'electronics'
                      ? 'ئەلیکترۆن'
                      : p.category === 'posts'
                      ? 'پۆستەکان'
                      : 'عام';

                  return (
                    <div
                      key={p.id}
                      className="glass"
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid var(--line)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        opacity: isDeleting ? 0.4 : 1,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      {/* Top row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              background: 'rgba(94, 200, 255, 0.15)',
                              color: 'var(--ice)',
                            }}
                          >
                            {categoryLabel}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 6px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--muted)',
                            }}
                          >
                            {p.type}
                          </span>
                          <span style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                            {timeStr}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleDelete(p)}
                          disabled={isDeleting}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.78rem',
                            color: '#ff7b8a',
                            borderColor: 'rgba(255, 123, 138, 0.3)',
                            gap: '4px',
                          }}
                          title="سڕینەوەی ئەم پۆستە"
                        >
                          <Trash2 size={13} />
                          {isDeleting ? 'دەسڕدرێتەوە...' : 'سڕینەوە'}
                        </button>
                      </div>

                      {/* Title */}
                      {p.title && (
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>
                          {p.title}
                        </div>
                      )}

                      {/* Content Preview */}
                      {p.text && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.84rem',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontFamily: p.type === 'code' ? "'JetBrains Mono', monospace" : 'inherit',
                            direction: p.type === 'code' ? 'ltr' : 'auto',
                            background: p.type === 'code' ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
                            padding: p.type === 'code' ? '8px 10px' : '0',
                            borderRadius: p.type === 'code' ? '6px' : '0',
                            maxHeight: '90px',
                            overflowY: 'auto',
                          }}
                        >
                          {p.text}
                        </p>
                      )}

                      {p.type === 'image' && p.url && (
                        <div>
                          <img
                            src={p.url}
                            alt="Preview"
                            loading="lazy"
                            style={{
                              maxHeight: '100px',
                              borderRadius: '8px',
                              border: '1px solid var(--line)',
                              objectFit: 'cover',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredPosts.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '24px 10px',
                      color: 'var(--muted)',
                      fontSize: '0.85rem',
                    }}
                  >
                    هیچ پۆستێک لەم بەشەدا نەدۆزرایەوە
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
