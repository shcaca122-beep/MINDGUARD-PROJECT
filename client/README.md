# MindGuard Web

Aplikasi web Next.js MindGuard. Panduan struktur kode, penelusuran error, dan
persiapan proyek ada di [README utama](../README.md).

## Menjalankan lokal

```powershell
npm install
npm run dev
```

Jalankan perintah dari folder `client`, lalu buka
[http://localhost:3000](http://localhost:3000). Pastikan `client/.env.local`
sudah berisi konfigurasi Supabase sesuai panduan utama.

## Pemeriksaan sebelum live coding

```powershell
npm run lint
npm run build
```

`npm run lint` memeriksa aturan kode, sedangkan `npm run build` memeriksa
kompilasi dan route aplikasi.
