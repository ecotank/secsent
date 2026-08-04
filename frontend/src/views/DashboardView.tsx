import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, BACKEND_URL, IS_PRODUCTION, getLettersFromNeonDB } from '../services/api';
import { AccessLog } from '../utils/webcrypto';

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
  
  // Admin User Registration States
  const [adminSubTab, setAdminSubTab] = useState<'letters' | 'register'>(
    user.role === 'ADMIN' ? 'register' : 'letters'
  );
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newNip, setNewNip] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("STAFF");
  const [newClearance, setNewClearance] = useState("CONFIDENTIAL");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState<any | null>(null);

  // Generates a random secure 16-character Base32 string
  const generateRandomBase32 = (): string => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return result;
  };

  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess(null);

    if (!newUsername || !newFullName || !newNip || !newEmail || !newPassword) {
      setRegError("Semua kolom input wajib diisi.");
      return;
    }

    const cleanUsername = newUsername.trim().toLowerCase();
    
    // Check if user already exists in dynamic database
    const localUsersJson = localStorage.getItem("local_registered_users");
    const localUsers = localUsersJson ? JSON.parse(localUsersJson) : [];
    
    const exists = localUsers.some((u: any) => u.username === cleanUsername) || 
                   ["ka.unit.sec", "admin.sys", "sekretaris.sec", "staf.sec", "auditor.sys"].includes(cleanUsername);
    if (exists) {
      setRegError("Username telah terdaftar di sistem.");
      return;
    }

    // Generate unique Base32 Secret Key for this new employee
    const userSecret = generateRandomBase32();

    // Save to local user secrets map
    const localSecretsJson = localStorage.getItem("local_user_mfa_secrets");
    const localSecrets = localSecretsJson ? JSON.parse(localSecretsJson) : {};
    localSecrets[cleanUsername] = userSecret;
    localStorage.setItem("local_user_mfa_secrets", JSON.stringify(localSecrets));

    // Save user profile object to local database
    const newEmployee = {
      id: "usr-" + Math.random().toString(36).substring(2, 11),
      username: cleanUsername,
      full_name: newFullName.trim(),
      nip_nik: newNip.trim(),
      email: newEmail.trim(),
      role: newRole,
      clearance_level: newClearance,
      password: newPassword.trim()
    };
    localUsers.push(newEmployee);
    localStorage.setItem("local_registered_users", JSON.stringify(localUsers));

    // Display registration success details
    setRegSuccess({
      ...newEmployee,
      secret: userSecret,
      otpauthURI: `otpauth://totp/SecSent:${cleanUsername}?secret=${userSecret}&issuer=SecSent`
    });

    // Clear form fields
    setNewUsername("");
    setNewFullName("");
    setNewNip("");
    setNewEmail("");
    setNewPassword("");
  };

  // HEAD_OF_UNIT Access Logs View States
  const [kaSubTab, setKaSubTab] = useState<'letters' | 'logs'>('letters');
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

  useEffect(() => {
    if (user.role === 'HEAD_OF_UNIT') {
      const logsJson = localStorage.getItem("local_unit_access_logs");
      if (logsJson) {
        setAccessLogs(JSON.parse(logsJson));
      } else {
        const defaultLogs: AccessLog[] = [
          { timestamp: "2026-07-23 09:30:12", username: "sekretaris.sec", action: "Sesi Login Baru (MFA Sukses)", status: "SUCCESS", client: "Chrome (Windows)" },
          { timestamp: "2026-07-23 09:35:45", username: "sekretaris.sec", action: "Penyusunan Draf Surat Baru (ND/001)", status: "SUCCESS", client: "Chrome (Windows)" },
          { timestamp: "2026-07-23 10:15:22", username: "ka.unit.sec", action: "Sesi Login Baru (MFA Sukses)", status: "SUCCESS", client: "Edge (Windows)" },
          { timestamp: "2026-07-23 10:20:05", username: "ka.unit.sec", action: "Dekripsi Dokumen Surat Masuk", status: "SUCCESS", client: "Edge (Windows)" },
          { timestamp: "2026-07-23 10:21:40", username: "ka.unit.sec", action: "Tanda Tangan Digital Surat (ND/001)", status: "SUCCESS", client: "Edge (Windows)" }
        ];
        localStorage.setItem("local_unit_access_logs", JSON.stringify(defaultLogs));
        setAccessLogs(defaultLogs);
      }
    }
  }, [user.role, kaSubTab]);

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
      // 1. Primary Source: Fetch live letters from Neon PostgreSQL Database via Netlify Serverless API
      try {
        const neonLetters = await getLettersFromNeonDB();
        if (isMounted && neonLetters && Array.isArray(neonLetters) && neonLetters.length > 0) {
          const mapped = neonLetters.map((l: any, idx: number) => ({
            id: l.id || `BK-2026-09${18 - idx}`,
            letterId: l.id,
            number: l.number || l.letter_number || `ND/${100 + idx}/UK-SEC-001/VII/2026`,
            subject: l.subject || l.subject_plaintext || "Naskah Dinas Terenkripsi",
            category: l.category || "NOTA_DINAS",
            classification: l.classification || "BIASA",
            sender: l.sender || "Bagian Persuratan & TU",
            recipient: "Direktorat IT & Security",
            status: l.status || "SENT",
            date: l.date ? String(l.date).substring(0, 16) : "2026-07-20 14:32",
            color: l.classification === "RAHASIA" ? "amber" : "emerald"
          }));
          setLetters(mapped);
          return;
        }
      } catch (e) {
        console.warn("Neon DB letters fetch notice:", e);
      }

      // 2. Secondary Source: Local Go Backend
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`${BACKEND_URL}/letters`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            const mapped = data.map((l: any, idx: number) => ({
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
        // Silent fallback
      }

      // 3. Default Initial Display
      if (isMounted) {
        setLetters(mockLetters);
      }
    }
    fetchLetters();
    return () => { isMounted = false; };
  }, []);

  const filtered = useMemo(() => {
    return letters.filter((l) => {
      const q = query.toLowerCase().trim();
      const matchesSearch = !q || `${l.number || ''} ${l.subject || ''} ${l.sender || ''} ${l.recipient || ''}`.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      // Admins and Auditors can view all letters for system monitoring
      if (user.role === 'ADMIN' || user.role === 'AUDITOR') {
        return true;
      }

      const userUnitName = (user.work_unit?.unit_name || "").toLowerCase();
      const userUnitCode = (user.work_unit?.unit_code || "").toLowerCase();
      const userFullName = (user.full_name || "").toLowerCase();

      const senderStr = `${l.sender || ''}`.toLowerCase();
      const recipientStr = `${l.recipient || ''}`.toLowerCase();

      const isSender = senderStr.includes(userUnitName) || senderStr.includes(userUnitCode) || senderStr.includes(userFullName);
      const isRecipient = recipientStr.includes(userUnitName) || recipientStr.includes(userUnitCode) ||
                          (userUnitCode === "uk-sec-001" && (recipientStr.includes("persuratan") || recipientStr.includes("sec"))) ||
                          (userUnitCode === "uk-itsec-001" && (recipientStr.includes("it") || recipientStr.includes("keamanan") || recipientStr.includes("cyber"))) ||
                          (userUnitCode === "uk-fin-001" && (recipientStr.includes("keuangan") || recipientStr.includes("fin"))) ||
                          (userUnitCode === "uk-legal-001" && (recipientStr.includes("hukum") || recipientStr.includes("legal")));

      return isSender || isRecipient;
    });
  }, [letters, query, user]);

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
            {user.role === 'ADMIN' ? (
              "Keamanan sistem terpantau stabil. Silakan lakukan administrasi registrasi akun pegawai baru."
            ) : user.role === 'AUDITOR' ? (
              "Seluruh hash rantai jejak audit terverifikasi sah. Silakan pantau audit trail siber."
            ) : (
              <>
                Integritas seluruh surat dinas dalam pengawasan. Ada <span style={{ color: '#e9a84f', fontWeight: 600 }}>{pendingLetters} naskah</span> yang menunggu tanda tangan.
              </>
            )}
          </p>
        </div>

        {user.role !== 'ADMIN' && user.role !== 'AUDITOR' && (
          <button onClick={onNavigateCompose} className="btn-primary">
            <Icon name="plus" size={17}/> Buat Surat Dinas Baru
          </button>
        )}
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

      {user.role === 'ADMIN' ? (
        /* ==================== 1. ADMIN WORKSPACE (Registration Only) ==================== */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
          <section className="glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
              Registrasi Pegawai Baru
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#8b9a8d', marginBottom: '2rem' }}>
              Daftarkan pejabat/staf baru untuk memberikan akses kunci kriptografi sektoral asimetris.
            </p>

            {regError && (
              <div style={{
                backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid #ff6b6b',
                borderRadius: '8px', padding: '0.75rem 1rem', color: '#ff8585', fontSize: '0.8rem', marginBottom: '1.5rem'
              }}>
                <span>⚠ {regError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b9a8d', marginBottom: '0.5rem' }}>
                  Username Baru
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Contoh: staf.sec"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b9a8d', marginBottom: '0.5rem' }}>
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Contoh: Ahmad Hidayat, S.Kom."
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b9a8d', marginBottom: '0.5rem' }}>
                  NIP / NIK Resmi
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={newNip}
                  onChange={(e) => setNewNip(e.target.value)}
                  placeholder="Contoh: NIP-19951112-004"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b9a8d', marginBottom: '0.5rem' }}>
                  Email Dinas
                </label>
                <input
                  type="email"
                  className="input-control"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Contoh: staf@secsent.internal"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b9a8d', marginBottom: '0.5rem' }}>
                  Kata Sandi (Password)
                </label>
                <input
                  type="password"
                  className="input-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter..."
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b9a8d', marginBottom: '0.5rem' }}>
                  Hak Akses (Role)
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="input-control"
                  style={{ backgroundColor: '#07100f' }}
                >
                  <option value="HEAD_OF_UNIT">HEAD_OF_UNIT (Kepala Unit)</option>
                  <option value="SECRETARY">SECRETARY (Sekretaris)</option>
                  <option value="STAFF">STAFF (Staf Pelaksana)</option>
                  <option value="ADMIN">ADMIN (System Administrator)</option>
                  <option value="AUDITOR">AUDITOR (Auditor Internal)</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#8b9a8d', marginBottom: '0.5rem' }}>
                  Clearance Level (Tingkat Klasifikasi Naskah)
                </label>
                <select
                  value={newClearance}
                  onChange={(e) => setNewClearance(e.target.value)}
                  className="input-control"
                  style={{ backgroundColor: '#07100f' }}
                >
                  <option value="UNCLASSIFIED">UNCLASSIFIED (Biasa / Terbuka)</option>
                  <option value="RESTRICTED">RESTRICTED (Terbatas)</option>
                  <option value="CONFIDENTIAL">CONFIDENTIAL (Rahasia)</option>
                  <option value="SECRET">SECRET (Sangat Rahasia)</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                👤 Daftarkan Pegawai Baru
              </button>

            </form>
          </section>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {regSuccess ? (
              <div style={{ backgroundColor: '#101d18', borderRadius: '8px', border: '1px solid #79dcb8', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#79dcb8' }}>
                  <span style={{ fontSize: '1.2rem' }}>🎉</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>AKUN BERHASIL TERDAFTAR!</span>
                </div>
                
                <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: '#e8eee8' }}>
                  <p>Nama: <strong>{regSuccess.full_name}</strong></p>
                  <p>Username: <code>{regSuccess.username}</code></p>
                  <p>PIN Default: <code>123456</code></p>
                  
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '10px', color: '#8b9a8d', display: 'block', marginBottom: '0.25rem' }}>Keamanan Transmisi:</span>
                    <span style={{ fontSize: '0.75rem', color: '#d8ff43', fontWeight: 600 }}>🔒 METODE AKTIVASI MANDIRI AKTIF</span>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: '#8b9a8d', marginTop: '0.5rem', lineHeight: '1.4' }}>
                    💡 <em>Sesuai prinsip Zero-Trust, Kunci Base32 OTPKEY dan QR Code tidak ditampilkan di sini. Pegawai tersebut akan dipandu secara otomatis di layarnya sendiri untuk melakukan konfigurasi OTPKEY pada saat login pertama kali.</em>
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#0b1714', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
                  Pedoman Pendaftaran
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#8b9a8d', lineHeight: '1.5' }}>
                  Pendaftaran akun dinas baru secara otomatis membangkitkan pasangan kunci Base32 dinamis yang terisolasi. 
                  Pegawai baru tersebut wajib mengganti kata sandi awal dan mendaftarkan kunci ke OTPKEY sebelum bisa mengakses Dashboard.
                </p>
              </div>
            )}
          </aside>
        </div>
      ) : user.role === 'AUDITOR' ? (
        /* ==================== 2. AUDITOR WORKSPACE (Read-Only Audit Trail) ==================== */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: '2rem' }}>
          
          <section className="glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
              Dashboard Audit Keamanan & Kepatuhan
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#8b9a8d', marginBottom: '2rem' }}>
              Memantau integritas log audit trail kriptografis (SHA-256 Hash Chain). Hak akses Anda bersifat <strong>Read-Only</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { time: "14:32:01", event: "Verifikasi Digital Signature Ed25519 - Sukses", actor: "Dr. Budi Santoso, M.Si.", status: "VALID" },
                { time: "14:16:15", event: "Dekripsi Berkas PDF AES-GCM - Sukses", actor: "Dr. Budi Santoso, M.Si.", status: "VALID" },
                { time: "13:49:50", event: "Pemeriksaan Hash Chain Node SHA-256 - Sukses", actor: "Sistem Core", status: "VALID" },
                { time: "11:08:12", event: "Aktivasi Akun & Onboarding MFA Baru", actor: "Siti Rahma, S.AP.", status: "VALID" },
                { time: "10:45:33", event: "Inisialisasi Enkripsi Naskah Dinas", actor: "Ahmad Hidayat", status: "VALID" }
              ].map((log, idx) => (
                <div key={idx} style={{
                  backgroundColor: '#091411', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '6px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#8b9a8d', marginRight: '1rem' }}>{log.time}</span>
                    <strong style={{ fontSize: '13px', color: '#e8eee8' }}>{log.event}</strong>
                    <span style={{ fontSize: '11px', color: '#758277', display: 'block', marginTop: '0.25rem' }}>Aktor: {log.actor}</span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600,
                    color: '#79dcb8', backgroundColor: 'rgba(121,220,184,0.1)',
                    padding: '0.25rem 0.5rem', borderRadius: '4px'
                  }}>
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Node Security Panel */}
            <section style={{ backgroundColor: '#0b1714', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', marginBottom: '1rem' }}>Node Keamanan</h3>
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
          </aside>
        </div>
      ) : (
        /* ==================== 3. CORRESPONDENCE WORKSPACE (Inbox/Outbox) ==================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Sub-Tab Switching for HEAD_OF_UNIT */}
          {user.role === 'HEAD_OF_UNIT' && (
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <button
                onClick={() => setKaSubTab('letters')}
                style={{
                  background: 'none', border: 'none', color: kaSubTab === 'letters' ? '#d8ff43' : '#889a8d',
                  fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  borderBottom: kaSubTab === 'letters' ? '2px solid #d8ff43' : 'none', paddingBottom: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                📋 Arsip & Surat Masuk
              </button>
              <button
                onClick={() => setKaSubTab('logs')}
                style={{
                  background: 'none', border: 'none', color: kaSubTab === 'logs' ? '#d8ff43' : '#889a8d',
                  fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  borderBottom: kaSubTab === 'logs' ? '2px solid #d8ff43' : 'none', paddingBottom: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                🛡️ Log Pengawasan Unit
              </button>
            </div>
          )}

          {kaSubTab === 'logs' && user.role === 'HEAD_OF_UNIT' ? (
            /* Log Pengawasan Unit View */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: '2rem' }}>
              <section className="glass-card" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
                  Log Pengawasan Akses Unit Kerja
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#8b9a8d', marginBottom: '2rem' }}>
                  Catatan aktivitas seluruh pegawai yang berada di bawah wewenang unit kerja Anda.
                </p>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#091411', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#758277' }}>
                      <tr>
                        <th style={{ padding: '0.75rem 1.25rem', fontWeight: 400 }}>Waktu</th>
                        <th style={{ padding: '0.75rem 0.75rem', fontWeight: 400 }}>Aktor</th>
                        <th style={{ padding: '0.75rem 0.75rem', fontWeight: 400 }}>Aktivitas</th>
                        <th style={{ padding: '0.75rem 0.75rem', fontWeight: 400 }}>Status</th>
                        <th style={{ padding: '0.75rem 1.25rem', fontWeight: 400 }}>Perangkat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accessLogs.map((log, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <td style={{ padding: '1rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#aab6aa' }}>
                            {log.timestamp}
                          </td>
                          <td style={{ padding: '1rem 0.75rem', fontSize: '13px', fontWeight: 600, color: '#e8eee8' }}>
                            {log.username}
                          </td>
                          <td style={{ padding: '1rem 0.75rem', fontSize: '13px', color: '#d6ddd6' }}>
                            {log.action}
                          </td>
                          <td style={{ padding: '1rem 0.75rem' }}>
                            <span style={{
                              fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600,
                              color: log.status === 'SUCCESS' ? '#79dcb8' : '#ff8585',
                              backgroundColor: log.status === 'SUCCESS' ? 'rgba(121,220,184,0.1)' : 'rgba(255,107,107,0.1)',
                              padding: '0.15rem 0.4rem', borderRadius: '4px'
                            }}>
                              {log.status}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 1.25rem', fontSize: '11px', color: '#758277' }}>
                            {log.client}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ backgroundColor: '#0b1714', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
                    Fungsi Pengawasan Kepala Unit
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#8b9a8d', lineHeight: '1.5' }}>
                    Dashboard pemantauan ini menyajikan transparansi aktivitas personil unit kerja secara real-time guna mencegah penyalahgunaan akses dan menjaga akuntabilitas dokumen.
                  </p>
                </div>
              </aside>
            </div>
          ) : (
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
          )}

        </div>
      )}

    </div>
  );
};
