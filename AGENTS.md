# SecureOffice-AI
# AI Agent Operational Guidelines (`AGENTS.md`)

## Dokumen Pedoman Kerja AI Coding Assistant

Dokumen ini berisi aturan operasional bagi seluruh AI Coding Assistant yang bekerja pada repository SecureOffice-AI.

AI Agent yang bekerja pada proyek ini meliputi:

- Antigravity Agent
- OpenCode Agent
- Trae Agent
- Sub-agent pengembangan
- Automated coding assistant lainnya


Seluruh AI Agent WAJIB mengikuti aturan dalam dokumen ini sebelum:

- membuat kode;
- melakukan perubahan struktur;
- melakukan refactor;
- menambahkan dependency;
- mengubah arsitektur.


---

# 1. Identitas Proyek


## 1.1 Nama Proyek

SecureOffice-AI


## 1.2 Tujuan Utama

SecureOffice-AI adalah aplikasi web pengiriman dan pengelolaan surat dinas digital antar unit kerja yang dirancang untuk menyediakan komunikasi dokumen organisasi secara:

- aman;
- terstruktur;
- terdokumentasi;
- dapat diaudit;
- didukung kecerdasan buatan.


Sistem harus mampu mendukung:

- pembuatan surat dinas;
- pengiriman surat antar unit kerja;
- penerimaan surat;
- disposisi surat;
- pengelolaan arsip;
- pengaturan hak akses;
- perlindungan dokumen;
- analisis dokumen berbasis AI.


---

# 2. Prinsip Dasar Proyek


## 2.1 Sistem Persuratan adalah Fokus Utama

Seluruh AI Agent harus memahami bahwa:

SecureOffice-AI adalah:

> Sistem persuratan digital yang diperkuat dengan keamanan dan kecerdasan buatan.


Bukan:

- chatbot AI;
- aplikasi AI document generator;
- sistem enkripsi murni;
- sistem penyimpanan file.


Setiap fitur yang dibuat harus memiliki hubungan langsung dengan kebutuhan pengelolaan surat dinas.


---

# 3. Hierarki Prioritas Pengembangan


Ketika terjadi konflik antara fitur, gunakan urutan prioritas berikut:


## Prioritas 1: Core Correspondence System

Fokus utama:

- pengguna;
- unit kerja;
- surat masuk;
- surat keluar;
- pengiriman surat;
- penerimaan surat;
- disposisi;
- arsip;
- pencarian dokumen.


Tanpa modul ini, sistem belum dapat disebut aplikasi persuratan.


---

## Prioritas 2: Security Layer

Keamanan adalah komponen wajib.


Meliputi:

- authentication;
- authorization;
- access control;
- document protection;
- audit trail.


---

## Prioritas 3: AI Enhancement Layer

AI digunakan untuk meningkatkan kemampuan sistem.


Meliputi:

- klasifikasi surat;
- analisis risiko dokumen;
- rekomendasi keamanan;
- bantuan administrasi.


AI bukan pengganti workflow utama.


---

# 4. Peran AI Agent Dalam Proyek


Setiap AI Agent memiliki tanggung jawab berbeda.


# 4.1 Antigravity Agent

Peran:

System Architect dan Research Assistant.


Tugas:

- memahami kebutuhan sistem;
- membantu desain arsitektur;
- melakukan analisis teknologi;
- membantu dokumentasi;
- melakukan review konsep.


Antigravity tidak menjadi developer utama.


---

# 4.2 OpenCode Agent

Peran:

Primary Implementation Engineer.


Tugas:

- implementasi kode;
- membuat modul aplikasi;
- memperbaiki bug;
- membuat testing;
- melakukan integrasi.


OpenCode wajib mengikuti:

- dokumentasi proyek;
- struktur repository;
- aturan keamanan.


---

# 4.3 Trae Agent

Peran:

Security Reviewer dan Quality Assurance.


Tugas:

- melakukan code review;
- mencari vulnerability;
- melakukan debugging;
- melakukan pengujian keamanan;
- memberikan rekomendasi perbaikan.


Trae tidak boleh melakukan perubahan besar tanpa memahami arsitektur.


---

# 5. Aturan Membaca Dokumentasi


Sebelum melakukan coding, AI Agent WAJIB membaca dokumentasi terkait.


Urutan membaca:


1. `docs/PROJECT_SPEC.md`

Tujuan:

Memahami:

- kebutuhan bisnis;
- tujuan sistem;
- ruang lingkup.


---

2. `docs/ARCHITECTURE.md`

Tujuan:

Memahami:

- struktur aplikasi;
- hubungan antar service;
- batas modul.


---

3. `docs/DATABASE.md`

Tujuan:

Memahami:

- struktur data;
- relasi tabel;
- aturan penyimpanan.


---

4. `docs/SECURITY.md`

Tujuan:

Memahami:

- kebijakan keamanan;
- ancaman;
- mitigasi.


---

5. `docs/AI_AGENT.md`

Tujuan:

Memahami:

- fungsi agent;
- batas kemampuan AI;
- workflow AI.


---

6. `docs/SECURE_SDLC.md`

Tujuan:

Memahami:

- proses pengembangan aman;
- testing;
- evaluasi keamanan.


---

# 6. Aturan Struktur Repository


Pertahankan struktur berikut:

SecureOffice-AI/
├── docs/
│
├── frontend/
│
├── backend/
│
├── ai-service/
│
├── crypto-service/
│
├── tests/
│
├── README.md
│
└── AGENTS.md


Jangan membuat struktur baru tanpa alasan yang jelas.


Jika struktur berubah:

WAJIB memperbarui dokumentasi.


---

# 7. Aturan Pemisahan Modul


## Frontend


Frontend bertanggung jawab:

- tampilan;
- interaksi pengguna;
- komunikasi API.


Frontend tidak boleh:

- mengakses database;
- menyimpan credential;
- melakukan keputusan keamanan.


---

## Backend


Backend bertanggung jawab:

- business logic;
- user management;
- workflow surat;
- permission;
- API.


Backend menjadi sumber kebenaran untuk:

- validasi;
- akses;
- transaksi.


---

## AI Service


AI Service bertanggung jawab:

- analisis;
- prediksi;
- rekomendasi.


AI Service tidak boleh:

- mengubah dokumen resmi;
- mengirim surat otomatis;
- memberikan akses dokumen.


---

## Crypto Service


Crypto Service bertanggung jawab:

- enkripsi;
- dekripsi;
- hashing;
- signature.


Crypto Service tidak boleh:

- menangani business workflow;
- menentukan permission pengguna.


---

# 8. Aturan Keamanan Wajib


Semua implementasi harus mengikuti prinsip:


## Authentication

Wajib memperhatikan:

- keamanan password;
- token management;
- session security.


---

## Authorization

Wajib menggunakan:

- Role-Based Access Control (RBAC);
- prinsip least privilege.


Pengguna hanya boleh mengakses dokumen sesuai kewenangan.


---

## Document Security


Dokumen surat harus memperhatikan:

- confidentiality;
- integrity;
- authenticity.


Dilarang:

- menyimpan dokumen sensitif secara terbuka;
- melewati pemeriksaan akses.


---

# 9. Aturan Implementasi Kriptografi


AI Agent harus mengikuti aturan:


Dilarang:

- membuat algoritma kriptografi sendiri;
- menyimpan key dalam kode;
- menggunakan metode tidak standar.


Wajib:

- menggunakan library terpercaya;
- memisahkan crypto logic;
- menjaga keamanan key.


---

# 10. Aturan Agentic AI


AI Agent dalam aplikasi hanya berfungsi sebagai:

- asisten;
- analis;
- pemberi rekomendasi.


AI boleh:

- mengklasifikasi surat;
- memberikan risk assessment;
- memberikan rekomendasi tujuan;
- memberikan saran keamanan.


AI tidak boleh:

- mengirim surat tanpa persetujuan;
- mengubah isi surat;
- menghapus surat;
- mengubah hak akses;
- mengambil keputusan administratif final.


Semua keputusan penting tetap membutuhkan validasi manusia.


---

# 11. Aturan Machine Learning


Model AI harus memiliki:

- tujuan yang jelas;
- data yang sesuai;
- proses preprocessing;
- evaluasi performa.


Setiap model harus memiliki dokumentasi:

- dataset;
- metode;
- parameter;
- hasil evaluasi.


---

# 12. Aturan Coding


Setiap kode harus:


- mudah dibaca;
- modular;
- memiliki dokumentasi;
- memiliki error handling;
- mengikuti standar bahasa pemrograman.


Dilarang:

- membuat kode duplikat;
- menghapus fitur tanpa alasan;
- melakukan perubahan besar tanpa analisis.


---

# 13. Aturan Database


Database harus:


- memiliki schema jelas;
- menggunakan migration;
- memiliki relasi yang benar;
- menjaga integritas data.


Dilarang:

- menyimpan password plaintext;
- menghapus data tanpa mekanisme;
- mengubah schema tanpa dokumentasi.


---

# 14. Aturan Testing


Setiap fitur wajib diuji.


Jenis testing:


## Functional Testing

Memastikan:

- fitur berjalan;
- workflow surat sesuai.


## Security Testing

Memastikan:

- tidak ada akses ilegal;
- permission berjalan;
- dokumen aman.


## AI Testing

Memastikan:

- prediksi;
- klasifikasi;
- rekomendasi.


---

# 15. Aturan Dependency


Sebelum menambahkan library baru:

AI Agent harus:

- menjelaskan alasan;
- memastikan kompatibilitas;
- mempertimbangkan keamanan.


Jangan menambahkan dependency hanya karena mempermudah coding.


---

# 16. Aturan Perubahan Sistem


Sebelum melakukan perubahan besar:


WAJIB:

1. Memahami dampak perubahan.
2. Memastikan tidak merusak fitur lama.
3. Memperbarui dokumentasi.


Dilarang:

- mengganti arsitektur tanpa alasan;
- menghapus modul keamanan;
- mengubah teknologi utama secara tiba-tiba.


---

# 17. Definition of Done


Sebuah fitur dianggap selesai jika:


✓ Implementasi selesai

✓ Testing berhasil

✓ Dokumentasi diperbarui

✓ Tidak melanggar keamanan

✓ Tidak merusak fitur lain


---

# 18. Prinsip Akhir AI Agent


Setiap AI Agent harus selalu mengingat:


SecureOffice-AI bukan sekadar aplikasi CRUD.


Tujuan akhirnya adalah:

"Membangun sistem pengiriman surat dinas digital antar unit kerja yang aman, terpercaya, dan cerdas melalui penerapan software engineering, kriptografi, machine learning, dan agentic AI."


Prioritas keputusan:

1. Keamanan
2. Kebenaran fungsi
3. Maintainability
4. Dokumentasi
5. Optimasi