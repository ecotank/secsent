# Arsitektur Sistem (ARCHITECTURE.md): SecureOffice-AI

## 1. Arsitektur Umum Aplikasi
**SecureOffice-AI** mengadopsi arsitektur **Decoupled Microservices berbasis Event-Driven** yang dirancang sesuai prinsip **Zero-Trust Security Architecture**. Setiap komponen layanan terisolasi dalam *security boundary* masing-masing dan berkomunikasi melalui protokol aman terenkripsi (mTLS / HTTPS).

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                             PRESENTATION LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │    Frontend Client Web SPA (React / Next.js + WebCrypto API Engine)         │  │
│  └──────────────────────────────────────┬──────────────────────────────────────┘  │
└─────────────────────────────────────────┼─────────────────────────────────────────┘
                                          │ HTTPS / TLS 1.3 / WSS
┌─────────────────────────────────────────▼─────────────────────────────────────────┐
│                             API GATEWAY & SECURITY MESH                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │    Reverse Proxy, Rate Limiter, WAF, OAuth2/OIDC Auth Filter, TLS Offload  │  │
│  └───────────┬──────────────────────────┬──────────────────────────┬───────────┘  │
└──────────────┼──────────────────────────┼──────────────────────────┼──────────────┘
               │ mTLS                     │ mTLS                     │ mTLS
┌──────────────▼─────────────┐ ┌──────────▼─────────────┐ ┌──────────▼─────────────┐
│     BACKEND CORE SERVICE   │ │     CRYPTO SERVICE     │ │      AI SERVICE        │
│  ┌──────────────────────┐  │ │  ┌──────────────────┐  │ │  ┌──────────────────┐  │
│  │ - Letter Lifecycle   │  │ │  │ - Hybrid Enkripsi│  │ │  │ - ML Classifier  │  │
│  │ - Disposisi Routing  │  │ │  │   (AES-256 +     │  │ │  │ - Multi-Agent AI  │  │
│  │ - RBAC / ABAC        │  │ │  │    Ed25519/PQC)  │  │ │  │   Risk Analyzer   │  │
│  │ - Audit Log Engine   │  │ │  │ - Digital Sign   │  │ │  │ - RAG Vector Pipe │  │
│  └───────────┬──────────┘  │ │  │ - KMS/HSM Module │  │ │  └───────────┬──────┘  │
└──────────────┼─────────────┘ └───────────┬──────────┘ └──────────────┼─────────────┘
               │                           │                           │
┌──────────────▼───────────────────────────▼───────────────────────────▼─────────────┐
│                             DATA & PERSISTENCE LAYER                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────┐  │
│  │  PostgreSQL   │  │  Redis Cache  │  │ Qdrant Vector │  │ MinIO Blob Storage  │  │
│  │  (Relational) │  │  (Session/Pub)│  │ (Embeddings)  │  │ (Ciphertext Blobs)  │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  └─────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Rincian Komponen Utama

### 2.1 Frontend (`/frontend`)
- **Fungsi Utama**: Antarmuka pengguna (UI/UX) responsif berestetika tinggi untuk manajemen persuratan dinas, penyusunan draft, pelacakan disposisi, dan pembuatan tanda tangan digital.
- **Teknologi**: React / Next.js, TypeScript, Vanilla CSS design tokens, dan HTML5 WebCrypto API.
- **Fitur Keamanan Frontend**:
  - **Client-Side Cryptographic Engine**: Melakukan hashing SHA-256 dan enkripsi awal dokumen di peramban sebelum dikirim ke API Gateway.
  - **Content Security Policy (CSP) Strict**: Mencegah serangan Cross-Site Scripting (XSS) dan Data Exfiltration.
  - **Zero Local Plaintext Storage**: Token autentikasi disimpan dalam Cookie `HttpOnly`, `Secure`, dan `SameSite=Strict`.

### 2.2 Backend Core Service (`/backend`)
- **Fungsi Utama**: Pusat orkestrasi bisnis persuratan, pengurusan alur disposisi antar unit kerja, penegakan otorisasi, generator nomor surat otomatis, dan perekaman jejak audit imutabel.
- **Teknologi Utama**: **Go (Golang)** (pilihan standar produksi untuk performa tinggi, memori aman, concurrency native, dan eksekusi latensi rendah).
- **Sub-Modul Utama**:
  1. *Letter & Disposition Engine*: Mengatur alur status surat (Draft, AI Reviewing, Pending Signature, Signed, Sent, Received, Disposed, Archived, Need Revision, Rejected).
  2. *Policy Decision Point (PDP)*: Mengevaluasi kebijakan RBAC dan ABAC berdasarkan peran pengguna, unit kerja, dan tingkat kerahasiaan surat.
  3. *Audit Log Dispatcher*: Merekam setiap transaksi ke dalam struktur data *Hash Chaining* (Tamper-Evident Chain).

### 2.3 Crypto Service (`/crypto-service`)
- **Fungsi Utama**: Layanan microservice terisolasi tinggi (*high-isolation microservice*) yang khusus menangani seluruh operasi kriptografi hibrida dan manajemen kunci.
- **Teknologi Utama**: **Rust / Go** dengan binding ke PKCS#11 untuk integrasi Hardware Security Module (HSM) / AWS KMS / HashiCorp Vault.
- **Operasi Kriptografi Hibrida (Hybrid Cryptography Operations)**:
  - **Symmetric Encryption Engine**: Menggunakan **AES-256-GCM** atau **ChaCha20-Poly1305** untuk mengenkripsi payload dan lampiran surat dinas berukuran besar secara cepat.
  - **Envelope Key Exchange Engine (Asymmetric Encryption)**: Menggunakan **X25519** / **RSA-4096-OAEP** / **ML-KEM (Kyber)** untuk mengenkripsi kunci simetris (*Data Encryption Key - DEK*) ke kunci publik penerima dan pengirim.
  - **Digital Signature Engine**: Menggunakan **Ed25519** / **RSA-4096-PSS** / **ML-DSA (Dilithium)** untuk penandatanganan dan verifikasi **Tanda Tangan Digital Resmi** pejabat.
  - **Post-Quantum Cryptography (PQC) Readiness**: Menyiapkan modul hibrida berbasis standar NIST PQC (ML-KEM / ML-DSA) untuk mengantisipasi ancaman dekripsi komputasi kuantum di masa depan.

### 2.4 AI Service (`/ai-service`)
- **Fungsi Utama**: Layanan cerdas yang memproses Machine Learning klasifikasi surat serta mengorkestrasi sistem **Multi-Agentic AI** untuk analisis risiko dan keamanan.
- **Teknologi**: Python, PyTorch, vLLM / Ollama (Local LLM Execution), LangGraph / CrewAI untuk arsitektur multi-agent, Qdrant / PGVector untuk Vector Database.
- **Komponen Utama**:
  1. *Machine Learning Document Classifier*: Pipeline NLP (TF-IDF + Fine-tuned BERT/RoBERTa) untuk mengklasifikasikan jenis naskah dinas dan indeks prioritas secara instan.
  2. *Agentic AI Risk & Security Subsystem*: Jaringan agen AI independen (*Classifier Agent*, *Risk Analyzer Agent*, *Security Recommender Agent*, dan *Compliance Auditor Agent*) yang bekerja secara berurutan maupun paralel.
  3. *Privacy-Preserving RAG (Retrieval-Augmented Generation)*: Ingesti data terenkripsi dengan pemindaian PII (Personally Identifiable Information) Redaction sebelum dibuat vektor embedding-nya.

### 2.5 Database & Persistence Layer (`/database`)
- **PostgreSQL**: Datastore utama berorientasi ACID untuk menyimpan metadata surat, unit kerja, pengguna, sertifikat digital, dan catatan log terikat hash.
- **Redis**: In-memory store untuk caching kebijakan akses, rate limiting, serta broker pesan pub/sub real-time untuk notifikasi surat masuk.
- **Qdrant / PGVector**: Vector Database terisolasi tempat penyimpanan dokumen embeddings terpolarisasi per unit kerja.
- **MinIO / Amazon S3 Object Storage**: Storage terenkripsi untuk menyimpan ciphertext naskah dinas dan dokumen lampiran (hanya ciphertext yang tersimpan di disk).

---

## 3. Protokol Komunikasi Inter-Service
1. **External Client ↔ API Gateway**: HTTPS (TLS 1.3) dan Secure WebSockets (WSS).
2. **API Gateway ↔ Backend / Crypto / AI Service**: gRPC over mTLS (Mutual TLS dengan sertifikat internal terotentikasi).
3. **Internal Event Messaging**: Event Bus berbasis NATS / Kafka terenkripsi untuk pengiriman sinyal pemrosesan dokumen latar belakang (background processing).
