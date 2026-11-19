import React, { useState } from 'react';
import {
  Radio,
  Plus,
  Trash2,
  X,
  Image as ImageIcon,
  Video,
  TrendingUp,
  TrendingDown,
  Copy,
  Check,
  Upload,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import {
  createPublicPost,
  deletePublicPost,
  compressTradingImage,
  formatShortTimestamp,
  type PublicFeedPost,
  type TradeDirection,
  type TradingUserProfile,
} from '../tradingFirebase';

interface FeedTabProps {
  profile: TradingUserProfile;
  isAdmin: boolean;
  posts: PublicFeedPost[];
}

function getEmbedVideoInfo(url: string): { kind: 'iframe' | 'video' | 'link'; src: string } | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (ytMatch) {
    return { kind: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}` };
  }

  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(trimmed)) {
    return { kind: 'video', src: trimmed };
  }

  return { kind: 'link', src: trimmed };
}

const DIRECTIONS: TradeDirection[] = ['BUY', 'SELL', 'BUY LIMIT', 'SELL LIMIT'];

export const FeedTab: React.FC<FeedTabProps> = ({ profile, isAdmin, posts }) => {
  const [composerOpen, setComposerOpen] = useState(false);
  const [postType, setPostType] = useState<'announcement' | 'signal' | 'media'>('announcement');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);

  // Optional signal fields when postType === 'signal'
  const [pair, setPair] = useState('XAUUSD');
  const [direction, setDirection] = useState<TradeDirection>('BUY');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [tp1, setTp1] = useState('');
  const [tp2, setTp2] = useState('');
  const [tp3, setTp3] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const resetForm = () => {
    setPostType('announcement');
    setTitle('');
    setBody('');
    setImageUrl('');
    setVideoUrl('');
    setPair('XAUUSD');
    setDirection('BUY');
    setEntryPrice('');
    setStopLoss('');
    setTp1('');
    setTp2('');
    setTp3('');
    setFormError(null);
  };

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    setUploadingImg(true);
    try {
      const compressedDataUrl = await compressTradingImage(file);
      setImageUrl(compressedDataUrl);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to process image.');
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setFormError(null);

    if (!title.trim() && !body.trim() && postType !== 'signal') {
      setFormError('Please enter a title or message for your broadcast.');
      return;
    }

    let signalPayload = null;
    if (postType === 'signal') {
      const entry = parseFloat(entryPrice);
      const sl = parseFloat(stopLoss);
      const t1 = parseFloat(tp1);
      if (!pair.trim() || Number.isNaN(entry) || Number.isNaN(sl) || Number.isNaN(t1)) {
        setFormError('Public signal requires Pair, Entry, SL, and TP1.');
        return;
      }
      signalPayload = {
        pair: pair.trim().toUpperCase(),
        type: direction,
        entryPrice: entry,
        stopLoss: sl,
        tp1: t1,
        tp2: tp2.trim() ? parseFloat(tp2) : null,
        tp3: tp3.trim() ? parseFloat(tp3) : null,
      };
    }

    setSubmitting(true);
    try {
      await createPublicPost({
        authorUid: profile.uid,
        authorEmail: profile.email,
        authorName: profile.displayName || 'Desk Admin',
        postType,
        title: title.trim() || (signalPayload ? `${signalPayload.pair} ${signalPayload.type} Signal` : 'Desk Update'),
        body: body.trim(),
        imageUrl: imageUrl.trim(),
        videoUrl: videoUrl.trim(),
        signal: signalPayload,
      });
      resetForm();
      setComposerOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to publish post.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!isAdmin) return;
    try {
      await deletePublicPost(postId);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleCopySignal = async (post: PublicFeedPost) => {
    if (!post.signal) return;
    const s = post.signal;
    const lines = [
      `${s.pair} ${s.type}`,
      `Entry: ${s.entryPrice}`,
      `SL: ${s.stopLoss}`,
      `TP1: ${s.tp1}`,
      s.tp2 ? `TP2: ${s.tp2}` : null,
      s.tp3 ? `TP3: ${s.tp3}` : null,
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Clipboard may be unavailable inside restricted WebViews
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} style={{ color: 'var(--tr-buy)' }} />
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#F8FAFC' }}>
              Admin Broadcast Feed
            </h1>
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--tr-muted)', marginTop: '2px' }}>
            Official market updates, desk announcements &amp; public signals
          </div>
        </div>

        {/* ONLY Admin sees New Post button */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setComposerOpen(true);
            }}
            className="tr-btn tr-btn-primary tr-btn-sm tr-press"
          >
            <Plus size={16} />
            <span>New Post</span>
          </button>
        )}
      </div>

      {/* Feed List */}
      {posts.length === 0 ? (
        <div className="tr-card" style={{ textAlign: 'center', padding: '44px 20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>
            No broadcasts yet
          </div>
          <p style={{ fontSize: '13px', color: 'var(--tr-muted)', margin: '6px auto 0', maxWidth: '340px' }}>
            {isAdmin
              ? 'Publish announcements, market charts, video breakdowns, or public signals using the New Post button.'
              : 'Desk announcements and public setups posted by the administrator will appear here in real time.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '820px' }}>
          {posts.map((post) => {
            const videoInfo = post.videoUrl ? getEmbedVideoInfo(post.videoUrl) : null;
            const isBuySignal = post.signal?.type.startsWith('BUY');

            return (
              <article key={post.id} className="tr-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Author & Timestamp Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'var(--tr-buy-soft)',
                        border: '1px solid var(--tr-buy-border)',
                        color: '#6EE7B7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ShieldCheck size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>
                          {post.authorName || 'Desk Admin'}
                        </span>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '6px',
                            background: 'var(--tr-buy-soft)',
                            color: '#6EE7B7',
                          }}
                        >
                          ADMIN
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--tr-muted)' }}>
                        {formatShortTimestamp(post.createdAt)} ·{' '}
                        {post.postType === 'signal'
                          ? 'Public Signal'
                          : post.postType === 'media'
                          ? 'Media Analysis'
                          : 'Announcement'}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {confirmDeleteId === post.id ? (
                        <>
                          <button
                            type="button"
                            className="tr-btn tr-btn-danger tr-btn-sm tr-press"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            className="tr-btn tr-btn-sm tr-press"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          aria-label="Delete broadcast"
                          onClick={() => setConfirmDeleteId(post.id)}
                          className="tr-btn tr-btn-sm tr-press"
                          style={{ padding: '6px 9px', color: '#FCA5A5' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Title & Body */}
                <div>
                  {post.title && (
                    <h2 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 800, color: '#F8FAFC' }}>
                      {post.title}
                    </h2>
                  )}
                  {post.body && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        color: 'var(--tr-text-secondary)',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
                      }}
                    >
                      {post.body}
                    </p>
                  )}
                </div>

                {/* Embedded Public Signal Box */}
                {post.signal && (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      background: 'rgba(11, 15, 23, 0.78)',
                      border: `1px solid ${isBuySignal ? 'var(--tr-buy-border)' : 'var(--tr-sell-border)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="tr-mono" style={{ fontSize: '16px', fontWeight: 800, color: '#F8FAFC' }}>
                          {post.signal.pair}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 9px',
                            borderRadius: '8px',
                            background: isBuySignal ? 'var(--tr-buy-soft)' : 'var(--tr-sell-soft)',
                            color: isBuySignal ? '#6EE7B7' : '#FCA5A5',
                            fontSize: '11.5px',
                            fontWeight: 800,
                          }}
                        >
                          {isBuySignal ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {post.signal.type}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopySignal(post)}
                        className="tr-btn tr-btn-sm tr-press"
                        style={{ minHeight: '34px', padding: '5px 10px' }}
                      >
                        {copiedId === post.id ? <Check size={13} style={{ color: 'var(--tr-buy)' }} /> : <Copy size={13} />}
                        <span>{copiedId === post.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="tr-price-grid">
                      <div className="tr-price-cell">
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--tr-muted)' }}>ENTRY</span>
                        <span className="tr-mono" style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>
                          {post.signal.entryPrice}
                        </span>
                      </div>
                      <div className="tr-price-cell" style={{ borderColor: 'rgba(239, 68, 68, 0.28)' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#FCA5A5' }}>SL</span>
                        <span className="tr-mono" style={{ fontSize: '13.5px', fontWeight: 700, color: '#FCA5A5' }}>
                          {post.signal.stopLoss}
                        </span>
                      </div>
                      <div className="tr-price-cell" style={{ borderColor: 'rgba(16, 185, 129, 0.28)' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#6EE7B7' }}>TP1</span>
                        <span className="tr-mono" style={{ fontSize: '13.5px', fontWeight: 700, color: '#6EE7B7' }}>
                          {post.signal.tp1}
                        </span>
                      </div>
                      <div className="tr-price-cell">
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--tr-muted)' }}>TP2</span>
                        <span className="tr-mono" style={{ fontSize: '13.5px', fontWeight: 600, color: post.signal.tp2 ? '#A7F3D0' : 'var(--tr-muted)' }}>
                          {post.signal.tp2 ?? '—'}
                        </span>
                      </div>
                      <div className="tr-price-cell">
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--tr-muted)' }}>TP3</span>
                        <span className="tr-mono" style={{ fontSize: '13.5px', fontWeight: 600, color: post.signal.tp3 ? '#A7F3D0' : 'var(--tr-muted)' }}>
                          {post.signal.tp3 ?? '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Attachment */}
                {post.imageUrl && !brokenImages[post.id] && (
                  <div
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid var(--tr-border)',
                      background: '#080B12',
                    }}
                  >
                    <img
                      src={post.imageUrl}
                      alt={post.title || 'Market chart'}
                      referrerPolicy="no-referrer"
                      onError={() => setBrokenImages((prev) => ({ ...prev, [post.id]: true }))}
                      style={{
                        width: '100%',
                        maxHeight: '420px',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                )}

                {/* Video Embed */}
                {videoInfo && (
                  <div>
                    {videoInfo.kind === 'iframe' ? (
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          paddingTop: '56.25%',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          border: '1px solid var(--tr-border)',
                          background: '#000',
                        }}
                      >
                        <iframe
                          src={videoInfo.src}
                          title={post.title || 'Market video'}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            border: 'none',
                          }}
                        />
                      </div>
                    ) : videoInfo.kind === 'video' ? (
                      <video
                        src={videoInfo.src}
                        controls
                        playsInline
                        style={{
                          width: '100%',
                          maxHeight: '400px',
                          borderRadius: '12px',
                          border: '1px solid var(--tr-border)',
                          background: '#000',
                        }}
                      />
                    ) : (
                      <a
                        href={videoInfo.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tr-btn tr-btn-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        <Video size={14} />
                        <span>Open Attached Video</span>
                      </a>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Admin-Only New Broadcast Modal */}
      {isAdmin && composerOpen && (
        <div
          className="tr-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setComposerOpen(false);
          }}
        >
          <div className="tr-sheet" role="dialog" aria-modal="true" aria-labelledby="tr-feed-modal-title">
            <div className="tr-sheet-handle" />
            <div className="tr-sheet-header">
              <div>
                <h2 id="tr-feed-modal-title" style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#F8FAFC' }}>
                  Publish to Public Feed
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--tr-muted)' }}>
                  Visible immediately to all active traders
                </div>
              </div>
              <button
                type="button"
                aria-label="Close composer"
                onClick={() => setComposerOpen(false)}
                className="tr-btn tr-btn-sm tr-press"
                style={{ padding: '6px 8px', minHeight: '36px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="tr-sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {formError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'var(--tr-sell-soft)',
                      border: '1px solid var(--tr-sell-border)',
                      color: '#FECACA',
                      fontSize: '12.5px',
                    }}
                  >
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Post Type Segmented Control */}
                <div className="tr-segmented" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <button
                    type="button"
                    className={`tr-seg-btn tr-press ${postType === 'announcement' ? 'active' : ''}`}
                    onClick={() => setPostType('announcement')}
                  >
                    Announcement
                  </button>
                  <button
                    type="button"
                    className={`tr-seg-btn tr-press ${postType === 'signal' ? 'active' : ''}`}
                    onClick={() => setPostType('signal')}
                  >
                    Public Signal
                  </button>
                  <button
                    type="button"
                    className={`tr-seg-btn tr-press ${postType === 'media' ? 'active' : ''}`}
                    onClick={() => setPostType('media')}
                  >
                    Chart / Video
                  </button>
                </div>

                <div>
                  <label className="tr-label" htmlFor="tr-post-title">Headline / Title</label>
                  <input
                    id="tr-post-title"
                    type="text"
                    className="tr-input"
                    placeholder="e.g. Gold NY Session Outlook"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={180}
                  />
                </div>

                <div>
                  <label className="tr-label" htmlFor="tr-post-body">Message / Commentary</label>
                  <textarea
                    id="tr-post-body"
                    className="tr-textarea"
                    placeholder="Write your market commentary, key levels, or risk reminder..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={4000}
                  />
                </div>

                {/* Public Signal Fields */}
                {postType === 'signal' && (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'rgba(11, 15, 23, 0.72)',
                      border: '1px solid var(--tr-border-strong)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label className="tr-label">Pair *</label>
                        <input
                          type="text"
                          className="tr-input tr-mono"
                          value={pair}
                          onChange={(e) => setPair(e.target.value.toUpperCase())}
                          placeholder="XAUUSD"
                        />
                      </div>
                      <div>
                        <label className="tr-label">Type *</label>
                        <select
                          className="tr-select"
                          value={direction}
                          onChange={(e) => setDirection(e.target.value as TradeDirection)}
                        >
                          {DIRECTIONS.map((d) => (
                            <option key={d} value={d} style={{ background: '#111827' }}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      <div>
                        <label className="tr-label">Entry *</label>
                        <input
                          type="number"
                          step="any"
                          className="tr-input tr-mono"
                          value={entryPrice}
                          onChange={(e) => setEntryPrice(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="tr-label">Stop Loss *</label>
                        <input
                          type="number"
                          step="any"
                          className="tr-input tr-mono"
                          value={stopLoss}
                          onChange={(e) => setStopLoss(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="tr-label">TP1 *</label>
                        <input
                          type="number"
                          step="any"
                          className="tr-input tr-mono"
                          value={tp1}
                          onChange={(e) => setTp1(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="tr-label">TP2 (optional)</label>
                        <input
                          type="number"
                          step="any"
                          className="tr-input tr-mono"
                          value={tp2}
                          onChange={(e) => setTp2(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="tr-label">TP3 (optional)</label>
                      <input
                        type="number"
                        step="any"
                        className="tr-input tr-mono"
                        value={tp3}
                        onChange={(e) => setTp3(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Image URL or Upload */}
                <div>
                  <label className="tr-label" htmlFor="tr-post-img">
                    Image URL or Upload Chart
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <ImageIcon
                        size={15}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--tr-muted)',
                        }}
                      />
                      <input
                        id="tr-post-img"
                        type="text"
                        className="tr-input"
                        style={{ paddingLeft: '36px' }}
                        placeholder="https://... or upload image"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                    </div>
                    <label
                      className="tr-btn tr-press"
                      style={{ cursor: 'pointer', flexShrink: 0, padding: '0 14px' }}
                    >
                      <Upload size={15} />
                      <span>{uploadingImg ? '...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileSelect}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  {imageUrl && (
                    <div style={{ marginTop: '8px', position: 'relative' }}>
                      <img
                        src={imageUrl}
                        alt="Upload preview"
                        style={{
                          width: '100%',
                          maxHeight: '160px',
                          objectFit: 'cover',
                          borderRadius: '10px',
                          border: '1px solid var(--tr-border)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        aria-label="Remove image"
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'rgba(11,15,23,0.85)',
                          color: '#F8FAFC',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Video URL */}
                <div>
                  <label className="tr-label" htmlFor="tr-post-video">
                    Video URL (YouTube, Vimeo, or MP4 link)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Video
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--tr-muted)',
                      }}
                    />
                    <input
                      id="tr-post-video"
                      type="url"
                      className="tr-input"
                      style={{ paddingLeft: '36px' }}
                      placeholder="https://youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="tr-sheet-footer">
                <button
                  type="button"
                  className="tr-btn tr-press"
                  style={{ flex: 1 }}
                  onClick={() => setComposerOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImg}
                  className="tr-btn tr-btn-primary tr-press"
                  style={{ flex: 2 }}
                >
                  {submitting ? 'Publishing...' : 'Publish Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
