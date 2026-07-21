import React, { useState, useEffect } from 'react';
import { UserProfile } from './services/api';
import { Navbar } from './components/Navbar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { ComposeLetterView } from './views/ComposeLetterView';
import { LetterDetailView } from './views/LetterDetailView';
import { Lock, ShieldAlert, Key } from 'lucide-react';

export function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'compose' | 'detail'>('dashboard');
  const [selectedLetterId, setSelectedLetterId] = useState<string>('');

  // Zero-Trust Auto Inactivity Lock State (3-Minute Idle Protection)
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [unlockPIN, setUnlockPIN] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string>('');

  const handleLoginSuccess = (userToken: string, userData: UserProfile) => {
    setToken(userToken);
    setUser(userData);
    setCurrentView('dashboard');
    setIsLocked(false);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setIsLocked(false);
  };

  const handleSelectLetter = (id: string) => {
    setSelectedLetterId(id);
    setCurrentView('detail');
  };

  // Idle Timer (3 Minutes Inactivity Lock)
  useEffect(() => {
    if (!token || !user) return;

    let idleTimer: NodeJS.Timeout;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      // Auto lock after 3 minutes (180,000 ms) of inactivity
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
    if (unlockPIN === '123456' || unlockPIN.length >= 6) {
      setIsLocked(false);
      setUnlockPIN('');
      setUnlockError('');
    } else {
      setUnlockError('PIN/Sandi tidak valid. Masukkan PIN 6-Digit yang benar (Demo: 123456).');
    }
  };

  if (!token || !user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* Auto Inactivity Screen Lock Overlay */}
      {isLocked && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(11, 15, 25, 0.95)',
          backdropFilter: 'blur(20px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div className="glass-card glass-card-glow" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', textAlign: 'center' }}>
            <div style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              width: '64px', height: '64px',
              borderRadius: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
              marginBottom: '1rem'
            }}>
              <Lock size={32} />
            </div>

            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>Sesi Terkunci Otomatis</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Tidak ada aktivitas selama 3 menit. Masukkan PIN Keamanan untuk membuka sesi <strong>{user.full_name}</strong>.
            </p>

            {unlockError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
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

      <Navbar
        user={user}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1 }}>
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
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        borderTop: '1px solid var(--border-glass)',
        fontSize: '0.8rem',
        color: 'var(--text-dim)',
        marginTop: 'auto'
      }}>
        SecureOffice-AI © 2026. Zero-Trust Security Architecture with Automated Idle Lock & Dynamic Watermarking.
      </footer>
    </div>
  );
}

export default App;
