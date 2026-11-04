import React from 'react';
import type { VisitorStats, DayStats } from '../firebase';
import { translations, type Language } from '../i18n';

interface FooterProps {
  stats: {
    total: VisitorStats;
    today: DayStats;
  };
  siteName: string;
  onOpenAdmin: () => void;
  lang?: Language;
}

export const Footer: React.FC<FooterProps> = ({
  stats,
  siteName,
  onOpenAdmin,
  lang = 'ku',
}) => {
  const numFormatter = new Intl.NumberFormat('en-US');
  const t = translations[lang] || translations.ku;

  const hasStats = stats.total.opens > 0 || stats.total.unique > 0 || stats.today.unique > 0;

  return (
    <footer>
      {hasStats && (
        <div className="stats">
          <div className="glass">
            <b>{numFormatter.format(stats.total.unique || 0)}</b>
            <small>{t.stats_unique}</small>
          </div>
          <div className="glass">
            <b>{numFormatter.format(stats.today.unique || 0)}</b>
            <small>{t.stats_today}</small>
          </div>
          <div className="glass">
            <b>{numFormatter.format(stats.total.opens || 0)}</b>
            <small>{t.stats_opens}</small>
          </div>
        </div>
      )}

      <p
        id="yr"
        style={{
          marginTop: '6px',
          padding: '24px 10px',
          userSelect: 'none',
          color: 'var(--muted)',
          fontSize: '0.86rem',
        }}
      >
        ©{' '}
        <span
          onClick={(e) => {
            e.stopPropagation();
            onOpenAdmin();
          }}
          style={{
            cursor: 'pointer',
            transition: 'color 0.2s',
            fontWeight: 600,
            display: 'inline-block',
          }}
          className="secret-admin-trigger"
          title="2026"
        >
          2026
        </span>{' '}
        {siteName} - {t.copyright}
      </p>
    </footer>
  );
};
