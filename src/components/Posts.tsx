import React from 'react';
import type { Post } from '../firebase';
import { PostCard } from './PostCard';
import { translations, type Language } from '../i18n';

interface PostsProps {
  posts: Post[];
  lang?: Language;
  onOpenModal?: (post: Post) => void;
}

export const Posts: React.FC<PostsProps> = ({ posts, lang = 'ku', onOpenModal }) => {
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
        {homePosts.map((post) => (
          <PostCard key={post.id} post={post} lang={lang} onOpenModal={onOpenModal} />
        ))}
      </div>
    </section>
  );
};
