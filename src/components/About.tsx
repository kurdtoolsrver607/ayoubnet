import React from 'react';

export const About: React.FC = () => {
  const chips = [
    'بازرگانی',
    'وێبسایت',
    'ئەپ',
    'دیزاینی وێنە',
    'ڤیدیۆ',
    'زیرەکی دەستکرد',
  ];

  return (
    <section id="about">
      <div className="about glass rv in">
        <div>
          <div className="head" style={{ margin: '0 0 14px' }}>
            <h2>دەربارەی ئەیوب</h2>
          </div>
          <p>
            لە بواری بازرگانی و تەکنەلۆژیا کار دەکەم. بازرگانی و دروستکردنی ئەپ و وێبسایت و دیزاین لە یەک شوێن کۆ دەکەمەوە، تا پڕۆژەکەت لە بیرۆکەوە تا دەرچوون یەک ڕێچکە بگرێت.
          </p>
        </div>
        <div className="chips">
          {chips.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
      </div>
    </section>
  );
};
