import React from 'react';
import type { Language } from '../i18n';

interface ContactProps {
  lang?: Language;
}

export const Contact: React.FC<ContactProps> = ({ lang = 'ku' }) => {
  const content = {
    ku: {
      title: 'پڕۆژەیەکت هەیە؟',
      desc: 'باسی بیرۆکەکەم بۆ بکە، با پێکەوە دروستی بکەین بە بەرزترین کوالێتی.',
      btn: 'پەیوەندی لە تێلێگرام',
    },
    ar: {
      title: 'هل لديك فكرة مشروع؟',
      desc: 'شاركنا فكرتك، ولنبدأ في بنائها معاً بأعلى معايير الإتقان والتطور.',
      btn: 'تواصل عبر تيليجرام',
    },
    en: {
      title: 'Have a Project in Mind?',
      desc: "Tell us about your vision, and let's craft an exceptional digital experience together.",
      btn: 'Chat on Telegram',
    },
  }[lang] || {
    title: 'پڕۆژەیەکت هەیە؟',
    desc: 'باسی بیرۆکەکەم بۆ بکە.',
    btn: 'پەیوەندی لە تێلێگرام',
  };

  return (
    <section id="contact">
      <div className="cta glass rv in">
        <h2>{content.title}</h2>
        <p>{content.desc}</p>
        <a
          className="btn pri"
          href="https://t.me/amin_rst00"
          target="_blank"
          rel="noopener noreferrer"
        >
          {content.btn}
        </a>
      </div>
    </section>
  );
};
