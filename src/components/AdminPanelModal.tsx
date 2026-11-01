import React, { useState, useRef } from 'react';
import {
  auth,
  signOut,
  createPost,
  deletePost,
  type VisitorStats,
  type DayStats,
  type Post,
} from '../firebase';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    total: VisitorStats;
    today: DayStats;
  };
  posts: Post[];
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  stats,
  posts,
}) => {
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'code'>('text');
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [isSuccessMsg, setIsSuccessMsg] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const num = new Intl.NumberFormat('en-US');
  const statsSummary = `سەردانیکەر: ${num.format(stats.total.unique || 0)}  |  ئەمڕۆ: ${num.format(
    stats.today.unique || 0
  )}  |  کراوەتەوە: ${num.format(stats.total.opens || 0)}`;

  const isMedia = postType === 'image' || postType === 'video';

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as 'text' | 'image' | 'video' | 'code';
    setPostType(val);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setStatusMsg('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleLogout = async () => {
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
    const trimmed = text.trim();

    if (isMedia && !selectedFile) {
      setIsSuccessMsg(false);
      setStatusMsg('فایلێک هەڵبژێرە');
      return;
    }

    if (!isMedia && !trimmed) {
      setIsSuccessMsg(false);
      setStatusMsg('شتێک بنووسە');
      return;
    }

    if (selectedFile && selectedFile.size > 60 * 1024 * 1024) {
      setIsSuccessMsg(false);
      setStatusMsg('فایلەکە لە 60MB گەورەترە');
      return;
    }

    setIsPublishing(true);
    setStatusMsg('');

    try {
      await createPost(
        postType,
        trimmed,
        selectedFile,
        (pct) => {
          setIsSuccessMsg(true);
          setStatusMsg(`${pct}%`);
        }
      );

      setText('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsSuccessMsg(true);
      setStatusMsg('بڵاوکرایەوە');
    } catch (err) {
      console.error(err);
      setIsSuccessMsg(false);
      setStatusMsg('هەڵە ڕوویدا، دووبارە هەوڵبدەوە');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (post: Post) => {
    if (!window.confirm('دڵنیای؟')) return;
    try {
      await deletePost(post);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const getPlaceholder = () => {
    if (postType === 'code') return 'کۆدەکە لێرە دابنێ';
    if (isMedia) return 'ناونیشان (دڵخوازە)';
    return 'نووسین...';
  };

  return (
    <div
      className="ov on"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="box glass"
        style={{ width: 'min(580px, 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>پەڕەی ئەدمین</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '14px' }}>
          {statsSummary}
        </p>

        <select value={postType} onChange={handleTypeChange}>
          <option value="text">تێکست</option>
          <option value="image">وێنە</option>
          <option value="video">ڤیدیۆ</option>
          <option value="code">کۆد</option>
        </select>

        <textarea
          placeholder={getPlaceholder()}
          value={text}
          onChange={(e) => setText(e.target.value)}
          dir={postType === 'code' ? 'ltr' : 'auto'}
          style={{
            fontFamily: postType === 'code' ? "'JetBrains Mono', monospace" : 'inherit',
          }}
        />

        {isMedia && (
          <input
            ref={fileInputRef}
            type="file"
            accept={`${postType}/*`}
            onChange={handleFileChange}
            style={{
              display: 'block',
              marginBottom: '12px',
              color: 'var(--muted)',
            }}
          />
        )}

        <div
          className="err"
          style={{
            color: isSuccessMsg ? 'var(--s)' : '#ff7b8a',
          }}
        >
          {statusMsg}
        </div>

        <div className="row">
          <button
            className="btn pri"
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
          >
            {isPublishing ? 'لە بڵاوکردنەوەدایە...' : 'بڵاوکردنەوە'}
          </button>
          <button className="btn" type="button" onClick={onClose}>
            داخستن
          </button>
          <button className="btn" type="button" onClick={handleLogout}>
            دەرچوون
          </button>
        </div>

        <div id="al" style={{ marginTop: '16px' }}>
          {posts.map((p) => (
            <div key={p.id} className="arow">
              <span>
                {p.type} - {(p.text || '').slice(0, 40) || (p.url ? 'فایل' : '')}
              </span>
              <button
                className="btn"
                type="button"
                onClick={() => handleDelete(p)}
              >
                سڕینەوە
              </button>
            </div>
          ))}
          {posts.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', margin: '14px 0' }}>
              هیچ پۆستێک نییە
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
