# ARCHITECTURE: Kos-Kosan Management System

## 1. Arsitektur Sistem & Database Cloud (Neon DB)

Sistem menggunakan full-cloud persistence tanpa state atau data lokal.

```
[Client / Browser]
        │
        ▼ (HTTPS)
[Next.js App Router (Vercel / Node Server)]
  ├── Server Components & Actions
  ├── Auth Middleware (NextAuth v5 / RBAC Guard)
  ├── Route Handlers (/api/cron, /api/webhooks)
  └── Drizzle ORM Driver
        │
        ▼ (TLS/SSL Connection String)
[Neon Database Serverless PostgreSQL]
  ├── Pooling Connection (Port 5432 / 6543)
  └── SSL Mode: require
```

Integrasi eksternal:
- **Midtrans Sandbox:** Snap API untuk token pembayaran & Webhook notifikasi status.
- **WhatsApp Web / Mobile:** Universal protocol URL `https://wa.me/` via client redirection.

---

## 2. Struktur Direktori Projek & Prinsip Clean Code (Separation of Concerns)

Sistem memisahkan tanggung jawab secara ketat ke dalam lapisan terisolasi:

```
kos-kita/
├── docs/
│   ├── RESEARCH.md
│   ├── PRD.md
│   └── ARCHITECTURE.md
├── drizzle/                     # Migrasi SQL Drizzle
├── src/
│   ├── app/                     # Presentation / HTTP Routing saja
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/[rooms, tenants, meter, invoices, dashboard]/
│   │   ├── (portal)/portal/
│   │   └── api/[cron, webhooks, auth]/
│   ├── components/              # UI Components murni (dumb/smart components)
│   │   ├── ui/                  # Komponen atomik (button, input, modal)
│   │   ├── dashboard/           # Komponen tampilan manajemen kos
│   │   └── portal/              # Komponen tampilan portal tenant
│   ├── actions/                 # Controller / Server Actions (validasi input -> panggil service)
│   │   ├── auth.actions.ts
│   │   ├── room.actions.ts
│   │   ├── tenant.actions.ts
│   │   ├── meter.actions.ts
│   │   └── invoice.actions.ts
│   ├── services/                # Domain & Business Logic murni (tidak kenal HTTP request/response)
│   │   ├── user.service.ts
│   │   ├── room.service.ts
│   │   ├── tenant.service.ts
│   │   ├── meter.service.ts
│   │   ├── billing.service.ts
│   │   └── payment.service.ts
│   ├── db/                      # Persistence Layer (hanya skema & koneksi DB)
│   │   ├── index.ts             # Inisialisasi pool Neon DB
│   │   └── schema.ts            # Definisi entitas tabel Drizzle
│   ├── lib/                     # Infrastruktur & Integrasi Pihak Ketiga
│   │   ├── auth.ts              # Konfigurasi NextAuth engine
│   │   ├── midtrans.ts          # Driver SDK Midtrans
│   │   ├── whatsapp.ts          # Formatter URL wa.me
│   │   └── env.ts               # Validasi environment variables
│   └── types/                   # Definisi tipe DTO dan interface domain
```

### Aturan Batas Lapisan (Layer Boundaries):
1. **DB Layer (`src/db`):** Hanya definisi skema, koneksi, dan migrasi. Dilarang ada logika bisnis di sini.
2. **Service Layer (`src/services`):** Tempat seluruh logika bisnis, rumus kalkulasi (listrik, tagihan), dan query Drizzle. Dilarang mengakses objek HTTP (`Request`, `Response`, `cookies()`, `redirect()`).
3. **Action / Controller Layer (`src/actions` & `src/app/api`):** Menangani validasi skema masukan (Zod), otorisasi sesi, memanggil Service, dan mengembalikan hasil/redirect.
4. **UI Layer (`src/components` & `src/app`):** Hanya rendering antarmuka, binding event form, dan pemanggilan Server Action.
5. **Lib Layer (`src/lib`):** Isolasi SDK pihak ketiga (Midtrans, Auth.js) agar tidak bocor ke lapisan lain.

---

## 3. Skema Data Relasional (Neon PostgreSQL via Drizzle)

### 3.1. Enums
- `role`: `'OWNER'`, `'STAFF'`, `'TENANT'`
- `room_status`: `'AVAILABLE'`, `'OCCUPIED'`, `'MAINTENANCE'`
- `invoice_status`: `'UNPAID'`, `'PAID'`, `'EXPIRED'`, `'CANCELLED'`

### 3.2. Tabel Inti
1. **`users`**
   - `id`: UUID (Primary Key, defaultRandom)
   - `email`: Text, Unique, Not Null
   - `password`: Text (Hash bcrypt), Not Null
   - `name`: Text, Not Null
   - `phone`: Text, Not Null
   - `role`: `role` enum, Default `'TENANT'`, Not Null
   - `created_at`: Timestamp, Default Now

2. **`rooms`**
   - `id`: UUID (Primary Key, defaultRandom)
   - `room_number`: Text, Unique, Not Null
   - `type`: Text, Not Null
   - `base_price`: Numeric(12, 2), Not Null
   - `status`: `room_status` enum, Default `'AVAILABLE'`, Not Null
   - `created_at`: Timestamp, Default Now

3. **`tenants`**
   - `id`: UUID (Primary Key, defaultRandom)
   - `user_id`: UUID, References `users.id`, Unique, Not Null
   - `room_id`: UUID, References `rooms.id`, Not Null
   - `rent_start_date`: Timestamp, Not Null
   - `billing_day`: Integer (1-31), Not Null (sesuai tgl masuk)
   - `ktp_number`: Text
   - `emergency_phone`: Text
   - `is_active`: Boolean, Default `true`, Not Null

4. **`meter_readings`**
   - `id`: UUID (Primary Key, defaultRandom)
   - `room_id`: UUID, References `rooms.id`, Not Null
   - `period_date`: Timestamp, Not Null
   - `start_kwh`: Numeric(10, 2), Not Null
   - `end_kwh`: Numeric(10, 2), Not Null
   - `rate_per_kwh`: Numeric(10, 2), Not Null
   - `created_at`: Timestamp, Default Now

5. **`invoices`**
   - `id`: UUID (Primary Key, defaultRandom)
   - `tenant_id`: UUID, References `tenants.id`, Not Null
   - `invoice_number`: Text, Unique, Not Null
   - `month_period`: Timestamp, Not Null
   - `due_date`: Timestamp, Not Null
   - `rent_fee`: Numeric(12, 2), Not Null
   - `electricity_fee`: Numeric(12, 2), Default `0`, Not Null
   - `total_amount`: Numeric(12, 2), Not Null
   - `status`: `invoice_status` enum, Default `'UNPAID'`, Not Null
   - `midtrans_snap_token`: Text
   - `paid_at`: Timestamp
   - `created_at`: Timestamp, Default Now

---

## 4. Pipeline Koneksi Neon DB

Menggunakan package `@neondatabase/serverless` atau `postgres` dengan connection string `DATABASE_URL`:
- String format: `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`
- Drizzle config mengarahkan langsung ke URL Neon untuk generate migrasi:
  ```typescript
  import { defineConfig } from 'drizzle-kit';
  export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
      url: process.env.DATABASE_URL!,
    },
  });
  ```

---

## 5. Matriks Hak Akses (RBAC & Route Guard)

| Path Prefix | Role Izin | Aksi |
|---|---|---|
| `/login` | Public (Unauthenticated) | Form login email/password |
| `/dashboard` | `OWNER`, `STAFF` | Metrik operasional kos & pintasan |
| `/rooms` | `OWNER`, `STAFF` | Kelola kamar kos & harga dasar |
| `/tenants` | `OWNER`, `STAFF` | Kelola penghuni & tanggal sewa |
| `/meter` | `OWNER`, `STAFF` | Pencatatan meteran listrik |
| `/invoices` | `OWNER`, `STAFF` | Monitoring invoice & tombol pengingat WA |
| `/portal` | `TENANT` | Detail kamar, daftar tagihan, tombol Midtrans Snap |
| `/api/cron/*` | Bearer Token (CRON_SECRET) | Generator invoice otomatis |
| `/api/webhooks/midtrans` | Public (Verified Signature) | Update status invoice |

---

## 6. Rencana Tahap Implementasi (Task Breakdown)

1. **Task 1: Inisialisasi Fondasi & Neon DB Setup**
   - Init Next.js, pasang Drizzle ORM, setup koneksi Neon DB, definisikan skema tabel di `src/db/schema.ts`.
   - Jalankan push skema ke Neon DB.
2. **Task 2: Autentikasi & RBAC Middleware**
   - Setup NextAuth v5 + password hashing bcrypt.
   - Buat halaman login dan middleware penjaga rute (Owner/Staff vs Tenant).
3. **Task 3: Modul Data Kamar & Penghuni**
   - Form & tabel kamar (`/rooms`).
   - Form & tabel registrasi penghuni (`/tenants`) terhubung ke kamar dan penetapan `billingDay`.
4. **Task 4: Modul Meteran Listrik**
   - Pencatatan meteran listrik bulanan per kamar (`/meter`).
   - Kalkulasi otomatis `(endKwh - startKwh) * ratePerKwh`.
5. **Task 5: Generator Invoice & Notifikasi WhatsApp**
   - API cron `/api/cron/billing` untuk generate invoice otomatis berdasarkan `billingDay`.
   - Halaman daftar tagihan & generator link pengingat WhatsApp (`wa.me`).
6. **Task 6: Integrasi Midtrans Snap Sandbox**
   - Setup API Snap Token.
   - Pasang pop-up pembayaran di portal penghuni (`/portal`).
   - Setup webhook `/api/webhooks/midtrans` verifikasi signature dan update status ke `PAID`.
