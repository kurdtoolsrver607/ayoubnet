import React, { useState, useMemo } from 'react';
import type { Post } from '../firebase';
import { extractDriveFileId, formatPostDate } from '../firebase';
import { DriveImage } from './DriveImage';
import { ProgrammingTools } from './ProgrammingTools';
import { PostCard } from './PostCard';
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
  FileCode,
  Play,
  Terminal,
  Shield,
  Sparkles,
} from 'lucide-react';
import type { Language } from '../i18n';

interface SectionPageProps {
  section: NavSection;
  posts: Post[];
  onBackToHome: () => void;
  lang?: Language;
}

type ProgSubTab = 'posts' | 'html' | 'python' | 'encrypt';

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
  lang = 'ku',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [progSubTab, setProgSubTab] = useState<ProgSubTab>('posts');

  const metaTranslations = {
    ku: {
      programming: {
        title: 'بەشی بەرنامەسازی',
        desc: 'فێرکاری، نموونە کۆدەکان، پڕۆژەی وێب و ئەپ، ڕەنکردنی کۆد و ستۆدیۆی ئینکریپت.',
      },
      posts: {
        title: 'بەشی پۆستەکان',
        desc: 'بابەت و ڕاگەیەندراوە تایبەتەکانی ئەم بەشە لە یەک شوێندا.',
      },
      electronics: {
        title: 'بەشی ئەلیکترۆن',
        desc: 'سیستەمە ئەلیکترۆنییەکان، تاقیکردنەوەی هاردوێر، وردەپارچەکان و ئۆتۆمەیشن.',
      },
      home: { title: 'سەرەکی', desc: '' },
    },
    ar: {
      programming: {
        title: 'قسم البرمجة والتطوير',
        desc: 'دروس برمجية، مشغلات الأكواد، واستوديو التشفير والحماية المتقدم.',
      },
      posts: {
        title: 'قسم المنشورات',
        desc: 'أحدث المقالات والإعلانات التقنية في مكان واحد.',
      },
      electronics: {
        title: 'قسم الإلكترونيات',
        desc: 'الأنظمة الإلكترونية، اختبار العتاد، القطع والأتمتة.',
      },
      home: { title: 'الرئيسية', desc: '' },
    },
    en: {
      programming: {
        title: 'Programming Lab',
        desc: 'Tutorials, code examples, interactive compilers, and code encryption studio.',
      },
      posts: {
        title: 'Articles & Posts',
        desc: 'All specialized articles, news, and technical publications.',
      },
      electronics: {
        title: 'Electronics Lab',
        desc: 'Electronic circuits, hardware prototyping, components, and embedded automation.',
      },
      home: { title: 'Home', desc: '' },
    },
  };

  const currentMeta = (metaTranslations[lang] || metaTranslations.ku)[section];

  const meta = {
    title: currentMeta.title,
    desc: currentMeta.desc,
    icon:
      section === 'programming' ? (
        <Code size={26} style={{ color: 'var(--ice)' }} />
      ) : section === 'posts' ? (
        <MessageSquare size={26} style={{ color: 'var(--vio)' }} />
      ) : section === 'electronics' ? (
        <Cpu size={26} style={{ color: 'var(--s)' }} />
      ) : null,
  };

  // Strictly filter posts by category - exactly as requested:
  // - programming shows ONLY programming posts
  // - electronics shows ONLY electronics posts
  // - posts shows ONLY posts category
  const sectionPosts = useMemo(() => {
    return posts.filter((p) => {
      if (section === 'programming') {
        return p.category === 'programming';
      }
      if (section === 'electronics') {
        return p.category === 'electronics';
      }
      if (section === 'posts') {
        return p.category === 'posts';
      }
      return false;
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

        <div className="glass" style={{ padding: '26px 30px', borderRadius: '18px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            {meta.icon}
            <h1 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', margin: 0, fontWeight: 800 }}>
              {meta.title}
            </h1>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.94rem', margin: 0 }}>
            {meta.desc}
          </p>

          {/* Programming Subsection Horizontal Tabs (lined up at top with hidden scrollbar) */}
          {section === 'programming' && (
            <div style={{ marginTop: '22px', borderTop: '1px solid var(--line2)', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '10px' }}>
                بەشەکانی بەرنامەسازی هەڵبژێرە:
              </span>
              <div
                className="no-scrollbar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                  padding: '4px 2px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {[
                  { id: 'posts', label: `پۆستەکان (${sectionPosts.length})`, icon: <FileCode size={15} /> },
                  { id: 'html', label: 'ڕەنکردنی HTML / JS', icon: <Play size={15} /> },
                  { id: 'python', label: 'ڕەنکردنی پایتۆن', icon: <Terminal size={15} /> },
                  { id: 'encrypt', label: 'ئینکریپت و پاراستنی کۆد', icon: <Shield size={15} /> },
                ].map((tab) => {
                  const isActive = progSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setProgSubTab(tab.id as ProgSubTab)}
                      style={{
                        background: isActive ? 'linear-gradient(135deg, var(--ice), var(--vio))' : 'rgba(255, 255, 255, 0.05)',
                        color: isActive ? '#05080f' : 'var(--text)',
                        border: '1px solid var(--line2)',
                        padding: '9px 18px',
                        borderRadius: '12px',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                      }}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Bar - only show when viewing posts */}
          {(section !== 'programming' || progSubTab === 'posts') && (
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
          )}

          {(section !== 'programming' || progSubTab === 'posts') && (
            <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--muted)' }}>
              نیشاندانی {filteredPosts.length} لە کۆی {sectionPosts.length} پۆست
            </div>
          )}
        </div>
      </div>

      {/* Programming Section View Switcher */}
      {section === 'programming' && progSubTab === 'html' && (
        <ProgrammingTools initialTab="html" />
      )}

      {section === 'programming' && progSubTab === 'python' && (
        <ProgrammingTools initialTab="python" />
      )}

      {section === 'programming' && progSubTab === 'encrypt' && (
        <ProgrammingTools initialTab="encrypt" />
      )}

      {/* Posts List (Shown when not in runner/encrypt subtabs, or in non-programming sections) */}
      {(section !== 'programming' || progSubTab === 'posts') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} lang={lang} />
          ))}

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
                دەتوانیت لە ڕێگەی پەڕەی ئەدمینەوە پۆست لەم بەشەدا زیاد بکەیت.
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
