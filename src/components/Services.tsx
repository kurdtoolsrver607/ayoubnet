import React from 'react';

interface ServiceItem {
  id: string;
  span: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

export const Services: React.FC = () => {
  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const services: ServiceItem[] = [
    {
      id: 'biz',
      span: 's4',
      title: 'بازرگانی',
      desc: 'پلانی بازرگانی، گەشەپێدانی بیزنس و ستراتیژی فرۆشتن، بۆ ئەوەی براندەکەت بە دروستی گەشە بکات.',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 20h18M6 16V9m6 7V5m6 11v-5" />
        </svg>
      ),
    },
    {
      id: 'web',
      span: 's2',
      title: 'وێبسایت',
      desc: 'خێرا، ڕێکخراو و گونجاو لەگەڵ هەموو شاشەکان.',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
        </svg>
      ),
    },
    {
      id: 'app',
      span: 's2',
      title: 'ئەپ',
      desc: 'ئەپی مۆبایل و ویب بە ئەزموونێکی ساکار.',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
          <path d="M11 18.5h2" />
        </svg>
      ),
    },
    {
      id: 'design',
      span: 's2',
      title: 'دیزاینی وێنە',
      desc: 'لۆگۆ، پۆستەر و ناسنامەی بینراوی براند.',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2s0-2.5 1.5-2.5H17a4 4 0 0 0 4-4A9 9 0 0 0 12 3z" />
          <circle cx="8" cy="11" r="1" />
          <circle cx="12" cy="7.5" r="1" />
          <circle cx="16" cy="11" r="1" />
        </svg>
      ),
    },
    {
      id: 'video',
      span: 's2',
      title: 'دیزاینی ڤیدیۆ',
      desc: 'مۆنتاژی پیشەگەر بۆ ڕیکلام و سۆشیاڵ میدیا.',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M10 9.5v5l4.5-2.5z" />
        </svg>
      ),
    },
    {
      id: 'ai',
      span: 's2',
      title: 'سیستمە دەستکردەکان',
      desc: 'زیرەکی دەستکرد بۆ ئۆتۆماتیککردنی کار.',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="2" />
          <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
        </svg>
      ),
    },
  ];

  return (
    <section id="services">
      <div className="head rv in">
        <h2>خزمەتگوزارییەکان</h2>
        <p>شەش بواری سەرەکی کە تێیاندا کار دەکەم.</p>
      </div>
      <div className="bento">
        {services.map((item, idx) => (
          <article
            key={item.id}
            className={`t glass ${item.span} rv in`}
            style={{ '--d': `${(idx % 3) * 0.1}s` } as React.CSSProperties}
            onPointerMove={handlePointerMove}
          >
            {item.icon}
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
