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
} from './firebase';
import { Navbar, type NavSection } from './components/Navbar';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { About } from './components/About';
import { Posts } from './components/Posts';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { SectionPage } from './components/SectionPage';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AmbientEffects } from './components/AmbientEffects';

export const App: React.FC = () => {
  const [stats, setStats] = useState<{ total: VisitorStats; today: DayStats }>({
    total: { unique: 0, opens: 0 },
    today: { unique: 0, opens: 0 },
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [activeSection, setActiveSection] = useState<NavSection>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

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

    // Escape key listener for modals
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLoginModalOpen(false);
        setIsAdminPanelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubStats();
      unsubPosts();
      unsubSettings();
      unsubAuth();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOpenAdmin = () => {
    const isAdmin = (currentUser && !currentUser.isAnonymous) || localStorage.getItem('ayoub_admin_auth') === '1';
    if (isAdmin) {
      setIsAdminPanelOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    setIsAdminPanelOpen(true);
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
      />

      {activeSection === 'home' ? (
        <main className="wrap">
          <Hero siteName={siteSettings.name} subtitle={siteSettings.subtitle} />
          <Services />
          <About />
          <Posts posts={posts} />
          <Contact />
        </main>
      ) : (
        <SectionPage
          section={activeSection}
          posts={posts}
          onBackToHome={() => {
            setActiveSection('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      <Footer
        stats={stats}
        siteName={siteSettings.name}
        onOpenAdmin={handleOpenAdmin}
      />

      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        stats={stats}
        posts={posts}
        siteSettings={siteSettings}
        onSaveSettings={handleSaveSettings}
      />
    </>
  );
};

export default App;
