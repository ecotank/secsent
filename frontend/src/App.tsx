import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from './services/api';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { ComposeLetterView } from './views/ComposeLetterView';
import { LetterDetailView } from './views/LetterDetailView';
import { OnboardingWizardView } from './views/OnboardingWizardView';
import { getStoredUserPIN, setStoredUserPIN, logUnitActivity } from './utils/webcrypto';
import { Lock, ShieldAlert, Key, CheckCircle2 } from 'lucide-react';

type IconName = "grid" | "archive" | "scan" | "file" | "shield" | "chart" | "bell" | "search" | "plus" | "arrow" | "dots" | "check" | "logout"

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    archive: <><path d="M3 8h18v12H3z"/><path d="M2 4h20v4H2zM10 12h4"/></>,
    scan: <><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3"/><path d="M8 12h8M12 8v8"/></>,
    file: <><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></>,
    shield: <path d="M12 3 20 6v5c0 5.2-3.4 8.7-8 10-4.6-1.3-8-4.8-8-10V6z"/>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    search: <><circle cx="11" cy="11" r="6"/><path d="m20 20-4-4"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    arrow: <path d="M5 12h14M13 6l6 6-6 6"/>,
    dots: <path d="M5 12h.01M12 12h.01M19 12h.01"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'compose' | 'detail'>('dashboard');
  const [selectedLetterId, setSelectedLetterId] = useState<string>('');

  // Zero-Trust Auto Inactivity Lock State (3-Minute Idle Protection)
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [unlockPIN, setUnlockPIN] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string>('');

  // PIN Settings Modal State
  const [showPINModal, setShowPINModal] = useState(false);
  const [currentPINInput, setCurrentPINInput] = useState('');
  const [newPINInput, setNewPINInput] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [pinError, setPinError] = useState('');

  const handleLoginSuccess = (userToken: string, userData: UserProfile) => {
    setToken(userToken);
    setUser(userData);
    setCurrentView('dashboard');
    setIsLocked(false);
  };

  const handleLogout = () => {
    if (user) {
      logUnitActivity(user.username, "Sesi Keluar (Logout)", "SUCCESS");
    }
    setToken(null);
    setUser(null);
    setIsLocked(false);
  };

  const handleSelectLetter = (id: string) => {
    setSelectedLetterId(id);
    setCurrentView('detail');
  };

  const handleSaveNewPIN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPinError('');
    setPinMessage('');

    const existing = getStoredUserPIN(user.username);
    if (currentPINInput.trim() !== existing && currentPINInput.trim() !== "123456") {
      setPinError('PIN saat ini tidak cocok.');
      return;
    }

    if (newPINInput.trim().length !== 6 || !/^\d+$/.test(newPINInput.trim())) {
      setPinError('PIN Baru harus berupa 6 angka (0-9).');
      return;
    }

    setStoredUserPIN(user.username, newPINInput.trim());
    setPinMessage('PIN Keamanan Pejabat berhasil diperbarui!');
    setCurrentPINInput('');
    setNewPINInput('');
    setTimeout(() => {
      setShowPINModal(false);
      setPinMessage('');
    }, 1500);
  };

  // Idle Timer (3 Minutes Inactivity Lock)
  useEffect(() => {
    if (!token || !user) return;

    let idleTimer: any;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsLocked(true);
      }, 180000);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(evt => window.addEventListener(evt, resetIdleTimer));
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach(evt => window.removeEventListener(evt, resetIdleTimer));
    };
  }, [token, user]);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && (unlockPIN === getStoredUserPIN(user.username) || unlockPIN === '123456')) {
      logUnitActivity(user.username, "Membuka Kunci Layar (Idle Timeout)", "SUCCESS");
      setIsLocked(false);
      setUnlockPIN('');
      setUnlockError('');
    } else {
      if (user) {
        logUnitActivity(user.username, "Gagal Membuka Kunci Layar (PIN Salah)", "FAILED");
      }
      setUnlockError('PIN Keamanan tidak sah.');
    }
  };

  const syncTime = useMemo(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  }, []);

  if (!token || !user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  if (user.password_change_required) {
    return (
      <OnboardingWizardView
        user={user}
        onComplete={() => {
          const localUsersJson = localStorage.getItem("local_registered_users");
          if (localUsersJson) {
            const localUsers = JSON.parse(localUsersJson);
            const idx = localUsers.findIndex((u: any) => u.username === user.username);
            if (idx !== -1) {
              localUsers[idx].password_change_required = false;
              localStorage.setItem("local_registered_users", JSON.stringify(localUsers));
            }
          }
          setUser({ ...user, password_change_required: false });
        }}
      />
    );
  }

  const initials = user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PJ';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#07100f', color: '#e8eee8' }}>
      
      {/* 1. Left Sidebar (Fixed 254px Tactical Container) */}
      <aside className="sidebar-container">
        
        {/* Logo Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem', paddingLeft: '0.25rem' }}>
          <div style={{
            display: 'grid', placeItems: 'center', width: '40px', height: '40px',
            borderRadius: '6px', backgroundColor: '#d8ff43', color: '#091513'
          }}>
            <Icon name="shield" size={21}/>
          </div>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', color: '#aab6aa', textTransform: 'uppercase' }}>
              SECURE
            </p>
            <p style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em', color: '#ffffff' }}>
              CORRESPONDENCE
            </p>
          </div>
        </div>

        {/* Sidebar Nav Buttons */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }} aria-label="Navigasi utama">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`sidebar-nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
          >
            <Icon name="grid"/>
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentView('compose')}
            className={`sidebar-nav-btn ${currentView === 'compose' ? 'active' : ''}`}
          >
            <Icon name="plus"/>
            <span>Buat Surat Dinas</span>
          </button>

          <button
            onClick={() => setShowPINModal(true)}
            className="sidebar-nav-btn"
          >
            <Icon name="shield"/>
            <span>Pengaturan PIN</span>
          </button>

          <button
            onClick={handleLogout}
            className="sidebar-nav-btn"
            style={{ color: '#ff6b6b' }}
          >
            <Icon name="logout"/>
            <span>Keluar Sesi</span>
          </button>
        </nav>

        {/* Bottom Protected Badge */}
        <div style={{
          marginTop: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: '#0d1c18', padding: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px', fontWeight: 600, color: '#d8ff43', marginBottom: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d8ff43', boxShadow: '0 0 12px #d8ff43' }}/>
            Sistem Terlindungi
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', lineHeight: '1.5', color: '#809084' }}>
            AES-256 · HSM online<br/>
            SYNC {syncTime} WIB
          </p>
        </div>

      </aside>

      {/* 2. Right Main Layout Area */}
      <section style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Header Bar */}
        <header className="top-header">
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', color: '#839187', textTransform: 'uppercase' }}>
            DASBOR / {currentView === 'dashboard' ? 'DASHBOARD' : currentView === 'compose' ? 'TULIS_SURAT' : 'SURAT_DETAIL'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button style={{
              position: 'relative', display: 'grid', placeItems: 'center', width: '40px', height: '40px',
              borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#aab6aa', cursor: 'pointer'
            }} aria-label="Notifikasi">
              <Icon name="bell"/>
              <span style={{ position: 'absolute', right: '8px', top: '8px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e9a84f' }}/>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>{user.full_name}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#819084', textTransform: 'uppercase' }}>{user.role}</p>
              </div>
              <div style={{
                display: 'grid', placeItems: 'center', width: '36px', height: '36px',
                borderRadius: '50%', backgroundColor: '#355c57', fontSize: '12px', fontWeight: 700, color: '#ffffff'
              }}>
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* View Router Render Block */}
        <div style={{ flex: 1, padding: '2rem' }}>
          {currentView === 'dashboard' && (
            <DashboardView
              user={user}
              onSelectLetter={handleSelectLetter}
              onNavigateCompose={() => setCurrentView('compose')}
            />
          )}

          {currentView === 'compose' && (
            <ComposeLetterView
              user={user}
              onBack={() => setCurrentView('dashboard')}
              onSubmitSuccess={() => setCurrentView('dashboard')}
            />
          )}

          {currentView === 'detail' && (
            <LetterDetailView
              user={user}
              letterId={selectedLetterId}
              onBack={() => setCurrentView('dashboard')}
            />
          )}
        </div>

      </section>

      {/* 3. Auto Inactivity Screen Lock Overlay */}
      {isLocked && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(7, 16, 15, 0.96)',
          backdropFilter: 'blur(20px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div className="glass-card glass-card-glow" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', textAlign: 'center' }}>
            <div style={{
              background: 'rgba(233, 168, 79, 0.12)',
              border: '1px solid rgba(233, 168, 79, 0.3)',
              width: '64px', height: '64px',
              borderRadius: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)',
              marginBottom: '1rem'
            }}>
              <Lock size={32} />
            </div>

            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.25rem', color: '#ffffff' }}>Sesi Terkunci Otomatis</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Tidak ada aktivitas selama 3 menit. Masukkan PIN Keamanan untuk membuka sesi <strong>{user.full_name}</strong>.
            </p>

            {unlockError && (
              <div style={{
                background: 'rgba(255, 107, 107, 0.12)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                color: 'var(--accent-crimson)',
                padding: '0.6rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                justifyContent: 'center'
              }}>
                <ShieldAlert size={14} /> {unlockError}
              </div>
            )}

            <form onSubmit={handleUnlockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="password"
                className="input-control"
                placeholder="Masukkan PIN (Demo: 123456)"
                value={unlockPIN}
                onChange={(e) => setUnlockPIN(e.target.value)}
                maxLength={6}
                style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '1.1rem' }}
                required
                autoFocus
              />
              <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
                <Key size={16} /> Buka Kunci Sesi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. PIN Setup Modal for Sidebar Link */}
      {showPINModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-card glass-card-glow" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                <Key size={18} color="var(--accent-cyan)" /> Pengaturan PIN Keamanan
              </h3>
              <button onClick={() => setShowPINModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Atur PIN 6-Digit pribadi Anda. PIN ini digunakan untuk verifikasi dekripsi dokumen <strong>RAHASIA</strong> saat bertugas.
            </p>

            {pinError && (
              <div style={{ background: 'rgba(255, 107, 107, 0.12)', color: 'var(--accent-crimson)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {pinError}
              </div>
            )}

            {pinMessage && (
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} /> {pinMessage}
              </div>
            )}

            <form onSubmit={handleSaveNewPIN} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  PIN Saat Ini (Default Demo: 123456)
                </label>
                <input
                  type="password"
                  className="input-control"
                  maxLength={6}
                  placeholder="•••••"
                  value={currentPINInput}
                  onChange={(e) => setCurrentPINInput(e.target.value)}
                  style={{ letterSpacing: '4px', textAlign: 'center' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  PIN Baru 6-Digit (Angka)
                </label>
                <input
                  type="password"
                  className="input-control"
                  maxLength={6}
                  placeholder="Masukkan 6 Angka Baru"
                  value={newPINInput}
                  onChange={(e) => setNewPINInput(e.target.value)}
                  style={{ letterSpacing: '4px', textAlign: 'center' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowPINModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Simpan PIN Baru <Key size={14} />
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default App;
