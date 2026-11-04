import React, { useState, useEffect } from 'react';
import {
  auth,
  trackVisitor,
  subscribeStats,
  subscribePosts,
  subscribeSiteSettings,
  updateSiteSettings,
  onAuthStateChanged,
  type VisitorStats,
  type DayStats,
  type Post,
  type SiteSettings,
  DEFAULT_SITE_SETTINGS,
  type User,
  safeStorage,
} from './firebase';
import { Navbar, type NavSection } from './components/Navbar';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { About } from './components/About';
import { Posts } from './components/Posts';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { SectionPage } from './components/SectionPage';
import { AdminPage } from './components/AdminPage';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AmbientEffects } from './components/AmbientEffects';
import { type Language } from './i18n';

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => {
    return (safeStorage.get('ayoub_lang') as Language) || 'ku';
  });
  const [stats, setStats] = useState<{ total: VisitorStats; today: DayStats }>({
    total: { unique: 0, opens: 0 },
    today: { unique: 0, opens: 0 },
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [activeSection, setActiveSection] = useState<NavSection>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  // Sync document language and direction
  useEffect(() => {
    try {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
    } catch {}
  }, [lang]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    safeStorage.set('ayoub_lang', newLang);
  };

  useEffect(() => {
    // Record visitor count
    trackVisitor().catch((err) => console.debug('Track error:', err));

    // Listen to live stats
    const unsubStats = subscribeStats((newStats) => {
      setStats(newStats);
    });

    // Listen to live posts
    const unsubPosts = subscribePosts((newPosts) => {
      setPosts(newPosts);
    });

    // Listen to live site settings
    const unsubSettings = subscribeSiteSettings((newSettings) => {
      setSiteSettings(newSettings);
      if (newSettings.name) {
        document.title = `${newSettings.name} - ${newSettings.subtitle || 'پلاتفۆرمی فەرمی'}`;
      }
    });

    // Listen to auth changes
    let unsubAuth = () => {};
    if (auth) {
      unsubAuth = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
      });
    }

    return () => {
      unsubStats();
      unsubPosts();
      unsubSettings();
      unsubAuth();
    };
  }, []);

  // Deep link handler for direct shared post links (?post=ID)
  useEffect(() => {
    if (typeof window === 'undefined' || posts.length === 0) return;

    try {
      const params = new URLSearchParams(window.location.search);
      const targetPostId = params.get('post') || window.location.hash.replace(/^#post-/, '');
      if (!targetPostId) return;

      const targetPost = posts.find((p) => p.id === targetPostId);
      if (targetPost) {
        if (targetPost.category === 'programming') {
          setActiveSection('programming');
        } else if (targetPost.category === 'posts') {
          setActiveSection('posts');
        } else if (targetPost.category === 'electronics') {
          setActiveSection('electronics');
        } else {
          setActiveSection('home');
        }

        const timer = setTimeout(() => {
          const el = document.getElementById(`post-${targetPostId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('post-highlight');
            setTimeout(() => {
              el.classList.remove('post-highlight');
            }, 3500);
          }
        }, 400);

        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.debug('Deep link handling note:', err);
    }
  }, [posts]);

  // Secret trigger when user clicks on year 2026 in the footer
  const handleOpenAdmin = () => {
    const isAuthed =
      safeStorage.get('ayoub_admin_auth') === '1' ||
      (auth?.currentUser && !auth.currentUser.isAnonymous);

    if (isAuthed) {
      setActiveSection('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowAdminLoginModal(true);
    }
  };

  const handleSaveSettings = async (newSettings: SiteSettings) => {
    await updateSiteSettings(newSettings);
    setSiteSettings(newSettings);
  };

  return (
    <>
      <AmbientEffects />

      <Navbar
        siteName={siteSettings.name}
        activeSection={activeSection}
        onNavigate={(sec) => {
          setActiveSection(sec);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        lang={lang}
        onLanguageChange={handleLanguageChange}
      />

      {activeSection === 'home' ? (
        <main className="wrap">
          <Hero siteName={siteSettings.name} subtitle={siteSettings.subtitle} lang={lang} />
          <Services lang={lang} />
          <About lang={lang} />
          <Posts posts={posts} lang={lang} />
          <Contact lang={lang} />
        </main>
      ) : activeSection === 'admin' ? (
        <AdminPage
          stats={stats}
          posts={posts}
          siteSettings={siteSettings}
          onSaveSettings={handleSaveSettings}
          onBackToHome={() => {
            setActiveSection('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      ) : (
        <SectionPage
          section={activeSection}
          posts={posts}
          onBackToHome={() => {
            setActiveSection('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          lang={lang}
        />
      )}

      {activeSection !== 'admin' && (
        <Footer
          stats={stats}
          siteName={siteSettings.name}
          onOpenAdmin={handleOpenAdmin}
          lang={lang}
        />
      )}

      {/* Secret Admin Login Modal (Triggered ONLY by clicking year "2026") */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={() => {
          setShowAdminLoginModal(false);
          setActiveSection('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        siteName={siteSettings.name}
        lang={lang}
      />
    </>
  );
};

export default App;
