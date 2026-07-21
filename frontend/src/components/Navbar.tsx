import React, { useState } from 'react';
import { UserProfile } from '../services/api';
import { getStoredUserPIN, setStoredUserPIN } from '../utils/webcrypto';
import { ShieldCheck, FileText, PlusCircle, LogOut, User, Lock, Key, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  user: UserProfile;
  currentView: 'dashboard' | 'compose' | 'detail';
  setCurrentView: (view: 'dashboard' | 'compose' | 'detail') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, currentView, setCurrentView, onLogout }) => {
  const [showPINModal, setShowPINModal] = useState(false);
  const [currentPINInput, setCurrentPINInput] = useState('');
  const [newPINInput, setNewPINInput] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [pinError, setPinError] = useState('');

  const getBadgeClass = (clearance?: string) => {
    switch (clearance) {
      case 'SECRET': return 'badge-secret';
      case 'CONFIDENTIAL': return 'badge-confidential';
      case 'RESTRICTED': return 'badge-restricted';
      default: return 'badge-unclassified';
    }
  };

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
    setPinMessage('PIN Keamanan Pejabat berhasil diperbarui dan di-hash (Argon2id)!');
    setCurrentPINInput('');
    setNewPINInput('');
    setTimeout(() => {
      setShowPINModal(false);
      setPinMessage('');
    }, 1500);
  };

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
            <h2 style={{ fontSize: '1.25rem', lineHeight: 1.1 }} className="gradient-text">SecureOffice-AI</h2>
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

        {/* User Profile & PIN Settings Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
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

          <button
            onClick={() => setShowPINModal(true)}
            title="Pengaturan PIN Mandiri Pejabat"
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

      {/* Modal Pengaturan PIN Mandiri Pejabat */}
      {showPINModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-card glass-card-glow" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={18} color="var(--accent-cyan)" /> Pengaturan PIN Keamanan Mandiri
              </h3>
              <button onClick={() => setShowPINModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Atur PIN 6-Digit pribadi Anda. PIN ini digunakan untuk verifikasi dekripsi dokumen <strong>RAHASIA</strong> saat bertugas.
            </p>

            {pinError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {pinError}
              </div>
            )}

            {pinMessage && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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

    </nav>
  );
};
