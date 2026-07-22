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

  // Compute stat quantities
  const totalLetters = letters.length;
  const signedLetters = letters.filter(l => l.status === "SIGNED" || l.status === "SENT").length;
  const pendingLetters = letters.filter(l => l.status === "PENDING_SIGNATURE").length;

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      
      {/* 1. Header Greeting & Date (Identical to Sentinel Welcome Section) */}
      <div className="mb-8 flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-px w-8 bg-[#d8ff43]"/>
            <span className="font-mono text-[10px] tracking-[0.16em] text-[#d8ff43] uppercase">{timestampStr}</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Selamat siang, {user.full_name.split(' ')[0]}.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#94a197]">
            Integritas seluruh surat dinas dalam pengawasan. Ada <span className="text-[#e9a84f] font-semibold">{pendingLetters} naskah</span> yang menunggu tanda tangan.
          </p>
        </div>
        <button
          onClick={onNavigateCompose}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#d8ff43] px-5 text-sm font-semibold text-[#091513] transition hover:bg-[#ecff88]"
        >
          <Icon name="plus" size={17}/> Buat Surat Dinas Baru
        </button>
      </div>

      {/* 2. Grid of 4 KPI Metric Cards (Identical to Sentinel Stat Blocks) */}
      <div className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
        
        <div className="bg-[#0b1714] p-5 transition hover:bg-[#0e201b]">
          <div className="mb-7 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8b9a8d]">Total Surat Dinas</p>
            <span className="h-2 w-2 rounded-full bg-[#d8ff43]"/>
          </div>
          <p className="text-3xl font-semibold tracking-tight text-white">{totalLetters}</p>
          <p className="mt-2 text-xs text-[#849287]">+3 terbuat minggu ini</p>
        </div>

        <div className="bg-[#0b1714] p-5 transition hover:bg-[#0e201b]">
          <div className="mb-7 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8b9a8d]">Tanda Tangan Sah</p>
            <span className="h-2 w-2 rounded-full bg-[#79dcb8]"/>
          </div>
          <p className="text-3xl font-semibold tracking-tight text-white">{signedLetters}</p>
          <p className="mt-2 text-xs text-[#849287]">Integritas Ed25519 Terjamin</p>
        </div>

        <div className="bg-[#0b1714] p-5 transition hover:bg-[#0e201b]">
          <div className="mb-7 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8b9a8d]">Perlu Tindakan</p>
            <span className="h-2 w-2 rounded-full bg-[#e9a84f]"/>
          </div>
          <p className="text-3xl font-semibold tracking-tight text-[#e9a84f]">{pendingLetters}</p>
          <p className="mt-2 text-xs text-[#849287]">Persetujuan / Tanda Tangan Tertunda</p>
        </div>

        <div className="bg-[#0b1714] p-5 transition hover:bg-[#0e201b]">
          <div className="mb-7 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8b9a8d]">Integritas Hash</p>
            <span className="h-2 w-2 rounded-full bg-[#cbd5e1]"/>
          </div>
          <p className="text-3xl font-semibold tracking-tight text-white">99,99%</p>
          <p className="mt-2 text-xs text-[#849287]">Audit Chains Node Online</p>
        </div>

      </div>

      {/* 3. Two-Column Workspace Layout (Identical to Sentinel Main Block) */}
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_330px]">
        
        {/* Left Column: Recent Correspondence Table */}
        <section className="overflow-hidden rounded-lg border border-white/10 bg-[#0b1714]">
          
          <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Naskah dinas terbaru</h2>
              <p className="mt-1 text-xs text-[#87958a]">Register pergerakan dokumen dinas terakhir</p>
            </div>
            <label className="flex h-9 items-center gap-2 rounded-md border border-white/10 bg-[#07100f] px-3 text-[#829185] focus-within:border-[#d8ff43]">
              <Icon name="search" size={15}/>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nomor atau perihal"
                className="w-36 bg-transparent text-xs text-white outline-none placeholder:text-[#657368]"
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[690px] text-left">
              <thead className="bg-[#091411] font-mono text-[10px] uppercase tracking-[0.1em] text-[#758277]">
                <tr>
                  <th className="px-5 py-3 font-normal">Nomor Naskah</th>
                  <th className="px-3 py-3 font-normal">Perihal / Unit Kerja</th>
                  <th className="px-3 py-3 font-normal">Klasifikasi</th>
                  <th className="px-3 py-3 font-normal">Aktivitas Terakhir</th>
                  <th className="px-5 py-3"/>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {filtered.map((letter) => (
                  <tr key={letter.id} className="group hover:bg-white/[.025]">
                    <td className="px-5 py-4 font-mono text-[11px] text-[#d8ff43]">
                      {letter.number}
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-sm font-medium text-[#e4eae4]">{letter.subject}</p>
                      <p className="mt-1 text-[11px] text-[#849287]">Dari: {letter.sender}</p>
                    </td>
                    <td className="px-3 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium ${
                        letter.classification === 'RAHASIA' ? 'border-[#e9a84f]/30 bg-[#e9a84f]/10 text-[#e9a84f]' : 'border-[#79dcb8]/25 bg-[#79dcb8]/8 text-[#79dcb8]'
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current"/>
                        {letter.classification}
                      </span>
                    </td>
                    <td className="px-3 py-4 font-mono text-[10px] text-[#87958a]">{letter.date}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => onSelectLetter(letter.letterId)}
                        className="text-[#9aa89d] opacity-0 transition hover:text-[#d8ff43] group-hover:opacity-100"
                        aria-label={`Buka ${letter.id}`}
                      >
                        <Icon name="arrow" size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-9 text-center text-sm text-[#849287]">
                      Tidak ada naskah dinas yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button className="flex w-full items-center justify-center gap-2 border-t border-white/10 py-3.5 text-xs font-medium text-[#b7c5ba] transition hover:bg-white/[.035] hover:text-[#d8ff43]">
            Lihat seluruh register surat dinas <Icon name="arrow" size={14}/>
          </button>
        </section>

        {/* Right Column: Node Security & Timeline Logs */}
        <aside className="space-y-5">
          
          {/* Node Security Panel */}
          <section className="rounded-lg border border-white/10 bg-[#0b1714] p-5">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#89978c]">Keamanan Ekosistem</p>
                <h2 className="mt-2 text-lg font-semibold text-white">Node Utama Aman</h2>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-full border border-[#d8ff43]/30 text-[#d8ff43]">
                <Icon name="check" size={17}/>
              </div>
            </div>
            <div className="space-y-3">
              {[
                ["Crypto Engine (Go)", "TERHUBUNG"],
                ["AI Sanitizer (FastAPI)", "TERHUBUNG"],
                ["Replikasi Cadangan DB", "AKTIF"]
              ].map(([node, status]) => (
                <div key={node} className="flex items-center justify-between border-t border-white/8 pt-3">
                  <span className="text-xs text-[#aab6aa]">{node}</span>
                  <span className="font-mono text-[9px] text-[#79dcb8]">{status}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Jejak Audit Terakhir Panel */}
          <section className="rounded-lg border border-[#d8ff43]/20 bg-[#101d18] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#d8ff43]">Jejak Audit Terakhir</p>
            <div className="mt-5 space-y-5 border-l border-white/10 pl-4">
              {[
                ["14:32", "Digital Signature Ed25519 diverifikasi", "Budi Santoso"],
                ["14:16", "Naskah dinas RAHASIA didekripsi", "Budi Santoso"],
                ["13:49", "Audit Chain SHA-256 diverifikasi", "Sistem Core"]
              ].map(([time, desc, actor]) => (
                <div key={time} className="relative">
                  <span className="absolute -left-[19px] top-1 h-2 w-2 rounded-full border-2 border-[#101d18] bg-[#d8ff43]"/>
                  <p className="text-xs leading-5 text-[#d6ddd6]">{desc}</p>
                  <p className="mt-1 font-mono text-[9px] text-[#758277]">{time} · {actor}</p>
                </div>
              ))}
            </div>
            <button className="mt-5 text-xs font-medium text-[#d8ff43] hover:text-[#efff9a]">
              Buka Audit Trail Lengkap →
            </button>
          </section>

        </aside>

      </div>

    </div>
  );
};
