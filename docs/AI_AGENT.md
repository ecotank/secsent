# Spesifikasi Agentic AI & Machine Learning (AI_AGENT.md): SecureOffice-AI

## 1. Arsitektur Sub-sistem Agentic AI
Sub-sistem **AI Service** (`/ai-service`) pada SecureOffice-AI mengombinasikan **Model Machine Learning Klasik/NLP** untuk klasifikasi cepat dengan **Arsitektur Multi-Agentic AI Otonom** untuk pemindaian risiko, audit kepatuhan, dan rekomendasi proteksi keamanan.

```
                         [Draft Naskah Dinas]
                                  │
                                  ▼
                 ┌─────────────────────────────────┐
                 │  ML Document Classifier Agent   │
                 │  (Fast NLP Categorization)      │
                 └────────────────┬────────────────┘
                                  │
                                  ▼
                 ┌─────────────────────────────────┐
                 │  PII Redaction & Sanitizer      │
                 │  (Privacy Preserving Layer)     │
                 └────────────────┬────────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              ▼                                       ▼
┌──────────────────────────┐             ┌──────────────────────────┐
│  AI Risk Analyzer Agent  │             │  Compliance Auditor Agent│
│  (Data Leakage & Anomaly)│             │  (Tata Naskah Dinas)     │
└─────────────┬────────────┘             └────────────┬─────────────┘
              │                                       │
              └───────────────────┬───────────────────┘
                                  │
                                  ▼
                 ┌─────────────────────────────────┐
                 │   Security Recommender Agent    │
                 │   (Classification & Encryption) │
                 └────────────────┬────────────────┘
                                  │
                                  ▼
                 ┌─────────────────────────────────┐
                 │  Human-in-the-Loop (HITL) Gate  │
                 │  (Persetujuan Pejabat/Sekretaris│
                 └─────────────────────────────────┘
```

---

## 2. Peran & Spesifikasi Setiap AI Agent

### 2.1 Agent 1: ML Document Classifier Agent
- **Fungsi**: Memprediksi kategori naskah dinas (misal: *Surat Edaran*, *Nota Dinas*, *Surat Keputusan*, *Surat Undangan*) dan indeks urgensi secara instan.
- **Model**: Fine-tuned BERT / RoBERTa / FastText classifier.
- **Input Contract (JSON)**:
```json
{
  "letter_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "raw_text_content": "Diberitahukan kepada seluruh Kepala Unit Kerja untuk menghadiri rapat koordinasi...",
  "sender_unit_code": "UK-SEC-001"
}
```
- **Output Contract (JSON)**:
```json
{
  "letter_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "predicted_category": "SURAT_UNDANGAN",
  "confidence_score": 0.98,
  "predicted_urgency": "BIASA"
}
```

---

### 2.2 Agent 2: AI Risk Analyzer Agent
- **Fungsi**: Memindai konten naskah dinas untuk mendeteksi potensi kebocoran informasi sensitif (PII, nomor rekening, rahasia negara, data finansial, atau frasa berisiko tinggi).
- **Model**: Local LLM (Llama-3 / Mistral via vLLM) dengan teknik *Zero-Shot Chain-of-Thought (CoT)*.
- **Input Contract (JSON)**:
```json
{
  "letter_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "sanitized_text_content": "Rencana anggaran proyek rahasia kode ALPHA sebesar Rp [REDACTED] juta...",
  "category": "NOTA_DINAS",
  "sender_unit_clearance": "CONFIDENTIAL"
}
```
- **Output Contract (JSON)**:
```json
{
  "letter_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "risk_score": 7.85,
  "risk_level": "HIGH",
  "detected_risk_entities": [
    {
      "entity_type": "PROJECT_SECRET_CODE",
      "phrase": "ALPHA",
      "risk_impact": "Potential leak of unreleased operational code"
    },
    {
      "entity_type": "FINANCIAL_BUDGET",
      "phrase": "anggaran proyek",
      "risk_impact": "Contains budget allocation details"
    }
  ],
  "anomaly_flag": false
}
```

---

### 2.3 Agent 3: Compliance Auditor Agent
- **Fungsi**: Memeriksa kesesuaian format surat dinas terhadap aturan Tata Naskah Dinas Elektronik (TNDE) resmi (kelengkapan kop, nomor surat, tanggal, perihal, dan struktur penutup).
- **Model**: Rule-based Validator + LLM Structured Parser.
- **Input Contract (JSON)**:
```json
{
  "letter_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "header_metadata": {
    "letter_number": "ND/102/UK-SEC/2026",
    "date": "2026-07-19",
    "subject": "Rapat Koordinasi Anggaran"
  }
}
```
- **Output Contract (JSON)**:
```json
{
  "letter_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "compliance_status": "WARNING",
  "missing_elements": ["LAMPIRAN_COUNT_EXPLICIT"],
  "recommendations": [
    "Tambahkan jumlah lampiran secara eksplisit pada bagian header."
  ]
}
```

---

### 2.4 Agent 4: Security Recommender Agent
- **Fungsi**: Menggabungkan hasil dari *Classifier*, *Risk Analyzer*, dan *Compliance Auditor* untuk memformulasikan rekomendasi final terkait **Klasifikasi Kerahasiaan Surat** (`BIASA`, `TERBATAS`, `RAHASIA`, `SANGAT_RAHASIA`) serta jenis enkripsi dan batasan penerima disposisi.
- **Model**: Autonomous Agent (LangGraph Controller).
- **Input Contract (JSON)**:
```json
{
  "letter_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "classifier_output": { "predicted_category": "NOTA_DINAS" },
  "risk_output": { "risk_score": 7.85, "risk_level": "HIGH" },
  "compliance_output": { "compliance_status": "WARNING" }
}
```
- **Output Contract (JSON)**:
```json
{
  "letter_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "recommended_classification": "RAHASIA",
  "required_encryption": "HYBRID_AES_256_GCM_ED25519",
  "disposition_restriction": "RESTRICT_TO_UNIT_HEAD_ONLY",
  "action_summary": "Surat direkomendasikan naik klasifikasi menjadi RAHASIA karena memuat anggaran proyek rahasia ALPHA."
}
```

---

## 3. Workflow Agentic AI & Human-in-the-Loop (HITL)

### 3.1 Alur Kerja Otonom Multi-Agent (Execution Pipeline)
1. **Penyusunan Draft**: Pengguna menyusun draft surat pada frontend.
2. **Triggering AI Pipeline**: Setelah diklik "Proses AI", `backend` mengirimkan event payload ke `ai-service`.
3. **Tahap 1 - Sanitasi PII**: Teks surat dipindai; informasi identitas pribadi (PII) diredam secara otomatis sebelum diproses oleh model LLM.
4. **Tahap 2 - Eksekusi Pararel**: `ML Classifier Agent` dan `Compliance Auditor Agent` berjalan secara paralel.
5. **Tahap 3 - Evaluasi Risiko**: `AI Risk Analyzer Agent` menerima konteks yang telah disanitasi dan menghitung skor risiko kebocoran data.
6. **Tahap 4 - Formulasi Rekomendasi**: `Security Recommender Agent` mengevaluasi seluruh output dan menghasilkan keputusan rekomendasi tingkat kerahasiaan.

### 3.2 Gate Human-in-the-Loop (HITL) Safety Control
- AI Agent **TIDAK PERNAH** secara sepihak mengubah atau menandatangani surat dinas tanpa persetujuan manusia.
- Rekomendasi AI ditampilkan pada dashboard Pejabat/Sekretaris dalam bentuk **Security Advisory Card**.
- Pejabat dapat menyetujui (*Approve*) atau mengesampingkan (*Override*) rekomendasi AI dengan memberikan alasan yang akan dicatat dalam `audit_logs`.

### 3.3 AI Fallback & Fail-Safe Strategy (Handling Latency & Service Degradation)
- **Hard Timeout**: Ditetapkan batas waktu eksekusi maksimum **5.0 detik** untuk pemrosesan AI Pipeline.
- **Fail-Open Policy**: Jika `ai-service` mengalami *timeout*, *service offline*, atau *GPU Out-Of-Memory (OOM)*:
  1. Backend Core tidak memblokir alur persuratan dinas.
  2. Sistem menetapkan klasifikasi default sementara: `BIASA` dengan flag `AI_SCAN_SKIPPED`.
  3. Dashboard Pejabat menyajikan pemberitahuan: *"Pemindaian AI Otomatis Terlewati (Service Timeout) - Diperlukan Peninjauan Manual oleh Pejabat berwenang"*.
  4. Kejadian kegagalan AI dicatat secara otomatis dalam `audit_logs` untuk pemantauan tim IT/Security.

---

## 4. Proteksi Terhadap Prompt Injection & Kebocoran Context
1. **Strict System Prompt Isolation**: Menggunakan format instrumen terpisah (System Message vs User Message) yang tidak dapat ditembus oleh manipulasi teks surat.
2. **Secondary Output Scanner**: Output JSON dari agen AI dipindai oleh skema validator sebelum diparse oleh sistem backend untuk mencegah injeksi kode/skrip.
3. **Private Local Inferencing**: Seluruh eksekusi LLM dijalankan di dalam server internal terisolasi (vLLM / Ollama) tanpa pernah mengirim teks surat ke API cloud pihak ketiga.
