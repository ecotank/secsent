import React from 'react';
import { UserProfile } from '../services/api';
import { ShieldCheck, FileText, PlusCircle, LogOut, User, Lock } from 'lucide-react';

interface NavbarProps {
  user: UserProfile;
  currentView: 'dashboard' | 'compose' | 'detail';
  setCurrentView: (view: 'dashboard' | 'compose' | 'detail') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, currentView, setCurrentView, onLogout }) => {
  const getBadgeClass = (clearance?: string) => {
    switch (clearance) {
      case 'SECRET': return 'badge-secret';
      case 'CONFIDENTIAL': return 'badge-confidential';
      case 'RESTRICTED': return 'badge-restricted';
      default: return 'badge-unclassified';
    }
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

        {/* User Profile & Clearance Pill */}
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
    </nav>
  );
};
