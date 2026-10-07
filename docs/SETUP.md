# PANDUAN SETUP & PENGGUNAAN KOS KITA

## 1. Persiapan Environment (.env)
Salin `.env.example` menjadi `.env`:
```env
# URL Koneksi Neon PostgreSQL
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Kunci JWT Sesi
AUTH_SECRET="kos-kita-super-secret-key-min-32-chars-ok"

# Kredensial Midtrans Sandbox
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxx"
MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxx"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxx"

# Secret Token Cron Job
CRON_SECRET="secret-cron-token"
```

## 2. Migrasi Skema ke Neon PostgreSQL
Setelah mengisi `DATABASE_URL` dengan database Neon Anda, jalankan:
```bash
# Push langsung skema Drizzle ke Neon DB
npm run db:push
```
Atau terapkan file SQL di `drizzle/0000_lucky_nemesis.sql` via Neon SQL Editor.

## 3. Seeding Data Awal
Jalankan perintah seed untuk membuat akun Owner, Staff, 3 kamar awal, dan 1 sampel penghuni:
```bash
npm run db:seed
```

### Akun Bawaan Hasil Seed:
| Peran | Email | Kata Sandi | Halaman Utama |
|---|---|---|---|
| **Owner** | `owner@koskita.com` | `password123` | `/dashboard` |
| **Staff** | `staff@koskita.com` | `password123` | `/dashboard` |
| **Penghuni** | `tenant@koskita.com` | `password123` | `/portal` |

## 4. Menjalankan Aplikasi
```bash
npm run dev
```
Akses di peramban: `http://localhost:3000`

## 5. Fitur Utama & Pengujian

### A. Alur Penagihan Dinamis Sesuai Tanggal Masuk
1. Masuk sebagai Staff/Owner, buka menu **Kelola Kamar** (`/rooms`) dan **Data Penghuni** (`/tenants`).
2. Daftarkan penghuni baru, pilih kamar, dan tentukan `billingDay` (misal tgl 15).
3. Buka menu **Meteran Listrik** (`/meter`), masukkan kWh awal dan kWh akhir. Biaya listrik otomatis terhitung berdasarkan selisih kWh dikali tarif.
4. Buka menu **Daftar Tagihan** (`/invoices`), terbitkan invoice manual atau trigger cron via endpoint `/api/cron/billing`.

### B. Pengingat Tagihan WhatsApp Tanpa Biaya (wa.me)
1. Pada menu **Daftar Tagihan**, setiap invoice berstatus `UNPAID` memiliki tombol **Kirim WA**.
2. Klik tombol tersebut untuk membuka tab WhatsApp Web/App dengan format pesan penagihan otomatis yang memuat rincian sewa, listrik, jatuh tempo, dan tautan portal.

### C. Pembayaran Digital Midtrans Sandbox
1. Masuk sebagai penghuni (`tenant@koskita.com`).
2. Masuk ke **Portal Penghuni** (`/portal`).
3. Klik **Bayar Sekarang** pada tagihan yang aktif.
4. Pop-up Midtrans Snap akan muncul dengan nominal tagihan (Sewa + Listrik).
5. Selesaikan simulasi pembayaran di Midtrans Sandbox (Virtual Account / QRIS).
6. Webhook di `/api/webhooks/midtrans` akan otomatis memverifikasi signature dan mengubah status invoice menjadi `PAID`.
