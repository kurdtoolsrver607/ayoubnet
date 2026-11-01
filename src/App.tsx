import React, { useState, useEffect } from 'react';
import {
  auth,
  trackVisitor,
  subscribeStats,
  subscribePosts,
  onAuthStateChanged,
  type VisitorStats,
  type DayStats,
  type Post,
  type User,
} from './firebase';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { About } from './components/About';
import { Posts } from './components/Posts';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AmbientEffects } from './components/AmbientEffects';

export const App: React.FC = () => {
  const [stats, setStats] = useState<{ total: VisitorStats; today: DayStats }>({
    total: { unique: 0, opens: 0 },
    today: { unique: 0, opens: 0 },
  });
  const [posts, setPosts] = useState<Post[]>([]);
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
      unsubAuth();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOpenAdmin = () => {
    const isAdmin = currentUser && !currentUser.isAnonymous;
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

  return (
    <>
      <AmbientEffects />

      <Navbar />

      <main className="wrap">
        <Hero />
        <Services />
        <About />
        <Posts posts={posts} />
        <Contact />
      </main>

      <Footer stats={stats} onOpenAdmin={handleOpenAdmin} />

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
      />
    </>
  );
};

export default App;
