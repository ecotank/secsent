# Siklus Pengembang Perangkat Lunak Aman (SECURE_SDLC.md): SecureOffice-AI

## 1. Kerangka Kerja Secure SDLC (Shift-Left Security)
**SecureOffice-AI** menerapkan pendekatan **Shift-Left Security**, yang berarti keamanan diintegrasikan sejak awal fase ideasi dan desain, bukan ditambahkan di akhir sebagai pengujian pasca-produksi.

```
+─────────────────+    +─────────────────+    +─────────────────+    +─────────────────+    +─────────────────+
| 1. Security     |───►| 2. Threat       |───►| 3. Secure       |───►| 4. Automated    |───►| 5. Security     |
|   Requirements  |    |    Modeling     |    |    Coding       |    |    Testing      |    |    Deployment   |
+─────────────────+    +─────────────────+    +─────────────────+    +─────────────────+    +─────────────────+
```

---

## 2. Fase & Aturan Secure SDLC

### 2.1 Fase 1: Security Requirements (Kebutuhan Keamanan)
Sebelum kode apa pun ditulis, setiap kebutuhan fitur baru wajib mendefinisikan **Kriteria Keamanan Minimum (Security Acceptance Criteria)**:
- **Prinsip Least Privilege**: Pengguna hanya diberikan wewenang terkecil yang diperlukan untuk menyelesaikan tugasnya.
- **Defensive Data Handling**: Setiap input dari luar dianggap berbahaya sampai terbukti aman melalui sanitasi dan validasi tipe data yang ketat.
- **Kepatuhan Regulasi**: Kepatuhan terhadap aturan perlindungan data pribadi (UU PDP / GDPR) dan standar kriptografi nasional/internasional.

---

### 2.2 Fase 2: Threat Modeling (Pemodelan Ancaman Berulang)
- **STRIDE Methodology**: Dilakukan pada fase perancangan setiap modul baru (`frontend`, `backend`, `ai-service`, `crypto-service`).
- **Data Flow Diagrams (DFD) Analysis**: Mengidentifikasi *trust boundaries*, titik entri data, dan lokasi penyimpanan ciphertext vs plaintext.
- **Tinjauan Kriptografi**: Pemilihan algoritma kriptografi hibrida (AES-256-GCM + Ed25519) wajib ditinjau oleh Cybersecurity Architect.

---

### 2.3 Fase 3: Secure Coding Guidelines (Panduan Pemrograman Aman)
Seluruh pengembang (manusia maupun AI Coding Assistant) wajib mematuhi standar pemrograman aman:

1. **Pencegahan Injection (SQL, Command, Prompt Injection)**:
   - Penggunaan *Parameterized Queries* / ORM eksplisit (tidak boleh ada konkatenasi string pada SQL query).
   - Sanitasi teks surat sebelum dikirim ke `ai-service` guna mencegah *Prompt Injection*.
2. **Pencegahan Kebocoran Kunci & Rahasia (No Hardcoded Secrets)**:
   - Dilarang keras menanamkan (hardcode) API key, token, private key, atau kata sandi di dalam repositori kode.
   - Semua rahasia wajib dimuat via Variabel Lingkungan (`.env`) atau HashiCorp Vault / KMS.
3. **Penanganan Memori Kriptografi Aman**:
   - Penghapusan variabel kunci privat dari memori RAM (*zeroization*) setelah operasi penandatanganan/dekripsi selesai di `crypto-service`.
4. **Validasi Input Strict**:
   - Penggunaan pustaka skema validasi (misal: Zod / Pydantic / Go Validator) pada seluruh titik entri API Gateway.

---

### 2.4 Fase 4: Security Testing & Gate Verification (Pengujian Keamanan Otomatis)
Setiap *Pull Request (PR)* yang diajukan ke cabang utama wajib melewati **Security Pipeline CI/CD** dengan gerbang kelulusan (*Quality Gates*) yang ketat:

```text
               ┌─────────────────────────────────────────┐
               │    Pull Request (PR) Submitted          │
               └────────────────────┬────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│     Secret Scan       │ │      SAST Scan        │ │       SCA Scan        │
│ (Trufflehog/Gitleaks) │ │  (Semgrep/SonarQube)  │ │    (Trivy/Snyk)       │
└───────────┬───────────┘ └───────────┬───────────┘ └───────────┬───────────┘
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      │
                                      ▼
                       ┌─────────────────────────────┐
                       │  Pass All Quality Gates?    │
                       └──────────────┬──────────────┘
                                      │
                       ┌──────────────┴──────────────┐
                       │ YES                         │ NO
                       ▼                             ▼
         ┌───────────────────────────┐ ┌───────────────────────────┐
         │  DAST & Fuzzing (Staging) │ │    PR Blocked & Alert     │
         │   (OWASP ZAP / Cryptofuzz)│ │   to Security Officer     │
         └───────────────────────────┘ └───────────────────────────┘
```

#### Komponen Pengujian Keamanan:
1. **Secret Scanning (Trufflehog / Gitleaks)**: Memindai setiap commit untuk memastikan tidak ada kunci atau token yang tidak sengaja terdorong ke git history.
2. **Static Application Security Testing (SAST)**: Memindai kode sumber terhadap kerentanan OWASP Top 10 dan CWE Top 25 menggunakan Semgrep dan SonarQube.
3. **Software Composition Analysis (SCA)**: Memindai pustaka/dependensi pihak ketiga (`package.json`, `go.mod`, `requirements.txt`) terhadap CVE berbahaya menggunakan Trivy / Snyk.
4. **Dynamic Application Security Testing (DAST)**: Pemindaian otomatis pada lingkungan staging menggunakan OWASP ZAP untuk mendeteksi celah keamanan runtime.
5. **Cryptographic Fuzzing**: Pengujian input acak ekstrem pada `crypto-service` untuk menjamin tidak ada kelemahan parsing sertifikat atau crash memori.

---

### 2.5 Fase 5: Deployment Keamanan & Pemantauan Operasional
- **Signatur Kontainer (Container Signing)**: Citra kontainer Docker ditandatangani menggunakan **Cosign / Notary** sebelum di-deploy ke Kubernetes Cluster.
- **Runtimes Security & WAF**: Pemantauan lalu lintas aplikasi secara real-time menggunakan Web Application Firewall (WAF) dan eBPF-based runtime security (Falco).
- **SLA Perbaikan Kerentanan (Vulnerability Patching SLA)**:
  - **Critical (CVSS 9.0 - 10.0)**: Wajib ditambal dalam 24 jam.
  - **High (CVSS 7.0 - 8.9)**: Wajib ditambal dalam 7 hari.
  - **Medium (CVSS 4.0 - 6.9)**: Wajib ditambal dalam 30 hari.
