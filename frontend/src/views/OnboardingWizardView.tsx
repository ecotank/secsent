import React, { useState } from 'react';
import { UserProfile } from '../services/api';
import { getUserMFASecret, setStoredUserPIN, validateSecurityPIN } from '../utils/webcrypto';
import { ShieldAlert, Key, CheckCircle2, QrCode } from 'lucide-react';

interface OnboardingWizardViewProps {
  user: UserProfile;
  onComplete: () => void;
}

export const OnboardingWizardView: React.FC<OnboardingWizardViewProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const secret = getUserMFASecret(user.username);
  const otpauthURI = `otpauth://totp/SecureOffice-AI:${user.username}?secret=${secret}&issuer=SecureOffice-AI`;

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Kata Sandi Baru harus memiliki panjang minimal 8 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi Kata Sandi tidak cocok.');
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      setError('PIN Keamanan harus berupa 6 angka (0-9).');
      return;
    }
    if (pin !== confirmPin) {
      setError('Konfirmasi PIN tidak cocok.');
      return;
    }
    // Store PIN locally for encrypting local keys
    setStoredUserPIN(user.username, pin);
    setStep(3);
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const isValid = await validateSecurityPIN(otpInput, user.username);
    if (isValid) {
      setSuccess('MFA Berhasil diaktifkan! Menyiapkan dashboard...');
      setTimeout(() => {
        onComplete();
      }, 1500);
    } else {
      setError('Kode OTP Authenticator tidak valid atau telah kadaluarsa. Pastikan kunci telah terdaftar di OTPKEY.');
    }
  };

  return (
    <div style={{
      display: 'grid', placeItems: 'center', minHeight: '100vh',
      backgroundColor: '#07100f', color: '#e8eee8', padding: '2rem'
    }}>
      <div className="glass-card" style={{ maxWidth: '540px', width: '100%', padding: '2.5rem' }}>
        
        {/* Wizard Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-grid', placeItems: 'center', width: '56px', height: '56px',
            borderRadius: '12px', backgroundColor: '#d8ff43', color: '#091513', marginBottom: '1rem'
          }}>
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Aktivasi Keamanan Akun Baru</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Sesuai protokol Zero-Trust, Anda wajib menyetel perlindungan sebelum mengakses dashboard.
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              flex: 1, height: '4px', borderRadius: '2px',
              backgroundColor: s <= step ? 'var(--accent-cyan)' : 'var(--border-glass)'
            }} />
          ))}
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid #ff6b6b',
            borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem',
            color: '#ff8585', fontSize: '0.8rem', marginBottom: '1.5rem'
          }}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: 'rgba(46,204,113,0.1)', border: '1px solid #2ecc71',
            borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem',
            color: '#58d68d', fontSize: '0.8rem', marginBottom: '1.5rem'
          }}>
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Step 1: Change Password */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>Langkah 1: Ganti Kata Sandi</h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Kata Sandi Baru
              </label>
              <input
                type="password"
                className="input-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter..."
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Konfirmasi Kata Sandi
              </label>
              <input
                type="password"
                className="input-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru..."
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
              Simpan & Lanjutkan
            </button>
          </form>
        )}

        {/* Step 2: Set Security PIN */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>Langkah 2: Setel PIN Keamanan</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              PIN 6-digit digunakan secara lokal di memori untuk mengamankan dan membuka kunci pasangan kunci asimetris X25519 Anda.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                PIN Keamanan (6-Digit)
              </label>
              <input
                type="password"
                maxLength={6}
                className="input-control"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Ketik 6 angka..."
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Konfirmasi PIN Keamanan
              </label>
              <input
                type="password"
                maxLength={6}
                className="input-control"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Ketik ulang 6 angka..."
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
              Simpan & Lanjutkan
            </button>
          </form>
        )}

        {/* Step 3: Activate MFA */}
        {step === 3 && (
          <form onSubmit={handleStep3Submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>Langkah 3: Registrasi OTPKEY Authenticator</h3>
            
            <div style={{
              backgroundColor: '#091513', border: '1px solid var(--border-glass)',
              borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem'
            }}>
              {/* Visual QR Code Image */}
              <div style={{ padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '6px', display: 'inline-block' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(otpauthURI)}`}
                  alt="MFA QR Code"
                  style={{ display: 'block', width: '150px', height: '150px' }}
                />
              </div>

              <div style={{ width: '100%', textAlign: 'left' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Kunci Rahasia Base32 (Untuk Input Manual di Windows OTPKEY):
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <QrCode size={18} style={{ color: 'var(--accent-cyan)' }} />
                  <code style={{ fontSize: '0.85rem', color: '#d8ff43', letterSpacing: '0.05em' }}>
                    <strong>{secret}</strong>
                  </code>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Silakan salin Kunci Rahasia Base32 di atas ke aplikasi **OTPKEY Authenticator** Anda di Windows untuk mendapatkan kode 6-digit.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Masukkan Kode Verifikasi OTPKEY
              </label>
              <input
                type="text"
                maxLength={6}
                className="input-control"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="6-digit angka dari OTPKEY..."
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
              Selesaikan Aktivasi
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
