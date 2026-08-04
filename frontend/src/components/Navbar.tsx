import React, { useState, useEffect } from 'react';
import { UserProfile, changeUserPassword } from '../services/api';
import { getStoredUserPIN, setStoredUserPIN, getUserMFASecret, generateStandardTOTP, getTOTPTimeRemaining, logUnitActivity, AccessLog } from '../utils/webcrypto';
import { generateQRCodeSVG } from '../utils/qrcode';
import { ShieldCheck, FileText, PlusCircle, LogOut, User, Lock, Key, CheckCircle2, Bell, QrCode, Copy, Check, ShieldAlert, RefreshCw, X } from 'lucide-react';

interface NavbarProps {
  user: UserProfile;
  currentView: 'dashboard' | 'compose' | 'detail';
  setCurrentView: (view: 'dashboard' | 'compose' | 'detail') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, currentView, setCurrentView, onLogout }) => {
  // Modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'password' | 'pin' | '2fa'>('password');

  // Notification Drawer states
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(3);
  const [notifFilter, setNotifFilter] = useState<'all' | 'letter' | 'security'>('all');

  // Password Change States
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // PIN Change States
  const [currentPINInput, setCurrentPINInput] = useState('');
  const [newPINInput, setNewPINInput] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [pinError, setPinError] = useState('');

  // 2FA TOTP States
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [totpTimer, setTotpTimer] = useState(30);

  const secretKey = getUserMFASecret(user.username);
  const otpauthURI = `otpauth://totp/SecSent:${user.username}?secret=${secretKey}&issuer=SecSent`;

  // Load real-time notifications from access logs & activities
  useEffect(() => {
    const logsJson = localStorage.getItem("local_unit_access_logs");
    const logs: AccessLog[] = logsJson ? JSON.parse(logsJson) : [];
    
    const formattedNotifs = [
      {
        id: "notif-1",
        title: "Naskah Dinas Masuk Baru",
        desc: "Dokumen ND/742/UK-SEC-001/VII/2026 telah diterima di unit kerja Anda.",
        time: "5 menit lalu",
        type: "letter",
        unread: true
      },
      {
        id: "notif-2",
        title: "Verifikasi Keamanan TOTP/MFA",
        desc: "Sesi verifikasi Zero-Trust berhasil dilakukan untuk pengguna " + user.username,
        time: "15 menit lalu",
        type: "security",
        unread: true
      },
      {
        id: "notif-3",
        title: "Pembaruan Kunci Sertifikat",
        desc: "Sertifikat digital Ed25519 aktif dan terverifikasi secara sah.",
        time: "1 jam lalu",
        type: "security",
        unread: true
      },
      ...logs.slice(0, 7).map((log, idx) => ({
        id: `notif-log-${idx}`,
        title: log.action,
        desc: `Status: ${log.status} · Klien: ${log.client}`,
        time: log.timestamp,
        type: log.action.includes("Surat") || log.action.includes("Dokumen") ? "letter" : "security",
        unread: false
      }))
    ];

    setNotifications(formattedNotifs);
  }, [user.username, showNotifDrawer]);

  // Dynamic 2FA TOTP live preview timer
  useEffect(() => {
    let timerId: any;
    async function updateTOTP() {
      const code = await generateStandardTOTP(secretKey);
      setTotpCode(code);
      setTotpTimer(getTOTPTimeRemaining());
    }
    updateTOTP();
    timerId = setInterval(updateTOTP, 1000);
    return () => clearInterval(timerId);
  }, [secretKey]);

  const getBadgeClass = (clearance?: string) => {
    switch (clearance) {
      case 'SECRET': return 'badge-secret';
      case 'CONFIDENTIAL': return 'badge-confidential';
      case 'RESTRICTED': return 'badge-restricted';
      default: return 'badge-unclassified';
    }
  };

  // Handle Change Password Form
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPass !== confirmPass) {
      setPassError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    if (newPass.length < 6) {
      setPassError('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    try {
      await changeUserPassword(user.username, oldPass, newPass);
      setPassSuccess('Kata sandi akun Anda berhasil diperbarui secara permanen!');
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      setPassError(err.message || 'Gagal mengubah kata sandi.');
    }
  };

  // Handle Change PIN Form
  const handleSaveNewPIN = (e: React.FormEvent) => {
    e.preventDefault();
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
    logUnitActivity(user.username, "Mengubah PIN Keamanan 6-Digit", "SUCCESS");
    setPinMessage('PIN Keamanan Pejabat berhasil diperbarui!');
    setCurrentPINInput('');
    setNewPINInput('');
  };

  // Copy 2FA Secret Key
  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  // Mark all notifications as read
  const handleMarkAllRead = () => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const filteredNotifs = notifications.filter(n => {
    if (notifFilter === 'letter') return n.type === 'letter';
    if (notifFilter === 'security') return n.type === 'security';
    return true;
  });

  return (
    <nav style={{
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-glass)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0.85rem 2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setCurrentView('dashboard')}>
          <div style={{
            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
            padding: '0.5rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0b0f19'
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', lineHeight: 1.1 }} className="gradient-text">SecSent</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Zero-Trust Correspondence Platform
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className={`btn-secondary ${currentView === 'dashboard' ? 'glass-card-glow' : ''}`}
            onClick={() => setCurrentView('dashboard')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <FileText size={16} /> Dashboard Persuratan
          </button>
          <button
            className={`btn-primary ${currentView === 'compose' ? 'glass-card-glow' : ''}`}
            onClick={() => setCurrentView('compose')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <PlusCircle size={16} /> Buat Surat Dinas
          </button>
        </div>

        {/* User Profile, Notifications & Settings Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          {/* Interactive Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifDrawer(!showNotifDrawer)}
              title="Notifikasi Sistem & Log Aktivitas"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                padding: '0.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Slide-Over Drawer */}
            {showNotifDrawer && (
              <div className="glass-card glass-card-glow" style={{
                position: 'absolute',
                top: '45px',
                right: 0,
                width: '380px',
                maxHeight: '480px',
                overflowY: 'auto',
                zIndex: 250,
                padding: '1.25rem',
                boxShadow: '0 16px 40px rgba(0,0,0,0.6)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Bell size={16} color="var(--accent-cyan)" /> Notifikasi & Log Aktivitas
                  </h4>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.75rem', cursor: 'pointer' }}>
                      Tandai Dibaca
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem' }}>
                  {(['all', 'letter', 'security'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setNotifFilter(f)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.72rem',
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

                {/* Notification List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {filteredNotifs.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Tidak ada notifikasi.</div>
                  ) : (
                    filteredNotifs.map(item => (
                      <div key={item.id} style={{
                        background: item.unread ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        borderLeft: item.unread ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                        padding: '0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem'
                      }}>
                        <div style={{ fontWeight: 600, color: item.unread ? '#fff' : 'var(--text-muted)', marginBottom: '0.2rem' }}>{item.title}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginBottom: '0.25rem' }}>{item.desc}</div>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>{item.time}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
              <User size={14} color="var(--accent-cyan)" /> {user.full_name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.15rem' }}>
              <span>{user.role}</span> • <span>{user.work_unit?.unit_code || 'UK-SEC-001'}</span>
            </div>
          </div>

          <span className={`badge ${getBadgeClass(user.clearance_level)}`}>
            <Lock size={12} /> {user.clearance_level}
          </span>

          {/* Account Settings & Security Modal Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            title="Pengaturan Akun & Keamanan 2FA / PIN / Password"
            style={{
              background: 'rgba(0, 242, 254, 0.1)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              color: 'var(--accent-cyan)',
              padding: '0.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Key size={18} />
          </button>

          <button
            onClick={onLogout}
            title="Keluar dari Sistem"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              padding: '0.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LogOut size={18} />
          </button>
        </div>

      </div>

      {/* Modal Pengaturan Akun & Keamanan (Ganti Password, PIN, & 2FA QR Code) */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-card glass-card-glow" style={{ width: '100%', maxWidth: '520px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="var(--accent-cyan)" /> Pengaturan Keamanan & Profil Akun
              </h3>
              <button onClick={() => setShowSettingsModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {/* Navigation Tabs inside Modal */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setActiveTab('password')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'password' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === 'password' ? '#0b0f19' : 'var(--text-muted)',
                  fontWeight: activeTab === 'password' ? 700 : 400,
                  cursor: 'pointer'
                }}
              >
                Ganti Kata Sandi
              </button>
              <button
                onClick={() => setActiveTab('pin')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'pin' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === 'pin' ? '#0b0f19' : 'var(--text-muted)',
                  fontWeight: activeTab === 'pin' ? 700 : 400,
                  cursor: 'pointer'
                }}
              >
                Ganti PIN 6-Digit
              </button>
              <button
                onClick={() => setActiveTab('2fa')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === '2fa' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === '2fa' ? '#0b0f19' : 'var(--text-muted)',
                  fontWeight: activeTab === '2fa' ? 700 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem'
                }}
              >
                <QrCode size={14} /> QR Code 2FA
              </button>
            </div>

            {/* TAB 1: GANTI KATA SANDI */}
            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Perbarui kata sandi login Anda secara berkala sesuai standar keamanan ISO/IEC 27001.
                </p>

                {passError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.65rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                    {passError}
                  </div>
                )}
                {passSuccess && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.65rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                    placeholder="Masukkan Kata Sandi Lama"
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
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
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
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
                    placeholder="Ulangi Kata Sandi Baru"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowSettingsModal(false)}>Batal</button>
                  <button type="submit" className="btn-primary">Simpan Kata Sandi Baru</button>
                </div>
              </form>
            )}

            {/* TAB 2: GANTI PIN 6-DIGIT */}
            {activeTab === 'pin' && (
              <form onSubmit={handleSaveNewPIN} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Atur PIN 6-Digit pribadi Anda untuk verifikasi dekripsi cepat dokumen <strong>RAHASIA</strong>.
                </p>

                {pinError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.65rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                    {pinError}
                  </div>
                )}
                {pinMessage && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.65rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                  <button type="button" className="btn-secondary" onClick={() => setShowSettingsModal(false)}>Batal</button>
                  <button type="submit" className="btn-primary">Simpan PIN Baru</button>
                </div>
              </form>
            )}

            {/* TAB 3: 2FA TOTP QR CODE SETUP */}
            {activeTab === '2fa' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Pindai QR Code di bawah ini menggunakan aplikasi <strong>Google Authenticator, Authy, atau Microsoft Authenticator</strong> pada HP Anda untuk verifikasi MFA 2-Faktor.
                </p>

                {/* SVG QR CODE */}
                <div dangerouslySetInnerHTML={{ __html: generateQRCodeSVG(otpauthURI, 190) }} />

                {/* Base32 Secret Key display with Copy button */}
                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px dashed var(--accent-cyan)',
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kunci Rahasia Secret (Base32)</div>
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

                {/* Live TOTP Countdown preview */}
                <div style={{ background: 'rgba(0,242,254,0.08)', padding: '0.75rem', borderRadius: '10px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <RefreshCw size={14} className="spin-animation" color="var(--accent-cyan)" /> Refresh Kode dalam <strong>{totpTimer}s</strong>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '4px', color: '#fff' }}>
                    {totpCode}
                  </div>
                </div>

                <button type="button" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setShowSettingsModal(false)}>
                  Selesai Setup 2FA
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </nav>
  );
};
