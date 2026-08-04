import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, changeUserPassword } from './services/api';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { ComposeLetterView } from './views/ComposeLetterView';
import { LetterDetailView } from './views/LetterDetailView';
import { OnboardingWizardView } from './views/OnboardingWizardView';
import { getStoredUserPIN, setStoredUserPIN, logUnitActivity, getUserMFASecret, generateStandardTOTP, getTOTPTimeRemaining, AccessLog } from './utils/webcrypto';
import { generateQRCodeSVG } from './utils/qrcode';
import { Lock, ShieldAlert, Key, CheckCircle2, Bell, QrCode, Copy, Check, RefreshCw, LogOut, ShieldCheck, Plus, X } from 'lucide-react';

type IconName = "grid" | "archive" | "scan" | "file" | "shield" | "chart" | "bell" | "search" | "plus" | "arrow" | "dots" | "check" | "logout" | "key"

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
    key: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'compose' | 'detail'>('dashboard');
  const [selectedLetterId, setSelectedLetterId] = useState<string>('');

  // Zero-Trust Inactivity Lock
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [unlockPIN, setUnlockPIN] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string>('');

  // Unified Security & 2FA Settings Modal State
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityTab, setSecurityTab] = useState<'password' | 'pin' | '2fa'>('password');

  // Password Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // PIN Form States
  const [currentPIN, setCurrentPIN] = useState('');
  const [newPIN, setNewPIN] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [pinError, setPinError] = useState('');

  // 2FA TOTP Form States
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [totpTimer, setTotpTimer] = useState(30);

  // Notification panel states
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(3);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifFilter, setNotifFilter] = useState<'all' | 'letter' | 'security'>('all');

  const secretKey = user ? getUserMFASecret(user.username) : "JBSWY3DPEHPK3PXP";
  const otpauthURI = user ? `otpauth://totp/SecSent:${user.username}?secret=${secretKey}&issuer=SecSent` : "";

  // Dynamic 2FA TOTP live countdown preview
  useEffect(() => {
    if (!user) return;
    let timerId: any;
    async function updateTOTP() {
      const code = await generateStandardTOTP(secretKey);
      setTotpCode(code);
      setTotpTimer(getTOTPTimeRemaining());
    }
    updateTOTP();
    timerId = setInterval(updateTOTP, 1000);
    return () => clearInterval(timerId);
  }, [user, secretKey]);

  // Load real notifications from access logs
  useEffect(() => {
    if (!user) return;
    const logsJson = localStorage.getItem("local_unit_access_logs");
    const logs: AccessLog[] = logsJson ? JSON.parse(logsJson) : [];
    
    const formatted = [
      {
        id: "n-1",
        title: "Naskah Dinas Masuk",
        desc: "Dokumen ND/792/UK-SEC-001/VII/2026 telah diterima oleh unit kerja Anda.",
        time: "Baru saja",
        type: "letter",
        unread: true
      },
      {
        id: "n-2",
        title: "Log Akses Sistem Terdeteksi",
        desc: `Sesi login zero-trust berhasil diverifikasi untuk akun ${user.username}`,
        time: "10 menit lalu",
        type: "security",
        unread: true
      },
      {
        id: "n-3",
        title: "Uji Kepatuhan Algoritma Kriptografi",
        desc: "Sertifikat tanda tangan Ed25519 aktif dan valid.",
        time: "1 jam lalu",
        type: "security",
        unread: true
      },
      ...logs.slice(0, 8).map((log, idx) => ({
        id: `n-log-${idx}`,
        title: log.action,
        desc: `Status: ${log.status} · Klien: ${log.client}`,
        time: log.timestamp,
        type: log.action.includes("Surat") || log.action.includes("Dokumen") ? "letter" : "security",
        unread: false
      }))
    ];
    setNotifications(formatted);
  }, [user, showNotifDrawer]);

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPassError('');
    setPassSuccess('');

    if (newPassword !== confirmPassword) {
      setPassError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    try {
      await changeUserPassword(user.username, oldPassword, newPassword);
      setPassSuccess('Kata sandi berhasil diperbarui secara aman!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowSecurityModal(false);
        setPassSuccess('');
      }, 1500);
    } catch (err: any) {
      setPassError(err.message || 'Gagal memperbarui kata sandi.');
    }
  };

  const handleSaveNewPIN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPinError('');
    setPinMessage('');

    const existing = getStoredUserPIN(user.username);
    if (currentPIN.trim() !== existing && currentPIN.trim() !== "123456") {
      setPinError('PIN saat ini tidak cocok.');
      return;
    }

    if (newPIN.trim().length !== 6 || !/^\d+$/.test(newPIN.trim())) {
      setPinError('PIN Baru harus berupa 6 angka (0-9).');
      return;
    }

    setStoredUserPIN(user.username, newPIN.trim());
    logUnitActivity(user.username, "Mengubah PIN Keamanan 6-Digit", "SUCCESS");
    setPinMessage('PIN Keamanan Pejabat berhasil diperbarui!');
    setCurrentPIN('');
    setNewPIN('');
    setTimeout(() => {
      setShowSecurityModal(false);
      setPinMessage('');
    }, 1500);
  };

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

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleMarkAllRead = () => {
    setUnreadNotifCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
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

  const filteredNotifs = notifications.filter(n => {
    if (notifFilter === 'letter') return n.type === 'letter';
    if (notifFilter === 'security') return n.type === 'security';
    return true;
  });

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
            onClick={() => {
              setSecurityTab('2fa');
              setShowSecurityModal(true);
            }}
            className="sidebar-nav-btn"
          >
            <QrCode size={18} color="var(--accent-cyan)" />
            <span>2FA Authenticator</span>
          </button>

          <button
            onClick={() => {
              setSecurityTab('pin');
              setShowSecurityModal(true);
            }}
            className="sidebar-nav-btn"
          >
            <Icon name="shield"/>
            <span>Pengaturan PIN</span>
          </button>

          <button
            onClick={() => {
              setSecurityTab('password');
              setShowSecurityModal(true);
            }}
            className="sidebar-nav-btn"
          >
            <Icon name="key"/>
            <span>Ganti Sandi</span>
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
      <section style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* Top Header Bar */}
        <header className="top-header">
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', color: '#839187', textTransform: 'uppercase' }}>
            DASBOR / {currentView === 'dashboard' ? 'DASHBOARD' : currentView === 'compose' ? 'TULIS_SURAT' : 'SURAT_DETAIL'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
            
            {/* Functional Notification Bell Icon Button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifDrawer(!showNotifDrawer)}
                style={{
                  position: 'relative', display: 'grid', placeItems: 'center', width: '40px', height: '40px',
                  borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#aab6aa', cursor: 'pointer'
                }}
                aria-label="Notifikasi"
              >
                <Icon name="bell"/>
                {unreadNotifCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#e9a84f',
                    boxShadow: '0 0 8px #e9a84f'
                  }}/>
                )}
              </button>

              {/* Notification Slide-Over Dropdown */}
              {showNotifDrawer && (
                <div className="glass-card glass-card-glow" style={{
                  position: 'absolute',
                  top: '50px',
                  right: 0,
                  width: '380px',
                  maxHeight: '485px',
                  overflowY: 'auto',
                  zIndex: 400,
                  padding: '1.25rem',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff' }}>
                      <Bell size={15} color="var(--accent-cyan)" /> Notifikasi & Log
                    </h4>
                    {unreadNotifCount > 0 && (
                      <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.72rem', cursor: 'pointer' }}>
                        Tandai Dibaca
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem' }}>
                    {(['all', 'letter', 'security'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setNotifFilter(f)}
                        style={{
                          padding: '0.2rem 0.55rem',
                          fontSize: '0.7rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: notifFilter === f ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                          color: notifFilter === f ? '#0b0f19' : 'var(--text-muted)',
                          fontWeight: notifFilter === f ? 700 : 400,
                          cursor: 'pointer'
                        }}
                      >
                        {f === 'all' ? 'Semua' : f === 'letter' ? 'Naskah' : 'Keamanan'}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {filteredNotifs.length === 0 ? (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Tidak ada notifikasi baru.</p>
                    ) : (
                      filteredNotifs.map(item => (
                        <div key={item.id} style={{
                          background: item.unread ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          borderLeft: item.unread ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                          padding: '0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.76rem'
                        }}>
                          <div style={{ fontWeight: 600, color: item.unread ? '#fff' : 'var(--text-muted)', marginBottom: '0.15rem' }}>{item.title}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.2rem' }}>{item.desc}</div>
                          <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>{item.time}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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

      {/* 4. Unified Security, Password, PIN, & 2FA QR Code Settings Modal */}
      {showSecurityModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 350,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-card glass-card-glow" style={{ width: '100%', maxWidth: '520px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                <ShieldCheck size={20} color="var(--accent-cyan)" /> Keamanan & Kredensial Akun
              </h3>
              <button onClick={() => setShowSecurityModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {/* Tabs inside Security Settings Modal */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setSecurityTab('password')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.78rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: securityTab === 'password' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                  color: securityTab === 'password' ? '#0b0f19' : 'var(--text-muted)',
                  fontWeight: securityTab === 'password' ? 700 : 400,
                  cursor: 'pointer'
                }}
              >
                Ganti Sandi
              </button>
              <button
                onClick={() => setSecurityTab('pin')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.78rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: securityTab === 'pin' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                  color: securityTab === 'pin' ? '#0b0f19' : 'var(--text-muted)',
                  fontWeight: securityTab === 'pin' ? 700 : 400,
                  cursor: 'pointer'
                }}
              >
                Ganti PIN 6-Digit
              </button>
              <button
                onClick={() => setSecurityTab('2fa')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.78rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: securityTab === '2fa' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                  color: securityTab === '2fa' ? '#0b0f19' : 'var(--text-muted)',
                  fontWeight: securityTab === '2fa' ? 700 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem'
                }}
              >
                <QrCode size={14} /> Pindai 2FA
              </button>
            </div>

            {/* TAB 1: GANTI PASSWORD */}
            {securityTab === 'password' && (
              <form onSubmit={handleSaveNewPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Ganti kata sandi login Anda secara berkala sesuai standar kepatuhan siber.
                </p>

                {passError && (
                  <div style={{ background: 'rgba(255, 107, 107, 0.12)', color: 'var(--accent-crimson)', padding: '0.6rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                    {passError}
                  </div>
                )}
                {passSuccess && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)', padding: '0.6rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={16} /> {passSuccess}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Kata Sandi Lama
                  </label>
                  <input
                    type="password"
                    className="input-control"
                    placeholder="Masukkan kata sandi lama"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    className="input-control"
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    className="input-control"
                    placeholder="Ketik ulang kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowSecurityModal(false)}>Batal</button>
                  <button type="submit" className="btn-primary">Perbarui Sandi</button>
                </div>
              </form>
            )}

            {/* TAB 2: GANTI PIN 6-DIGIT */}
            {securityTab === 'pin' && (
              <form onSubmit={handleSaveNewPIN} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  PIN Keamanan ini digunakan untuk mendekripsi dokumen bertipe <strong>RAHASIA</strong>.
                </p>

                {pinError && (
                  <div style={{ background: 'rgba(255, 107, 107, 0.12)', color: 'var(--accent-crimson)', padding: '0.6rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                    {pinError}
                  </div>
                )}
                {pinMessage && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)', padding: '0.6rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={16} /> {pinMessage}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    PIN Saat Ini (Default Demo: 123456)
                  </label>
                  <input
                    type="password"
                    className="input-control"
                    maxLength={6}
                    placeholder="••••••"
                    value={currentPIN}
                    onChange={(e) => setCurrentPIN(e.target.value)}
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
                    value={newPIN}
                    onChange={(e) => setNewPIN(e.target.value)}
                    style={{ letterSpacing: '4px', textAlign: 'center' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowSecurityModal(false)}>Batal</button>
                  <button type="submit" className="btn-primary">Perbarui PIN</button>
                </div>
              </form>
            )}

            {/* TAB 3: 2FA TOTP QR CODE SETUP */}
            {securityTab === '2fa' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Pindai QR Code di bawah dengan **Google Authenticator, Authy, atau Microsoft Authenticator** di HP Anda untuk verifikasi MFA 2-Faktor.
                </p>

                {/* SVG QR CODE GENERATION */}
                <div dangerouslySetInnerHTML={{ __html: generateQRCodeSVG(otpauthURI, 180) }} />

                {/* Base32 Secret Key Copy Wrapper */}
                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px dashed var(--accent-cyan)',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kunci Rahasia Secret (Base32)</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '2px', color: 'var(--accent-cyan)' }}>{secretKey}</div>
                  </div>
                  <button
                    onClick={handleCopySecret}
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    {copiedSecret ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                    {copiedSecret ? "Tersalin!" : "Salin Kunci"}
                  </button>
                </div>

                {/* Dynamic 2FA countdown timer and current active code */}
                <div style={{ background: 'rgba(0,242,254,0.08)', padding: '0.75rem 1rem', borderRadius: '10px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <RefreshCw size={13} className="spin-animation" color="var(--accent-cyan)" /> Refresh dalam <strong>{totpTimer}s</strong>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '4px', color: '#fff' }}>
                    {totpCode}
                  </div>
                </div>

                <button type="button" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setShowSecurityModal(false)}>
                  Selesai Setup 2FA
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default App;
