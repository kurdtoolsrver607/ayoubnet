import React, { useState, useMemo } from 'react';
import type { Post } from '../firebase';
import type { NavSection } from './Navbar';
import {
  Search,
  Code,
  Cpu,
  MessageSquare,
  ArrowRight,
  Calendar,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SectionPageProps {
  section: NavSection;
  posts: Post[];
  onBackToHome: () => void;
}

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lineCount = (code || '').split('\n').length;
  const isLong = lineCount > 10;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`cb ${expanded ? 'open' : ''}`} style={{ position: 'relative' }}>
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
        <span>کۆدی پرۆگرامینگە</span>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: 'none',
            color: copied ? 'var(--s)' : 'var(--ice)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'کۆپیکرا' : 'کۆپیکردن'}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
      {isLong && (
        <button
          type="button"
          className="more"
          onClick={() => setExpanded(!expanded)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {expanded ? 'کەمتر پیشان بدە' : 'تەواوی کۆدەکە پیشان بدە'}
        </button>
      )}
    </div>
  );
};

export const SectionPage: React.FC<SectionPageProps> = ({
  section,
  posts,
  onBackToHome,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const meta = {
    programming: {
      title: 'بەشی بەرنامەسازی',
      desc: 'فێرکاری، نموونە کۆدەکان، پڕۆژەی وێب و ئەپ، و چارەسەری کێشە نەرمەکاڵاییەکان.',
      icon: <Code size={26} style={{ color: 'var(--ice)' }} />,
    },
    posts: {
      title: 'بەشی پۆستەکان',
      desc: 'هەواڵ، بابەت و ڕاگەیەندراوە گشتی و تەکنەلۆژییەکان لە یەک شوێندا.',
      icon: <MessageSquare size={26} style={{ color: 'var(--vio)' }} />,
    },
    electronics: {
      title: 'بەشی ئەلیکترۆن',
      desc: 'سیستەمە ئەلیکترۆنییەکان، تاقیکردنەوەی هاردوێر، وردەپارچەکان و ئۆتۆمەیشن.',
      icon: <Cpu size={26} style={{ color: 'var(--s)' }} />,
    },
    home: {
      title: 'سەرەکی',
      desc: '',
      icon: null,
    },
  }[section];

  // Filter posts by category
  const sectionPosts = useMemo(() => {
    return posts.filter((p) => {
      if (section === 'programming') {
        return p.category === 'programming' || p.type === 'code';
      }
      if (section === 'electronics') {
        return p.category === 'electronics';
      }
      if (section === 'posts') {
        return p.category === 'posts' || p.category === 'general' || !p.category;
      }
      return true;
    });
  }, [posts, section]);

  // Apply search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return sectionPosts;
    const q = searchQuery.toLowerCase().trim();
    return sectionPosts.filter((p) => {
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchText = (p.text || '').toLowerCase().includes(q);
      return matchTitle || matchText;
    });
  }, [sectionPosts, searchQuery]);

  const formatDate = (post: Post) => {
    if (post.t && typeof post.t === 'object' && 'toDate' in post.t && typeof post.t.toDate === 'function') {
      try {
        const d = post.t.toDate();
        return d.toLocaleDateString('ckb-IQ', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return '';
      }
    }
    return '';
  };

  return (
    <div className="wrap" style={{ paddingTop: '30px', paddingBottom: '60px' }}>
      {/* Back button and Section Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          type="button"
          className="btn"
          onClick={onBackToHome}
          style={{
            fontSize: '0.82rem',
            padding: '6px 14px',
            gap: '6px',
            marginBottom: '18px',
          }}
        >
          <ArrowRight size={14} />
          گەڕانەوە بۆ سەرەکی
        </button>

        <div className="glass" style={{ padding: '26px 30px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            {meta.icon}
            <h1 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', margin: 0, fontWeight: 800 }}>
              {meta.title}
            </h1>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.94rem', margin: 0 }}>
            {meta.desc}
          </p>

          {/* Search Bar */}
          <div style={{ marginTop: '20px', position: 'relative' }}>
            <input
              type="text"
              placeholder={`گەڕان لەناو ${meta.title} بەپێی ناونیشان یان ناوەڕۆک...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 44px 12px 18px',
                borderRadius: '12px',
                border: '1px solid var(--line2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text)',
                fontSize: '0.92rem',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <Search
              size={18}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--ice)',
                pointerEvents: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                }}
              >
                پاککردنەوە
              </button>
            )}
          </div>

          <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--muted)' }}>
            نیشاندانی {filteredPosts.length} لە کۆی {sectionPosts.length} بابەت
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {filteredPosts.map((post) => {
          const dateStr = formatDate(post);
          const isHttps = /^https:/.test(post.url || '');

          return (
            <article
              key={post.id}
              className="glass rv in"
              style={{
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Post Header: Title & Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                  {post.title || (post.type === 'code' ? 'نموونە کۆد' : 'بابەت')}
                </h3>

                {dateStr && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--muted)' }}>
                    <Calendar size={13} />
                    <span>{dateStr}</span>
                  </div>
                )}
              </div>

              {/* Post Content */}
              {post.type === 'code' ? (
                <CodeBlock code={post.text || ''} />
              ) : (
                <>
                  {post.text && (
                    <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text)', fontSize: '0.94rem', lineHeight: 1.8 }}>
                      {post.text}
                    </p>
                  )}

                  {post.type === 'image' && isHttps && post.url && (
                    <div style={{ marginTop: '8px' }}>
                      <img
                        src={post.url}
                        alt={post.title || ''}
                        loading="lazy"
                        style={{
                          maxWidth: '100%',
                          borderRadius: '12px',
                          display: 'block',
                          border: '1px solid var(--line)',
                        }}
                      />
                    </div>
                  )}

                  {post.type === 'video' && isHttps && post.url && (
                    <div style={{ marginTop: '8px' }}>
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
                  )}
                </>
              )}
            </article>
          );
        })}

        {filteredPosts.length === 0 && (
          <div
            className="glass"
            style={{
              textAlign: 'center',
              padding: '50px 20px',
              borderRadius: '16px',
              color: 'var(--muted)',
            }}
          >
            <p style={{ fontSize: '1rem', marginBottom: '8px' }}>
              {searchQuery ? `هیچ ئەنجامێک بۆ "${searchQuery}" نەدۆزرایەوە` : 'هێشتا هیچ پۆستێک لەم بەشەدا بڵاونەکراوەتەوە.'}
            </p>
            <small style={{ fontSize: '0.8rem' }}>
              دەتوانیت لە ڕێگەی پەڕەی ئەدمینەوە لەم بەشەدا پۆست دابنێیت.
            </small>
          </div>
        )}
      </div>
    </div>
  );
};
