# MindGuard

MindGuard adalah aplikasi informasi Bimbingan dan Konseling (BK) untuk **SMK
Budi Bakti Ciwidey**. Aplikasi ini membantu siswa dan staf sekolah mengelola
layanan BK melalui satu aplikasi web.

## Fitur

- **Siswa:** login dengan email atau NISN, mengajukan konseling, mengirim curhat,
  mengisi jurnal, serta melihat catatan pelanggaran milik
  sendiri.
- **Guru BK:** mengelola konseling, curhat, pelanggaran, panggilan
  orang tua, dan home visit.
- **Piket dan OSIS/MPK:** mengakses halaman dan rekap sesuai peran.
- **Admin/Tata Usaha:** mengelola data siswa dan staf, layanan BK, akun, serta
  laporan konseling dan pelanggaran.
- **Keamanan akun:** autentikasi Supabase, pembatasan akses berbasis peran,
  kebijakan privasi database, dan alur penggantian kata sandi.

## Teknologi

- Next.js 16, React 19, dan TypeScript
- Supabase Auth dan Supabase Database
- Tailwind CSS 4
- Prisma/PostgreSQL pada direktori `server`

Aplikasi web yang dijalankan saat pengembangan berada di direktori `client`.

## Persiapan

- Node.js yang kompatibel dengan Next.js 16
- npm
- Proyek Supabase yang sudah dikonfigurasi untuk aplikasi dan memiliki tabel
  data sekolah yang diperlukan

## Menjalankan aplikasi secara lokal

1. Masuk ke direktori aplikasi dan pasang dependensi:

   ```bash
   cd client
   npm install
   ```

2. Buat berkas `client/.env.local` dan isi konfigurasi Supabase:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
   SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
   ```

   `NEXT_PUBLIC_SUPABASE_ANON_KEY` dapat diganti dengan
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Jangan pernah membagikan atau
   mengekspos `SUPABASE_SERVICE_ROLE_KEY` ke browser, dan jangan commit
   `client/.env.local`.

3. Jika menyiapkan database dari akun lama, cadangkan database terlebih
   dahulu, lalu jalankan SQL berikut melalui Supabase SQL Editor:

   - [`20261020000000_role_based_privacy.sql`](client/supabase/migrations/20261020000000_role_based_privacy.sql)
   - [`20261025000000_link_student_violations.sql`](client/supabase/migrations/20261025000000_link_student_violations.sql)

   Untuk migrasi akun lama ke Supabase Auth, pastikan tabel sumber tersedia dan
   `SUPABASE_SERVICE_ROLE_KEY` sudah terisi, lalu jalankan:

   ```bash
   npm run migrate:auth
   ```

   Proses ini membaca kredensial lama dan mengubah akun ke Supabase Auth.
   Tinjau panduan [privasi dan migrasi akun](client/supabase/README.md)
   sebelum menjalankannya.

4. Jalankan server pengembangan:

   ```bash
   npm run dev
   ```

5. Buka [http://localhost:3000](http://localhost:3000).

## Perintah aplikasi

Jalankan dari direktori `client`:

| Perintah | Keterangan |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan |
| `npm run lint` | Menjalankan ESLint |
| `npm run build` | Membuat build produksi |
| `npm run start` | Menjalankan build produksi |
| `npm run migrate:auth` | Memigrasikan akun lama ke Supabase Auth |

## Catatan konfigurasi

- Pengguna dan peran akun harus tersedia di Supabase agar dapat login. Tidak
  ada akun contoh atau kredensial bawaan di repository.
- Fitur pengelolaan akun dan beberapa endpoint administratif memerlukan
  `SUPABASE_SERVICE_ROLE_KEY`. Simpan hanya di environment server.
- Untuk pemulihan kata sandi melalui email, atur Site URL, redirect URL
  `/reset-password`, dan pengiriman email di pengaturan Supabase Auth.
- Direktori `server` berisi konfigurasi dan skema Prisma; perintah pengembangan
  aplikasi web dijalankan dari `client`.
