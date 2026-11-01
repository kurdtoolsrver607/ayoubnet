import React from 'react';

export const Hero: React.FC = () => {
  return (
    <header className="hero">
      <div>
        <h1>
          بیرۆکەکانت دەکەم بە سیستمێکی کارا لەگەڵ <b>Ayoub Social</b>
        </h1>
        <p className="lead">
          بازرگانی، دروستکردنی وێبسایت و ئەپ، دیزاینی وێنە و ڤیدیۆ، و سیستمە دەستکردەکان؛ هەموو لە یەک شوێن.
        </p>
        <div className="btns">
          <a className="btn pri" href="#services">
            بینینی خزمەتگوزارییەکان
          </a>
          <a
            className="btn"
            href="https://t.me/amin_rst00"
            target="_blank"
            rel="noopener noreferrer"
          >
            دەستپێکردنی پڕۆژە
          </a>
        </div>
      </div>
      <div className="code glass" aria-hidden="true">
        <div className="bar">
          <span />
          <span />
          <span />
          <em>ayoub.js</em>
        </div>
        <pre>
          <span className="l" style={{ animationDelay: '0.2s' }}>
            <span className="k">const</span> <span className="p">ayoub</span> = {'{'}
          </span>
          <span className="l" style={{ animationDelay: '0.55s' }}>
            {'  '}brand: <span className="s">"Ayoub Social"</span>,
          </span>
          <span className="l" style={{ animationDelay: '0.9s' }}>
            {'  '}business: <span className="n">true</span>,
          </span>
          <span className="l" style={{ animationDelay: '1.25s' }}>
            {'  '}build: [<span className="s">"websites"</span>, <span className="s">"apps"</span>],
          </span>
          <span className="l" style={{ animationDelay: '1.6s' }}>
            {'  '}design: [<span className="s">"image"</span>, <span className="s">"video"</span>],
          </span>
          <span className="l" style={{ animationDelay: '1.95s' }}>
            {'  '}ai: <span className="s">"automation systems"</span>,
          </span>
          <span className="l" style={{ animationDelay: '2.3s' }}>
            {'  '}status: <span className="s">"open for projects"</span>
          </span>
          <span className="l" style={{ animationDelay: '2.65s' }}>
            {'}'};<span className="cur" />
          </span>
        </pre>
      </div>
    </header>
  );
};
