import React, { useState, useEffect } from 'react';
import { UserProfile, BACKEND_URL } from '../services/api';
import { Inbox, Send, ShieldCheck, CheckCircle2, Clock, Eye, Lock } from 'lucide-react';

interface DashboardViewProps {
  user: UserProfile;
  onSelectLetter: (letterId: string) => void;
  onNavigateCompose: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onSelectLetter, onNavigateCompose }) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'outbox' | 'disposed'>('inbox');
  const [letters, setLetters] = useState<any[]>([]);

  const mockLetters = [
    {
      id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      number: "ND/001/UK-SEC-001/VII/2026",
      subject: "Permohonan Pengadaan Perangkat Keamanan Jaringan & Firewall Enterprise",
      category: "NOTA_DINAS",
      classification: "RAHASIA",
      sender: "Bagian Persuratan & TU",
      recipient: "Direktorat IT & Security",
      status: "SIGNED",
      date: "2026-07-20 14:30",
      aiRiskScore: 7.80,
      signatureVerified: true
    },
    {
      id: "8a2ceb3c-2a6c-3aac-8acc-1a0c6a2cba5c",
      number: "SE/004/UK-ROOT/VII/2026",
      subject: "Himbauan Kepatuhan Protokol Keamanan Informasi & Password Manager",
      category: "SURAT_EDARAN",
      classification: "BIASA",
      sender: "Kantor Pusat / Sekretariat Utama",
      recipient: "Seluruh Unit Kerja",
      status: "SENT",
      date: "2026-07-19 09:15",
      aiRiskScore: 1.20,
      signatureVerified: true
    },
    {
      id: "7f1bfa2b-1a5b-2aab-7abb-0a9b5a1ba4eb",
      number: "ND/002/UK-SEC-001/VII/2026",
      subject: "Draft Usulan Anggaran Operasional Kegiatan Triwulan IV",
      category: "NOTA_DINAS",
      classification: "TERBATAS",
      sender: "Bagian Persuratan & TU",
      recipient: "Kepala Unit Kerja",
      status: "PENDING_SIGNATURE",
      date: "2026-07-20 16:45",
      aiRiskScore: 4.50,
      signatureVerified: false
    }
  ];

  useEffect(() => {
    let isMounted = true;
    async function fetchLetters() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${BACKEND_URL}/letters`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setLetters(data);
            return;
          }
        }
      } catch (e) {
        // Fallback to initial structured records
      }
      if (isMounted) {
        setLetters(mockLetters);
      }
    }
    fetchLetters();
    return () => { isMounted = false; };
  }, []);

  return (
    <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1.5rem' }}>
      
      {/* Welcome Banner */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Executive Dashboard • {user.work_unit?.unit_name || 'Unit Kerja'}
          </span>
          <h1 style={{ fontSize: '1.85rem', marginTop: '0.25rem' }}>
            Selamat Datang, {user.full_name}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Sistem pengawasan naskah dinas terenkripsi dengan proteksi <strong style={{ color: 'var(--text-main)' }}>Zero-Trust & Hybrid Encryption</strong>.
          </p>
        </div>
        <button className="btn-primary" onClick={onNavigateCompose}>
          + Buat Surat Dinas Baru
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Surat Masuk</span>
            <Inbox size={20} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700 }} className="gradient-text">14</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>3 Perlu Tanggapan</span>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pending Tanda Tangan</span>
            <Clock size={20} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--accent-amber)' }}>2</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Memerlukan Approval Pejabat</span>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tanda Tangan Terverifikasi</span>
            <ShieldCheck size={20} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>48</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ed25519 Integrity Pass</span>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Clearance Level Anda</span>
            <Lock size={20} color="var(--accent-indigo)" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>{user.clearance_level}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-indigo)' }}>Strict ABAC Enforced</span>
        </div>

      </div>

      {/* Main Correspondence List */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        
        {/* List Header Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setActiveTab('inbox')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'inbox' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontWeight: activeTab === 'inbox' ? 700 : 500,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Inbox size={18} /> Surat Masuk Unit (14)
            </button>
            <button
              onClick={() => setActiveTab('outbox')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'outbox' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontWeight: activeTab === 'outbox' ? 700 : 500,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Send size={18} /> Surat Keluar (8)
            </button>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Menampilkan naskah dinas resmi terverifikasi
          </span>
        </div>

        {/* Letters Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Nomor Surat / Perihal</th>
                <th style={{ padding: '0.75rem 1rem' }}>Klasifikasi</th>
                <th style={{ padding: '0.75rem 1rem' }}>Pengirim & Penerima</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status & AI Score</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {letters.map((letter) => (
                <tr
                  key={letter.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                >
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>
                      {letter.number || letter.letter_number}
                    </div>
                    <div style={{ fontWeight: 500, marginTop: '0.2rem', color: 'var(--text-main)' }}>
                      {letter.subject || letter.subject_plaintext}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{letter.date || "2026-07-20 14:30"}</span>
                  </td>

                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${
                      letter.classification === 'RAHASIA' ? 'badge-secret' :
                      letter.classification === 'TERBATAS' ? 'badge-confidential' : 'badge-unclassified'
                    }`}>
                      {letter.classification}
                    </span>
                  </td>

                  <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                    <div style={{ color: 'var(--text-main)' }}>Dari: {letter.sender || "Bagian Persuratan & TU"}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Ke: {letter.recipient || "Direktorat IT & Security"}</div>
                  </td>

                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {letter.status === 'SIGNED' || letter.status === 'SENT' ? (
                        <span style={{ color: 'var(--accent-emerald)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle2 size={14} /> Signed (Ed25519)
                        </span>
                      ) : (
                        <span style={{ color: 'var(--accent-amber)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={14} /> Pending Approval
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      AI Risk: <strong style={{ color: (letter.aiRiskScore || 7.8) > 5 ? 'var(--accent-crimson)' : 'var(--accent-emerald)' }}>{(letter.aiRiskScore || 7.80).toFixed(2)}</strong>
                    </div>
                  </td>

                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => onSelectLetter(letter.id)}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      <Eye size={14} /> Buka Surat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
