import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CandlestickChart,
  Radio,
  UserCircle2,
  Shield,
  TrendingUp,
} from 'lucide-react';
import {
  tradingAuth,
  onAuthStateChanged,
  ensureUserProfile,
  subscribeUserProfile,
  subscribeUserTrades,
  subscribePublicPosts,
  subscribeAllUsers,
  isTradingAdminEmail,
  getTimestampMs,
  type User,
  type TradingUserProfile,
  type TradeSignal,
  type PublicFeedPost,
} from './tradingFirebase';
import { computeTradingAnalytics } from './analytics';
import { AuthScreen, BlockedScreen } from './components/AuthScreen';
import { AnalysisTab } from './components/AnalysisTab';
import { JournalTab } from './components/JournalTab';
import { MarketTab } from './components/MarketTab';
import { FeedTab } from './components/FeedTab';
import { ProfileAdminTab } from './components/ProfileAdminTab';
import './trading.css';

type TradingTabId = 'analysis' | 'journal' | 'market' | 'feed' | 'profile';

const BASE_EQUITY_KEY = 'tr_isolated_base_equity_v1';

export const TradingApp: React.FC = () => {
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<TradingUserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [trades, setTrades] = useState<TradeSignal[]>([]);
  const [publicPosts, setPublicPosts] = useState<PublicFeedPost[]>([]);
  const [allUsers, setAllUsers] = useState<TradingUserProfile[]>([]);

  const [activeTab, setActiveTab] = useState<TradingTabId>('analysis');
  const [openJournalModalCounter, setOpenJournalModalCounter] = useState(0);

  const [baseEquity, setBaseEquity] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(BASE_EQUITY_KEY);
      const parsed = saved ? parseFloat(saved) : 10000;
      return !Number.isNaN(parsed) && parsed >= 100 ? parsed : 10000;
    } catch {
      return 10000;
    }
  });

  const handleBaseEquityChange = (nextVal: number) => {
    setBaseEquity(nextVal);
    try {
      localStorage.setItem(BASE_EQUITY_KEY, String(nextVal));
    } catch {
      // Ignore storage quota errors inside WebViews
    }
  };

  // Enforce noindex meta tag even if mounted via SPA fallback
  useEffect(() => {
    document.title = 'Trading Desk';
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = 'noindex, nofollow';
  }, []);

  // 1. Observe isolated Firebase Auth state (with safety timeout so UI never hangs)
  useEffect(() => {
    const safetyTimer = window.setTimeout(() => {
      setAuthReady(true);
    }, 5000);

    const unsub = onAuthStateChanged(tradingAuth, (user) => {
      window.clearTimeout(safetyTimer);
      setAuthUser(user);
      setAuthReady(true);
      if (!user) {
        setProfile(null);
        setTrades([]);
        setPublicPosts([]);
        setAllUsers([]);
      }
    });
    return () => {
      window.clearTimeout(safetyTimer);
      unsub();
    };
  }, []);

  // 2. Ensure & subscribe to current user's profile (enforces real-time isBlocked lockout)
  useEffect(() => {
    if (!authUser) return;
    let active = true;
    let unsubProfile: (() => void) | null = null;
    setProfileLoading(true);

    ensureUserProfile(authUser)
      .then((initialProfile) => {
        if (!active) return;
        setProfile(initialProfile);
        setProfileLoading(false);
        unsubProfile = subscribeUserProfile(authUser.uid, (liveProfile) => {
          if (liveProfile) {
            setProfile(liveProfile);
          }
        });
      })
      .catch((err) => {
        console.error('Failed to load user profile:', err);
        if (!active) return;
        const email = (authUser.email || '').trim().toLowerCase();
        setProfile({
          uid: authUser.uid,
          email,
          displayName: authUser.displayName || email.split('@')[0] || 'Trader',
          role: isTradingAdminEmail(email) ? 'admin' : 'user',
          isBlocked: false,
          createdAt: null,
          updatedAt: null,
        });
        setProfileLoading(false);
      });

    return () => {
      active = false;
      if (unsubProfile) unsubProfile();
    };
  }, [authUser]);

  const isAdmin = Boolean(profile && isTradingAdminEmail(profile.email));
  const isBlocked = Boolean(profile && profile.isBlocked && !isAdmin);

  // 3. Subscribe to private trades & public posts when active (non-blocked)
  useEffect(() => {
    if (!authUser || !profile || isBlocked) return;

    const unsubTrades = subscribeUserTrades(authUser.uid, setTrades);
    const unsubPosts = subscribePublicPosts(setPublicPosts);
    let unsubUsers: (() => void) | null = null;

    if (isAdmin) {
      unsubUsers = subscribeAllUsers(setAllUsers);
    } else {
      setAllUsers([]);
    }

    return () => {
      unsubTrades();
      unsubPosts();
      if (unsubUsers) unsubUsers();
    };
  }, [authUser, profile?.uid, isBlocked, isAdmin]);

  const analytics = useMemo(() => {
    return computeTradingAnalytics(trades, baseEquity, getTimestampMs(profile?.createdAt));
  }, [trades, baseEquity, profile?.createdAt]);

  const navItems: Array<{
    id: TradingTabId;
    label: string;
    shortLabel: string;
    Icon: React.ComponentType<{ size?: number | string }>;
  }> = [
    { id: 'analysis', label: 'Analysis', shortLabel: 'Analysis', Icon: BarChart3 },
    { id: 'journal', label: 'My Journal', shortLabel: 'Journal', Icon: BookOpen },
    { id: 'market', label: 'Live Market', shortLabel: 'Market', Icon: CandlestickChart },
    { id: 'feed', label: 'Admin Feed', shortLabel: 'Feed', Icon: Radio },
    {
      id: 'profile',
      label: isAdmin ? 'Admin Panel' : 'Profile',
      shortLabel: isAdmin ? 'Admin' : 'Profile',
      Icon: isAdmin ? Shield : UserCircle2,
    },
  ];

  // Loading state while auth / profile initializes
  if (!authReady || (authUser && profileLoading && !profile)) {
    return (
      <div className="tr-root">
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            color: 'var(--tr-muted)',
            fontSize: '13.5px',
          }}
        >
          <div className="tr-splash-ring" />
          <span>Securing session...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated -> Auth screens
  if (!authUser || !profile) {
    return (
      <div className="tr-root">
        <AuthScreen />
      </div>
    );
  }

  // Blocked user -> Immediately lock out
  if (isBlocked) {
    return (
      <div className="tr-root">
        <BlockedScreen email={profile.email} />
      </div>
    );
  }

  const activeNavMeta = navItems.find((n) => n.id === activeTab) || navItems[0];

  return (
    <div className="tr-root">
      <div className="tr-shell">
        {/* Desktop Sidebar */}
        <aside className="tr-sidebar" aria-label="Trading Navigation">
          <div className="tr-sidebar-brand">
            <div className="tr-brand-mark">
              <TrendingUp size={18} strokeWidth={2.5} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                FX Desk
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--tr-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.displayName}
              </div>
            </div>
          </div>

          <nav className="tr-sidebar-nav">
            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`tr-nav-btn tr-press ${activeTab === id ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(11, 15, 23, 0.72)',
              border: '1px solid var(--tr-border)',
              fontSize: '11.5px',
              color: 'var(--tr-muted)',
            }}
          >
            <div style={{ fontWeight: 700, color: '#CBD5E1', marginBottom: '2px' }}>
              {isAdmin ? 'Administrator Mode' : 'Private Vault'}
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.email}
            </div>
          </div>
        </aside>

        {/* Main Viewport */}
        <div className="tr-main">
          {/* Mobile Compact Sticky Top Bar */}
          <header className="tr-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div className="tr-brand-mark" style={{ width: '30px', height: '30px', borderRadius: '9px' }}>
                <TrendingUp size={16} strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.01em' }}>
                {activeNavMeta.label}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                className="tr-mono"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: analytics.growthPercent >= 0 ? '#6EE7B7' : '#FCA5A5',
                }}
              >
                {analytics.growthPercent >= 0 ? '+' : ''}
                {analytics.growthPercent.toFixed(1)}%
              </span>
              {isAdmin && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '6px',
                    background: 'var(--tr-buy-soft)',
                    border: '1px solid var(--tr-buy-border)',
                    color: '#6EE7B7',
                  }}
                >
                  ADMIN
                </span>
              )}
            </div>
          </header>

          {/* Active Tab Content */}
          <main className="tr-content">
            {activeTab === 'analysis' && (
              <AnalysisTab
                profile={profile}
                analytics={analytics}
                baseEquity={baseEquity}
                onOpenJournal={() => {
                  setActiveTab('journal');
                  setOpenJournalModalCounter((c) => c + 1);
                }}
              />
            )}

            {activeTab === 'journal' && (
              <JournalTab
                uid={profile.uid}
                trades={trades}
                openModalSignal={openJournalModalCounter}
              />
            )}

            {activeTab === 'market' && <MarketTab />}

            {activeTab === 'feed' && (
              <FeedTab profile={profile} isAdmin={isAdmin} posts={publicPosts} />
            )}

            {activeTab === 'profile' && (
              <ProfileAdminTab
                profile={profile}
                isAdmin={isAdmin}
                allUsers={allUsers}
                baseEquity={baseEquity}
                onBaseEquityChange={handleBaseEquityChange}
              />
            )}
          </main>
        </div>

        {/* Fixed 5-Tab Bottom Navigation Bar (Mobile / WebView) */}
        <nav className="tr-bottom-nav" aria-label="Bottom Navigation">
          {navItems.map(({ id, shortLabel, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`tr-bottom-item tr-press ${activeTab === id ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{shortLabel}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default TradingApp;
