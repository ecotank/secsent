# Bahan Presentasi Komprehensif: SecureOffice-AI
## Sistem Persuratan Digital Terenkripsi End-to-End Berbasis Zero-Trust Architecture

---

## 📋 DAFTAR ISI PRESENTASI
1. **Slide 1**: Judul & Pendahuluan
2. **Slide 2**: Latar Belakang & Rumusan Masalah (Vabilitas TNDE Konvensional)
3. **Slide 3**: Tujuan Utama Pengembangan SecureOffice-AI
4. **Slide 4**: Rencana Aplikasi & Arsitektur Mikroservis Modular
5. **Slide 5**: Pemodelan Ancaman Keamanan (STRIDE Threat Model & Mitigasi)
6. **Slide 6**: Konsep Kriptografi Hibrida (Hybrid Cryptography & Envelope Encryption)
7. **Slide 7**: Implementasi Enkripsi Simetris (AES-256-GCM) & Kunci Asimetris (X25519)
8. **Slide 8**: Tanda Tangan Digital (Ed25519) & Kesiapan Pasca-Kuantum (PQC)
9. **Slide 9**: Alur Pembuatan Aplikasi 1 - Framework Secure SDLC (Shift-Left Security)
10. **Slide 10**: Alur Pembuatan Aplikasi 2 - CI/CD Security Quality Gates (SAST, DAST, SCA, Secret Scan)
11. **Slide 11**: Alur Penggunaan Aplikasi 1 - Registrasi Pegawai & Onboarding MFA (TOTP Base32)
12. **Slide 12**: Alur Penggunaan Aplikasi 2 - Penulisan Naskah & Inspeksi Keamanan AI (Sanitizer)
13. **Slide 13**: Alur Penggunaan Aplikasi 3 - Enkripsi, Penandatanganan & Pengiriman Surat
14. **Slide 14**: Alur Penggunaan Aplikasi 4 - Dekripsi Penerima, Disposisi & Log Pengawasan Unit
15. **Slide 15**: Pembuktian Integritas Hash Chaining Audit Trail & Kesimpulan

---

## SLIDE 1: JUDUL & PENDAHULUAN
* **Judul Presentasi**: SecureOffice-AI: Penerapan Kriptografi Hibrida dan Agentic AI dalam Tata Naskah Dinas Elektronik Berarsitektur Zero-Trust
* **Sub-Judul**: Mengamankan Korespondensi Digital Instansi dari Ancaman Kebocoran Data Internal dan Penyadapan Eksternal
* **Poin Utama Paparan**:
  * **Pengenalan Platform**: SecureOffice-AI adalah sistem pengiriman dan pengarsipan surat dinas digital antar unit kerja yang aman, terstruktur, dapat diaudit, dan diperkuat oleh kecerdasan buatan (*AI-enhanced*).
  * **Prinsip Utama**: Mengadopsi doktrin keamanan Zero-Trust (*"Never Trust, Always Verify"*) di mana server dan database dianggap sebagai lingkungan yang berpotensi berbahaya (*untrusted environment*).
  * **Inovasi Inti**: Penggabungan enkripsi simetris berkecepatan tinggi (AES-256-GCM), pertukaran kunci kurva eliptik (X25519), tanda tangan digital (Ed25519), serta pemindaian risiko konten AI secara real-time.

---

## SLIDE 2: LATAR BELAKANG & RUMUSAN MASALAH
* **Judul Slide**: Kerentanan Tata Naskah Dinas Elektronik (TNDE) Konvensional
* **Rumusan Masalah Utama**:
  1. **Penyimpanan Plaintext Terbuka**: Aplikasi TNDE tradisional menyimpan berkas dokumen (PDF/Word) dan isi surat secara terbuka (*plaintext*) pada server/database.
  2. **Ancaman Orang Dalam & DBA (*Database Administrator Threat*)**: Administrator database atau peretas yang mengompromikan akun server dapat membaca seluruh isi surat rahasia negara tanpa batasan.
  3. **Kelemahan Enkripsi Statis (TDE/TLS Only)**: 
     - *Transport Layer Security (TLS/HTTPS)* hanya mengamankan pipa transmisi di jaringan, namun data tetap didekripsi di memori server aplikasi.
     - *Transparent Data Encryption (TDE)* hanya mengamankan harddisk saat mati, tetapi data tetap terbuka saat database server berjalan.
  4. **Penyalahgunaan Hak Akses & Kebocoran Dokumen**: Staf biasa dapat mengintip surat dinas berklasifikasi *Rahasia/Sangat Rahasia* milik pimpinan jika otorisasi di tingkat aplikasi lemah.
  5. **Ancaman Manipulasi Isi Surat (Tampering)**: Dokumen dinas digital rentan diubah isinya di pertengahan jalan tanpa ada bukti perubahan yang tidak terbantahkan.

---

## SLIDE 3: TUJUAN UTAMA PENGEMBANGAN
* **Judul Slide**: Tujuan & Target Capaian Aplikasi SecureOffice-AI
* **Tujuan Pengembangan**:
  1. **Perlindungan Dokumen End-to-End (E2E)**: Memastikan naskah dinas dan lampiran terenkripsi secara independen sejak di penjelajah web pengirim hingga penjelajah web penerima (*Client-Side Decryption*).
  2. **Isolasi Wewenang Berbasis Peran & Atribut (RBAC & ABAC)**: Mengunci hak akses dokumen secara ketat berdasarkan peran (*Role*) dan tingkat kerahasiaan (*Security Clearance Level*).
  3. **Verifikasi Keaslian & Nir-Penyangkalan (*Non-Repudiation*)**: Menjamin keabsahan dokumen menggunakan tanda tangan digital berkecepatan tinggi (Ed25519) dan stempel waktu (*Timestamp Token*).
  4. **Tata Kelola Cerdas Berbasis AI**: Membantu pegawai mendeteksi risiko kebocoran data sensitif (PII/kredensial) pada perihal dan isi surat sebelum dokumen dikirimkan.
  5. **Audit Trail Imutabel & Nir-Manipulasi**: Mencatat seluruh aktivitas persuratan dalam struktur rantai hash kriptografis (*Cryptographic Hash Chaining*) yang mencegah penghapusan/pengubahan jejak log.

---

## SLIDE 4: RENCANA APLIKASI & ARSITEKTUR SISTEM
* **Judul Slide**: Arsitektur Mikroservis Modular Terisolasi
* **Komponen Layanan Sistem**:
  ```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │                        FRONTEND CLIENT SPA                             │
  │     (React Vite + WebCrypto API + Local Envelope Vault + Tailwind)     │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │ REST API (HTTPS / TLS 1.3)
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                         API GATEWAY / ROUTER                           │
  └─────────────┬─────────────────────┬─────────────────────┬──────────────┘
                │                     │                     │
                ▼                     ▼                     ▼
  ┌───────────────────────────┐ ┌─────────┬───────────────┐ ┌──────────────┐
  │    BACKEND CORE SERVICE   │ │  CRYPTO MICROSERVICE  │ │  AI SERVICE  │
  │ (Go Engine + PostgreSQL   │ │ (Go Native Engine +   │ │ (FastAPI +   │
  │   + Redis + JWT Auth)     │ │  X25519 / Ed25519)    │ │  Sanitizer)  │
  └───────────────────────────┘ └─────────────────────────┘ └──────────────┘
  ```
* **Peran Masing-Masing Modul**:
  - **Frontend SPA**: Tempat pengeditan naskah, eksekusi WebCrypto API, pemindaian QR Code MFA, dan dekripsi memori RAM lokal.
  - **Backend Core (Go)**: Mengelola logika bisnis persuratan, otorisasi RBAC/ABAC, alur disposisi, dan rantai hash audit log.
  - **Crypto Service (Go)**: Layanan terisolasi khusus pembentukan kunci asimetris, pembangkitan DEK simetris, dan validasi tanda tangan digital.
  - **AI Subsystem (Python FastAPI)**: Layanan analisis risiko keamanan, klasifikasi otomatis, dan peredaksian data sensitif (*PII Redaction*).

---

## SLIDE 5: PEMODELAN ANCAMAN KEAMANAN (STRIDE THREAT MODEL)
* **Judul Slide**: Identifikasi Ancaman & Strategi Mitigasi Berdasarkan Framework STRIDE
* **Matriks Analisis STRIDE**:

| Kategori Ancaman (STRIDE) | Bentuk Ancaman pada Aplikasi Persuratan | Strategi Mitigasi pada SecureOffice-AI |
| :--- | :--- | :--- |
| **Spoofing Identity** (Pemalsuan Identitas) | Penyerang mengaku sebagai Kepala Unit untuk membuat atau menandatangani surat dinas palsu. | Wajib **MFA TOTP 6-Digit (RFC 6238)** / Hardware Key FIDO2 + Penandatanganan Digital berbasis kunci privat **Ed25519**. |
| **Tampering Data** (Manipulasi Isi Data) | Mengubah isi surat dinas atau status persuratan pada database PostgreSQL. | Enkripsi **AES-256-GCM** (Authenticating Payload) + **SHA-256 Hash Chain** pada jejak log audit. |
| **Repudiation** (Penyangkalan Aksinya) | Pejabat menyangkal telah menandatangani atau menyetujui surat dinas yang terkirim. | Tanda tangan digital asimetris **Ed25519** + penyematan **Timestamp Token (TSA)** yang terverifikasi hukum. |
| **Information Disclosure** (Kebocoran Rahasia) | Administrator DB atau penyadap jaringan membaca isi dokumen berklasifikasi Rahasia. | **Envelope Encryption** E2EE (Client-side Decryption) + Pembatasan Klirens **ABAC** (Unclassified/Restricted/Secret). |
| **Denial of Service** (Lumpuhnya Layanan) | Serangan lonjakan trafik palsu untuk menghentikan aliran pengiriman surat dinas kritis. | **Rate Limiting** API Gateway + **Redis Caching** + Penanganan Timeout Async (AbortController). |
| **Elevation of Privilege** (Eskalasi Hak Akses) | Staf biasa memanipulasi parameter URL untuk membuka surat rahasia milik Kepala Unit. | Penegakan aturan **ABAC di level API Backend** (memvalidasi User Unit ID & Clearance vs Resource Clearance). |
| **Prompt Injection** (Ancaman AI khusus) | Menyisipkan teks khusus dalam naskah dinas untuk memanipulasi keputusan AI Analyzer. | **Input Context Isolation**, sanitasi teks sebelum dikirim ke AI, serta larangan eksekusi kode pada AI Sandbox. |

---

## SLIDE 6: KONSEP KRIPTOGRAFI HIBRIDA (HYBRID CRYPTOGRAPHY)
* **Judul Slide**: Penggabungan Kecepatan Enkripsi Simetris & Keamanan Kunci Asimetris
* **Prinsip Envelope Encryption (Enkripsi Amplop)**:
  ```text
  [ Plaintext Naskah Dinas + PDF ] 
                 │
                 ▼  (Dienkripsi dengan Kunci Simetris Acak DEK)
  [ Ciphertext Naskah Dinas (AES-256-GCM) ] ──► Disimpan di Storage Disk / MinIO
  
  [ Data Encryption Key (DEK) ] 
                 │
                 ▼  (Dienkripsi dengan Kunci Publik Asimetris X25519 Penerima)
  [ Encrypted Key Envelope (Encrypted DEK) ] ──► Disimpan di Database Metadata
  ```
* **Keunggulan Metode Hibrida**:
  - **Efisiensi Komputasi**: Dokumen berukuran besar (seperti PDF puluhan MB) dienkripsi dengan cepat menggunakan AES-256-GCM.
  - **Skalabilitas Distribusi**: Kunci simetris (DEK) yang kecil dienkripsi secara terpisah untuk tiap kunci publik penerima, tanpa perlu menguangkan/mendenkripsi ulang dokumen utama.

---

## SLIDE 7: IMPLEMENTASI AES-256-GCM & X25519
* **Judul Slide**: Komposisi Algoritma Enkripsi & Pertukaran Kunci
* **1. AES-256-GCM (Galois/Counter Mode)**:
  - **Panjang Kunci**: 256-bit Data Encryption Key (DEK) yang dibangkitkan acak via `crypto/rand`.
  - **Keunggulan AEAD**: Selain mengenkripsi (*Confidentiality*), GCM menghasilkan **Authentication Tag 128-bit** (*Integrity & Authenticity*). Jika ada perubahan 1 bit pada ciphertext, proses dekripsi akan gagal seketika.
  - **IV (Initialization Vector)**: 96-bit unik untuk setiap operasi enkripsi guna mencegah serangan re-use vector.
* **2. X25519 (Elliptic Curve Diffie-Hellman / Curve25519)**:
  - Digunakan untuk membungkus (*wrapping*) kunci DEK simetris ke kunci publik penerima.
  - **Keamanan Tinggi & Ukuran Kecil**: Menyediakan tingkat keamanan setara RSA-3072 bit namun dengan panjang kunci hanya 256-bit, sangat ringan diproses oleh perangkat mobile/browser.

---

## SLIDE 8: TANDA TANGAN DIGITAL & PASCA-KUANTUM (PQC)
* **Judul Slide**: Keabsahan Hukum Dokumen & Kesiapan Era Komputasi Kuantum
* **1. Tanda Tangan Digital Resmi (Ed25519)**:
  - Berbasis *Edwards-curve Digital Signature Algorithm (EdDSA)*.
  - Hashing dokumen menggunakan `SHA-256`, kemudian ditandatangani menggunakan Kunci Privat `Ed25519` milik Pejabat Penandatangan.
  - Mencegah kejahatan pemalsuan surat dan memberikan jaminan hukum *Non-Repudiation* (penandatangan tidak dapat menyangkal).
* **2. Kesiapan Pasca-Kuantum (*Post-Quantum Cryptography / PQC Ready*)**:
  - Menyiapkan arsitektur hibrida ganda (*Dual-Layer Hybrid*) yang mendukung algoritma standar NIST PQC:
    - **ML-KEM (Kyber)**: Untuk pertukaran kunci asimetris tahan komputer kuantum.
    - **ML-DSA (Dilithium)**: Untuk tanda tangan digital tahan komputer kuantum.

---

## SLIDE 9: ALUR PEMBUATAN 1 - FRAMEWORK SECURE SDLC
* **Judul Slide**: Penerapan Pendekatan Shift-Left Security
* **Siklus Pengembangan Aman (5 Fase SSDLC)**:
  ```text
  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
  │ 1. SECURITY      │──►│ 2. THREAT        │──►│ 3. SECURE        │──►│ 4. AUTOMATED     │──►│ 5. SECURITY      │
  │    REQUIREMENTS  │   │    MODELING      │   │    CODING        │   │    TESTING       │   │    DEPLOYMENT    │
  └──────────────────┘   └──────────────────┘   └──────────────────┘   └──────────────────┘   └──────────────────┘
  ```
* **Deskripsi Alur Pembuatan**:
  - **Fase 1 (Requirements)**: Penentuan aturan Least Privilege, Zero-Trust, dan kepatuhan UU PDP.
  - **Fase 2 (Design)**: Pemodelan ancaman STRIDE dan pembuatan Data Flow Diagram (DFD).
  - **Fase 3 (Implementation)**: Pemrograman aman (mencegah SQLi, Prompt Injection, dan membuang kunci privat dari RAM/Zeroization).
  - **Fase 4 (Testing)**: Pengujian otomatis CI/CD Quality Gates sebelum kode di-merge.
  - **Fase 5 (Deployment)**: Container signing (Cosign), penyiapan WAF, dan pengawasan runtime.

---

## SLIDE 10: ALUR PEMBUATAN 2 - AUTOMATED SECURITY QUALITY GATES
* **Judul Slide**: Pipa Pengujian Keamanan Otomatis CI/CD Pipeline
* **Arsitektur Pengujian Keamanan**:
  ```text
           ┌────────────────────────────────────────┐
           │      Pull Request (PR) Submitted       │
           └───────────────────┬────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
  ┌─────────┐             ┌─────────┐             ┌─────────┐
  │ SECRET  │             │  SAST   │             │   SCA   │
  │ SCAN    │             │ SCANNER │             │ SCANNER │
  └────┬────┘             └────┬────┘             └────┬────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               ▼
                   ┌───────────────────────┐
                   │ Lolos Quality Gates? │
                   └───────────┬───────────┘
                               │
               ┌───────────────┴───────────────┐
               │ YA                            │ TDK
               ▼                               ▼
  ┌──────────────────────────┐   ┌──────────────────────────┐
  │ DAST & Cryptographic     │   │ PR Ditolak Otomatis &    │
  │ Fuzzing (Staging Server) │   │ Notifikasi Security Team │
  └──────────────────────────┘   └──────────────────────────┘
  ```
* **Peralatan Penguji Keamanan**:
  - **Secret Scan (Trufflehog/Gitleaks)**: Memastikan tidak ada API Key/Password tertanam di Git.
  - **SAST (Semgrep/SonarQube)**: Memindai celah keamanan OWASP Top 10 pada kode Go, Python, dan React.
  - **SCA (Trivy/Snyk)**: Memindai kerentanan CVE pada library dependensi `package.json`, `go.mod`, dan `requirements.txt`.
  - **DAST & Fuzzing (OWASP ZAP & Cryptofuzz)**: Memindai celah runtime dan kerapuhan parser kriptografi.

---

## SLIDE 11: ALUR PENGGUNAAN 1 - REGISTRASI PEGAWAI & ONBOARDING MFA
* **Judul Slide**: Operasional Pengguna: Aktivasi Akun & Setup MFA Terisolasi
* **Alur Penggunaan (Registrasi Pegawai Baru)**:
  1. **Registrasi oleh Admin**: Admin menginput Username, NIP, Nama, Email, dan Role pegawai di dashboard Admin.
  2. **Bangkatan Kunci Base32 Unik**: Sistem membangkitkan Kunci Rahasia Base32 terisolasi untuk pegawai tersebut tanpa menampilkannya di layar Admin (Prinsip *Zero-Trust Self-Activation*).
  3. **Pengiriman Notifikasi Telegram**: Notifikasi pendaftaran terkirim otomatis via Telegram Bot ke pegawai bersangkutan.
  4. **Login Perdana & Mandatory Onboarding**:
     - Pegawai login pertama kali dan dipaksa (*forced redirect*) menyelesaikan 3 langkah Onboarding:
       - **Langkah 1**: Mengganti kata sandi awal dengan password kuat.
       - **Langkah 2**: Mengubah PIN Keamanan 6-digit pribadi.
       - **Langkah 3**: Memindai QR Code untuk mendaftarkan Kunci Base32 ke aplikasi **OTPKEY Authenticator / Google Authenticator**.

---

## SLIDE 12: ALUR PENGGUNAAN 2 - PENULISAN NASKAH & AI SECURITY SANITIZER
* **Judul Slide**: Operasional Pengguna: Pembuatan Surat & Analisis Risiko AI Real-Time
* **Alur Penggunaan (Penyusunan Surat Dinas)**:
  1. **Dual-Mode Input**: Pegawai memilih mode penyusunan: *Tulis Teks Manual* atau *Lampirkan File PDF/Word*.
  2. **Debounced Auto-Scan AI (600ms)**: Saat pengguna mengetik perihal dan isi surat, `ai-service` secara otomatis menganalisis teks di latar belakang.
  3. **Peredaksian PII (*Personally Identifiable Information*)**:
     - AI mendeteksi data sensitif (seperti NIK, NIP, nominal anggaran) dan meredaksinya secara otomatis (`[REDACTED_NIK_NIP]`, `[REDACTED_AMOUNT]`).
  4. **Pemeriksaan Kepatuhan Perihal (*Subject Compliance Inspector*)**:
     - Mencegah pembocoran kata kunci rahasia pada judul perihal surat dan merekomendasikan klasifikasi keamanan (`BIASA`, `TERBATAS`, `RAHASIA`).

---

## SLIDE 13: ALUR PENGGUNAAN 3 - ENKRIPSI, PENANDATANGANAN & PENGIRIMAN
* **Judul Slide**: Operasional Pengguna: Eksekusi Kriptografi Sebelum Penyimpanan
* **Alur Penggunaan (Eksekusi Enkripsi & Tanda Tangan)**:
  ```text
  [ Form Surat Dinas disetujui Pengirim ]
                     │
                     ▼
  [ Hashing SHA-256 ] ──► [ Penandatanganan Digital Ed25519 dengan Kunci Privat ]
                     │
                     ▼
  [ Pembangkitan DEK AES-256-GCM ] ──► [ Enkripsi Payload Naskah & PDF ]
                     │
                     ▼
  [ Enkripsi DEK via Kunci Publik X25519 Penerima ] ──► [ Pembentukan Encrypted Key Envelope ]
                     │
                     ▼
  [ Simpan Ciphertext ke MinIO Storage & Metadata ke PostgreSQL ]
  ```
* **Hasil**: Dokumen yang tersimpan di disk server 100% berbentuk ciphertext acak. Administrator database tidak memiliki cara untuk membaca naskah tersebut.

---

## SLIDE 14: ALUR PENGGUNAAN 4 - DEKRIPSI PENERIMA & LOG PENGAWASAN UNIT
* **Judul Slide**: Operasional Pengguna: Pengaksesan Penerima, Disposisi & Pengawasan
* **Alur Penggunaan (Penerimaan, Dekripsi & Disposisi)**:
  1. **Notifikasi Surat Masuk**: Penerima menerima pemberitahuan naskah dinas baru di dashboard-nya.
  2. **Pemeriksaan Klirens ABAC**: Sistem mengevaluasi apakah `Clearance Level` penerima memenuhi indeks kerahasiaan surat (`RAHASIA` / `TERBATAS`).
  3. **Verifikasi PIN / MFA**: Penerima menginput PIN 6-digit pribadi atau Kode OTPKEY Authenticator.
  4. **Dekripsi Lokal Browser (RAM)**:
     - Kunci privat X25519 penerima dibuka oleh PIN, lalu mendekripsi amplop DEK.
     - DEK mendekripsi payload surat langsung di memori penjelajah (*browser RAM*).
     - Berkas fisik dapat diunduh secara nyata dalam bentuk teks/PDF hasil dekripsi (`_DECRYPTED.txt`).
  5. **Disposisi & Log Pengawasan**:
     - Kepala Unit (`HEAD_OF_UNIT`) dapat memberikan instruksi disposisi terenkripsi kepada staf.
     - Kepala Unit dapat memantau seluruh aktivitas personilnya (login, dekripsi, unduhan) secara real-time via tab **"Log Pengawasan Unit"**.

---

## SLIDE 15: HASIL AUDIT CHAIN & KESIMPULAN
* **Judul Slide**: Verifikasi Rantai Hash Imutabel & Rangkuman Akhir
* **1. Cryptographic Hash Chaining Audit Trail**:
  - Setiap tindakan (Login, Dekripsi, Unduh, Tanda Tangan) dicatat dengan rumus:
    $$\text{Current Hash} = \text{SHA-256}(\text{Log ID} \parallel \text{Action} \parallel \text{Actor} \parallel \text{Timestamp} \parallel \text{Previous Hash})$$
  - Menjamin jejak log tidak dapat dimanipulasi atau dihapus oleh siapapun.
* **2. Kesimpulan Akhir**:
  - **Keamanan Mutlak E2E**: Integrasi AES-256-GCM, X25519, dan Ed25519 terbukti menutup celah kebocoran data internal dan eksternal.
  - **Segmentasi Hak Akses Ketat**: Peran `ADMIN` dan `AUDITOR` terisolasi penuh dari membaca surat dinas, mempertahankan prinsip *Least Privilege* & *Separation of Duties*.
  - **Siap Produksi**: Pengujian kompilasi 100% bersih, mendukung eksekusi lokal cepat (*Staging Fallback*) maupun penyebaran kontainer produksi riil (*Docker Compose*).
