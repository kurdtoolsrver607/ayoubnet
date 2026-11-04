import React, { useState, useEffect } from 'react';
import type { Post } from '../firebase';
import {
  extractDriveFileId,
  formatPostDateTime,
  togglePostLike,
  recordPostView,
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
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  lang?: Language;
}

export const PostCard: React.FC<PostCardProps> = ({ post, lang = 'ku' }) => {
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
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const shareUrl = `${origin}${pathname}?post=${post.id}`;

    let sharedViaNavigator = false;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: post.title || (lang === 'en' ? 'Ayoubi Post' : 'پۆستی ئەیوبی'),
          text: post.text ? (post.text.length > 120 ? post.text.slice(0, 117) + '...' : post.text) : '',
          url: shareUrl,
        });
        sharedViaNavigator = true;
      } catch (err) {
        // User cancelled or share dismissed
      }
    }

    if (!sharedViaNavigator && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2600);
      } catch {
        // Fallback prompt if clipboard fails
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

  return (
    <article
      id={`post-${post.id}`}
      className="post glass rv in"
      style={{
        padding: '24px',
        borderRadius: '18px',
        border: '1px solid var(--line)',
        marginBottom: '20px',
        transition: 'all 0.3s ease',
        position: 'relative',
      }}
    >
      {/* Post Header: Title + Category badge + Exact Date and Time */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {post.category && post.category !== 'general' && (
            <span
              style={{
                alignSelf: 'flex-start',
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(94, 200, 255, 0.12)',
                color: 'var(--ice)',
                fontWeight: 600,
              }}
            >
              {post.category === 'programming'
                ? (lang === 'en' ? 'Programming' : 'بەرنامەسازی')
                : post.category === 'electronics'
                ? (lang === 'en' ? 'Electronics' : 'ئەلیکترۆن')
                : (lang === 'en' ? 'Posts' : 'پۆستەکان')}
            </span>
          )}

          <h3
            style={{
              fontSize: '1.22rem',
              fontWeight: 700,
              margin: 0,
              color: 'var(--text)',
              lineHeight: 1.4,
            }}
          >
            {post.title || (post.type === 'code' ? t.code_snippet : '')}
          </h3>
        </div>

        {/* Date and Time Badges (both shown clearly) */}
        {(dt.date || dt.time) && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--line2)',
              fontSize: '0.78rem',
              color: 'var(--muted)',
              flexWrap: 'wrap',
            }}
          >
            {dt.date && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} style={{ color: 'var(--ice)' }} />
                <span>{dt.date}</span>
              </span>
            )}
            {dt.time && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={13} style={{ color: 'var(--vio)' }} />
                <span>{dt.time}</span>
              </span>
            )}
          </div>
        )}
      </div>

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
                fontSize: '0.95rem',
                lineHeight: 1.85,
                color: 'var(--text)',
                margin: '0 0 10px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {post.text}
            </p>
          )}

          {post.type === 'image' && isHttps && post.url && (
            <div style={{ marginTop: '12px' }}>
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
                      borderRadius: '12px',
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
                      borderRadius: '12px',
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

      {/* Post Action Footer: Likes, Views, and Share Button */}
      <div
        style={{
          marginTop: '18px',
          paddingTop: '14px',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isLiking}
            title={isLiked ? t.post_like : t.post_like}
            style={{
              background: isLiked ? 'rgba(255, 75, 110, 0.16)' : 'rgba(255, 255, 255, 0.04)',
              border: isLiked ? '1px solid rgba(255, 75, 110, 0.5)' : '1px solid var(--line2)',
              color: isLiked ? '#ff4b6e' : 'var(--muted)',
              borderRadius: '10px',
              padding: '6px 14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              fontSize: '0.86rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: isLiked ? 'scale(1.03)' : 'scale(1)',
            }}
          >
            <Heart
              size={17}
              fill={isLiked ? '#ff4b6e' : 'transparent'}
              style={{
                color: isLiked ? '#ff4b6e' : 'currentColor',
                transition: 'transform 0.2s',
              }}
            />
            <span style={{ direction: 'ltr', fontVariantNumeric: 'tabular-nums' }}>
              {likeCount}
            </span>
          </button>

          {/* Views Display (Per device tracked) */}
          <div
            title={`${t.post_views}: ${post.views || 0}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.84rem',
              color: 'var(--muted)',
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <Eye size={16} style={{ color: 'var(--ice)', opacity: 0.85 }} />
            <span style={{ direction: 'ltr', fontVariantNumeric: 'tabular-nums' }}>
              {post.views || 0}
            </span>
            <span style={{ fontSize: '0.76rem', opacity: 0.8 }}>{t.post_views}</span>
          </div>
        </div>

        {/* Share Button with feedback */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
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
              gap: '7px',
              fontSize: '0.84rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
            }}
          >
            {copiedLink ? <Check size={16} style={{ color: 'var(--s)' }} /> : <Share2 size={16} style={{ color: 'var(--ice)' }} />}
            <span>{copiedLink ? t.post_share_copied : t.post_share}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
