# Spesifikasi Keamanan (SECURITY.md): SecureOffice-AI

## 1. Pendekatan Keamanan Zero-Trust
**SecureOffice-AI** menerapkan arsitektur **Zero-Trust ("Never Trust, Always Verify")**. Setiap permintaan API, transaksi dokumen, hingga interaksi AI diperlakukan seolah-olah berasal dari jaringan yang berpotensi berbahaya.

---

## 2. Authentication (Autentikasi Pengguna & Layanan)
- **Identity Provider (IdP) & SSO**: Integrasi dengan OAuth 2.0 / OpenID Connect (OIDC) enterprise (Okta, Azure AD, Keycloak).
- **Multi-Factor Authentication (MFA) Wajib**:
  - **FIDO2 / WebAuthn Hardware Keys** (YubiKey) untuk pejabat penandatangan berwenang tinggi.
  - **TOTP (Time-based One-Time Password)** untuk seluruh pengguna internal.
- **Session Management**:
  - Penggunaan JSON Web Token (JWT) berumur pendek (*Short-lived Access Token*, < 15 menit) yang ditandatangani menggunakan algoritma `Ed25519` / `RS256`.
  - Token penyegaran (*Refresh Token*) disimpan dalam Cookie HTTP-only, `Secure`, dan `SameSite=Strict` dengan proteksi Sliding Window & Automatic Revocation pada pemicuan anomali.
- **mTLS Service-to-Service Auth**: Komunikasi internal antar microservices (`backend`, `crypto-service`, `ai-service`) diotorisasi menggunakan sertifikat Mutual TLS dengan rotasi kunci otomatis.

---

## 3. Authorization (Otorisasi Akses Persuratan)
SecureOffice-AI mengombinasikan **Role-Based Access Control (RBAC)** dan **Attribute-Based Access Control (ABAC)** untuk penegakan akses persuratan dinas.

### 3.1 Role-Based Access Control (RBAC)
- **`ADMIN`**: Pengelolaan konfigurasi sistem, unit kerja, dan log audit tanpa akses ke plaintext surat.
- **`HEAD_OF_UNIT`**: Berwenang menandatangani surat dinas resmi, memberikan disposisi, dan membuka surat klasifikasi Rahasia/Sangat Rahasia unitnya.
- **`SECRETARY`**: Berwenang membuat draft surat, menerima surat masuk unit, dan menyiapkan lampiran.
- **`STAFF`**: Membaca surat dan melaksanakan petunjuk disposisi yang ditugaskan secara eksplisit.
- **`AUDITOR`**: Akses *read-only* ke log audit terenkripsi dan dashboard kepatuhan.

### 3.2 Attribute-Based Access Control (ABAC)
Kebijakan akses dievaluasi secara dinamis berdasarkan 4 matriks atribut:
1. **User Attributes**: `work_unit_id`, `clearance_level`, `role`.
2. **Resource Attributes**: `letter_classification` (`BIASA`, `TERBATAS`, `RAHASIA`, `SANGAT_RAHASIA`), `sender_unit_id`, `recipient_unit_id`.
3. **Action Attributes**: `READ`, `SIGN`, `DISPOSE`, `DELETE`, `EXPORT`.
4. **Environment Attributes**: `request_ip` (IP Whitelisting), `time_of_day`, `device_compliance_state`.

---

## 4. Kriptografi Hibrida & Pengelolaan Kunci (Hybrid Encryption)

### 4.1 Enkripsi Dokumen Hibrida (Envelope Encryption)
Guna menggabungkan efisiensi enkripsi simetris dengan fleksibilitas manajemen kunci enkripsi asimetris, dokumen persuratan diproses melalui skema **Hybrid Cryptography**:

```text
[Plaintext Surat Dinas] + [Random Symmetric Key (DEK: Data Encryption Key)]
                             │
                             ▼
                 AES-256-GCM / ChaCha20-Poly1305
                             │
                             ▼
                 [Ciphertext Surat Dinas]

[DEK] + [Public Key Asimetris Penerima & Pengirim (X25519 / RSA-OAEP / ML-KEM)]
                             │
                             ▼
             [Encrypted Key Envelope (Encrypted DEK)]
```

- **Data Encryption Key (DEK)**: Kunci simetris acak 256-bit dibuat secara khusus untuk setiap surat, mengenkripsi naskah dinas dan lampiran secara instan.
- **Key Encryption Key (KEK) / Asymmetric Public Key**: Kunci publik asimetris pejabat/unit kerja berbasis **X25519** / **RSA-4096-OAEP** / **ML-KEM (Kyber)** mengenkripsi DEK tersebut menjadi *Key Envelope*.
- **Post-Quantum Cryptography (PQC) Readiness**: Sistem menyiapkan lapisan algoritma **ML-KEM (Kyber)** untuk pertukaran kunci dan **ML-DSA (Dilithium)** untuk tanda tangan digital guna melindungi dari serangan komputasi kuantum mendatang.

### 4.2 Alur Data: Pemindaian AI vs Enkripsi Penyimpanan
1. **In-Transit Protection**: Draf naskah dinas dikirimkan dari frontend ke API Gateway melalui **HTTPS (TLS 1.3)**.
2. **AI Inspection Phase**: Selama tahap *AI Reviewing*, `ai-service` memproses data plaintext sementara di dalam memori server terisolasi (private local inferencing) untuk pemindaian PII & analisis risiko.
3. **Approval & Signing**: Pejabat menyetujui rekomendasi dan menandatangani dokumen menggunakan kunci privat `Ed25519`.
4. **Storage Encryption**: Setelah ditandatangani, `crypto-service` membuat DEK acak, mengenkripsi payload surat ke ciphertext, dan menyimpan ciphertext tersebut ke MinIO/S3 Object Storage. Data di disk **100% terenkripsi**.

### 4.3 Manajemen Siklus Kunci & Rotasi (Key Lifecycle & Revocation)
- Pasangan Kunci Privat Utama (*Master Private Keys*) disimpan di dalam **Hardware Security Module (HSM)** berstandar FIPS 140-2 Level 3 atau KMS Terisolasi.
- Kunci privat pengguna dienkripsi dengan **Argon2id** menggunakan frasa sandi pengguna dan disimpan terenkripsi di tabel `hybrid_key_pairs`.
- **Kebijakan Revokasi & Rotasi Kunci (Key Revocation & Re-keying)**:
  - Jika kunci publik pengguna di-revokasi (*REVOKED*) atau kadaluarsa (*EXPIRED*), kunci lama tetap diarsipkan secara aman untuk mendekripsi dokumen histori.
  - Untuk pengiriman surat baru, sistem mewajibkan penerbitan pasangan kunci baru (*Active Key Pair*).
  - *Re-keying Process*: Dokumentasi arsip sensitif dapat di-enkripsi ulang envelope key-nya (*Re-envelope*) menggunakan Kunci Master Arsip Organisasi tanpa perlu menguji ulang tanda tangan digital historis.

---

## 5. Tanda Tangan Digital Resmi (Digital Signature)
1. **Proses Penandatanganan**:
   - Hashing naskah dinas asli menggunakan `SHA-256` / `SHA-384`.
   - Pembentukan Tanda Tangan Digital menggunakan Kunci Privat Pejabat (algoritma **Ed25519** / **RSA-4096-PSS** / **ML-DSA-PQC**).
   - Sertifikat digital pejabat disematkan ke dalam metadata surat bersama Timestamp Token Kriptografis dari Timestamp Authority (TSA).
2. **Proses Verifikasi**:
   - Penerima surat memverifikasi tanda tangan dengan Kunci Publik Pejabat. Jika dokumen telah diubah 1 bit saja setelah penandatanganan, verifikasi tanda tangan akan gagal (Integrity Guarantee).

---

## 6. Audit Logging Imutabel (Tamper-Evident Hash Chaining)
Setiap transaksi persuratan dicatat dalam tabel `audit_logs` dengan mekanisme **Cryptographic Hash Chaining** (serupa dengan blockchain ringan):

$$\text{Current Hash} = \text{SHA-256}(\text{Log ID} \parallel \text{Action} \parallel \text{Actor ID} \parallel \text{Timestamp} \parallel \text{Previous Hash})$$

- Jika seorang peretas atau admin internal mengubah isi baris log pada database, seluruh hash berurutan berikutnya akan menjadi invalid.
- Sistem secara berkala mengirimkan snapshot hash log ke penyimpanan terisolasi (*WORM - Write Once Read Many*) untuk verifikasi integritas independen.

---

## 7. Pemodelan Ancaman (STRIDE Threat Model)

| Kategori Ancaman (STRIDE) | Risiko Spesifik pada SecureOffice-AI | Strategi Mitigasi & Proteksi |
|---|---|---|
| **Spoofing Identity** | Pemalsuan identitas pejabat untuk membuat/menandatangani surat dinas palsu. | MFA Wajib (FIDO2 Hardware Key), Verifikasi Tanda Tangan Digital Ed25519, OAuth2 OIDC. |
| **Tampering Data** | Mengubah isi surat dinas di database/storage saat ditransmisikan. | Hybrid AES-256-GCM Envelope Encryption, SHA-256 Checksum, Tamper-Evident Audit Logging. |
| **Repudiation** | Pejabat menyangkal telah menandatangani atau menyetujui surat dinas. | Digital Signature berbasis Asymmetric Cryptography + TSA Timestamping terverifikasi. |
| **Information Disclosure** | Kebocoran naskah dinas Rahasia akibat penyadapan jaringan atau insider threat. | End-to-End Encryption (E2EE), ABAC Strict Clearance Level, PII Redaction pada RAG AI Service. |
| **Denial of Service (DoS)** | Lonjakan lalu lintas palsu menghambat pengiriman surat dinas kritis. | Rate Limiting pada API Gateway, WAF Protection, Caching Redis, Async NATS Event Queue. |
| **Elevation of Privilege** | Staf biasa mengakses surat dinas level Rahasia milik Kepala Unit. | ABAC Enforcement di tingkat API PDP, Separasi Tugas (SoD), Isolated Microservice Boundaries. |
| **Prompt Injection (AI)** | Menyisipkan perintah jahat dalam teks surat untuk manipulasi AI Risk Analyzer. | Context Isolation, Sanitasi Input AI, Secondary Guardrail Model, No Code Execution in AI Sandbox. |
