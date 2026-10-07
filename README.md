# Kos Kita

Sistem manajemen operasional kos-kosan dan penagihan terintegrasi berbasis Next.js App Router, Neon PostgreSQL, Drizzle ORM, dan Midtrans Sandbox.

## Fitur Utama

- Penagihan Siklus Dinamis: Tagihan bulanan dihitung sesuai tanggal check-in masing-masing penghuni (billingDay).
- Pencatatan Meteran Listrik: Otomatisasi penarikan kWh awal periode sebelumnya, input kWh akhir, dan kalkulasi tagihan listrik per kamar.
- Pembayaran Digital Midtrans: Integrasi Midtrans Snap Sandbox dan webhook otomatis dengan validasi signature SHA512.
- Pengingat WhatsApp Gratis: Pembuatan tautan wa.me otomatis untuk pengiriman tagihan dan tenggat waktu tanpa biaya gateway pihak ketiga.
- Pemisahan Peran Pengguna:
  - Owner: Dashboard ringkasan eksekutif satu halaman (read-only), pemantauan okupansi, cashflow, dan daftar penunggak.
  - Staff: Pusat operasional dengan running alert ticker marquee, manajemen kamar interaktif, inventaris, penghuni, dan invoice.
  - Tenant (Penghuni): Portal mandiri, riwayat tagihan, pembayaran Snap, pengajuan pindah kamar, dan program referral diskon sewa 10 persen.
- Registrasi Mandiri: Konsumen dapat mendaftar langsung dengan opsi penukaran kode referral.

## Teknologi

- Framework: Next.js 14 (App Router, Server Actions)
- Bahasa: TypeScript
- Database: Neon PostgreSQL (Serverless HTTP Driver)
- ORM: Drizzle ORM, Drizzle Kit
- Autentikasi: Stateless Session Cookie dengan JWT via jose
- Validasi Input: Zod
- Pembayaran: Midtrans Client (Snap Sandbox)
- Desain UI: Tailwind CSS, Lucide React

## Prasyarat

- Node.js versi 18.17 atau lebih tinggi
- Akun Neon PostgreSQL (mendapatkan connection string)
- Akun Midtrans Sandbox (Server Key dan Client Key)

## Konfigurasi Lingkungan

Salin file .env.example menjadi .env:

```bash
cp .env.example .env
```

Isi variabel lingkungan berikut di dalam .env:

```env
# URL Koneksi Neon PostgreSQL
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Kunci JWT Sesi (minimal 32 karakter)
AUTH_SECRET="kos-kita-super-secret-key-min-32-chars-ok"

# Kredensial Midtrans Sandbox
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxx"
MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxx"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxx"

# Secret Token Cron Job
CRON_SECRET="secret-cron-token"
```

## Instalasi dan Setup

1. Pasang dependensi:

```bash
npm install
```

2. Jalankan migrasi database ke Neon PostgreSQL:

```bash
npm run db:migrate
```

Atau lakukan sinkronisasi skema langsung:

```bash
npm run db:push
```

3. Jalankan seeding data awal (Owner, Staff, Kamar, dan Penghuni demo):

```bash
npm run db:seed
```

4. Jalankan server pengembangan:

```bash
npm run dev
```

Buka peramban pada http://localhost:3000.

## Akun Demo Hasil Seed

Password default untuk seluruh akun: password123

| Peran | Email | Halaman Akses |
|---|---|---|
| Owner | owner@koskita.com | /dashboard |
| Staff | staff@koskita.com | /dashboard |
| Tenant (Penghuni) | tenant@koskita.com | /portal |

## Perintah Skrip (Scripts)

| Perintah | Deskripsi |
|---|---|
| npm run dev | Menjalankan Next.js server mode development |
| npm run build | Kompilasi aplikasi Next.js untuk produksi |
| npm run start | Menjalankan server aplikasi Next.js mode produksi |
| npm run test | Menjalankan unit test domain logika mandiri |
| npm run typecheck | Menjalankan pemeriksaan tipe TypeScript tanpa emit |
| npm run db:generate | Menghasilkan file migrasi Drizzle SQL dari schema.ts |
| npm run db:migrate | Mengeksekusi file migrasi Drizzle SQL langsung ke Neon DB |
| npm run db:push | Menerapkan skema Drizzle langsung ke Neon DB |
| npm run db:seed | Memasukkan data awal akun dan kamar ke database |
| npm run db:studio | Membuka Drizzle Studio GUI di browser lokal |

## Struktur Direktori

```
kos-kita/
├── docs/                 # Dokumentasi PRD, riset, arsitektur, dan panduan setup
├── drizzle/              # File migrasi SQL hasil generate Drizzle
├── src/
│   ├── actions/          # Next.js Server Actions (auth, room, tenant, meter, invoice)
│   ├── app/              # Next.js App Router (auth, dashboard, portal, API routes)
│   ├── components/       # Komponen antarmuka (dashboard, portal, UI primitives)
│   ├── db/               # Koneksi Neon DB, skema tabel, runner migrasi, dan seed
│   ├── lib/              # Utilitas auth JWT, enkripsi password, Midtrans client
│   └── services/         # Layer logika bisnis (user, room, tenant, meter, billing)
├── tests/                # Unit test logika domain (self-check runner)
├── .env.example          # Contoh variabel lingkungan
├── package.json          # Manifest dependensi dan skrip proyek
├── README.md             # Dokumentasi utama proyek
└── tsconfig.json         # Konfigurasi TypeScript
```

## Lisensi

ISC
