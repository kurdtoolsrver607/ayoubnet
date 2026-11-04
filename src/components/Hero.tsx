import React from 'react';
import { translations, type Language } from '../i18n';

interface HeroProps {
  siteName: string;
  subtitle?: string;
  lang?: Language;
}

export const Hero: React.FC<HeroProps> = ({ siteName, subtitle, lang = 'ku' }) => {
  const t = translations[lang] || translations.ku;

  return (
    <header className="hero">
      <div>
        <h1>
          {lang === 'en' ? (
            <>Transforming ideas into digital reality with <b>{siteName}</b></>
          ) : lang === 'ar' ? (
            <>نحوّل أفكارك إلى أنظمة ذكية متطورة مع <b>{siteName}</b></>
          ) : (
            <>بیرۆکەکانت دەکەم بە سیستمێکی کارا لەگەڵ <b>{siteName}</b></>
          )}
        </h1>
        <p className="lead">
          {lang === 'ku' && subtitle
            ? subtitle
            : t.hero_desc}
        </p>
        <div className="btns">
          <a className="btn pri" href="#services">
            {t.hero_btn_services}
          </a>
          <a
            className="btn"
            href="https://t.me/amin_rst00"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.hero_btn_contact}
          </a>
        </div>
      </div>
      <div className="code glass" aria-hidden="true">
        <div className="bar">
          <span />
          <span />
          <span />
          <em>ayoubi.js</em>
        </div>
        <pre>
          <span className="l" style={{ animationDelay: '0.2s' }}>
            <span className="kw">const</span> platform = <span className="str">"{siteName}.site"</span>;
          </span>
          <span className="l" style={{ animationDelay: '0.4s' }}>
            <span className="kw">const</span> status = <span className="str">"Online 2026"</span>;
          </span>
          <span className="l" style={{ animationDelay: '0.6s' }}>
            <span className="fn">launch</span>({"{"} services: <span className="kw">true</span> {"}"});
          </span>
          <span className="l" style={{ animationDelay: '0.8s' }}>
            <span className="cm">// Fast, secure and innovative</span>
          </span>
        </pre>
      </div>
    </header>
  );
};
