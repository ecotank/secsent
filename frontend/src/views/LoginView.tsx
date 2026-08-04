import React, { useState } from 'react';
import { loginUser, UserProfile } from '../services/api';
import { validateSecurityPIN, logUnitActivity } from '../utils/webcrypto';
import { ShieldCheck, Lock, ArrowRight, ShieldAlert, ArrowLeft, RefreshCw, Key } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (token: string, user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Quick Access PIN login state
  const [lastUser, setLastUser] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem("secsent_last_logged_in_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [pinInput, setPinInput] = useState('');

  const handleFullLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!mfaCode || mfaCode.trim().length !== 6) {
      setError('Kode Verifikasi MFA/TOTP (6-Digit) wajib diisi.');
      setLoading(false);
      return;
    }

    try {
      const res = await loginUser(username, password, mfaCode);
      // Remember user for future Quick PIN Login
      localStorage.setItem("secsent_last_logged_in_user", JSON.stringify(res.user));
      onLoginSuccess(res.token, res.user);
    } catch (err: any) {
      setError(err.message || 'Autentikasi gagal. Periksa kembali username, password, dan Kode MFA/TOTP 6-digit.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPINLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (pinInput.trim().length !== 6) {
      setError('PIN Keamanan / TOTP wajib berupa 6 digit angka.');
      setLoading(false);
      return;
    }

    try {
      if (!lastUser) throw new Error("Sesi tidak valid.");
      
      // Verify against stored user PIN or TOTP 2FA secret
      const isValid = await validateSecurityPIN(pinInput, lastUser.username);
      if (!isValid) {
        logUnitActivity(lastUser.username, "Gagal Login Quick PIN (PIN/MFA Salah)", "FAILED");
        throw new Error("PIN Keamanan atau Kode TOTP 2FA yang Anda masukkan salah.");
      }

      logUnitActivity(lastUser.username, "Login Quick PIN Berhasil", "SUCCESS");
      const fakeToken = "jwt_access_token_" + Date.now();
      
      // Set session variables and navigate
      sessionStorage.setItem("secsent_session_token", fakeToken);
      sessionStorage.setItem("secsent_session_user", JSON.stringify(lastUser));
      
      onLoginSuccess(fakeToken, lastUser);
    } catch (err: any) {
      setError(err.message || "Autentikasi PIN gagal.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    localStorage.removeItem("secsent_last_logged_in_user");
    setLastUser(null);
    setError('');
  };

  const initials = lastUser?.full_name ? lastUser.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PJ';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: '#07100f'
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
          <h1 style={{ fontSize: '1.75rem', color: '#fff' }} className="gradient-text">SecSent</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Zero-Trust Enterprise Correspondence Platform
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

        {/* 1. QUICK PIN LOGIN VIEW */}
        {lastUser ? (
          <form onSubmit={handleQuickPINLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
            
            {/* User Avatar Circle */}
            <div style={{
              display: 'grid',
              placeItems: 'center',
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              backgroundColor: '#1b2f2b',
              border: '2.5px solid var(--accent-cyan)',
              color: '#00f2fe',
              fontSize: '1.75rem',
              fontWeight: 800,
              boxShadow: '0 0 20px rgba(0, 242, 254, 0.15)',
              marginBottom: '0.5rem'
            }}>
              {initials}
            </div>

            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>{lastUser.full_name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                {lastUser.role} · {lastUser.work_unit?.unit_name || 'Bagian Persuratan'}
              </div>
            </div>

            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textAlign: 'center', fontWeight: 500 }}>
                Masukkan PIN Keamanan / Kode 2FA (6-Digit)
              </label>
              <input
                type="password"
                className="input-control"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••••"
                maxLength={6}
                style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,242,254,0.2)' }}
                required
                autoFocus
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
              <Key size={16} /> {loading ? 'Membuka Sesi Enkripsi...' : 'Masuk dengan PIN / 2FA'}
            </button>

            <button
              type="button"
              onClick={handleSwitchAccount}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                marginTop: '0.5rem'
              }}
            >
              Masuk dengan Akun Lain
            </button>

          </form>
        ) : (
          /* 2. FULL USERNAME & PASSWORD LOGIN VIEW */
          <form onSubmit={handleFullLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 500 }}>
                Username Pejabat / Staf Kedinasan
              </label>
              <input
                type="text"
                className="input-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username instansi..."
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 500 }}>
                Kata Sandi
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
                PIN Keamanan / Kode 2FA (6-Digit)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="input-control"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="Masukkan 6-Digit PIN/2FA"
                  maxLength={6}
                  style={{ letterSpacing: '4px', textAlign: 'center', fontWeight: 700 }}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', whiteSpace: 'nowrap' }}>
                  <Lock size={12} /> Enforced
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
        )}

      </div>
    </div>
  );
};
