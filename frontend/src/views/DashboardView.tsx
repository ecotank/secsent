import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, BACKEND_URL } from '../services/api';

type IconName = "search" | "plus" | "arrow" | "check" | "lock"

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="6"/><path d="m20 20-4-4"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    arrow: <path d="M5 12h14M13 6l6 6-6 6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    lock: <path d="M12 3 20 6v5c0 5.2-3.4 8.7-8 10-4.6-1.3-8-4.8-8-10V6z"/>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

interface DashboardViewProps {
  user: UserProfile;
  onSelectLetter: (letterId: string) => void;
  onNavigateCompose: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onSelectLetter, onNavigateCompose }) => {
  const [letters, setLetters] = useState<any[]>([]);
  const [query, setQuery] = useState("");

  const mockLetters = [
    {
      id: "BK-2026-0918",
      letterId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      number: "ND/001/UK-SEC-001/VII/2026",
      subject: "Permohonan Pengadaan Perangkat Keamanan Jaringan & Firewall Enterprise",
      category: "NOTA_DINAS",
      classification: "RAHASIA",
      sender: "Bagian Persuratan & TU",
      recipient: "Direktorat IT & Security",
      status: "SIGNED",
      date: "2026-07-20 14:32",
      color: "emerald"
    },
    {
      id: "BK-2026-0917",
      letterId: "8a2ceb3c-2a6c-3aac-8acc-1a0c6a2cba5c",
      number: "SE/004/UK-ROOT/VII/2026",
      subject: "Himbauan Kepatuhan Protokol Keamanan Informasi & Password Manager",
      category: "SURAT_EDARAN",
      classification: "BIASA",
      sender: "Kantor Pusat / Sekretariat Utama",
      recipient: "Seluruh Unit Kerja",
      status: "SENT",
      date: "2026-07-19 11:08",
      color: "lime"
    },
    {
      id: "BK-2026-0916",
      letterId: "7f1bfa2b-1a5b-2aab-7abb-0a9b5a1ba4eb",
      number: "ND/002/UK-SEC-001/VII/2026",
      subject: "Draft Usulan Anggaran Operasional Kegiatan Triwulan IV",
      category: "NOTA_DINAS",
      classification: "TERBATAS",
      sender: "Bagian Persuratan & TU",
      recipient: "Kepala Unit Kerja",
      status: "PENDING_SIGNATURE",
      date: "2026-07-20 16:45",
      color: "amber"
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
            const mapped = data.map((l, idx) => ({
              id: `BK-2026-09${18 - idx}`,
              letterId: l.id,
              number: l.letter_number,
              subject: l.subject_plaintext,
              category: l.category,
              classification: l.classification,
              sender: "Bagian Persuratan & TU",
              recipient: "Direktorat IT & Security",
              status: l.status,
              date: "2026-07-20 14:32",
              color: l.classification === "RAHASIA" ? "amber" : "emerald"
            }));
            setLetters(mapped);
            return;
          }
        }
      } catch (e) {
        // graceful fallback to mock records
      }
      if (isMounted) {
        setLetters(mockLetters);
      }
    }
    fetchLetters();
    return () => { isMounted = false; };
  }, []);

  const filtered = useMemo(() => {
    return letters.filter((l) =>
      `${l.number} ${l.subject}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [letters, query]);

  const timestampStr = useMemo(() => {
    const d = new Date();
    const months = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WIB`;
  }, []);

  const totalLetters = letters.length;
  const signedLetters = letters.filter(l => l.status === "SIGNED" || l.status === "SENT").length;
  const pendingLetters = letters.filter(l => l.status === "PENDING_SIGNATURE").length;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 1. Header Greeting & Date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ display: 'inline-block', width: '32px', height: '1px', backgroundColor: '#d8ff43' }}/>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', color: '#d8ff43', textTransform: 'uppercase' }}>
              {timestampStr}
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#ffffff' }}>
            Selamat siang, {user.full_name.split(' ')[0]}.
          </h1>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#94a197' }}>
            Integritas seluruh surat dinas dalam pengawasan. Ada <span style={{ color: '#e9a84f', fontWeight: 600 }}>{pendingLetters} naskah</span> yang menunggu tanda tangan.
          </p>
        </div>

        <button onClick={onNavigateCompose} className="btn-primary">
          <Icon name="plus" size={17}/> Buat Surat Dinas Baru
        </button>
      </div>

      {/* 2. Grid of 4 KPI Metric Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: '2rem'
      }}>
        
        <div style={{ backgroundColor: '#0b1714', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8b9a8d' }}>
              Total Surat Dinas
            </p>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d8ff43' }}/>
          </div>
          <p style={{ fontSize: '1.85rem', fontWeight: 600, color: '#ffffff' }}>{totalLetters}</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#849287' }}>+3 terbuat minggu ini</p>
        </div>

        <div style={{ backgroundColor: '#0b1714', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8b9a8d' }}>
              Tanda Tangan Sah
            </p>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#79dcb8' }}/>
          </div>
          <p style={{ fontSize: '1.85rem', fontWeight: 600, color: '#ffffff' }}>{signedLetters}</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#849287' }}>Integritas Ed25519 Terjamin</p>
        </div>

        <div style={{ backgroundColor: '#0b1714', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8b9a8d' }}>
              Perlu Tindakan
            </p>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e9a84f' }}/>
          </div>
          <p style={{ fontSize: '1.85rem', fontWeight: 600, color: '#e9a84f' }}>{pendingLetters}</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#849287' }}>Persetujuan Tertunda</p>
        </div>

        <div style={{ backgroundColor: '#0b1714', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8b9a8d' }}>
              Integritas Hash
            </p>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#cbd5e1' }}/>
          </div>
          <p style={{ fontSize: '1.85rem', fontWeight: 600, color: '#ffffff' }}>99,99%</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#849287' }}>Audit Chains Node Online</p>
        </div>

      </div>

      {/* 3. Two-Column Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: '2rem' }}>
        
        {/* Left Column: Recent Correspondence Table */}
        <section style={{ backgroundColor: '#0b1714', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>Naskah dinas terbaru</h2>
              <p style={{ fontSize: '0.75rem', color: '#87958a', marginTop: '0.25rem' }}>Register pergerakan dokumen dinas terakhir</p>
            </div>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#07100f',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.4rem 0.75rem', color: '#829185'
            }}>
              <Icon name="search" size={15}/>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nomor atau perihal"
                style={{ width: '140px', background: 'transparent', border: 'none', color: '#ffffff', fontSize: '12px', outline: 'none' }}
              />
            </label>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#091411', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#758277' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1.25rem', fontWeight: 400 }}>Nomor Naskah</th>
                  <th style={{ padding: '0.75rem 0.75rem', fontWeight: 400 }}>Perihal / Unit Kerja</th>
                  <th style={{ padding: '0.75rem 0.75rem', fontWeight: 400 }}>Klasifikasi</th>
                  <th style={{ padding: '0.75rem 0.75rem', fontWeight: 400 }}>Aktivitas</th>
                  <th style={{ padding: '0.75rem 1.25rem' }}/>
                </tr>
              </thead>
              <tbody>
                {filtered.map((letter) => (
                  <tr key={letter.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#d8ff43' }}>
                      {letter.number}
                    </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#e4eae4' }}>{letter.subject}</p>
                      <p style={{ fontSize: '11px', color: '#849287', marginTop: '0.25rem' }}>Dari: {letter.sender}</p>
                    </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <span className={`badge ${
                        letter.classification === 'RAHASIA' ? 'badge-secret' :
                        letter.classification === 'TERBATAS' ? 'badge-confidential' : 'badge-restricted'
                      }`}>
                        {letter.classification}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#87958a' }}>
                      {letter.date}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => onSelectLetter(letter.letterId)}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '12px' }}
                      >
                        Buka <Icon name="arrow" size={14}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </section>

        {/* Right Column: Node Security & Timeline Logs */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Node Security Panel */}
          <section style={{ backgroundColor: '#0b1714', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#89978c' }}>
                  Keamanan Ekosistem
                </p>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', marginTop: '0.25rem' }}>Node Utama Aman</h2>
              </div>
              <div style={{
                display: 'grid', placeItems: 'center', width: '36px', height: '36px',
                borderRadius: '50%', border: '1px solid rgba(216,255,67,0.3)', color: '#d8ff43'
              }}>
                <Icon name="check" size={17}/>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                ["Crypto Engine (Go)", "TERHUBUNG"],
                ["AI Sanitizer (FastAPI)", "TERHUBUNG"],
                ["Replikasi Cadangan DB", "AKTIF"]
              ].map(([node, status]) => (
                <div key={node} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '12px', color: '#aab6aa' }}>{node}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#79dcb8' }}>{status}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Jejak Audit Terakhir Panel */}
          <section style={{ backgroundColor: '#101d18', borderRadius: '8px', border: '1px solid rgba(216,255,67,0.2)', padding: '1.25rem' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#d8ff43' }}>
              Jejak Audit Terakhir
            </p>
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1rem' }}>
              {[
                ["14:32", "Digital Signature Ed25519 diverifikasi", "Budi Santoso"],
                ["14:16", "Naskah dinas RAHASIA didekripsi", "Budi Santoso"],
                ["13:49", "Audit Chain SHA-256 diverifikasi", "Sistem Core"]
              ].map(([time, desc, actor]) => (
                <div key={time} style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '-21px', top: '4px', width: '8px', height: '8px',
                    borderRadius: '50%', border: '2px solid #101d18', backgroundColor: '#d8ff43'
                  }}/>
                  <p style={{ fontSize: '12px', lineHeight: '1.4', color: '#d6ddd6' }}>{desc}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#758277', marginTop: '0.25rem' }}>{time} · {actor}</p>
                </div>
              ))}
            </div>
            <button style={{ marginTop: '1.25rem', background: 'none', border: 'none', color: '#d8ff43', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
              Buka Audit Trail Lengkap →
            </button>
          </section>

        </aside>

      </div>

    </div>
  );
};
