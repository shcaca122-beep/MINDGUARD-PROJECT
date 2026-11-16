# MindGuard API Route Specification

Dokumentasi ini mencatat Next.js Route Handler yang tersedia di `client/app/api`
berdasarkan implementasi saat ini. Base URL lokal adalah
`http://localhost:3000`; ganti dengan origin deployment untuk lingkungan lain.
Semua endpoint menerima dan mengembalikan JSON kecuali dinyatakan lain.

## Konvensi

- Endpoint yang memakai Supabase Auth membaca sesi dari cookie Supabase browser.
  Login harus dilakukan terlebih dahulu kecuali endpoint login siswa.
- `401` berarti sesi tidak ada/tidak valid atau kredensial tidak cocok;
  `403` berarti role tidak berwenang.
- Error umumnya berbentuk `{ "error": "pesan" }`. Endpoint pelanggaran
  menggunakan `{ "success": false, "message": "pesan" }`.
- Jangan mencatat atau membagikan password, service-role key, data siswa, atau
  daftar login yang dikembalikan API.
- `SUPABASE_SERVICE_ROLE_KEY` hanya digunakan di server dan tidak boleh
  dikirim sebagai header atau ditanam pada kode browser.

## Daftar rute

| Method | Path | Kegunaan | Autentikasi / izin |
| --- | --- | --- | --- |
| `POST` | `/api/auth/student-login` | Masuk menggunakan NISN dan password; menetapkan sesi Supabase Auth. | Tidak perlu sesi sebelumnya; kredensial dan profil siswa diperiksa di server. Memerlukan konfigurasi service-role server. |
| `POST` | `/api/auth/complete-password-reset` | Menyelesaikan penggantian password sementara oleh siswa. | Sesi Supabase valid; hanya role `siswa` dengan `password_reset_required: true`. |
| `POST` | `/api/admin/accounts` | Membuat satu atau beberapa akun siswa/staf. | Sesi Supabase valid; `user_profiles.role` harus tepat `admin`. Memerlukan service-role key. |
| `PATCH` | `/api/admin/accounts` | Memperbarui akun siswa/staf yang sudah tertaut. | Sesi Supabase valid; `user_profiles.role` harus tepat `admin`. Memerlukan service-role key. |
| `DELETE` | `/api/admin/accounts` | Menghapus akun Auth dan record siswa/staf terkait. | Sesi Supabase valid; `user_profiles.role` harus tepat `admin`. Memerlukan service-role key. |
| `POST` | `/api/admin/accounts/reset-password` | Menetapkan password sementara untuk satu siswa dan mewajibkan ganti password saat login. | Sesi Supabase valid; `user_profiles.role` harus tepat `admin`. Memerlukan service-role key. |
| `POST` | `/api/admin/accounts/bulk-reset-password` | Mereset password sementara seluruh akun siswa dan menyiapkan daftar login. | Sesi Supabase valid; `user_profiles.role` harus tepat `admin`. Memerlukan service-role key. |
| `POST` | `/api/pelanggaran` | Membuat catatan pelanggaran pada `pelanggaran_siswa`. | Handler tidak memeriksa sesi atau role secara eksplisit; operasi database bergantung pada konfigurasi Supabase/RLS. Jangan anggap handler ini sebagai batas otorisasi mandiri. |

## Rincian endpoint

### `POST /api/auth/student-login`

Masuk sebagai siswa dengan NISN. Handler juga menerima UUID record siswa pada
field `nisn` untuk kebutuhan internal; UI login biasa mengirim NISN.

**Request**

```json
{
  "nisn": "0000000000",
  "password": "<password>"
}
```

Kedua field wajib berupa string tidak kosong.

**Respons sukses — `200`**

```json
{
  "userId": "<supabase-user-uuid>",
  "email": "siswa@example.sch.id",
  "profile": {
    "role": "siswa",
    "display_name": "Nama Siswa",
    "student_record_id": "<student-uuid>",
    "kelas": "XI"
  }
}
```

**Status error:** `400` body tidak valid atau field wajib kosong; `401` NISN,
password, atau profil yang cocok tidak ditemukan; `503` konfigurasi/server
Supabase tidak tersedia; `500` kesalahan tak terduga.

### `POST /api/auth/complete-password-reset`

Mengubah password sementara menjadi password pribadi. Password minimum 12
karakter. Setelah perubahan password, server mencoba memperbarui sesi.

**Request**

```json
{ "password": "<password-baru-minimal-12-karakter>" }
```

**Respons sukses — `200`**

```json
{ "success": true }
```

**Status error:** `400` body/password tidak valid atau Supabase menolak
perubahan; `401` sesi tidak valid; `403` bukan akun siswa; `409` akun tidak
sedang menunggu reset; `503` password tersimpan tetapi sesi gagal diperbarui
(respons berisi `reLoginRequired: true`);
`500` konfigurasi server tidak lengkap atau kesalahan tak terduga.

### `POST /api/admin/accounts`

Menerima satu akun melalui `account` atau beberapa akun melalui array
`accounts`. Seluruh objek harus valid agar request diterima. Akun diproses satu
per satu; hasil parsial dilaporkan melalui `207 Multi-Status`.

**Bentuk akun**

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `kind` | string | Wajib: `student` atau `staff`. |
| `email` | string | Wajib; dinormalisasi menjadi huruf kecil. |
| `nama` | string | Wajib. |
| `password` | string | Diperlukan saat pembuatan; opsional saat update. |
| `role` | string | Opsional; staf harus cocok dengan role yang dikenal (`admin`/`TU`, `BK`, `piket`, `OSIS`, atau `MPK`). Siswa default ke `siswa`. |
| `nisn` | string | Opsional; field siswa. |
| `kelas` | string | Opsional; field siswa. |
| `nip` | string | Opsional; field staf. |

**Request satu akun**

```json
{
  "account": {
    "kind": "student",
    "email": "siswa@example.sch.id",
    "password": "<password-awal>",
    "nama": "Nama Siswa",
    "nisn": "0000000000",
    "kelas": "XI"
  }
}
```

Untuk batch, ganti `account` dengan `"accounts": [{...}, {...}]`.

**Respons sukses penuh — `201`**

```json
{ "created": 1, "failed": [] }
```

**Respons parsial — `207`**

```json
{
  "created": 1,
  "failed": [
    { "email": "staf@example.sch.id", "message": "Alasan kegagalan" }
  ]
}
```

**Status error:** `400` body/akun tidak valid; `403` role bukan administrator;
`500` konfigurasi atau kesalahan tak terduga.

### `PATCH /api/admin/accounts`

Memperbarui akun Auth, record legacy, dan `user_profiles`. Password tidak
diubah bila field `password` kosong atau tidak diberikan.

**Request**

```json
{
  "legacyId": "<id-record-siswa-atau-staf>",
  "account": {
    "kind": "student",
    "email": "siswa@example.sch.id",
    "nama": "Nama Siswa",
    "nisn": "0000000000",
    "kelas": "XI"
  }
}
```

`account` memakai field yang sama dengan endpoint `POST`; `kind`, `email`, dan
`nama` tetap wajib.

**Respons sukses — `200`**

```json
{ "success": true }
```

**Status error:** `400` input/role tidak valid atau update Auth ditolak; `403`
role bukan administrator; `404` profil Auth tidak ditemukan; `500` record atau
profil gagal diperbarui atau terjadi kesalahan server. Jika respons menyebut
autentikasi sudah berubah tetapi record gagal diperbarui, periksa konsistensi
data sebelum mengulangi request.

### `DELETE /api/admin/accounts`

Menghapus pengguna Supabase Auth terkait kemudian menghapus record di `users`
atau `admin_roles`.

**Request**

```json
{
  "kind": "staff",
  "legacyId": 123
}
```

`kind` wajib `student` atau `staff`; `legacyId` adalah ID pada tabel record
legacy, bukan UUID akun Auth.

**Respons sukses — `200`**

```json
{ "success": true }
```

**Status error:** `400` identitas tidak valid; `403` role bukan administrator;
`404` profil Auth tidak ditemukan; `500` penghapusan Auth/record gagal atau
terjadi kesalahan server. Bila Auth sudah terhapus tetapi record gagal
dihapus, periksa data secara manual sebelum mencoba ulang.

### `POST /api/admin/accounts/reset-password`

Menetapkan password sementara untuk satu siswa. Akun diwajibkan mengganti
password saat login berikutnya.

**Request**

```json
{
  "legacyStudentId": "<id-record-siswa>",
  "password": "<password-sementara-minimal-12-karakter>"
}
```

**Respons sukses — `200`**

```json
{ "success": true }
```

**Status error:** `400` input/password/role siswa tidak valid atau Auth menolak
perubahan; `401` sesi admin tidak valid; `403` role bukan administrator; `404`
record/profil/akun siswa tidak ditemukan; `409` email login siswa bentrok;
`503` pencarian akun Auth gagal; `500` terjadi kesalahan Supabase/server.

### `POST /api/admin/accounts/bulk-reset-password`

Mereset semua akun siswa. Tindakan ini berdampak luas dan tidak idempoten dari
sisi password: kirim hanya setelah konfirmasi operasional yang sesuai.
Password sementara minimal 12 karakter dan teks konfirmasi harus tepat
`GANTI SEMUA`.

**Request**

```json
{
  "password": "<password-sementara-minimal-12-karakter>",
  "confirmation": "GANTI SEMUA"
}
```

**Respons sukses — `200`**

```json
{
  "total": 120,
  "changed": 119,
  "failed": [
    {
      "nisn": "0000000000",
      "studentId": "<student-uuid>",
      "nama": "Nama Siswa",
      "message": "Alasan kegagalan"
    }
  ],
  "legacyPasswordClearFailures": 0,
  "roster": [
    {
      "nisn": "0000000001",
      "studentId": "<student-uuid>",
      "nama": "Nama Siswa",
      "kelas": "XI",
      "emailLogin": "siswa@example.sch.id"
    }
  ]
}
```

Roster berisi data identitas/login siswa dan hanya boleh diterima serta
disimpan oleh administrator berwenang. Endpoint mengirim header
`Cache-Control: no-store, max-age=0`.

**Status error:** `400` password/konfirmasi tidak valid; `401` sesi admin tidak
valid; `403` role bukan administrator; `404` tidak ada akun siswa; `500` tidak
ada akun yang berhasil atau terjadi kesalahan pemrosesan. Jika sebagian akun
berhasil, respons `200` menyertakan daftar `failed`; periksa setiap kegagalan.

### `POST /api/pelanggaran`

Mencatat pelanggaran pada tabel `pelanggaran_siswa`. Handler mengisi default
`kelas: "-"`, `pencatat: "Petugas Piket"`, `foto_bukti_path: null`, dan waktu
`created_at` bila field terkait tidak diberikan.

**Request**

```json
{
  "siswa_id": "<student-uuid>",
  "nama_siswa": "Nama Siswa",
  "kelas": "XI",
  "jenis_pelanggaran": "Contoh kategori pelanggaran",
  "poin": 5,
  "pencatat": "Petugas Piket",
  "foto_bukti_path": null
}
```

Field `nama_siswa`, `jenis_pelanggaran`, dan `poin` wajib. `poin` dikonversi
menjadi angka; handler hanya memeriksa keberadaan field, bukan rentang atau
positivitas nilai.

**Respons sukses — `201`**

```json
{
  "success": true,
  "message": "Catatan pelanggaran berhasil disimpan.",
  "data": {}
}
```

**Status error:** `400` field wajib tidak ada; `500` JSON tidak valid,
Supabase/RLS menolak operasi, atau terjadi kesalahan database. Kode saat ini
tidak mengembalikan `401/403` secara eksplisit dan tidak memverifikasi role
pencatat di handler; keamanan efektif bergantung pada kunci Supabase dan RLS
yang berlaku. Tinjau kebijakan proyek sebelum mengekspos endpoint ini.

## Endpoint yang tidak dibuat oleh aplikasi

Halaman lupa/reset password menggunakan Supabase Auth SDK secara langsung
(`resetPasswordForEmail`, `updateUser`, dan `signOut`), bukan Route Handler
MindGuard. Akses database dari banyak halaman juga dilakukan langsung melalui
Supabase client. Daftar route di atas mencakup semua file
`client/app/api/**/route.ts` pada repository saat dokumentasi ini dibuat.

## Pembaruan dokumentasi

Saat menambah atau mengubah Route Handler, perbarui tabel rute, skema request,
respons, status error, dan aturan autentikasi/otorisasi di dokumen ini.