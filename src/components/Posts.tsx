import React, { useState } from 'react';
import type { Post } from '../firebase';
import { Tag } from 'lucide-react';

interface PostsProps {
  posts: Post[];
}

const CodePostCard: React.FC<{ text: string }> = ({ text }) => {
  const [isOpen, setIsOpen] = useState(false);
  const lineCount = (text || '').split('\n').length;
  const isLong = lineCount > 8;

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
          {isOpen ? 'کەمتر' : 'زیاتر ببینە'}
        </button>
      )}
    </div>
  );
};

export const Posts: React.FC<PostsProps> = ({ posts }) => {
  // Only show general / home feed posts
  const homePosts = posts.filter(
    (p) => !p.category || p.category === 'general' || p.category === 'posts'
  );

  if (!homePosts || homePosts.length === 0) {
    return null;
  }

  const formatDate = (post: Post) => {
    if (post.t && typeof post.t === 'object' && 'toDate' in post.t && typeof post.t.toDate === 'function') {
      try {
        return post.t.toDate().toLocaleDateString('ckb-IQ', {
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
    <section id="posts">
      <div className="head rv in">
        <h2>پۆستە گشتییەکان</h2>
        <p>دوایین ڕاگەیاندن و پۆستە بڵاوکراوەکان.</p>
      </div>
      <div id="plist">
        {homePosts.map((post) => {
          const dateStr = formatDate(post);
          const isHttps = /^https:/.test(post.url || '');

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
                <CodePostCard text={post.text || ''} />
              ) : (
                <>
                  {post.text && <p style={{ fontSize: '0.92rem', lineHeight: 1.8 }}>{post.text}</p>}
                  {post.type === 'image' && isHttps && post.url && (
                    <img src={post.url} alt={post.title || ''} loading="lazy" />
                  )}
                  {post.type === 'video' && isHttps && post.url && (
                    <video
                      src={post.url}
                      controls
                      preload="metadata"
                      playsInline
                    />
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
