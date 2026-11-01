import React, { useState, useEffect } from 'react';
import { Sun, Moon, Code, Cpu, MessageSquare, Home, Sparkles } from 'lucide-react';

export type NavSection = 'home' | 'programming' | 'posts' | 'electronics';

interface NavbarProps {
  siteName: string;
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  siteName,
  activeSection,
  onNavigate,
}) => {
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

  const navItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'سەرەکی', icon: <Home size={15} /> },
    { id: 'programming', label: 'بەرنامەسازی', icon: <Code size={15} /> },
    { id: 'posts', label: 'پۆستەکان', icon: <MessageSquare size={15} /> },
    { id: 'electronics', label: 'ئەلیکترۆن', icon: <Cpu size={15} /> },
  ];

  return (
    <nav className="glass" aria-label="Main Navigation" style={{ flexWrap: 'wrap', gap: '12px' }}>
      <div
        className="logo"
        onClick={() => onNavigate('home')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <span>{siteName}</span><i>.</i><span>site</span>
      </div>

      <ul style={{ alignItems: 'center', flexWrap: 'wrap', gap: '8px', margin: 0, padding: 0 }}>
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                style={{
                  background: isActive ? 'linear-gradient(135deg, var(--ice), var(--vio))' : 'transparent',
                  color: isActive ? '#05080f' : 'var(--muted)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}

        {activeSection === 'home' && (
          <li>
            <a
              href="#services"
              style={{
                fontSize: '0.86rem',
                color: 'var(--muted)',
                padding: '6px 10px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={14} style={{ color: 'var(--ice)' }} />
              خزمەتگوزاری
            </a>
          </li>
        )}

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
              padding: '6px',
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
