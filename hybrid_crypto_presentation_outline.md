# Kerangka Presentasi Kriptografi Hibrida SecureOffice-AI
Dokumen ini dirancang khusus untuk dibaca oleh **NotebookLM** guna menghasilkan materi presentasi visual berkinerja tinggi mengenai sistem keamanan korespondensi digital SecureOffice-AI.

---

## Slide 1: Judul Presentasi
* **Judul**: Implementasi Kriptografi Hibrida Zero-Trust untuk Keamanan Korespondensi Digital pada Administrasi Publik
* **Sub-judul**: Studi Kasus Pengamanan Naskah Dinas & PDF Terenkripsi Platform SecureOffice-AI
* **Poin Paparan**:
  * Pengenalan pembicara (Alba Pejabat - Departemen Keamanan Informasi).
  * Fokus paparan: Penggabungan cipher simetris berkecepatan tinggi dengan pertukaran kunci asimetris kurva eliptik modern untuk menciptakan ekosistem persuratan pemerintahan yang nir-bocor.

---

## Slide 2: Latar Belakang & Masalah Utama
* **Judul Slide**: Celah Keamanan Tata Naskah Dinas Elektronik (TNDE) Tradisional
* **Poin Utama**:
  * **Ilusi TLS (Transport Layer Security)**: TLS hanya mengenkripsi data saat transit di jaringan. Begitu sampai di server, data disimpan dalam bentuk plaintext di database atau direktori file.
  * **Ancaman Administrator Database (DBA)**: DBA internal atau peretas yang berhasil mengambil alih server database memiliki akses mutlak untuk membaca seluruh dokumen negara berklasifikasi rahasia.
  * **Modifikasi Berkas Ilegal**: Database konvensional tidak mendeteksi jika integritas file PDF surat dinas dimanipulasi secara langsung di level biner penyimpanan.

---

## Slide 3: Konsep Kunci: Zero-Trust Hybrid Cryptography
* **Judul Slide**: Apa itu Kriptografi Hibrida Tingkat Dokumen?
* **Poin Utama**:
  * **Pemisahan Data dan Kunci**: Mengamankan dokumen langsung pada objeknya (*object-level encryption*) sebelum disimpan di datastore.
  * **Prinsip Hybrid**:
    * **Simetris**: Menggunakan kunci sekali pakai (dinamis) untuk mengenkripsi isi surat/file PDF secara cepat (efisiensi).
    * **Asimetris**: Melindungi kunci sekali pakai tersebut menggunakan kunci publik penerima surat (distribusi aman).
  * **Hasil Akhir**: Database hanya menyimpan dokumen terenkripsi dan kunci terbungkus. Pihak selain pengirim dan penerima yang sah tidak akan bisa membacanya.

---

## Slide 4: Enkripsi Simetris Dokumen (AES-256-GCM)
* **Judul Slide**: Pengamanan Payload Menggunakan Cipher Blok AES-256-GCM
* **Poin Utama**:
  * **Data Encryption Key (DEK)**: Setiap surat dinas baru memicu pembangkitan kunci simetris 256-bit acak secara dinamis oleh generator kriptografis aman (`crypto/rand`).
  * **AEAD (Authenticated Encryption with Associated Data)**: Menjamin kerahasiaan (*confidentiality*) dan otentikasi data dalam satu langkah operasi.
  * **Komputasi Matematika GHASH**:
    * Polinomial pereduksi biner Galois Field $GF(2^{128})$:
      $$g(x) = x^{128} + x^7 + x^2 + x + 1$$
    * Fungsi perkalian Galois Field berulang untuk otentikasi integritas data:
      $$X_i = (X_{i-1} \oplus C_i) \cdot H \pmod{g(x)}$$
      di mana sub-kunci $H = \text{AES}_{DEK}(0^{128})$.

---

## Slide 5: Pembungkusan Kunci Penerima (X25519)
* **Judul Slide**: Distribusi Kunci Aman Melalui Key Wrapping X25519
* **Poin Utama**:
  * **Montgomery Curve X25519**: Memanfaatkan kurva eliptik modern berkecepatan tinggi dengan tingkat keamanan tinggi:
    $$y^2 = x^3 + 486662x^2 + x \pmod{2^{255} - 19}$$
  * **Mekanisme Pembungkusan**:
    * Kunci simetris DEK dibungkus (*wrapped*) menggunakan kunci publik X25519 milik penerima target $\rightarrow$ menghasilkan `Symmetric Envelope Key`.
    * Hanya pemilik kunci privat pasangan ($priv_{rec}$) penerima yang dapat membuka bungkus kunci untuk mendekripsi berkas.
  * **Resistensi Serangan**: X25519 dirancang bebas dari jebakan waktu komputasi (*timing-attack free*).

---

## Slide 6: Proteksi Identitas & Kunci Privat (Ed25519 & PBKDF2)
* **Judul Slide**: Otentisitas Tanda Tangan & Pengamanan Kunci Privat
* **Poin Utama**:
  * **Tanda Tangan Digital Resmi (Ed25519)**:
    * Pejabat pengirim menandatangani dokumen menggunakan kurva Edwards terpuntir:
      $$-x^2 + y^2 = 1 - \frac{121665}{121666}x^2y^2$$
    * Menjamin aspek otentisitas (*authenticity*) pengirim dan anti-penyangkalan (*non-repudiation*).
  * **Enkripsi Kunci Privat di Browser (PBKDF2)**:
    * Kunci privat penerima tidak boleh disimpan dalam plaintext di browser storage.
    * Kunci privat dienkripsi lokal menggunakan kunci yang diturunkan dari PIN keamanan 6-digit pejabat via PBKDF2:
      $$DK = \text{PBKDF2}(\text{HMAC-SHA256}, \text{PIN}, \text{Salt}, 10000, 256)$$

---

## Slide 7: Kepatuhan Terhadap Standar Kriptografi Formal
* **Judul Slide**: Standarisasi Keamanan Internasional dan Kepatuhan BSSN
* **Poin Utama**:
  * **FIPS PUB 197 / NIST SP 800-38D**: Kepatuhan terhadap standar enkripsi militer AES-256 dan protokol verifikasi integritas GCM.
  * **RFC 7748 / RFC 8032**: Standar IETF untuk pertukaran kunci Curve25519 dan algoritma EdDSA.
  * **Kepatuhan Kriptografi Nasional (BSSN)**:
    * Penggunaan ECC Curve25519 (kunci 256-bit) setara dengan proteksi **RSA 3072-bit hingga RSA 4096-bit**.
    * Memenuhi syarat hukum tata kelola informasi bersandi dan klasifikasi dokumen **RAHASIA** di Indonesia.

---

## Slide 8: Hasil Pengujian Performa Komputasi (Go Subsystem)
* **Judul Slide**: Kecepatan Eksekusi Layanan Kripto (Go Crypto-Service)
* **Poin Utama**:
  * Hasil benchmark runtime pemrosesan enkripsi amplop (*envelope encryption*):
    * **Ukuran 100 KB**: 1,65 ms (Symmetric: 0.08 ms, Asymmetric: 1.57 ms)
    * **Ukuran 1 MB**: 1,92 ms (Symmetric: 0.35 ms, Asymmetric: 1.57 ms)
    * **Ukuran 5 MB**: 2,79 ms (Symmetric: 1.22 ms, Asymmetric: 1.57 ms)
    * **Ukuran 10 MB**: 4,02 ms (Symmetric: 2.45 ms, Asymmetric: 1.57 ms)
    * **Ukuran 50 MB**: 13,46 ms (Symmetric: 11.89 ms, Asymmetric: 1.57 ms)
  * **Analisis**: Operasi asimetris (X25519 & Ed25519) berdurasi konstan ($\approx$ 1.57 ms) karena hanya memproses parameter kunci berukuran tetap.

---

## Slide 9: Uji Ketahanan Manipulasi & Efisiensi Sistem
* **Judul Slide**: Validasi Integritas Data & Efisiensi Memori
* **Poin Utama**:
  * **Simulasi Serangan DBA Aktif**:
    * Sistem mensimulasikan modifikasi paksa pada representasi biner berkas PDF terenkripsi langsung di database.
    * Penerima secara otomatis menolak berkas dengan memunculkan kesalahan otentikasi:
      `decryption authentication failed (tampered data or wrong key)`.
  * **Efisiensi Sumber Daya vs RSA-4096**:
    * Memotong beban komputasi penandatanganan hingga **85\%**.
    * Mengurangi penggunaan alokasi memori heap hingga **70\%**, sangat ramah terhadap akses browser seluler.

---

## Slide 10: Kesimpulan & Agenda Riset Masa Depan
* **Judul Slide**: Kesimpulan & Post-Quantum Cryptography (PQC)
* **Poin Utama**:
  * **Keamanan Mutlak E2E**: Kombinasi AES-256-GCM, X25519, dan Ed25519 menutup rapat celah kebocoran di level database admin dan mitigasi spionase siber.
  * **Kecepatan Tinggi**: Overhead pemrosesan kripto di bawah 5 ms untuk dokumen standar 10 MB menjamin kepuasan pengguna.
  * **Rencana Mendatang**: Integrasi algoritma pasca-kuantum (*Post-Quantum Cryptography*) berbasis Kyber dan Dilithium untuk menangkal ancaman pemecahan kunci asimetris oleh superkomputer kuantum masa depan.
