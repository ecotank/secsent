/**
 * API Client Service for SecureOffice-AI Microservices
 * Connects Frontend SPA to Backend Core (:8080), Crypto Service (:8081), and AI Service (:8000)
 * Includes Strict MFA / TOTP 6-Digit Enforcement and instant 2.0s AbortController timeout fallback
 */

import { validateSecurityPIN, logUnitActivity } from '../utils/webcrypto';

export const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:8080/api/v1";
export const CRYPTO_URL = (import.meta as any).env?.VITE_CRYPTO_URL || "http://localhost:8081/api/v1";
export const AI_URL = (import.meta as any).env?.VITE_AI_URL || "http://localhost:8000/api/v1";
export const IS_PRODUCTION = Boolean((import.meta as any).env?.VITE_BACKEND_URL && !(import.meta as any).env?.VITE_BACKEND_URL.includes("localhost"));

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  nip_nik: string;
  role: "ADMIN" | "HEAD_OF_UNIT" | "SECRETARY" | "STAFF" | "AUDITOR";
  clearance_level: "UNCLASSIFIED" | "RESTRICTED" | "CONFIDENTIAL" | "SECRET";
  work_unit?: {
    unit_code: string;
    unit_name: string;
  };
  password_change_required?: boolean;
}

export interface AIRiskScanResponse {
  letter_id: string;
  classifier: {
    predicted_category: string;
    confidence_score: number;
    predicted_urgency: string;
  };
  sanitized_text: string;
  risk_analysis: {
    risk_score: number;
    risk_level: string;
    detected_risk_entities: Array<{
      entity_type: string;
      phrase: string;
      risk_impact: string;
    }>;
  };
  compliance?: {
    letter_id: string;
    compliance_status: string;
    missing_elements: string[];
    recommendations: string[];
  };
  recommendation: {
    recommended_classification: string;
    required_encryption: string;
    disposition_restriction: string;
    action_summary: string;
  };
  suggested_subject?: string;
}

export async function loginUser(username: string, password: string, mfaCode: string): Promise<{ token: string; user: UserProfile }> {
  const cleanMFA = mfaCode ? mfaCode.trim() : "";
  if (!cleanMFA || cleanMFA.length !== 6 || !/^\d+$/.test(cleanMFA)) {
    throw new Error("Kode Verifikasi MFA/TOTP (6-Digit) Wajib Diisi & Harus Valid.");
  }

  const isValid = await validateSecurityPIN(cleanMFA, username);
  if (!isValid) {
    logUnitActivity(username, "Gagal Login (Kode MFA Tidak Sah)", "FAILED");
    throw new Error("Kode Verifikasi MFA/TOTP (6-Digit) tidak cocok atau telah kadaluarsa.");
  }
  logUnitActivity(username, "Sesi Login Baru (MFA Sukses)", "SUCCESS");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, mfa_code: cleanMFA }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return { token: data.access_token, user: data.user };
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error) {
        throw new Error(errData.error);
      }
    }
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (e.message && e.message.includes("MFA")) {
      throw e;
    }
    if (IS_PRODUCTION) {
      throw new Error(`Koneksi Keamanan Gagal: Server core backend tidak dapat dijangkau (${e.message || "Timeout"}).`);
    }
    console.warn("Backend offline or DB timeout, executing fallback demo authentication.");
  }

  // --- LOCAL DYNAMIC USER AUTHENTICATOR (STAGING FALLBACK) ---
  const defaultPasswords: Record<string, string> = {
    "ka.unit.sec": "pimpinan123",
    "sekretaris.sec": "sekretaris123",
    "staf.sec": "staf123",
    "admin.sys": "admin123",
    "auditor.sys": "auditor123",
    "dir.itsec": "direktur123"
  };

  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = password.trim();

  const localUsersJson = localStorage.getItem("local_registered_users");
  const localUsers = localUsersJson ? JSON.parse(localUsersJson) : [];
  const foundUser = localUsers.find((u: any) => u.username.trim().toLowerCase() === cleanUsername);

  if (foundUser) {
    if (foundUser.password && cleanPassword !== foundUser.password) {
      throw new Error("Kombinasi Username dan Kata Sandi tidak cocok.");
    }
    const isValid = await validateSecurityPIN(cleanMFA, username);
    if (!isValid) {
      throw new Error("Kode Verifikasi MFA/TOTP (6-Digit) tidak cocok atau telah kadaluarsa.");
    }
    return {
      token: "jwt_access_token_" + Date.now(),
      user: {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        full_name: foundUser.full_name,
        nip_nik: foundUser.nip_nik,
        role: foundUser.role as any,
        clearance_level: foundUser.clearance_level as any,
        work_unit: {
          unit_code: foundUser.work_unit?.unit_code || "UK-SEC-001",
          unit_name: foundUser.work_unit?.unit_name || "Bagian Persuratan & Tata Usaha"
        },
        password_change_required: foundUser.password_change_required !== false
      }
    };
  }

  // Validate seed accounts
  const seedUsernames = ["ka.unit.sec", "sekretaris.sec", "staf.sec", "admin.sys", "auditor.sys", "dir.itsec"];
  if (!seedUsernames.includes(cleanUsername)) {
    throw new Error("Username tidak terdaftar di sistem.");
  }

  const storedCustomPassword = localStorage.getItem(`local_user_password_${cleanUsername}`);
  const expectedPassword = storedCustomPassword || defaultPasswords[cleanUsername];
  if (cleanPassword !== expectedPassword) {
    throw new Error("Kombinasi Username dan Kata Sandi tidak cocok.");
  }

  const isValidSeedMFA = await validateSecurityPIN(cleanMFA, cleanUsername);
  if (!isValidSeedMFA) {
    throw new Error("Kode Verifikasi MFA/TOTP (6-Digit) tidak cocok atau telah kadaluarsa.");
  }

  let role: "ADMIN" | "HEAD_OF_UNIT" | "SECRETARY" | "STAFF" | "AUDITOR" = "HEAD_OF_UNIT";
  let fullName = "Dr. Budi Santoso, M.Si.";
  let clearance: "UNCLASSIFIED" | "RESTRICTED" | "CONFIDENTIAL" | "SECRET" = "CONFIDENTIAL";
  let unitCode = "UK-SEC-001";
  let unitName = "Bagian Persuratan & Tata Usaha";

  if (cleanUsername.includes("itsec") || cleanUsername.includes("dir")) {
    role = "HEAD_OF_UNIT";
    fullName = "Ir. Hendra Wijaya, M.T.";
    clearance = "SECRET";
    unitCode = "UK-ITSEC-001";
    unitName = "Direktorat Keamanan Informasi & Cyber";
  } else if (cleanUsername.includes("sekretaris")) {
    role = "SECRETARY";
    fullName = "Siti Rahma, S.AP.";
    clearance = "RESTRICTED";
  } else if (cleanUsername.includes("staf")) {
    role = "STAFF";
    fullName = "Ahmad Hidayat, S.Kom.";
    clearance = "UNCLASSIFIED";
  } else if (cleanUsername.includes("admin")) {
    role = "ADMIN";
    fullName = "Administrator Utama";
    clearance = "SECRET";
  } else if (cleanUsername.includes("auditor")) {
    role = "AUDITOR";
    fullName = "Auditor Keamanan Utama";
    clearance = "SECRET";
  }

  return {
    token: "jwt_access_token_" + Date.now(),
    user: {
      id: "22222222-2222-2222-2222-222222222222",
      username: cleanUsername,
      email: `${cleanUsername}@secsent.internal`,
      full_name: fullName,
      nip_nik: "NIP-19820315-002",
      role: role,
      clearance_level: clearance,
      work_unit: {
        unit_code: unitCode,
        unit_name: unitName
      },
      password_change_required: cleanUsername !== "ka.unit.sec" && cleanUsername !== "admin.sys" && cleanUsername !== "dir.itsec"
    }
  };
}

export async function analyzeLetterWithAI(text: string, subject: string): Promise<AIRiskScanResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(`${AI_URL}/ai/analyze-risk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        letter_id: "draft-" + Date.now(),
        raw_text_content: text,
        sender_unit_code: "UK-SEC-001",
        sender_unit_clearance: "CONFIDENTIAL",
        subject: subject
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      return await res.json();
    }
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (IS_PRODUCTION) {
      throw new Error(`AI Scan Failure: Layanan AI Sanitizer tidak dapat dijangkau (${e.message || "Timeout"}).`);
    }
  }

  // --- COMPREHENSIVE LOCAL FALLBACK SCANNER ENGINE ---
  const textLower = text.toLowerCase();
  const subjectLower = subject.toLowerCase();

  const highKeywords = [
    { type: "INTEL_MILITARY", kw: ["intelijen", "militer", "sandi", "alutsista", "operasi keamanan", "komando", "satgas", "rahasia negara"] },
    { type: "CYBER_VULNERABILITY", kw: ["exploit", "peretasan", "kebocoran data", "kerentanan", "serangan cyber", "hacker", "bug bounty"] },
    { type: "SYSTEM_CREDENTIALS", kw: ["password", "private key", "token akses", "api key", "credential", "passphrase", "kunci enkripsi"] },
    { type: "LEGAL_INVESTIGATION", kw: ["penyidikan", "tipikor", "tersangka", "kasus hukum", "bap", "korupsi", "surat perintah penyidikan"] },
    { type: "HIGH_SECRET_LABEL", kw: ["rahasia", "secret", "top secret", "sangat rahasia", "confidential"] }
  ];

  const mediumKeywords = [
    { type: "FINANCIAL_PROCUREMENT", kw: ["anggaran", "biaya proyek", "pencairan dana", "tender", "keuangan", "nominal", "keuntungan"] },
    { type: "INTERNAL_POLICY", kw: ["kebijakan internal", "draf keputusan", "strategis", "himbauan keamanan", "protokol"] },
    { type: "INFRASTRUCTURE_METADATA", kw: ["ip address", "server utama", "port jaringan", "database", "firewall"] }
  ];

  const detectedRiskEntities: Array<{ entity_type: string; phrase: string; risk_impact: string }> = [];
  let highMatches = 0;
  let mediumMatches = 0;

  // Scan High Severity
  for (const group of highKeywords) {
    for (const word of group.kw) {
      if (textLower.includes(word)) {
        highMatches++;
        detectedRiskEntities.push({
          entity_type: group.type,
          phrase: word,
          risk_impact: `High Risk: Detected classified military, credential, vulnerability or investigation terms (${word}).`
        });
        break;
      }
    }
  }

  // Scan Medium Severity
  for (const group of mediumKeywords) {
    for (const word of group.kw) {
      if (textLower.includes(word)) {
        mediumMatches++;
        detectedRiskEntities.push({
          entity_type: group.type,
          phrase: word,
          risk_impact: `Medium Risk: Detected financial, internal policy or infrastructure terms (${word}).`
        });
        break;
      }
    }
  }

  // Calculate score locally matching backend agent math
  let score = 1.00 + (highMatches * 2.50) + (mediumMatches * 1.20);
  if (highMatches > 0 && score < 7.50) {
    score = 7.50;
  } else if (mediumMatches > 0 && score < 4.50) {
    score = 4.50;
  }
  const riskScore = Math.min(score, 10.00);

  const riskLevel = riskScore >= 7.00 ? "HIGH" : riskScore >= 4.00 ? "MEDIUM" : "LOW";
  const recommendedClassification = riskScore >= 7.00 ? "RAHASIA" : riskScore >= 4.00 ? "TERBATAS" : "BIASA";
  
  const actionSummary = riskScore >= 7.00
    ? `Surat direkomendasikan naik klasifikasi menjadi RAHASIA karena mendeteksi data anggaran sensitif atau kunci rahasia (Skor Risiko: ${riskScore.toFixed(2)}).`
    : riskScore >= 4.00
    ? `Surat direkomendasikan klasifikasi TERBATAS (Skor Risiko: ${riskScore.toFixed(2)}).`
    : "Dokumen memenuhi kriteria standar. Rekomendasi klasifikasi BIASA.";

  // --- COMPREHENSIVE LOCAL FALLBACK COMPLIANCE INSPECTOR ---
  const formalPrefixes = [
    "permohonan", "himbauan", "pemberitahuan", "laporan", "keputusan",
    "undangan", "nota", "rencana", "usulan", "persetujuan", "instruksi",
    "evaluasi", "pelaksanaan", "pengadaan", "pengangkatan", "penunjukan"
  ];
  const forbiddenSubjectKeywords = [
    "password", "private key", "token", "kunci enkripsi", "sandi negara",
    "api key", "credential", "exploit", "bug bounty", "rahasia negara"
  ];

  // Dynamic Subject Concluding/Formulation Engine
  let concludedSubject = "Pemberitahuan Koordinasi Pelaksanaan Kegiatan Operasional";
  if (textLower.includes("pemberitahuan")) {
    concludedSubject = "Surat Pemberitahuan";
  } else if (textLower.includes("himbauan")) {
    concludedSubject = "Surat Himbauan";
  } else if (textLower.includes("undangan")) {
    concludedSubject = "Surat Undangan";
  } else if (textLower.includes("keputusan")) {
    concludedSubject = "Surat Keputusan";
  } else if (textLower.includes("nota dinas")) {
    concludedSubject = "Nota Dinas";
  } else if (textLower.includes("edaran")) {
    concludedSubject = "Surat Edaran";
  } else if (textLower.includes("permohonan")) {
    concludedSubject = "Surat Permohonan";
  } else if (textLower.includes("instruksi")) {
    concludedSubject = "Surat Instruksi";
  } else if (textLower.includes("tugas") || textLower.includes("surat tugas")) {
    concludedSubject = "Surat Tugas Pelaksanaan Kegiatan";
  } else if (textLower.includes("perintah") || textLower.includes("sprint")) {
    concludedSubject = "Surat Perintah Kerja";
  } else if (textLower.includes("pengantar")) {
    concludedSubject = "Surat Pengantar Dokumen";
  } else if (textLower.includes("kuasa")) {
    concludedSubject = "Surat Kuasa Khusus";
  } else if (textLower.includes("keterangan")) {
    concludedSubject = "Surat Keterangan Resmi";
  } else if (textLower.includes("pernyataan")) {
    concludedSubject = "Surat Pernyataan Kesanggupan";
  } else if (textLower.includes("pengumuman")) {
    concludedSubject = "Surat Pengumuman Resmi";
  } else if (textLower.includes("perjanjian") || textLower.includes("kontrak")) {
    concludedSubject = "Surat Perjanjian Kerja Sama";
  } else if (textLower.includes("dispensasi")) {
    concludedSubject = "Surat Dispensasi Operasional";
  } else if (textLower.includes("rekomendasi")) {
    concludedSubject = "Surat Rekomendasi Jabatan";
  } else if (textLower.includes("laporan") || textLower.includes("pertanggungjawaban") || textLower.includes("sptjb")) {
    concludedSubject = "Laporan Pertanggungjawaban Realisasi Anggaran";
  } else if (textLower.includes("telaahan staf")) {
    concludedSubject = "Telaahan Staf Kajian Strategis";
  } else if (textLower.includes("piagam") || textLower.includes("sertifikat")) {
    concludedSubject = "Piagam Penghargaan Atas Prestasi Kerja";
  } else if (textLower.includes("anggaran") || textLower.includes("biaya") || textLower.includes("pengadaan")) {
    if (textLower.includes("keamanan") || textLower.includes("firewall") || textLower.includes("jaringan")) {
      concludedSubject = "Permohonan Pengadaan Perangkat Keamanan Jaringan & Firewall Enterprise";
    } else {
      concludedSubject = "Permohonan Pengadaan Sarana dan Prasarana Operasional Instansi";
    }
  } else if (textLower.includes("password") || textLower.includes("token") || textLower.includes("kunci") || textLower.includes("sandi")) {
    if (textLower.includes("kepatuhan")) {
      concludedSubject = "Himbauan Kepatuhan Protokol Keamanan Informasi dan Sandi";
    } else {
      concludedSubject = "Pengaturan Ulang Akses Kredensial Keamanan Ekosistem";
    }
  } else {
    const firstSentence = text.split(".")[0].trim();
    const wordsArr = firstSentence.split(/\s+/);
    if (wordsArr.length > 8) {
      concludedSubject = wordsArr.slice(0, 8).join(" ") + "...";
    } else if (firstSentence.length > 5) {
      concludedSubject = firstSentence;
    }
  }

  const activeSubject = subject && subject !== "Draft Surat Dinas" ? subject : concludedSubject;
  const activeSubjectLower = activeSubject.toLowerCase();

  const complianceMissingElements: string[] = [];
  const complianceRecommendations: string[] = [];
  let complianceStatus = "COMPLIANT";

  if (!activeSubject || activeSubject.trim() === "") {
    complianceStatus = "NON_COMPLIANT";
    complianceMissingElements.push("SUBJECT_MISSING");
    complianceRecommendations.push("Perihal naskah dinas wajib diisi.");
  } else {
    if (activeSubject.trim().length < 15) {
      complianceMissingElements.push("SUBJECT_TOO_SHORT");
      complianceRecommendations.push("Perihal terlalu singkat. Harus menggambarkan maksud surat secara deskriptif (minimal 15 karakter).");
    }
    if (activeSubject.trim().length > 100) {
      complianceMissingElements.push("SUBJECT_TOO_LONG");
      complianceRecommendations.push("Perihal terlalu panjang (maksimal 100 karakter).");
    }
    const hasFormal = formalPrefixes.some(pref => activeSubjectLower.includes(pref));
    if (!hasFormal) {
      complianceMissingElements.push("NON_FORMAL_SUBJECT");
      complianceRecommendations.push("Gunakan kata benda formal kedinasan pada awal perihal (misal: 'Permohonan...', 'Pemberitahuan...', 'Laporan...').");
    }
    const leakedKws = forbiddenSubjectKeywords.filter(kw => activeSubjectLower.includes(kw));
    if (leakedKws.length > 0) {
      complianceStatus = "NON_COMPLIANT";
      complianceMissingElements.push("SUBJECT_INFORMATION_LEAK");
      complianceRecommendations.push(`Kritis: Perihal membocorkan info rahasia (${leakedKws.join(", ")}). Pindahkan ke isi terenkripsi.`);
    }
  }

  if (complianceMissingElements.length > 0 && complianceStatus !== "NON_COMPLIANT") {
    complianceStatus = complianceMissingElements.length === 1 ? "WARNING" : "NON_COMPLIANT";
  }

  return {
    letter_id: "draft-" + Date.now(),
    classifier: {
      predicted_category: textLower.includes("edaran") ? "SURAT_EDARAN" : "NOTA_DINAS",
      confidence_score: 0.95,
      predicted_urgency: textLower.includes("segera") ? "SEGERA" : "BIASA"
    },
    sanitized_text: text
      .replace(/Rp\s?\d+(\.\d{3})*/gi, "Rp [REDACTED_AMOUNT]")
      .replace(/\b(19|20)\d{16}\b|\b\d{16}\b/g, "[REDACTED_NIK_NIP]"),
    risk_analysis: {
      risk_score: riskScore,
      risk_level: riskLevel,
      detected_risk_entities: detectedRiskEntities
    },
    compliance: {
      letter_id: "draft-" + Date.now(),
      compliance_status: complianceStatus,
      missing_elements: complianceMissingElements,
      recommendations: complianceRecommendations
    },
    recommendation: {
      recommended_classification: recommendedClassification,
      required_encryption: "HYBRID_AES_256_GCM_X25519",
      disposition_restriction: riskScore >= 7.00 ? "RESTRICT_TO_UNIT_HEAD_ONLY" : "NONE",
      action_summary: actionSummary
    },
    suggested_subject: concludedSubject
  };
}

/**
 * Handles password modification dynamically with backend proxy support and local staging persistence fallback.
 */
export async function changeUserPassword(username: string, oldPass: string, newPass: string): Promise<void> {
  const cleanUsername = username.trim().toLowerCase();
  
  // 1. Try to call the backend API (if live)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(`${BACKEND_URL}/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: cleanUsername, old_password: oldPass, new_password: newPass }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      logUnitActivity(cleanUsername, "Mengubah Kata Sandi Akun (Backend)", "SUCCESS");
      return;
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error) {
        throw new Error(errData.error);
      }
    }
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (IS_PRODUCTION) {
      throw new Error(`Gagal mengubah kata sandi di server: ${e.message || "Timeout"}`);
    }
  }

  // 2. Local Fallback authentication change
  const defaultPasswords: Record<string, string> = {
    "ka.unit.sec": "pimpinan123",
    "sekretaris.sec": "sekretaris123",
    "staf.sec": "staf123",
    "admin.sys": "admin123",
    "auditor.sys": "auditor123"
  };

  const localUsersJson = localStorage.getItem("local_registered_users");
  const localUsers = localUsersJson ? JSON.parse(localUsersJson) : [];
  const foundIdx = localUsers.findIndex((u: any) => u.username.trim().toLowerCase() === cleanUsername);

  if (foundIdx !== -1) {
    const userObj = localUsers[foundIdx];
    if (userObj.password && oldPass.trim() !== userObj.password) {
      throw new Error("Kata sandi lama tidak cocok.");
    }
    userObj.password = newPass.trim();
    localUsers[foundIdx] = userObj;
    localStorage.setItem("local_registered_users", JSON.stringify(localUsers));
  } else {
    // Check seed accounts
    const seedUsernames = ["ka.unit.sec", "sekretaris.sec", "staf.sec", "admin.sys", "auditor.sys"];
    if (!seedUsernames.includes(cleanUsername)) {
      throw new Error("Username tidak terdaftar di sistem.");
    }
    const currentStoredPass = localStorage.getItem(`local_user_password_${cleanUsername}`);
    const expectedPass = currentStoredPass || defaultPasswords[cleanUsername];
    if (oldPass.trim() !== expectedPass) {
      throw new Error("Kata sandi lama tidak cocok.");
    }
    localStorage.setItem(`local_user_password_${cleanUsername}`, newPass.trim());
  }

  logUnitActivity(cleanUsername, "Mengubah Kata Sandi Akun (Local)", "SUCCESS");
}

export async function saveLetterToNeonDB(letterData: any) {
  try {
    const res = await fetch("/.netlify/functions/letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(letterData)
    });
    if (res.ok) {
      const data = await res.json();
      console.log("Neon DB Sync Result:", data);
      return data;
    } else {
      const errData = await res.json().catch(() => ({}));
      console.error("Neon DB Function Error:", res.status, errData);
      return {
        status: 'error',
        statusCode: res.status,
        error: errData.error || errData.message || `Server Error (${res.status})`,
        details: errData.details || ''
      };
    }
  } catch (err: any) {
    console.warn("Neon DB Sync Network Error:", err);
    return { status: 'error', error: err.message };
  }
}

export async function getLettersFromNeonDB() {
  try {
    const res = await fetch("/.netlify/functions/letters", {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'success' && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch letters from Neon DB Serverless API:", err);
  }
  return null;
}
