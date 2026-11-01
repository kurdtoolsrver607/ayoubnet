import React, { useRef } from 'react';
import type { VisitorStats, DayStats } from '../firebase';

interface FooterProps {
  stats: {
    total: VisitorStats;
    today: DayStats;
  };
  siteName: string;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ stats, siteName, onOpenAdmin }) => {
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  const numFormatter = new Intl.NumberFormat('en-US');

  const handleYearClick = () => {
    const now = Date.now();
    if (now - lastClickTimeRef.current > 2000) {
      clickCountRef.current = 0;
    }
    lastClickTimeRef.current = now;
    clickCountRef.current += 1;

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      onOpenAdmin();
    }
  };

  const hasStats = stats.total.opens > 0 || stats.total.unique > 0 || stats.today.unique > 0;

  return (
    <footer>
      {hasStats && (
        <div className="stats">
          <div className="glass">
            <b>{numFormatter.format(stats.total.unique || 0)}</b>
            <small>سەردانیکەری جیاواز</small>
          </div>
          <div className="glass">
            <b>{numFormatter.format(stats.today.unique || 0)}</b>
            <small>سەردانیکەری ئەمڕۆ</small>
          </div>
          <div className="glass">
            <b>{numFormatter.format(stats.total.opens || 0)}</b>
            <small>جار کراوەتەوە</small>
          </div>
        </div>
      )}
      <p
        id="yr"
        onClick={handleYearClick}
        style={{ marginTop: '6px', padding: '28px 10px', cursor: 'pointer' }}
        title={`© 2026 ${siteName}`}
      >
        © 2026 {siteName}
      </p>
    </footer>
  );
};
