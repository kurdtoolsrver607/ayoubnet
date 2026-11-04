import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Code, Cpu, MessageSquare, Home, Sparkles, Globe, ChevronDown, ShoppingBag } from 'lucide-react';
import { safeStorage } from '../firebase';
import { translations, type Language } from '../i18n';

export type NavSection = 'home' | 'programming' | 'posts' | 'electronics' | 'store' | 'admin';

interface NavbarProps {
  siteName: string;
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  lang?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  siteName,
  activeSection,
  onNavigate,
  lang = 'ku',
  onLanguageChange,
}) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const t = translations[lang] || translations.ku;

  useEffect(() => {
    try {
      const savedTheme = safeStorage.get('ayoub_theme') as 'dark' | 'light' | null;
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else {
        const prefersLight = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)')?.matches;
        const initial = prefersLight ? 'light' : 'dark';
        setTheme(initial);
        document.documentElement.setAttribute('data-theme', initial);
      }
    } catch {}
  }, []);

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    safeStorage.set('ayoub_theme', nextTheme);
    try {
      document.documentElement.setAttribute('data-theme', nextTheme);
    } catch {}
  };

  // Nav items: NO admin button here - completely hidden from public UI!
  const navItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: t.nav_home, icon: <Home size={15} /> },
    { id: 'store', label: t.nav_store, icon: <ShoppingBag size={15} /> },
    { id: 'programming', label: t.nav_programming, icon: <Code size={15} /> },
    { id: 'posts', label: t.nav_posts, icon: <MessageSquare size={15} /> },
    { id: 'electronics', label: t.nav_electronics, icon: <Cpu size={15} /> },
  ];

  const languagesList: { code: Language; name: string; native: string }[] = [
    { code: 'ku', name: 'Kurdish', native: 'کوردی (سەرەکی)' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'en', name: 'English', native: 'English' },
  ];

  const currentLangLabel = languagesList.find((l) => l.code === lang)?.native.split(' ')[0] || 'کوردی';

  return (
    <nav
      className="glass"
      aria-label="Main Navigation"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        padding: '8px 16px',
        position: 'sticky',
        top: '12px',
        zIndex: 100,
      }}
    >
      {/* Brand Logo */}
      <div
        className="logo"
        onClick={() => onNavigate('home')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
      >
        <span>{siteName}</span><i>.</i><span>site</span>
      </div>

      {/* Horizontally scrollable row with HIDDEN scrollbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          padding: '4px 2px',
          flex: 1,
          justifyContent: 'flex-start',
        }}
        className="no-scrollbar"
      >
        <ul
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            margin: 0,
            padding: 0,
            listStyle: 'none',
            flexWrap: 'nowrap',
          }}
        >
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <li key={item.id} style={{ flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  style={{
                    background: isActive ? 'linear-gradient(135deg, var(--ice), var(--vio))' : 'transparent',
                    color: isActive ? '#05080f' : 'var(--muted)',
                    border: 'none',
                    padding: '7px 13px',
                    borderRadius: '10px',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}

          {activeSection === 'home' && (
            <li style={{ flexShrink: 0 }}>
              <a
                href="#services"
                style={{
                  fontSize: '0.86rem',
                  color: 'var(--muted)',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Sparkles size={14} style={{ color: 'var(--ice)' }} />
                <span>{lang === 'en' ? 'Services' : lang === 'ar' ? 'الخدمات' : 'خزمەتگوزاری'}</span>
              </a>
            </li>
          )}
        </ul>
      </div>

      {/* Right Controls: Language Switcher & Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Language Switcher Dropdown */}
        <div style={{ position: 'relative' }} ref={langMenuRef}>
          <button
            type="button"
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--line)',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
            title="گۆڕینی زمان / Language / تغيير اللغة"
          >
            <Globe size={14} style={{ color: 'var(--ice)' }} />
            <span>{currentLangLabel}</span>
            <ChevronDown size={12} style={{ opacity: 0.7, transform: langMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {/* Language Options Menu */}
          {langMenuOpen && (
            <div
              className="glass"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: lang === 'en' ? 'auto' : 0,
                left: lang === 'en' ? 0 : 'auto',
                minWidth: '150px',
                borderRadius: '12px',
                padding: '6px',
                zIndex: 1000,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
                border: '1px solid var(--line2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
              }}
            >
              {languagesList.map((item) => {
                const isSelected = item.code === lang;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      if (onLanguageChange) onLanguageChange(item.code);
                      setLangMenuOpen(false);
                    }}
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, var(--ice), var(--vio))' : 'transparent',
                      color: isSelected ? '#05080f' : 'var(--text)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      fontSize: '0.82rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: item.code === 'en' ? 'left' : 'right',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span>{item.native}</span>
                    {isSelected && <span style={{ fontSize: '0.7rem' }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--line)',
            color: 'var(--text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '7px 9px',
            borderRadius: '10px',
            transition: 'color 0.2s',
          }}
          title={theme === 'dark' ? 'دۆخی ڕووناک' : 'دۆخی تاریک'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </nav>
  );
};
