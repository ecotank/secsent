# Kerangka Presentasi Lengkap: Kriptografi Hibrida SecureOffice-AI (15 Slide)
Dokumen ini dirancang khusus untuk dibaca oleh **NotebookLM** guna menghasilkan materi presentasi visual berkinerja tinggi mengenai sistem keamanan korespondensi digital SecureOffice-AI. Setiap slide dilengkapi dengan poin-poin utama, penjelasan detail, dan panduan visual.

---

## Slide 1: Judul Presentasi
* **Judul**: Implementasi Kriptografi Hibrida Zero-Trust untuk Keamanan Korespondensi Digital pada Administrasi Publik
* **Sub-judul**: Studi Kasus Pengamanan Naskah Dinas & PDF Terenkripsi Platform SecureOffice-AI
* **Poin Paparan**:
  * Pengenalan pembicara (Alba Pejabat - Departemen Keamanan Informasi).
  * Fokus utama paparan: Penggabungan cipher simetris berkecepatan tinggi dengan pertukaran kunci asimetris kurva eliptik modern untuk menciptakan ekosistem persuratan pemerintahan yang nir-bocor.
* **Catatan Presenter**: Sambut para audiens. Jelaskan bahwa presentasi ini akan mengupas bagaimana cara mengamankan surat dinas dari ancaman kebocoran administrator database menggunakan kriptografi hibrida.

---

## Slide 2: Latar Belakang & Masalah Utama TNDE Konvensional
* **Judul Slide**: Kerentanan Tata Naskah Dinas Elektronik (TNDE) Tradisional
* **Poin Utama**:
  * **Penyimpanan Plaintext**: Sebagian besar aplikasi persuratan menyimpan isi surat dinas dan file PDF secara terbuka di sistem penyimpanan server.
  * **Kelemahan Enkripsi Statis (TDE)**: *Transparent Data Encryption* (TDE) pada database hanya mengamankan data saat harddisk mati. Saat database server menyala, data tetap terbaca oleh admin database.
  * **Ancaman Administrator Database (DBA)**: DBA internal atau peretas yang mengompromikan akun database memiliki wewenang penuh untuk membaca seluruh dokumen negara berklasifikasi rahasia.
* **Catatan Presenter**: Tunjukkan ilustrasi bahwa hak akses database konvensional tidak membatasi admin untuk membaca dokumen sensitif secara ilegal.

---

## Slide 3: Mengapa TLS/HTTPS Saja Tidak Cukup?
* **Judul Slide**: Batasan Perlindungan Lapisan Transportasi (Transport Layer Security)
* **Poin Utama**:
  * **Hanya Mengamankan Jalur Transmisi**: TLS/HTTPS hanya membungkus data selama transit di jaringan (mencegah penyadapan kabel/jaringan wifi).
  * **Kerentanan Titik Akhir (Endpoint/Server)**: Data didekripsi menjadi plaintext sesampainya di memori server aplikasi sebelum disimpan.
  * **Serangan Man-in-the-Middle (MitM)**: Jika sertifikat SSL/TLS server dikompromikan, penyerang dapat menyadap isi surat dinas tanpa disadari.
* **Catatan Presenter**: Tekankan bahwa TLS hanyalah "pipa yang aman", namun tidak mengamankan isi dokumen di ujung pipa (server/database).

---

## Slide 4: Solusi: Arsitektur Zero-Trust di Level Dokumen
* **Judul Slide**: Filosofi "Never Trust, Always Verify" pada Tingkat Dokumen
* **Poin Utama**:
  * **Object-Level Encryption**: Setiap naskah dinas dan lampiran PDF dienkripsi secara independen sebelum dikirimkan ke database/server.
  * **Pemisahan Wewenang Kunci**: Kunci dekripsi dipegang oleh masing-masing unit kerja (klien), bukan oleh sistem database server pusat.
  * **Perlindungan End-to-End (E2E)**: Dokumen tetap terenkripsi sepanjang waktu di jaringan, server aplikasi, hingga penyimpanan penyimpanan awan.
* **Catatan Presenter**: Jelaskan konsep Zero-Trust di mana sistem memperlakukan server dan database sebagai lingkungan yang tidak aman (*untrusted environment*).

---

## Slide 5: Struktur Komponen Sistem SecureOffice-AI
* **Judul Slide**: Arsitektur Modular Mikroservice Keamanan
* **Poin Utama**:
  * **Go Backend Core**: Menangani logika bisnis, status surat dinas, penugasan disposisi, dan log transaksi.
  * **Go Crypto-Service**: Modul khusus berkinerja tinggi yang menangani pembuatan pasangan kunci kurva eliptik, enkripsi payload, dan validasi tanda tangan.
  * **FastAPI AI Agent**: Menyediakan pemindaian risiko data sensitif secara real-time, penyaringan kebocoran perihal, dan peredaksian PII secara dinamis.
* **Catatan Presenter**: Tekankan pemisahan tugas (*separation of concerns*) di mana database dan logika bisnis tidak mencampuri urusan komputasi kriptografi secara langsung.

---

## Slide 6: Komponen 1 - Enkripsi Simetris (AES-256-GCM)
* **Judul Slide**: Pengamanan Payload dengan Cipher Blok AES-256-GCM
* **Poin Utama**:
  * **Data Encryption Key (DEK)**: Setiap naskah dinas baru membangkitkan kunci simetris 256-bit unik yang acak via generator kriptografis aman (`crypto/rand`).
  * **AEAD (Authenticated Encryption with Associated Data)**: Enkripsi dan otentikasi data diproses secara simultan untuk mendeteksi manipulasi biner dokumen.
  * **Persamaan GHASH Galois Field $GF(2^{128})$**:
    $$X_i = (X_{i-1} \oplus C_i) \cdot H \pmod{g(x)}$$
    Di mana sub-kunci hash $H = \text{AES}_{DEK}(0^{128})$ dan polinomial pereduksi:
    $$g(x) = x^{128} + x^7 + x^2 + x + 1$$
* **Catatan Presenter**: Jelaskan bahwa manipulasi terkecil sekalipun pada ciphertext akan menggagalkan fungsi dekripsi karena validitas tag otentikasi 128-bit ($T$) akan rusak.

---

## Slide 7: Komponen 2 - Pembungkusan Kunci (X25519 Montgomery)
* **Judul Slide**: Distribusi Kunci Aman Melalui Key Wrapping X25519
* **Poin Utama**:
  * **Montgomery Curve X25519**: Memanfaatkan kurva eliptik modern berkecepatan tinggi dengan tingkat keamanan tinggi:
    $$y^2 = x^3 + 486662x^2 + x \pmod{2^{255} - 19}$$
  * **Mekanisme Key Wrapping**:
    * Kunci simetris DEK dibungkus (*wrapped*) menggunakan kunci publik X25519 milik penerima target $\rightarrow$ menghasilkan `Symmetric Envelope Key`.
    * Kunci yang terbungkus disimpan bersama dengan ciphertext. Hanya penerima yang memiliki kunci privat pasangan ($priv_{rec}$) yang dapat membuka bungkus kunci tersebut.
  * **Resistensi Serangan**: Operasi X25519 bebas dari jebakan waktu komputasi (*timing-attack free*).
* **Catatan Presenter**: Tekankan bahwa ini adalah jantung dari kriptografi hibrida, di mana kunci asimetris digunakan untuk menyebarkan kunci simetris secara aman.

---

## Slide 8: Komponen 3 - Otentisitas & Tanda Tangan (Ed25519)
* **Judul Slide**: Tanda Tangan Digital Resmi Berbasis Ed25519
* **Poin Utama**:
  * **Ed25519 (EdDSA)**: Menggunakan kurva Edwards terpuntir untuk menjamin integritas dan keabsahan pengirim dokumen:
    $$-x^2 + y^2 = 1 - \frac{121665}{121666}x^2y^2$$
  * **Anti-Penyangkalan (Non-Repudiation)**: Pejabat pengirim menandatangani nilai hash SHA-256 dokumen menggunakan kunci privat tanda tangan ($priv_{sig}$).
  * **Verifikasi Instan**: Penerima memvalidasi keaslian tanda tangan menggunakan kunci publik pengirim ($pub_{sig}$) yang terdaftar resmi.
* **Catatan Presenter**: Terangkan perbedaan antara coret tangan gambar biasa (mudah dipalsukan) dengan tanda tangan kriptografi Ed25519 (mustahil dipalsukan tanpa kunci privat).

---

## Slide 9: Komponen 4 - Perlindungan Kunci Sisi Klien (PBKDF2)
* **Judul Slide**: Pengamanan Kunci Privat melalui Derivasi PIN Klien
* **Poin Utama**:
  * **Enkripsi Kunci Privat Lokal**: Kunci privat asimetris tidak boleh disimpan terbuka di penyimpanan lokal browser.
  * **Metode PBKDF2**: Kunci privat dienkripsi secara lokal menggunakan kunci derivasi dari PIN 6-digit pejabat via PBKDF2:
    $$DK = \text{PBKDF2}(\text{HMAC-SHA256}, \text{PIN}, \text{Salt}, 10000, 256)$$
  * **Integrasi TOTP (MFA)**: Autentikasi 6-digit TOTP dinamis (refresh tiap 30 detik) memperkuat otorisasi login dan dekripsi surat berklasifikasi Rahasia.
* **Catatan Presenter**: Jelaskan bahwa jika penyerang mencuri file lokal browser, mereka tetap tidak bisa membaca kunci privat tanpa menebak PIN 6-digit pengguna.

---

## Slide 10: Peran Kecerdasan Buatan (AI Multi-Agent Subsystem)
* **Judul Slide**: Pindai Otomatis & Klasifikasi Risiko Naskah Dinas
* **Poin Utama**:
  * **Debounced Auto-Scan**: AI memindai secara otomatis 600 ms setelah pengetikan selesai atau saat berkas PDF diunggah.
  * **Klasifikasi Kepatuhan & Kebocoran**: Mendeteksi penyimpangan format formalitas surat tata naskah dinas ANRI serta mendeteksi kebocoran data rahasia pada kolom perihal.
  * **Skor Risiko Kebocoran Kredensial**:
    $$S = 1.00 + (H_m \times 2.50) + (M_m \times 1.20)$$
    Dokumen dengan skor $S \geq 7.50$ langsung ditandai dengan klasifikasi **RAHASIA** dan wajib dienkripsi.
* **Catatan Presenter**: Tunjukkan bagaimana AI membantu pengguna mencegah kesalahan administratif (seperti lupa menandai dokumen sensitif sebagai Rahasia).

---

## Slide 11: Kepatuhan Terhadap Standar Kriptografi Internasional
* **Judul Slide**: Standardisasi Keamanan Siber Global
* **Poin Utama**:
  * **FIPS PUB 197**: Algoritma cipher simetris Rijndael sebagai basis standar AES-256 yang diakui secara global.
  * **NIST SP 800-38D**: Menjamin penggunaan Galois/Counter Mode (GCM) untuk perlindungan data terotentikasi.
  * **RFC 7748 / RFC 8032**: Standar resmi IETF untuk kurva Curve25519 dan algoritma tanda tangan digital EdDSA.
* **Catatan Presenter**: Tekankan bahwa SecureOffice-AI tidak membuat algoritma kriptografi sendiri, melainkan mengadopsi standar industri internasional yang telah teruji secara akademis.

---

## Slide 12: Kepatuhan Terhadap Regulasi Nasional BSSN
* **Judul Slide**: Keselarasan Kepatuhan Keamanan Informasi Nasional
* **Poin Utama**:
  * **Pedoman Kriptografi BSSN**: Memenuhi regulasi Badan Siber dan Sandi Negara (BSSN) tentang standar pengamanan infrastruktur informasi vital.
  * **Curve25519 vs Legacy RSA**:
    * Kekuatan kunci Curve25519 (256-bit) setara dengan kekuatan proteksi **RSA 3072-bit hingga RSA 4096-bit**.
    * Memiliki ukuran kunci jauh lebih kecil, mempercepat transmisi data pada sistem jaringan instansi pemerintah.
  * **Kesiapan Naskah Dinas Rahasia**: Memenuhi kriteria perlindungan dokumen berklasifikasi Rahasia dan Sangat Rahasia pada tata persuratan dinas nasional.
* **Catatan Presenter**: Jelaskan kepada penguji/audiens bahwa sistem ini mematuhi hukum siber Indonesia yang diawasi oleh BSSN.

---

## Slide 13: Metrik Evaluasi Performa Enkripsi Berkas
* **Judul Slide**: Hasil Benchmark Waktu Pemrosesan Go Crypto-Service
* **Poin Utama**:
  * Hasil pengujian waktu eksekusi enkripsi amplop (*envelope encryption*) pada berbagai ukuran berkas:
    * **Berkas 100 KB**: 1,65 ms (Symmetric: 0.08 ms, Asymmetric: 1.57 ms)
    * **Berkas 1 MB**: 1,92 ms (Symmetric: 0.35 ms, Asymmetric: 1.57 ms)
    * **Berkas 5 MB**: 2,79 ms (Symmetric: 1.22 ms, Asymmetric: 1.57 ms)
    * **Berkas 10 MB**: 4,02 ms (Symmetric: 2.45 ms, Asymmetric: 1.57 ms)
    * **Berkas 50 MB**: 13,46 ms (Symmetric: 11.89 ms, Asymmetric: 1.57 ms)
  * **Kesimpulan Performa**: Total pemrosesan di bawah 5 ms untuk file 10 MB membuktikan overhead yang sangat rendah bagi pengguna akhir.
* **Catatan Presenter**: Tunjukkan tabel ini sebagai bukti nyata pengujian empiris bahwa arsitektur hybrid sangat efisien.

---

## Slide 14: Simulasi Audit Serangan & Keamanan
* **Judul Slide**: Uji Ketahanan Manipulasi & Kebocoran Database
* **Poin Utama**:
  * **Uji Serangan DBA (Database Administrator)**:
    * Dilakukan simulasi modifikasi paksa representasi biner berkas PDF terenkripsi langsung di database oleh pihak penyusup.
    * Begitu berkas dibuka, proses dekripsi langsung digagalkan dengan memicu error:
      `decryption authentication failed (tampered data or wrong key)`.
  * **Efisiensi Sumber Daya**:
    * Memotong beban komputasi penandatanganan hingga **85\%** dibandingkan RSA-4096.
    * Mengurangi alokasi memori heap hingga **70\%**, optimal untuk browser web seluler.
* **Catatan Presenter**: Terangkan bahwa sistem menjamin integritas penuh, di mana pelaku manipulasi data (bahkan DBA sekalipun) akan langsung terdeteksi.

---

## Slide 15: Kesimpulan & Agenda Riset Masa Depan
* **Judul Slide**: Rangkuman Akhir \& Post-Quantum Cryptography
* **Poin Utama**:
  * **Perlindungan Mutlak E2E**: Integrasi AES-256-GCM, X25519, dan Ed25519 secara sukses memitigasi risiko kebocoran internal maupun penyadapan eksternal.
  * **Pengalaman Pengguna Optimal**: Waktu komputasi yang sub-milidetik memastikan keamanan tidak mengorbankan kenyamanan kerja pengguna.
  * **Langkah Mendatang (Post-Quantum)**:
    * Riset integrasi algoritma pasca-kuantum (*Post-Quantum Cryptography*) berbasis **Kyber** dan **Dilithium**.
    * Mempersiapkan perlindungan dokumen dari ancaman dekripsi di masa depan oleh superkomputer kuantum.
* **Catatan Presenter**: Sampaikan terima kasih atas perhatian audiens dan buka sesi tanya jawab.
