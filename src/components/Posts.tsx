import React, { useState } from 'react';
import type { Post } from '../firebase';

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
  if (!posts || posts.length === 0) {
    return null;
  }

  const formatDate = (post: Post) => {
    if (post.t && typeof post.t === 'object' && 'toDate' in post.t && typeof post.t.toDate === 'function') {
      try {
        return post.t.toDate().toLocaleDateString('en-GB');
      } catch {
        return '';
      }
    }
    return '';
  };

  return (
    <section id="posts">
      <div className="head rv in">
        <h2>پۆستەکان</h2>
      </div>
      <div id="plist">
        {posts.map((post) => {
          const dateStr = formatDate(post);
          const isHttps = /^https:/.test(post.url || '');

          return (
            <article key={post.id} className="post glass rv in">
              {dateStr && <time>{dateStr}</time>}

              {post.type === 'code' ? (
                <CodePostCard text={post.text || ''} />
              ) : (
                <>
                  {post.text && <p>{post.text}</p>}
                  {post.type === 'image' && isHttps && post.url && (
                    <img src={post.url} alt="" loading="lazy" />
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
