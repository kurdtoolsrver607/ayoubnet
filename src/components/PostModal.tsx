import React, { useState, useEffect } from 'react';
import type { Post } from '../firebase';
import {
  formatPostDateTime,
  togglePostLike,
  recordPostView,
  getPostShareUrl,
  safeStorage,
  extractDriveFileId,
} from '../firebase';
import { DriveImage } from './DriveImage';
import { translations, type Language } from '../i18n';
import {
  X,
  Heart,
  Share2,
  Eye,
  Clock,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
} from 'lucide-react';

interface PostModalProps {
  post: Post | null;
  onClose: () => void;
  lang?: Language;
}

export const PostModal: React.FC<PostModalProps> = ({ post, onClose, lang = 'ku' }) => {
  if (!post) return null;

  const t = translations[lang] || translations.ku;
  const dt = formatPostDateTime(post.t, lang);

  // Per-device like status
  const [isLiked, setIsLiked] = useState<boolean>(() => {
    return safeStorage.get(`liked_${post.id}`) === '1';
  });
  const [likeCount, setLikeCount] = useState<number>(post.likes || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (typeof post.likes === 'number') {
      setLikeCount(post.likes);
    }
  }, [post.likes]);

  useEffect(() => {
    recordPostView(post.id);
  }, [post.id]);

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleToggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    const willBeLiked = !isLiked;
    setIsLiked(willBeLiked);
    setLikeCount((prev) => Math.max(0, prev + (willBeLiked ? 1 : -1)));

    try {
      await togglePostLike(post.id);
    } catch (err) {
      console.debug('Like error in modal:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = getPostShareUrl(post.id);
    let sharedViaNavigator = false;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: post.title || 'پۆستی ئەیوبی',
          text: post.text ? (post.text.length > 100 ? post.text.slice(0, 97) + '...' : post.text) : '',
          url: shareUrl,
        });
        sharedViaNavigator = true;
      } catch {}
    }

    if (!sharedViaNavigator && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2600);
      } catch {}
    } else if (sharedViaNavigator) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2600);
    }
  };

  const isHttps = /^(https:|data:image\/)/.test(post.url || '');
  const shareUrl = getPostShareUrl(post.id);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`سەیری ئەم پۆستەی ئەیوبی بکە:\n${post.title || ''}\n${shareUrl}`)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 8, 16, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass rv in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '24px',
          border: '1px solid var(--line2)',
          background: 'rgba(11, 16, 32, 0.95)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(94, 200, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            background: 'rgba(11, 16, 32, 0.96)',
            zIndex: 10,
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Author info (Social Media style) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--ice), var(--vio))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                color: '#05080f',
                fontSize: '1.15rem',
                boxShadow: '0 0 15px rgba(94, 200, 255, 0.4)',
                flexShrink: 0,
              }}
            >
              A
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '1rem', color: 'var(--text)' }}>ئەیوبی | Ayoubi</strong>
                <CheckCircle2 size={16} fill="var(--ice)" color="#0b1020" />
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>@ayoubi.site</span>
                {post.category && post.category !== 'general' && (
                  <span style={{ color: 'var(--ice)', fontWeight: 600 }}>
                    #{post.category === 'programming' ? 'بەرنامەسازی' : post.category === 'electronics' ? 'ئەلیکترۆن' : 'پۆستەکان'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text)',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '22px 24px' }}>
          {/* Post Title */}
          {post.title && (
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--text)',
                margin: '0 0 12px',
                lineHeight: 1.45,
              }}
            >
              {post.title}
            </h2>
          )}

          {/* Date & Time metadata */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '18px',
              fontSize: '0.8rem',
              color: 'var(--muted)',
              flexWrap: 'wrap',
            }}
          >
            {dt.date && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={14} style={{ color: 'var(--ice)' }} />
                <span>{dt.date}</span>
              </span>
            )}
            {dt.time && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={14} style={{ color: 'var(--vio)' }} />
                <span>{dt.time}</span>
              </span>
            )}
          </div>

          {/* Post Text */}
          {post.text && (
            <p
              style={{
                fontSize: '1rem',
                lineHeight: 1.9,
                color: 'var(--text)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                marginBottom: '16px',
              }}
            >
              {post.text}
            </p>
          )}

          {/* Code snippet */}
          {post.type === 'code' && (
            <div className="cb open" style={{ margin: '14px 0' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderBottom: '1px solid var(--line)',
                  fontSize: '0.78rem',
                  color: 'var(--muted)',
                }}
              >
                <span>نموونە کۆد</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(post.text || '');
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copiedCode ? 'var(--s)' : 'var(--ice)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                  }}
                >
                  {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                  {copiedCode ? t.copied : t.copy_code}
                </button>
              </div>
              <pre>
                <code>{post.text}</code>
              </pre>
            </div>
          )}

          {/* Media image preview */}
          {post.type === 'image' && isHttps && post.url && (
            <div style={{ marginTop: '14px', borderRadius: '16px', overflow: 'hidden' }}>
              <DriveImage url={post.url} backupUrl={post.backupUrl} alt={post.title || ''} />
            </div>
          )}

          {/* Video player */}
          {post.type === 'video' && isHttps && post.url && (
            (() => {
              const driveId = extractDriveFileId(post.url);
              if (driveId) {
                return (
                  <div
                    style={{
                      marginTop: '14px',
                      width: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '16px',
                      aspectRatio: '16/9',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <iframe
                      src={`https://drive.google.com/file/d/${driveId}/preview`}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      title={post.title || 'Video'}
                    />
                  </div>
                );
              }
              return (
                <div style={{ marginTop: '14px' }}>
                  <video
                    src={post.url}
                    controls
                    autoPlay
                    playsInline
                    style={{
                      maxWidth: '100%',
                      borderRadius: '16px',
                      display: 'block',
                      border: '1px solid var(--line)',
                    }}
                  />
                </div>
              );
            })()
          )}
        </div>

        {/* Modal Action Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'rgba(11, 16, 32, 0.98)',
            position: 'sticky',
            bottom: 0,
            borderRadius: '0 0 24px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Like */}
            <button
              type="button"
              onClick={handleToggleLike}
              disabled={isLiking}
              style={{
                background: isLiked ? 'rgba(255, 75, 110, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: isLiked ? '1px solid rgba(255, 75, 110, 0.6)' : '1px solid var(--line2)',
                color: isLiked ? '#ff4b6e' : 'var(--muted)',
                borderRadius: '10px',
                padding: '7px 14px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '0.88rem',
                fontWeight: 600,
              }}
            >
              <Heart size={18} fill={isLiked ? '#ff4b6e' : 'transparent'} />
              <span style={{ direction: 'ltr' }}>{likeCount}</span>
            </button>

            {/* Views */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.84rem',
                color: 'var(--muted)',
                padding: '7px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
              }}
            >
              <Eye size={16} style={{ color: 'var(--ice)' }} />
              <span style={{ direction: 'ltr' }}>{post.views || 0}</span>
              <span style={{ fontSize: '0.78rem' }}>بینین</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* WhatsApp Share */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{
                padding: '7px 12px',
                fontSize: '0.82rem',
                gap: '6px',
                color: '#25D366',
                borderColor: 'rgba(37, 211, 102, 0.3)',
              }}
            >
              <MessageCircle size={15} />
              <span>واتسئاپ</span>
            </a>

            {/* Copy / Native Share */}
            <button
              type="button"
              onClick={handleShare}
              className="btn pri"
              style={{
                padding: '7px 14px',
                fontSize: '0.84rem',
                fontWeight: 700,
                gap: '7px',
              }}
            >
              {copiedLink ? <Check size={15} /> : <Share2 size={15} />}
              <span>{copiedLink ? t.post_share_copied : t.post_share}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
