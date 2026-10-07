# RESEARCH: Kos-Kosan Management System

## 1. Ringkasan Eksekutif
Sistem manajemen operasional rumah kos berbasis web untuk mengelola kamar, data penghuni, pencatatan meteran listrik pascabayar, pembuatan invoice otomatis berbasis siklus tanggal masuk penghuni, integrasi pembayaran digital Midtrans (Sandbox), dan pengingat bayar WhatsApp via tautan URL tanpa biaya pihak ketiga.

## 2. Analisis Stack Teknologi
- **Framework Utama:** Next.js 14+ (App Router, Server Actions, API Route Handlers).
  - Alasan: SSR/RSC untuk performa dashboard, API route terpadu untuk cron dan webhook Midtrans.
- **Database & ORM:** PostgreSQL + Drizzle ORM (`drizzle-orm`, `drizzle-kit`, `postgres`).
  - Alasan: Type-safe, overhead runtime minimal, migrasi SQL transparan dan deterministik.
- **Autentikasi & Otorisasi:** Auth.js / NextAuth v5 (Session Cookie).
  - Role: `OWNER`, `STAFF`, `TENANT`.
  - Proteksi via Next.js Middleware dan guard di level data layer.
- **UI / Komponen:** Tailwind CSS + Radix UI / shadcn/ui + Lucide Icons.
  - Alasan: Komponen aksesibel, cepat dibangun, desain ringkas.
- **Payment Gateway:** Midtrans Snap (Sandbox Environment) menggunakan `midtrans-client`.
  - Flow: Frontend panggil API snap token -> Snap modal popup -> Webhook Midtrans update status invoice ke database secara asinkron.
- **Pengingat Bayar (Reminder):**
  - Menggunakan skema link generator `wa.me/{nomor}?text={url_encoded_message}`.
  - Tanpa dependensi gateway WA berbayar. Pengelola cukup klik tombol di dashboard untuk buka WA langsung ke tenant terkait.

## 3. Analisis Siklus Bisnis & Edge Cases
- **Siklus Tagihan Dinamis:**
  - Setiap penghuni memiliki `billingDay` berdasarkan tanggal check-in (1-31).
  - Cron dijalankan harian untuk memeriksa penghuni yang jatuh tempo pada hari tersebut atau `H-N`.
- **Kalkulasi Listrik Pascabayar:**
  - Formula: `(endKwh - startKwh) * ratePerKwh`.
  - Validasi: `endKwh >= startKwh`. Jika belum ada input meteran bulan berjalan, sistem memberi peringatan draft atau default 0 kWh pemakaian dengan catatan.
- **Idempotensi Webhook:**
  - Webhook Midtrans harus memvalidasi signature key (`SHA512(order_id + status_code + gross_amount + server_key)`).
  - Status invoice hanya berubah jika status transaksi valid (`capture`, `settlement`).
