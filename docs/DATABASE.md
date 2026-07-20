# Desain Database (DATABASE.md): SecureOffice-AI

## 1. Skema Relasi Database (ERD Blueprint)

Secara arsitektural, **SecureOffice-AI** memisahkan penyimpanan data menjadi 4 area:
1. **Relational Core Data (PostgreSQL)**
2. **Key & Signature Management Data (Encrypted Storage / KMS Metadata)**
3. **AI Embeddings & Vector Index (Qdrant / PGVector)**
4. **Encrypted Blob Payload (MinIO / S3)**

Berikut adalah diagram keterhubungan antar tabel dalam PostgreSQL:

```text
  ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
  │   work_units    │1     N│      users      │1     N│ hybrid_key_pairs│
  ├─────────────────┤───────┼─────────────────┤───────┼─────────────────┤
  │ id (PK)         │       │ id (PK)         │       │ id (PK)         │
  │ unit_code       │       │ work_unit_id(FK)│       │ user_id (FK)    │
  │ unit_name       │       │ email           │       │ public_key_pem  │
  └────────┬────────┘       └────────┬────────┘       └────────┬────────┘
           │1                        │1                        │1
           │                         │                         │
           │N                        │N                        │N
  ┌────────▼────────┐       ┌────────▼────────┐       ┌────────▼────────┐
  │     letters     │1     N│  dispositions   │       │digital_signatures│
  ├─────────────────┤───────┼─────────────────┤       ├─────────────────┤
  │ id (PK)         │       │ id (PK)         │       │ id (PK)         │
  │ letter_number   │       │ letter_id (FK)  │       │ letter_id (FK)  │
  │ sender_unit(FK) │       │ sender_user(FK) │       │ signer_user(FK) │
  │ status          │       │ target_unit(FK) │       │ signer_key(FK)  │
  └────────┬────────┘       │ target_user(FK) │       └─────────────────┘
           │                └─────────────────┘
           │1
           ├─────────────────────────┬─────────────────────────┬─────────────────────────┐
          N│                        N│                        N│                        N│
  ┌────────▼────────┐       ┌────────▼────────┐       ┌────────▼────────┐       ┌────────▼────────┐
  │letter_recipients│       │letter_attachment│       │ ai_risk_analyses│       │   audit_logs    │
  ├─────────────────┤       ├─────────────────┤       ├─────────────────┤       ├─────────────────┤
  │ id (PK)         │       │ id (PK)         │       │ id (PK)         │       │ id (PK)         │
  │ letter_id (FK)  │       │ letter_id (FK)  │       │ letter_id (FK)  │       │ letter_id (FK)  │
  │ recipient_unit  │       │ blob_path       │       │ risk_score      │       │ previous_hash   │
  │ recipient_type  │       │ encrypted_key   │       │ action_taken    │       │ current_hash    │
  └─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 2. Rincian Tabel, Relasi, dan Atribut

### 2.1 Tabel `work_units` (Unit Kerja)
Menyimpan struktur organisasi dan unit kerja pengirim/penerima surat dinas.
- **`id`**: `UUID` (Primary Key, Unique)
- **`unit_code`**: `VARCHAR(50)` (Unique, Indexed) - Kode unik unit kerja (misal: `UK-SEC-001`).
- **`unit_name`**: `VARCHAR(255)` - Nama resmi unit kerja.
- **`parent_unit_id`**: `UUID` (Foreign Key -> `work_units.id`, Nullable) - Hirarki unit kerja.
- **`security_clearance_level`**: `VARCHAR(32)` - Tingkat kewenangan unit (misal: `UNCLASSIFIED`, `RESTRICTED`, `CONFIDENTIAL`, `SECRET`).
- **`created_at`**: `TIMESTAMPTZ` - Waktu pembuatan record.

### 2.2 Tabel `users` (Pengguna / Pejabat)
Menyimpan identitas pejabat dan staf yang mengoperasikan sistem persuratan.
- **`id`**: `UUID` (Primary Key, Unique)
- **`work_unit_id`**: `UUID` (Foreign Key -> `work_units.id`) - Unit kerja pengguna.
- **`username`**: `VARCHAR(100)` (Unique, Indexed)
- **`email`**: `VARCHAR(255)` (Unique)
- **`password_hash`**: `VARCHAR(255)` (Argon2id Hash, Column Encrypted)
- **`full_name`**: `VARCHAR(255)`
- **`nip_nik`**: `VARCHAR(50)` (Unique) - Nomor Induk Pegawai.
- **`role`**: `VARCHAR(50)` (Enum: `ADMIN`, `HEAD_OF_UNIT`, `SECRETARY`, `STAFF`, `AUDITOR`).
- **`clearance_level`**: `VARCHAR(32)` (Enum: `UNCLASSIFIED`, `RESTRICTED`, `CONFIDENTIAL`, `SECRET`) - Tingkat kewenangan individu.
- **`mfa_secret`**: `VARCHAR(255)` (Column Encrypted) - Secret TOTP MFA.
- **`is_active`**: `BOOLEAN` (Default: `true`)
- **`created_at`**: `TIMESTAMPTZ`

### 2.3 Tabel `hybrid_key_pairs` (Pasangan Kunci Kriptografi Hibrida)
Menyimpan kunci publik dan metadata pasangan kunci asimetris pengguna/unit kerja.
- **`id`**: `UUID` (Primary Key, Unique)
- **`user_id`**: `UUID` (Foreign Key -> `users.id`)
- **`algorithm`**: `VARCHAR(50)` (misal: `Ed25519`, `X25519`, `RSA-4096`, `ML-DSA-PQC`, `ML-KEM-PQC`)
- **`public_key_pem`**: `TEXT` - Kunci Publik dalam format PEM.
- **`encrypted_private_key`**: `TEXT` (Column Encrypted - AES-256-GCM dengan Kunci Master KMS/HSM).
- **`key_fingerprint`**: `VARCHAR(128)` (SHA-256 Hash Kunci Publik)
- **`status`**: `VARCHAR(20)` (Enum: `ACTIVE`, `REVOKED`, `EXPIRED`)
- **`valid_until`**: `TIMESTAMPTZ`

### 2.4 Tabel `letters` (Surat Dinas)
Menyimpan metadata dasar naskah dinas. Konten fisik dienkripsi dan disimpan dalam blob storage.
- **`id`**: `UUID` (Primary Key, Unique)
- **`letter_number`**: `VARCHAR(100)` (Unique, Indexed) - Nomor resmi surat dinas (Generated by Letter Numbering Engine).
- **`subject_encrypted`**: `BYTEA` (Column Encrypted - AES-256-GCM) - Perihal surat.
- **`classification`**: `VARCHAR(50)` (Enum: `BIASA`, `TERBATAS`, `RAHASIA`, `SANGAT_RAHASIA`) - Indeks Kerahasiaan.
- **`category`**: `VARCHAR(50)` - Jenis naskah dinas (misal: `SURAT_EDARAN`, `NOTA_DINAS`, `SURAT_KEPUTUSAN`).
- **`sender_unit_id`**: `UUID` (Foreign Key -> `work_units.id`)
- **`encrypted_content_path`**: `VARCHAR(512)` - URILink ke file ciphertext di MinIO/S3.
- **`symmetric_envelope_key`**: `TEXT` (Enkripsi Kunci Simetris Surat menggunakan Public Key Penerima & Pengirim via X25519/ML-KEM).
- **`content_hash`**: `VARCHAR(128)` (SHA-256 Hash dari dokumen asli sebelum dikirim).
- **`status`**: `VARCHAR(32)` (Enum: `DRAFT`, `AI_REVIEWING`, `PENDING_SIGNATURE`, `SIGNED`, `SENT`, `RECEIVED`, `DISPOSED`, `ARCHIVED`, `NEED_REVISION`, `REJECTED`)
- **`revision_notes_encrypted`**: `BYTEA` (Column Encrypted, Nullable) - Catatan revisi/penolakan dari pimpinan.
- **`created_at`**: `TIMESTAMPTZ`
- **`updated_at`**: `TIMESTAMPTZ`

### 2.5 Tabel `letter_recipients` (Penerima & Tembusan Surat)
Menyimpan multi-penerima utama dan tembusan (CC) untuk sebuah surat dinas.
- **`id`**: `UUID` (Primary Key, Unique)
- **`letter_id`**: `UUID` (Foreign Key -> `letters.id`)
- **`recipient_unit_id`**: `UUID` (Foreign Key -> `work_units.id`)
- **`recipient_type`**: `VARCHAR(20)` (Enum: `PRIMARY`, `CC`, `BCC`) - Jenis penerima.
- **`received_at`**: `TIMESTAMPTZ` (Nullable)

### 2.6 Tabel `letter_attachments` (Lampiran Surat)
Menyimpan metadata lampiran surat terenkripsi.
- **`id`**: `UUID` (Primary Key, Unique)
- **`letter_id`**: `UUID` (Foreign Key -> `letters.id`)
- **`file_name_encrypted`**: `BYTEA` (Column Encrypted)
- **`blob_storage_path`**: `VARCHAR(512)`
- **`file_size_bytes`**: `BIGINT`
- **`encrypted_attachment_key`**: `TEXT` (Envelope Key)
- **`file_hash`**: `VARCHAR(128)`

### 2.7 Tabel `dispositions` (Disposisi Surat)
Menyimpan catatan penanganan dan pengarahan surat antar pejabat, unit kerja, atau staf spesifik.
- **`id`**: `UUID` (Primary Key, Unique)
- **`letter_id`**: `UUID` (Foreign Key -> `letters.id`)
- **`sender_user_id`**: `UUID` (Foreign Key -> `users.id`) - Pejabat pemberi disposisi.
- **`target_unit_id`**: `UUID` (Foreign Key -> `work_units.id`, Nullable) - Unit kerja penerima disposisi.
- **`target_user_id`**: `UUID` (Foreign Key -> `users.id`, Nullable) - Staf spesifik penerima instruksi disposisi.
- **`instruction_encrypted`**: `BYTEA` (Column Encrypted) - Isi petunjuk disposisi.
- **`urgency_level`**: `VARCHAR(20)` (Enum: `BIASA`, `SEGERA`, `AMAT_SEGERA`)
- **`disposition_date`**: `TIMESTAMPTZ`

### 2.8 Tabel `digital_signatures` (Tanda Tangan Digital)
Menyimpan bukti sah verifikasi tanda tangan pejabat pada surat dinas.
- **`id`**: `UUID` (Primary Key, Unique)
- **`letter_id`**: `UUID` (Foreign Key -> `letters.id`)
- **`signer_user_id`**: `UUID` (Foreign Key -> `users.id`)
- **`signer_key_id`**: `UUID` (Foreign Key -> `hybrid_key_pairs.id`) - Kunci sertifikat publik yang digunakan.
- **`signature_algorithm`**: `VARCHAR(50)` (misal: `Ed25519`, `RSA-4096-PSS`, `ML-DSA-PQC`)
- **`signature_bytes`**: `BYTEA` - Data tanda tangan digital.
- **`timestamp_token`**: `BYTEA` - Proof Timestamping Kriptografis terverifikasi.
- **`signed_at`**: `TIMESTAMPTZ`

### 2.8 Tabel `ai_risk_analyses` (Analisis Risiko & Rekomendasi Agentic AI)
Menyimpan hasil evaluasi dari sub-sistem Agentic AI.
- **`id`**: `UUID` (Primary Key, Unique)
- **`letter_id`**: `UUID` (Foreign Key -> `letters.id`)
- **`predicted_category`**: `VARCHAR(50)` - Hasil klasifikasi ML.
- **`risk_score`**: `NUMERIC(4,2)` - Skor risiko kebocoran data (skala 0.00 - 10.00).
- **`detected_pii_entities`**: `JSONB` - Daftar entitas sensitif terdeteksi (masked).
- **`recommended_classification`**: `VARCHAR(50)` - Rekomendasi tingkat kerahasiaan dari agen AI.
- **`compliance_status`**: `VARCHAR(20)` (Enum: `COMPLIANT`, `WARNING`, `NON_COMPLIANT`)
- **`analyzed_at`**: `TIMESTAMPTZ`

### 2.9 Tabel `audit_logs` (Jejak Audit Tamper-Evident Chain)
Menyimpan catatan histori transaksi persuratan yang terikat hash secara saling berurutan (Cryptographic Hash Chaining).
- **`id`**: `BIGSERIAL` (Primary Key)
- **`letter_id`**: `UUID` (Foreign Key -> `letters.id`, Nullable)
- **`actor_user_id`**: `UUID` (Foreign Key -> `users.id`)
- **`action`**: `VARCHAR(100)` (misal: `CREATE_DRAFT`, `AI_SCAN`, `SIGN_LETTER`, `DISPOSE`, `READ`)
- **`ip_address`**: `VARCHAR(45)`
- **`user_agent`**: `VARCHAR(255)`
- **`previous_hash`**: `VARCHAR(128)` - SHA-256 Hash dari baris audit log sebelumnya.
- **`current_hash`**: `VARCHAR(128)` - SHA-256 Hash dari (`id` + `action` + `timestamp` + `actor_user_id` + `previous_hash`).
- **`timestamp`**: `TIMESTAMPTZ` (Default: `NOW()`)
