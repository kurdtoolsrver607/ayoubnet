import React, { useState } from 'react';
import type { Post } from '../firebase';
import { extractDriveFileId, formatPostDate } from '../firebase';
import { DriveImage } from './DriveImage';
import { translations, type Language } from '../i18n';

interface PostsProps {
  posts: Post[];
  lang?: Language;
}

const CodePostCard: React.FC<{ text: string; lang?: Language }> = ({ text, lang = 'ku' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const lineCount = (text || '').split('\n').length;
  const isLong = lineCount > 8;
  const t = translations[lang] || translations.ku;

  return (
    <div className={`cb ${isOpen ? 'open' : ''}`}>
      <pre>
        <code>{text}</code>
      </pre>
      {isLong && (
        <button
          type="button"
          className="more"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? t.read_less : t.read_more}
        </button>
      )}
    </div>
  );
};

export const Posts: React.FC<PostsProps> = ({ posts, lang = 'ku' }) => {
  const t = translations[lang] || translations.ku;

  // Only show general / عام home feed posts (strictly separated from other sections)
  const homePosts = posts.filter(
    (p) => !p.category || p.category === 'general'
  );

  if (!homePosts || homePosts.length === 0) {
    return null;
  }

  return (
    <section id="posts">
      <div className="head rv in">
        <h2>{t.posts_feed_title}</h2>
        <p>{t.posts_feed_desc}</p>
      </div>
      <div id="plist">
        {homePosts.map((post) => {
          const dateStr = formatPostDate(post.t);
          const isHttps = /^(https:|data:image\/)/.test(post.url || '');

          return (
            <article key={post.id} className="post glass rv in" style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                {post.title ? (
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                    {post.title}
                  </h3>
                ) : <span />}

                {dateStr && <time style={{ margin: 0 }}>{dateStr}</time>}
              </div>

              {post.type === 'code' ? (
                <CodePostCard text={post.text || ''} lang={lang} />
              ) : (
                <>
                  {post.text && <p style={{ fontSize: '0.92rem', lineHeight: 1.8 }}>{post.text}</p>}
                  {post.type === 'image' && isHttps && post.url && (
                    <DriveImage url={post.url} backupUrl={post.backupUrl} alt={post.title || ''} />
                  )}
                  {post.type === 'video' && isHttps && post.url && (
                    (() => {
                      const driveId = extractDriveFileId(post.url);
                      if (driveId) {
                        return (
                          <div style={{ marginTop: '12px', width: '100%', position: 'relative', overflow: 'hidden', borderRadius: '12px', aspectRatio: '16/9', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--line)' }}>
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
                        <video
                          src={post.url}
                          controls
                          preload="metadata"
                          playsInline
                        />
                      );
                    })()
                  )}
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
