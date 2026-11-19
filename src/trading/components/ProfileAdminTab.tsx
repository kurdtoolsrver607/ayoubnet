import React, { useMemo, useState } from 'react';
import {
  User as UserIcon,
  Shield,
  LogOut,
  KeyRound,
  Search,
  Ban,
  CheckCircle2,
  Save,
  DollarSign,
  Users,
} from 'lucide-react';
import {
  logoutTradingUser,
  resetTradingPassword,
  setUserBlockedStatus,
  updateUserDisplayName,
  formatShortTimestamp,
  isTradingAdminEmail,
  type TradingUserProfile,
} from '../tradingFirebase';

interface ProfileAdminTabProps {
  profile: TradingUserProfile;
  isAdmin: boolean;
  allUsers: TradingUserProfile[];
  baseEquity: number;
  onBaseEquityChange: (value: number) => void;
}

export const ProfileAdminTab: React.FC<ProfileAdminTabProps> = ({
  profile,
  isAdmin,
  allUsers,
  baseEquity,
  onBaseEquityChange,
}) => {
  const [nameInput, setNameInput] = useState(profile.displayName);
  const [equityInput, setEquityInput] = useState(String(baseEquity));
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Admin panel controls
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [togglingUid, setTogglingUid] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileNotice(null);
    try {
      if (nameInput.trim() && nameInput.trim() !== profile.displayName) {
        await updateUserDisplayName(profile.uid, nameInput.trim());
      }
      const parsedEq = parseFloat(equityInput);
      if (!Number.isNaN(parsedEq) && parsedEq >= 100) {
        onBaseEquityChange(parsedEq);
      }
      setProfileNotice('Account settings updated.');
      setTimeout(() => setProfileNotice(null), 2600);
    } catch (err) {
      setProfileNotice(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendReset = async () => {
    try {
      await resetTradingPassword(profile.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 4000);
    } catch (err) {
      console.error('Reset email error:', err);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logoutTradingUser();
    } finally {
      setSigningOut(false);
    }
  };

  const handleToggleBlock = async (target: TradingUserProfile) => {
    if (!isAdmin || isTradingAdminEmail(target.email)) return;
    setTogglingUid(target.uid);
    try {
      await setUserBlockedStatus(target.uid, !target.isBlocked);
    } catch (err) {
      console.error('Failed to update block status:', err);
    } finally {
      setTogglingUid(null);
    }
  };

  const adminStats = useMemo(() => {
    const total = allUsers.length;
    const blocked = allUsers.filter((u) => u.isBlocked).length;
    return { total, active: total - blocked, blocked };
  }, [allUsers]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return allUsers.filter((u) => {
      if (statusFilter === 'active' && u.isBlocked) return false;
      if (statusFilter === 'blocked' && !u.isBlocked) return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q)
      );
    });
  }, [allUsers, userSearch, statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#F8FAFC' }}>
          {isAdmin ? 'Profile & Admin Control' : 'Trader Profile'}
        </h1>
        <div style={{ fontSize: '12.5px', color: 'var(--tr-muted)', marginTop: '2px' }}>
          Manage your desk preferences, security, and session
        </div>
      </div>

      {/* Account Settings Card */}
      <section className="tr-card" style={{ maxWidth: '720px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'var(--tr-buy-soft)',
                border: '1px solid var(--tr-buy-border)',
                color: '#6EE7B7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isAdmin ? <Shield size={20} /> : <UserIcon size={20} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.email}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--tr-muted)' }}>
                Role: <strong style={{ color: isAdmin ? '#6EE7B7' : '#CBD5E1' }}>{isAdmin ? 'Administrator' : 'Private Trader'}</strong> · Joined {formatShortTimestamp(profile.createdAt)}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div>
              <label className="tr-label" htmlFor="tr-profile-name">Display Name</label>
              <input
                id="tr-profile-name"
                type="text"
                className="tr-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={80}
              />
            </div>

            <div>
              <label className="tr-label" htmlFor="tr-profile-equity">
                Base Account Equity (USD)
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--tr-muted)',
                  }}
                />
                <input
                  id="tr-profile-equity"
                  type="number"
                  min="100"
                  step="100"
                  className="tr-input tr-mono"
                  style={{ paddingLeft: '34px' }}
                  value={equityInput}
                  onChange={(e) => setEquityInput(e.target.value)}
                />
              </div>
            </div>
          </div>

          {profileNotice && (
            <div style={{ fontSize: '12.5px', color: '#6EE7B7', fontWeight: 600 }}>
              {profileNotice}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', paddingTop: '6px' }}>
            <button type="submit" disabled={savingProfile} className="tr-btn tr-btn-primary tr-btn-sm tr-press">
              <Save size={15} />
              <span>{savingProfile ? 'Saving...' : 'Save Settings'}</span>
            </button>

            <button type="button" onClick={handleSendReset} className="tr-btn tr-btn-sm tr-press">
              <KeyRound size={15} />
              <span>{resetSent ? 'Reset Email Sent' : 'Reset Password'}</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="tr-btn tr-btn-danger tr-btn-sm tr-press"
              style={{ marginLeft: 'auto' }}
            >
              <LogOut size={15} />
              <span>{signingOut ? 'Signing Out...' : 'Sign Out'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Admin-Only User Management Panel (STRICTLY visible only to tafteshok@gmail.com) */}
      {isAdmin && (
        <section className="tr-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} style={{ color: 'var(--tr-buy)' }} />
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#F8FAFC' }}>
                  Registered Users Management
                </h2>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--tr-muted)', marginTop: '2px' }}>
                Block or unblock accounts instantly · Enforced server-side via Firestore Rules
              </div>
            </div>

            <div className="tr-mono" style={{ display: 'flex', gap: '12px', fontSize: '12.5px' }}>
              <span style={{ color: '#F8FAFC' }}>Total: <strong>{adminStats.total}</strong></span>
              <span style={{ color: '#6EE7B7' }}>Active: <strong>{adminStats.active}</strong></span>
              <span style={{ color: '#FCA5A5' }}>Blocked: <strong>{adminStats.blocked}</strong></span>
            </div>
          </div>

          {/* Search & Status Filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <div className="tr-segmented">
              {(['all', 'active', 'blocked'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`tr-seg-btn tr-press ${statusFilter === tab ? 'active' : ''}`}
                >
                  {tab === 'all' ? 'All Users' : tab === 'active' ? 'Active' : 'Blocked'}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--tr-muted)',
                }}
              />
              <input
                type="search"
                className="tr-input"
                style={{ paddingLeft: '36px', minHeight: '40px' }}
                placeholder="Search by email or name..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          {/* User List */}
          {filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', fontSize: '13px', color: 'var(--tr-muted)' }}>
              No registered users match your filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredUsers.map((u) => {
                const isSelfAdmin = isTradingAdminEmail(u.email);
                const busy = togglingUid === u.uid;

                return (
                  <div
                    key={u.uid}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: 'rgba(11, 15, 23, 0.7)',
                      border: `1px solid ${u.isBlocked ? 'var(--tr-sell-border)' : 'var(--tr-border)'}`,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                          {u.displayName}
                        </span>
                        {isSelfAdmin ? (
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '6px',
                              background: 'var(--tr-buy-soft)',
                              color: '#6EE7B7',
                            }}
                          >
                            ADMIN
                          </span>
                        ) : u.isBlocked ? (
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '6px',
                              background: 'var(--tr-sell-soft)',
                              color: '#FCA5A5',
                            }}
                          >
                            BLOCKED
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '6px',
                              background: 'rgba(148,163,184,0.14)',
                              color: '#CBD5E1',
                            }}
                          >
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--tr-muted)', marginTop: '2px', wordBreak: 'break-all' }}>
                        {u.email} · Joined {formatShortTimestamp(u.createdAt)}
                      </div>
                    </div>

                    {!isSelfAdmin && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleToggleBlock(u)}
                        className={`tr-btn tr-btn-sm tr-press ${u.isBlocked ? 'tr-btn-buy' : 'tr-btn-danger'}`}
                      >
                        {u.isBlocked ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                        <span>{busy ? 'Updating...' : u.isBlocked ? 'Unblock' : 'Block User'}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
