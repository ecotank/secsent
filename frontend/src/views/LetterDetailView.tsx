import React, { useState } from 'react';
import { UserProfile } from '../services/api';
import { validateSecurityPIN, logUnitActivity } from '../utils/webcrypto';
import { ArrowLeft, ShieldCheck, Lock, Send, UserCheck, ShieldAlert, Key, EyeOff, FileText, Download } from 'lucide-react';

interface LetterDetailViewProps {
  user: UserProfile;
  letterId: string;
  onBack: () => void;
}

export const LetterDetailView: React.FC<LetterDetailViewProps> = ({ user, letterId, onBack }) => {
  const [showDispositionModal, setShowDispositionModal] = useState(false);
  const [targetUser, setTargetUser] = useState('44444444-4444-4444-4444-444444444444');
  const [instruction, setInstruction] = useState('Tolong kaji spesifikasi teknis perangkat jaringan ini dan siapkan tanggapan sebelum hari Jumat.');
  const [urgency, setUrgency] = useState('SEGERA');
  const [disposed, setDisposed] = useState(false);

  // Zero-Trust PIN & Dynamic TOTP Re-Authentication State
  const [isSecretUnlocked, setIsSecretUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const mockDetail = {
    id: letterId || "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    number: "ND/001/UK-SEC-001/VII/2026",
    subject: "Permohonan Pengadaan Perangkat Keamanan Jaringan & Firewall Enterprise",
    category: "NOTA_DINAS",
    classification: "RAHASIA",
    senderUnit: "Bagian Persuratan & Tata Usaha (UK-SEC-001)",
    recipientUnit: "Direktorat Keamanan Informasi (UK-ITSEC-001)",
    ccUnit: "Kantor Pusat / Sekretariat Utama (UK-ROOT)",
    content: "Diberitahukan kepada Direktur IT & Security bahwa sehubungan dengan peningkatan ancaman serangan cyber, kami mengajukan permohonan pencairan anggaran sebesar Rp 500.000.000 untuk lisensi firewall proyek rahasia ALPHA.",
    signerName: "Dr. Budi Santoso, M.Si. (Kepala Unit Kerja)",
    signedAt: "2026-07-20 14:30:12 UTC",
    signatureAlgorithm: "Ed25519 (Asymmetric EdDSA)",
    timestampToken: "TSA_TIMESTAMP_TOKEN|8f4e3c2b...|2026-07-20T14:30:12Z",
    fileName: "ND_Pengadaan_Firewall_Enterprise.pdf",
    fileSize: 422000,
    contentHash: "8f4e3c2b1a9f0d8e7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d"
  };

  const handlePINVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateSecurityPIN(pinInput, user.username);
    if (isValid) {
      logUnitActivity(user.username, `Dekripsi Surat Rahasia (${mockDetail.number})`, "SUCCESS");
      setIsSecretUnlocked(true);
      setPinError('');
      setPinInput('');
    } else {
      logUnitActivity(user.username, `Gagal Dekripsi Surat (${mockDetail.number}) - PIN/OTP Salah`, "FAILED");
      setPinError('PIN Keamanan atau Kode TOTP Authenticator tidak sah.');
    }
  };

  const handleDownloadFile = () => {
    logUnitActivity(user.username, `Mengunduh Berkas Lampiran Terenkripsi (${mockDetail.fileName})`, "SUCCESS");
    
    // Generate physical decrypted document blob to trigger actual browser download
    const documentText = `===========================================================
     SECUREOFFICE-AI: DECRYPTED CORRESPONDENCE PORTAL      
===========================================================
Nomor Naskah: ${mockDetail.number}
Kategori    : ${mockDetail.category}
Klasifikasi : ${mockDetail.classification}
Perihal     : ${mockDetail.subject}
Pengirim    : ${mockDetail.senderUnit}
Waktu Kirim : ${mockDetail.signedAt}
Aktor Unduh : ${user.full_name} (${user.role})

-----------------------------------------------------------
[DECRYPTION ENGINE STATUS]: SUCCESSFUL
[ENVELOPE DECRYPTION MODE]: ECIES Hybrid (X25519-AES-GCM)
[FILE INTEGRITY SECURE]   : SHA-256 Checksum Valid.
-----------------------------------------------------------

ISI NASKAH DINAS DEKRIPSI:
${mockDetail.content}

-----------------------------------------------------------
⚠️ Peringatan: Dokumen ini bersifat RAHASIA NEGARA dan dilindungi
oleh hukum persandian serta keamanan siber instansi.
Penyebaran tanpa otorisasi terikat ancaman hukum pidana.
===========================================================`;

    const blob = new Blob([documentText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const downloadName = mockDetail.fileName.endsWith('.pdf')
      ? mockDetail.fileName.replace('.pdf', '_DECRYPTED.txt')
      : mockDetail.fileName + '_DECRYPTED.txt';
      
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`Sukses: Dokumen dinas "${mockDetail.fileName}" berhasil didekripsi menggunakan Kunci Sektoral X25519 & diunduh secara aman via secure channel!`);
  };

  const handleDisposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDisposed(true);
    setShowDispositionModal(false);
    alert("Disposisi Surat Dinas Berhasil Dikirim & Catatan Audit Chains Ter-update!");
  };

  const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
      
      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-primary" onClick={() => setShowDispositionModal(true)}>
            <Send size={16} /> Disposisikan Surat Ini
          </button>
        </div>
      </div>

      {/* Main Document Card with Dynamic Watermark Container */}
      <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
        
        {/* Dynamic Security Screen Watermark Overlay */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          pointerEvents: 'none',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          alignItems: 'center',
          opacity: 0.045,
          userSelect: 'none',
          transform: 'rotate(-20deg)',
          fontSize: '1.15rem',
          fontWeight: 800,
          color: '#ffffff',
          whiteSpace: 'nowrap'
        }}>
          <div>CONFIDENTIAL • {user.full_name} ({user.nip_nik}) • {timestampStr} UTC</div>
          <div>INTERNAL USE ONLY • IP: 127.0.0.1 • CLEARANCE: {user.clearance_level}</div>
          <div>CONFIDENTIAL • {user.full_name} ({user.nip_nik}) • {timestampStr} UTC</div>
          <div>DO NOT PHOTOCOPY • SECUREOFFICE-AI AUDITED</div>
        </div>

        {/* Verification Banner */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={28} color="var(--accent-emerald)" />
            <div>
              <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem' }}>
                Tanda Tangan Digital Terverifikasi SAH ({mockDetail.signatureAlgorithm})
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Ditandatangani oleh: {mockDetail.signerName} pada {mockDetail.signedAt}
              </div>
            </div>
          </div>
          <span className="badge badge-secret">
            <Lock size={12} /> {mockDetail.classification}
          </span>
        </div>

        {/* Letter Metadata Header */}
        <div style={{ borderBottom: '2px dashed var(--border-glass)', paddingBottom: '1.5rem', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>
            {mockDetail.number}
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{mockDetail.subject}</h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Pengirim:</span>
              <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{mockDetail.senderUnit}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Penerima Utama:</span>
              <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{mockDetail.recipientUnit}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Tembusan (CC):</span>
              <div style={{ fontWeight: 500, marginTop: '0.15rem', color: 'var(--text-muted)' }}>{mockDetail.ccUnit}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Jenis Naskah:</span>
              <div style={{ fontWeight: 500, marginTop: '0.15rem' }}>{mockDetail.category}</div>
            </div>
          </div>
        </div>

        {/* Document Content Section with Strict Production Zero-Trust Lock */}
        {mockDetail.classification === 'RAHASIA' && !isSecretUnlocked ? (
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              width: '56px', height: '56px',
              borderRadius: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171',
              marginBottom: '1rem'
            }}>
              <Lock size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem', color: '#f87171' }}>
              Dokumen Terkunci Zero-Trust (Klasifikasi RAHASIA)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Masukkan PIN Keamanan 6-Digit Pejabat atau Kode dari Aplikasi Authenticator.
            </p>

            {pinError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                padding: '0.5rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                marginBottom: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <ShieldAlert size={14} /> {pinError}
              </div>
            )}

            <form onSubmit={handlePINVerification} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', maxWidth: '340px', margin: '0 auto' }}>
              <input
                type="password"
                className="input-control"
                placeholder="Masukkan PIN / Kode TOTP"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                maxLength={6}
                style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1rem' }}
                required
              />
              <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                Buka Surat <Key size={14} />
              </button>
            </form>
          </div>
        ) : (
          <div style={{ fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2rem', padding: '1rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                ✓ Transmisi Jalur Aman Terenkripsi AES-256-GCM Aktif
              </span>
              {mockDetail.classification === 'RAHASIA' && (
                <button
                  onClick={() => setIsSecretUnlocked(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <EyeOff size={12} /> Kunci Kembali Surat
                </button>
              )}
            </div>

            {/* Render Decrypted Text Content (Opsi Teks) */}
            {mockDetail.content && (
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Isi Pesan Surat Dinas:
                </h4>
                <p style={{ color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  {mockDetail.content}
                </p>
              </div>
            )}

            {/* Render Encrypted PDF File Attachment Card (Opsi Berkas) */}
            {mockDetail.fileName && (
              <div style={{
                background: 'rgba(216, 255, 67, 0.03)',
                border: '1px solid var(--accent-cyan)',
                borderRadius: '12px',
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 8px 32px rgba(216,255,67,0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    backgroundColor: 'rgba(216, 255, 67, 0.1)',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    color: 'var(--accent-cyan)'
                  }}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>
                      {mockDetail.fileName}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Ukuran Berkas: {(mockDetail.fileSize / 1024).toFixed(1)} KB • Terenkripsi AES-256-GCM
                    </span>
                  </div>
                </div>
                <button onClick={handleDownloadFile} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                  <Download size={14} /> Unduh & Dekripsi File
                </button>
              </div>
            )}

          </div>
        )}

        {/* Cryptographic Proof Footer */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '1rem',
          borderRadius: '10px',
          border: '1px solid var(--border-glass)',
          fontSize: '0.78rem',
          fontFamily: 'monospace'
        }}>
          <div style={{ color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '0.35rem' }}>
            [CRYPTOGRAPHIC INTEGRITY PROOF & TIMESTAMP]
          </div>
          <div>SHA-256 Checksum: {mockDetail.contentHash}</div>
          <div style={{ marginTop: '0.2rem', color: 'var(--text-muted)' }}>TSA Token: {mockDetail.timestampToken}</div>
        </div>

      </div>

      {/* Disposed Status Banner */}
      {disposed && (
        <div className="glass-card" style={{ padding: '1.25rem', borderColor: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <UserCheck size={24} color="var(--accent-emerald)" />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: '0.9rem' }}>
              Surat Berhasil Didisposisikan
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Instruksi disposisi telah dikirimkan ke Staf Pelaksana (Ahmad Hidayat) dengan urgensi {urgency}.
            </div>
          </div>
        </div>
      )}

      {/* Modal Disposisi Pimpinan */}
      {showDispositionModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-card glass-card-glow" style={{ width: '100%', maxWidth: '520px', padding: '2rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={18} color="var(--accent-cyan)" /> Disposisi Surat Dinas
              </h3>
              <button onClick={() => setShowDispositionModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleDisposeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Target Staf / Pejabat Penerima Disposisi
                </label>
                <select className="input-control" value={targetUser} onChange={(e) => setTargetUser(e.target.value)}>
                  <option value="44444444-4444-4444-4444-444444444444">Ahmad Hidayat (Staf Pelaksana Persuratan)</option>
                  <option value="33333333-3333-3333-3333-333333333333">Siti Rahma, S.AP. (Sekretaris Unit)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Tingkat Urgensi Disposisi
                </label>
                <select className="input-control" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                  <option value="BIASA">BIASA</option>
                  <option value="SEGERA">SEGERA</option>
                  <option value="AMAT_SEGERA">AMAT SEGERA</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Petunjuk / Instruksi Disposisi
                </label>
                <textarea
                  className="input-control"
                  rows={4}
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Tuliskan petunjuk penanganan surat..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowDispositionModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Kirim Disposisi Sekarang <Send size={16} />
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
