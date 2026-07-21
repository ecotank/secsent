# SecureOffice-AI
> **Platform Persuratan Dinas Digital Enterprise Berbasis Zero-Trust, Kriptografi Hibrida & Agentic AI**

SecureOffice-AI adalah aplikasi web persuratan dinas digital terstruktur antar-unit kerja yang dirancang dengan arsitektur **Zero-Trust**, enkripsi hibrida (**AES-256-GCM + X25519**), tanda tangan digital **Ed25519**, serta perlindungan cerdas berorientasi **Multi-Agentic AI Subsystem**.

---

## 🏛️ Arsitektur Ekosistem Layanan (4-Tier Architecture)

```
                       ┌──────────────────────────────────────────┐
                       │     Frontend Client SPA (React TS)       │
                       │             Port :5173                   │
                       └────────────────────┬─────────────────────┘
                                            │ REST / JWT Auth
                                            ▼
                       ┌──────────────────────────────────────────┐
                       │     Backend Core Service (Go)            │
                       │             Port :8080                   │
                       └───────────┬──────────────────┬───────────┘
                                   │                  │
            gRPC / REST            │                  │ REST Inter-service
       ┌───────────────────────────┘                  └──────────────────────────┐
       ▼                                                                         ▼
┌─────────────────────────────┐                                   ┌─────────────────────────────┐
│ Crypto Service (Go)         │                                   │ AI Subsystem Service (Py)   │
│ Port :8081                  │                                   │ Port :8000                  │
│ • Ed25519 Digital Signature │                                   │ • ML Document Classifier    │
│ • X25519 Key Exchange       │                                   │ • PII Redaction Sanitizer   │
│ • AES-256-GCM Envelope      │                                   │ • AI Risk Analyzer Agent    │
└─────────────────────────────┘                                   │ • Security Recommender      │
                                                                  └─────────────────────────────┘
```

---

## 🚀 Fitur Unggulan Sistem (Production-Grade)

### 1. Core Correspondence System (Prioritas 1)
- **Letter Numbering Engine**: Pembuat nomor surat resmi otomatis berurutan per unit dan tahun: `{KodeJenis}/{Sequence:03d}/{KodeUnit}/{BulanRomawi}/{Tahun}` (misal: `ND/001/UK-SEC-001/VII/2026`).
- **Multi-Recipients & CC**: Pengiriman surat ke multi-unit kerja penerima utama (`PRIMARY`), tembusan (`CC`), dan kerahasiaan (`BCC`).
- **Workflow Disposisi Pimpinan**: Pendelegasian instruksi surat dinas dari Kepala Unit / Sekretaris ke staf pelaksana target.

### 2. Security & Cryptography Layer (Prioritas 2)
- **Hybrid Envelope Encryption**: Enkripsi naskah dinas menggunakan **AES-256-GCM** dengan pembungkus Kunci Asimetris **X25519**.
- **Digital Signature Engine**: Tanda tangan digital resmi pejabat menggunakan **Ed25519 (EdDSA)** dengan timestamp token & pembuktian integritas.
- **Tamper-Evident Audit Trail**: Log aktivitas terantai SHA-256 ($\text{CurrentHash} = \text{SHA-256}(\text{Action} \parallel \text{Actor} \parallel \text{Timestamp} \parallel \text{PrevHash})$).
- **RBAC & ABAC Access Control**: Pengaturan hak akses berdasarkan Role (`ADMIN`, `HEAD_OF_UNIT`, `SECRETARY`, `STAFF`, `AUDITOR`) dan Clearance Level (`UNCLASSIFIED`, `RESTRICTED`, `CONFIDENTIAL`, `SECRET`).
- **Zero-Trust Screen Protection**: **Auto Inactivity 3-Minute Idle Lock**, **Zero-Trust 6-Digit PIN Re-Authentication Modal**, dan **Dynamic Translucent Security Watermarking**.

### 3. Multi-Agentic AI Subsystem (Prioritas 3)
- **Agent 1: ML Document Classifier**: Categorization instan jenis naskah & urgensi.
- **Privacy-Preserving PII Sanitizer**: Redaksi otomatis NIK/NIP, nomor telepon, email, & nominal rupiah sebelum diolah AI.
- **Agent 2: AI Risk Analyzer**: Pemindaian skor risiko kebocoran data (0.00–10.00).
- **Agent 3: Compliance Auditor**: Pemeriksa kesesuaian format TNDE.
- **Agent 4: Security Recommender**: Pengambil keputusan rekomendasi klasifikasi kerahasiaan untuk HITL Security Advisory Card.
- **Fail-Open Hard Timeout (5.0s)**: Penanganan kondisi darurat jika AI mengalami kecacatan service.

---

## 📖 Production Deployment & Operational Security Guide

### 1. Konfigurasi Rahasia Environment Production (`.env`)
Salin `.env.example` ke `.env` pada server produksi dan atur nilai rahasia produksi:
```env
APP_ENV=production
APP_PORT=8080
JWT_SECRET=GANTI_DENGAN_RANDOM_SECRET_MINIMAL_64_KARAKTER_PRODUKSI
DATABASE_URL=postgres://secureoffice_user:PasswordKuatProduksi@localhost:5432/secureoffice_db?sslmode=verify-full
CRYPTO_SERVICE_URL=http://localhost:8081/api/v1/crypto
AI_SERVICE_URL=http://localhost:8000/api/v1/ai
```

### 2. Eksekusi DDL Migration Basis Data PostgreSQL
```bash
# Eksekusi migrasi DDL 10 tabel & ENUM types
psql -U secureoffice_user -d secureoffice_db -f database/migrations/000001_init_schema.up.sql

# Masukkan data awal unit kerja & akun administrator instansi
psql -U secureoffice_user -d secureoffice_db -f database/seeds/000001_seed_initial_data.sql
```

### 3. Menjalankan Docker Compose Production Cluster
```bash
docker-compose -f docker-compose.yml up -d --build
```

### 4. Konfigurasi HTTPS / TLS Termination Reverse Proxy (Nginx)
Atur Nginx sebagai Reverse Proxy dengan sertifikat TLS kedinasan:
```nginx
server {
    listen 443 ssl http2;
    server_name persuratan.instansi.go.id;

    ssl_certificate /etc/ssl/certs/persuratan.crt;
    ssl_certificate_key /etc/ssl/private/persuratan.key;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;

    location / {
        proxy_pass http://localhost:5173;
    }

    location /api/v1/ {
        proxy_pass http://localhost:8080/api/v1/;
    }
}
```

---

## 📂 Struktur Repository

```text
SecureOffice-AI/
├── docs/                      # Dokumentasi Spesifikasi & Arsitektur Sistem (100% Mature)
│   ├── PROJECT_SPEC.md        # Spesifikasi Kebutuhan Bisnis & Aturan Persuratan
│   ├── ARCHITECTURE.md       # Arsitektur Microservices & Diagram Komponen
│   ├── DATABASE.md            # Skema Relasional 10 Tabel & Migration Specs
│   ├── SECURITY.md            # Kebijakan Kriptografi Hibrida & Matrix RBAC
│   ├── AI_AGENT.md            # Arsitektur Multi-Agentic AI & Fallback Strategy
│   ├── SECURE_SDLC.md         # Framework Pengembangan Perangkat Lunak Aman
│   └── DEVELOPMENT_RULES.md   # Standar Bahasa Pemrograman & Konvensi Kode
├── backend/                   # Backend Core Service (Go)
├── crypto-service/            # High-Isolation Crypto Service (Go)
├── ai-service/                # AI Subsystem Service (Python FastAPI)
├── frontend/                  # Frontend Client Web SPA (React TS + Glassmorphic Vanilla CSS)
├── database/                  # DDL Migrations & Seed Data (PostgreSQL)
├── tests/                     # Automated E2E & Security Audit Test Suite
└── docker-compose.yml         # Container Orchestration
```

---

## 📄 Lisensi & Hak Cipta
SecureOffice-AI © 2026. Hak Cipta Dilindungi Undang-Undang.
