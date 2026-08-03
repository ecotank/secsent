# Panduan Deployment Lengkap: SecSent
## GitHub + Netlify + Neon Serverless PostgreSQL

Dokumen ini berisi langkah-langkah lengkap dari awal hingga akhir untuk menayangkan (*deploy*) platform **SecSent** secara live di internet.

---

## 📌 LANGKAH 1: Push Kode Lokal ke GitHub Repository

Repositori remote telah berhasil dikonfigurasi ke:  
`https://github.com/ecotank/secsent.git`

Jalankan perintah berikut pada terminal laptop Anda untuk mendorong seluruh kode ke GitHub:

```bash
git push -u origin main
```

*(Jika diminta autentikasi, masuk menggunakan Personal Access Token / Login GitHub Anda).*

---

## 🐘 LANGKAH 2: Setup Neon Serverless PostgreSQL (Database Cloud)

1. Buka situs **[https://neon.tech](https://neon.tech)** dan pilih **Sign Up / Log In** (Bisa menggunakan akun GitHub Anda).
2. Klik tombol **"Create a Project"**:
   - **Project Name**: `secsent-db`
   - **Database Name**: `neondb`
   - **Region**: Singapore (`ap-southeast-1`) *atau region terdekat*.
3. Setelah database berhasil dibuat, buka menu **SQL Editor** pada sidebar kiri Neon.
4. Salin seluruh isi skrip DDL SQL dari berkas repositori:  
   `database/migrations/000001_init_schema.up.sql`
5. Paste ke dalam **SQL Editor** Neon dan klik tombol **Run**.
6. **Hasil**: Seluruh 10 tabel utama (termasuk `users`, `letters`, `hybrid_key_pairs`, `audit_logs`, dll.) kini telah terbentuk secara resmi di database online Neon PostgreSQL Anda.
7. Catat string koneksi (**Connection String / Connection Details**) yang diawali `postgres://...` pada dashboard Neon untuk referensi backend.

---

## 🚀 LANGKAH 3: Deploy Aplikasi Web Frontend ke Netlify

1. Buka situs **[https://www.netlify.com](https://www.netlify.com)** dan login menggunakan akun GitHub Anda.
2. Pada halaman utama dashboard Netlify, klik tombol **"Add new site"** $\rightarrow$ pilih **"Import an existing project"**.
3. Pilih penyedia **GitHub** dan otorisasi akses ke akun Anda.
4. Cari dan pilih repositori: **`ecotank/secsent`**.
5. Isi konfigurasi build sebagai berikut:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
6. Klik tombol **"Deploy secsent"**.
7. Tunggu proses build otomatis selesai (sekitar 1-2 menit). Netlify akan menerbitkan situs Anda dengan URL resmi HTTPS, misalnya:  
   `https://secsent.netlify.app` *(Anda juga dapat mengubah nama subdomainnya secara gratis pada menu Site Configuration).*

---

## 🌐 LANGKAH 4: Pengujian Situs Live

Buka URL Netlify Anda di penjelajah web (misalnya `https://secsent.netlify.app`):
- Lakukan login menggunakan akun bawaan:
  - **Kepala Unit**: `ka.unit.sec` | Password: `pimpinan123` | PIN/MFA: `123456`
  - **Sekretaris**: `sekretaris.sec` | Password: `sekretaris123` | PIN/MFA: `123456`
  - **Staf**: `staf.sec` | Password: `staf123` | PIN/MFA: `123456`
  - **Admin**: `admin.sys` | Password: `admin123` | PIN/MFA: `123456`
  - **Auditor**: `auditor.sys` | Password: `auditor123` | PIN/MFA: `123456`

Aplikasi **SecSent** Anda kini **LIVE** secara global dan siap dipresentasikan kepada Dosen atau Penguji! 🎉
