import React, { useState } from 'react';
import { loginUser, UserProfile } from '../services/api';
import { ShieldCheck, Lock, Key, ArrowRight, ShieldAlert } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (token: string, user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('ka.unit.sec');
  const [password, setPassword] = useState('PasswordHead2026!');
  const [mfaCode, setMfaCode] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await loginUser(username, password);
      onLoginSuccess(res.token, res.user);
    } catch (err: any) {
      setError('Autentikasi gagal. Periksa kembali username atau frasa sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="glass-card glass-card-glow" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem',
        position: 'relative'
      }}>
        
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0b0f19',
            marginBottom: '1rem',
            boxShadow: '0 0 30px rgba(0, 242, 254, 0.3)'
          }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem' }} className="gradient-text">SecureOffice-AI</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Aplikasi Persuratan Dinas Digital Berkeamanan Zero-Trust & AI
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '0.75rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ShieldAlert size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 500 }}>
              Username Pejabat / Staf
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="misal: ka.unit.sec"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 500 }}>
              Kata Sandi (Argon2id Hash Protected)
            </label>
            <input
              type="password"
              className="input-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 500 }}>
              Kode Verifikasi MFA / TOTP (Hardware/App)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                className="input-control"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                style={{ letterSpacing: '4px', textAlign: 'center', fontWeight: 700 }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', whiteSpace: 'nowrap' }}>
                <Lock size={12} inline /> Verified
              </span>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Memverifikasi Datastore...' : (
              <>
                Masuk ke Sistem Persuratan <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Credentials Preset Helper */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-glass)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.5rem', textAlign: 'center' }}>
            Demo Quick Login Presets:
          </p>
          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setUsername('ka.unit.sec'); setPassword('PasswordHead2026!'); }}
              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--accent-cyan)', cursor: 'pointer' }}
            >
              Kepala Unit
            </button>
            <button
              onClick={() => { setUsername('sekretaris.sec'); setPassword('PasswordSec2026!'); }}
              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--accent-amber)', cursor: 'pointer' }}
            >
              Sekretaris
            </button>
            <button
              onClick={() => { setUsername('admin.sys'); setPassword('PasswordAdmin2026!'); }}
              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#f87171', cursor: 'pointer' }}
            >
              Admin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
