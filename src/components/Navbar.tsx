import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('ayoub_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      const initial = prefersLight ? 'light' : 'dark';
      setTheme(initial);
      document.documentElement.setAttribute('data-theme', initial);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('ayoub_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <nav className="glass" aria-label="Main Navigation">
      <div className="logo">
        Ayoub<i>.</i>Social
      </div>
      <ul style={{ alignItems: 'center' }}>
        <li>
          <a href="#services">خزمەتگوزاری</a>
        </li>
        <li>
          <a href="#about">دەربارە</a>
        </li>
        <li>
          <a href="#contact">پەیوەندی</a>
        </li>
        <li>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: '8px',
              transition: 'color 0.2s',
            }}
            title={theme === 'dark' ? 'دۆخی ڕووناک' : 'دۆخی تاریک'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </li>
      </ul>
    </nav>
  );
};
