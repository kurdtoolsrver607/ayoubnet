import React from 'react';
import type { Language } from '../i18n';

interface AboutProps {
  lang?: Language;
}

export const About: React.FC<AboutProps> = ({ lang = 'ku' }) => {
  const content = {
    ku: {
      title: 'دەربارەی ئەیوبی',
      desc: 'لە بواری بازرگانی و تەکنەلۆژیا کار دەکەم. بازرگانی و دروستکردنی ئەپ و وێبسایت و دیزاین لە یەک شوێن کۆ دەکەمەوە، تا پڕۆژەکەت لە بیرۆکەوە تا سەرکەوتن یەک ڕێچکەی سەردەمیانە بگرێت.',
      chips: ['بازرگانی', 'وێبسایت', 'ئەپڵیکەیشن', 'دیزاینی وێنە', 'مۆنتاژی ڤیدیۆ', 'زیرەکی دەستکرد'],
    },
    ar: {
      title: 'حول منصة أيوبي',
      desc: 'نعمل في مجالات التجارة والتكنولوجيا والحلول الرقمية المتكاملة. نجمع بين بناء المواقع والتطبيقات والتصميم العصري، لتحويل فكرتك إلى مشروع ناجح على أرض الواقع.',
      chips: ['التجارة', 'المواقع', 'التطبيقات', 'التصميم', 'الفيديو', 'الذكاء الاصطناعي'],
    },
    en: {
      title: 'About Ayoubi',
      desc: 'Specializing in commerce, technology, and end-to-end digital experiences. We bridge strategy, engineering, and visual design to bring your boldest ideas into production.',
      chips: ['Commerce', 'Websites', 'Mobile Apps', 'Visual Design', 'Video Production', 'AI Systems'],
    },
  }[lang] || {
    title: 'دەربارەی ئەیوبی',
    desc: 'لە بواری بازرگانی و تەکنەلۆژیا کار دەکەم.',
    chips: ['بازرگانی', 'وێبسایت', 'ئەپڵیکەیشن'],
  };

  return (
    <section id="about">
      <div className="about glass rv in">
        <div>
          <div className="head" style={{ margin: '0 0 14px' }}>
            <h2>{content.title}</h2>
          </div>
          <p>{content.desc}</p>
        </div>
        <div className="chips">
          {content.chips.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
      </div>
    </section>
  );
};
