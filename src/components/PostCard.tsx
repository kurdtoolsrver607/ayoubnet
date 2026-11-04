import React, { useState, useEffect } from 'react';
import type { Post } from '../firebase';
import {
  extractDriveFileId,
  formatPostDateTime,
  togglePostLike,
  recordPostView,
  getPostShareUrl,
  safeStorage,
} from '../firebase';
import { DriveImage } from './DriveImage';
import { translations, type Language } from '../i18n';
import {
  Heart,
  Share2,
  Eye,
  Clock,
  Calendar,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  MessageCircle,
  Maximize2,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  lang?: Language;
  onOpenModal?: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, lang = 'ku', onOpenModal }) => {
  const t = translations[lang] || translations.ku;
  const dt = formatPostDateTime(post.t, lang);

  // Per-device like status
  const [isLiked, setIsLiked] = useState<boolean>(() => {
    return safeStorage.get(`liked_${post.id}`) === '1';
  });
  const [likeCount, setLikeCount] = useState<number>(post.likes || 0);
  const [isLiking, setIsLiking] = useState<boolean>(false);

  // Sync likeCount if props update from realtime Firestore
  useEffect(() => {
    if (typeof post.likes === 'number') {
      setLikeCount(post.likes);
    }
  }, [post.likes]);

  // Per-device view tracking: records exactly 1 view per device
  useEffect(() => {
    recordPostView(post.id);
  }, [post.id]);

  // Code block expand/collapse
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Share state & feedback
  const [copiedLink, setCopiedLink] = useState(false);

  const handleToggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    const willBeLiked = !isLiked;
    setIsLiked(willBeLiked);
    setLikeCount((prev) => Math.max(0, prev + (willBeLiked ? 1 : -1)));

    try {
      await togglePostLike(post.id);
    } catch (err) {
      console.debug('Like error:', err);
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
          title: post.title || (lang === 'en' ? 'Ayoubi Post' : 'پۆستی ئەیوبی'),
          text: post.text ? (post.text.length > 120 ? post.text.slice(0, 117) + '...' : post.text) : '',
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
      } catch {
        try {
          window.prompt(t.post_share_copied, shareUrl);
        } catch {}
      }
    } else if (sharedViaNavigator) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2600);
    }
  };

  const handleCopyCode = () => {
    if (!post.text || typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(post.text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isHttps = /^(https:|data:image\/)/.test(post.url || '');
  const lineCount = (post.text || '').split('\n').length;
  const isLongCode = lineCount > 8;

  const shareUrl = getPostShareUrl(post.id);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`سەیری ئەم پۆستەی ئەیوبی بکە:\n${post.title || ''}\n${shareUrl}`)}`;

  return (
    <article
      id={`post-${post.id}`}
      className="post glass rv in"
      style={{
        padding: '20px 24px',
        borderRadius: '20px',
        border: '1px solid var(--line)',
        marginBottom: '20px',
        transition: 'all 0.3s ease',
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.035)',
      }}
    >
      {/* Social Media Author Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '14px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Avatar with gradient glow */}
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--ice), var(--vio))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem',
              color: '#05080f',
              boxShadow: '0 0 14px rgba(94, 200, 255, 0.35)',
              flexShrink: 0,
            }}
          >
            A
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text)' }}>
                ئەیوبی | Ayoubi
              </span>
              <CheckCircle2 size={15} fill="var(--ice)" color="#0b1020" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--muted)' }}>
              <span>@ayoubi</span>
              {post.category && post.category !== 'general' && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: 'rgba(94, 200, 255, 0.1)',
                    color: 'var(--ice)',
                    fontWeight: 600,
                  }}
                >
                  #{post.category === 'programming'
                    ? (lang === 'en' ? 'Programming' : 'بەرنامەسازی')
                    : post.category === 'electronics'
                    ? (lang === 'en' ? 'Electronics' : 'ئەلیکترۆن')
                    : (lang === 'en' ? 'Posts' : 'پۆستەکان')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Date & Time Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {(dt.date || dt.time) && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--line2)',
                fontSize: '0.76rem',
                color: 'var(--muted)',
                flexWrap: 'wrap',
              }}
            >
              {dt.date && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} style={{ color: 'var(--ice)' }} />
                  <span>{dt.date}</span>
                </span>
              )}
              {dt.time && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} style={{ color: 'var(--vio)' }} />
                  <span>{dt.time}</span>
                </span>
              )}
            </div>
          )}

          {/* Open full modal button */}
          {onOpenModal && (
            <button
              type="button"
              onClick={() => onOpenModal(post)}
              title="کردنەوەی پۆست لە مۆداڵی تایبەت"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--line2)',
                borderRadius: '8px',
                padding: '5px',
                color: 'var(--muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Maximize2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Post Title */}
      {post.title && (
        <h3
          onClick={() => onOpenModal && onOpenModal(post)}
          style={{
            fontSize: '1.18rem',
            fontWeight: 700,
            margin: '0 0 10px',
            color: 'var(--text)',
            lineHeight: 1.45,
            cursor: onOpenModal ? 'pointer' : 'default',
          }}
        >
          {post.title}
        </h3>
      )}

      {/* Post Content */}
      {post.type === 'code' ? (
        <div className={`cb ${isCodeOpen ? 'open' : ''}`} style={{ position: 'relative', marginTop: '8px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderBottom: '1px solid var(--line)',
              fontSize: '0.75rem',
              color: 'var(--muted)',
            }}
          >
            <span>{t.code_snippet}</span>
            <button
              type="button"
              onClick={handleCopyCode}
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
          {isLongCode && (
            <button
              type="button"
              className="more"
              onClick={() => setIsCodeOpen(!isCodeOpen)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {isCodeOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              {isCodeOpen ? t.read_less : t.read_more}
            </button>
          )}
        </div>
      ) : (
        <>
          {post.text && (
            <p
              style={{
                fontSize: '0.94rem',
                lineHeight: 1.85,
                color: 'var(--text)',
                margin: '0 0 12px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {post.text}
            </p>
          )}

          {post.type === 'image' && isHttps && post.url && (
            <div
              style={{ marginTop: '12px', borderRadius: '14px', overflow: 'hidden', cursor: onOpenModal ? 'pointer' : 'default' }}
              onClick={() => onOpenModal && onOpenModal(post)}
            >
              <DriveImage url={post.url} backupUrl={post.backupUrl} alt={post.title || ''} />
            </div>
          )}

          {post.type === 'video' && isHttps && post.url && (
            (() => {
              const driveId = extractDriveFileId(post.url);
              if (driveId) {
                return (
                  <div
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '14px',
                      aspectRatio: '16/9',
                      background: 'rgba(0,0,0,0.4)',
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
                <div style={{ marginTop: '12px' }}>
                  <video
                    src={post.url}
                    controls
                    preload="metadata"
                    playsInline
                    style={{
                      maxWidth: '100%',
                      borderRadius: '14px',
                      display: 'block',
                      border: '1px solid var(--line)',
                    }}
                  />
                </div>
              );
            })()
          )}
        </>
      )}

      {/* Social Media Action Footer */}
      <div
        style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Like */}
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isLiking}
            title={t.post_like}
            style={{
              background: isLiked ? 'rgba(255, 75, 110, 0.16)' : 'rgba(255, 255, 255, 0.04)',
              border: isLiked ? '1px solid rgba(255, 75, 110, 0.5)' : '1px solid var(--line2)',
              color: isLiked ? '#ff4b6e' : 'var(--muted)',
              borderRadius: '10px',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.84rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: isLiked ? 'scale(1.04)' : 'scale(1)',
            }}
          >
            <Heart size={16} fill={isLiked ? '#ff4b6e' : 'transparent'} />
            <span style={{ direction: 'ltr', fontVariantNumeric: 'tabular-nums' }}>
              {likeCount}
            </span>
          </button>

          {/* Views */}
          <div
            title={`${t.post_views}: ${post.views || 0}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.82rem',
              color: 'var(--muted)',
              padding: '5px 8px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <Eye size={15} style={{ color: 'var(--ice)', opacity: 0.85 }} />
            <span style={{ direction: 'ltr', fontVariantNumeric: 'tabular-nums' }}>
              {post.views || 0}
            </span>
          </div>

          {/* WhatsApp Direct Share/Chat */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="شەیرکردن لە واتسئاپ"
            style={{
              background: 'rgba(37, 211, 102, 0.08)',
              border: '1px solid rgba(37, 211, 102, 0.25)',
              color: '#25D366',
              borderRadius: '8px',
              padding: '5px 10px',
              fontSize: '0.78rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              textDecoration: 'none',
            }}
          >
            <MessageCircle size={14} />
            <span>واتسئاپ</span>
          </a>
        </div>

        {/* Share Button with feedback */}
        <button
          type="button"
          onClick={handleShare}
          title={t.post_share}
          style={{
            background: copiedLink ? 'rgba(158, 230, 181, 0.18)' : 'rgba(255, 255, 255, 0.05)',
            border: copiedLink ? '1px solid var(--s)' : '1px solid var(--line2)',
            color: copiedLink ? 'var(--s)' : 'var(--text)',
            borderRadius: '10px',
            padding: '6px 14px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            fontWeight: 600,
            fontFamily: 'inherit',
            transition: 'all 0.2s ease',
          }}
        >
          {copiedLink ? <Check size={15} style={{ color: 'var(--s)' }} /> : <Share2 size={15} style={{ color: 'var(--ice)' }} />}
          <span>{copiedLink ? t.post_share_copied : t.post_share}</span>
        </button>
      </div>
    </article>
  );
};
