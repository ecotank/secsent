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

## 🚀 Fitur Unggulan Sistem

### 1. Core Correspondence System (Prioritas 1)
- **Letter Numbering Engine**: Pembuat nomor surat resmi otomatis berurutan per unit dan tahun: `{KodeJenis}/{Sequence:03d}/{KodeUnit}/{BulanRomawi}/{Tahun}` (misal: `ND/001/UK-SEC-001/VII/2026`).
- **Multi-Recipients & CC**: Pengiriman surat ke multi-unit kerja penerima utama (`PRIMARY`), tembusan (`CC`), dan kerahasiaan (`BCC`).
- **Workflow Disposisi Pimpinan**: Pendelegasian instruksi surat dinas dari Kepala Unit / Sekretaris ke staf pelaksana target.

### 2. Security & Cryptography Layer (Prioritas 2)
- **Hybrid Envelope Encryption**: Enkripsi naskah dinas menggunakan **AES-256-GCM** dengan pembungkus Kunci Asimetris **X25519**.
- **Digital Signature Engine**: Tanda tangan digital resmi pejabat menggunakan **Ed25519 (EdDSA)** dengan timestamp token & pembuktian integritas.
- **Tamper-Evident Audit Trail**: Log aktivitas terantai SHA-256 ($\text{CurrentHash} = \text{SHA-256}(\text{Action} \parallel \text{Actor} \parallel \text{Timestamp} \parallel \text{PrevHash})$).
- **RBAC & ABAC Access Control**: Pengaturan hak akses berdasarkan Role (`ADMIN`, `HEAD_OF_UNIT`, `SECRETARY`, `STAFF`, `AUDITOR`) dan Clearance Level (`UNCLASSIFIED`, `RESTRICTED`, `CONFIDENTIAL`, `SECRET`).

### 3. Multi-Agentic AI Subsystem (Prioritas 3)
- **Agent 1: ML Document Classifier**: Categorization instan jenis naskah & urgensi.
- **Privacy-Preserving PII Sanitizer**: Redaksi otomatis NIK/NIP, nomor telepon, email, & nominal rupiah sebelum diolah AI.
- **Agent 2: AI Risk Analyzer**: Pemindaian skor risiko kebocoran data (0.00–10.00).
- **Agent 3: Compliance Auditor**: Pemeriksa kesesuaian format TNDE.
- **Agent 4: Security Recommender**: Pengambil keputusan rekomendasi klasifikasi kerahasiaan untuk HITL Security Advisory Card.
- **Fail-Open Hard Timeout (5.0s)**: Penanganan kondisi darurat jika AI mengalami kecacatan service.

---

## 🛠️ Panduan Memulai & Pengoperasian (Quick Start)

### 1. Prasyarat Sistem
- **Docker & Docker Compose**
- **Go 1.22+**
- **Python 3.10+**
- **Node.js 18+**

### 2. Mengaktifkan Infrastruktur Basis Data
```bash
# Jalankan PostgreSQL 16, Redis, MinIO S3, dan Qdrant
docker-compose up -d
```

### 3. Jalankan Backend Core Service (:8080)
```bash
cd backend
go run cmd/api/main.go
```

### 4. Jalankan Crypto Service (:8081)
```bash
cd crypto-service
go run cmd/api/main.go
```

### 5. Jalankan AI Subsystem Service (:8000)
```bash
cd ai-service
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 6. Jalankan Frontend Client SPA (:5173)
```bash
cd frontend
npm install
npm run dev
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
