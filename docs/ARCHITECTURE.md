# ARCHITECTURE: Kos-Kosan Management System (Revisi v2.0)

## 1. Arsitektur Sistem & Database Cloud (Neon DB)

Sistem menggunakan full-cloud persistence tanpa state atau data lokal.

```
[Client / Browser]
        │
        ▼ (HTTPS)
[Next.js App Router (Node.js Serverless Runtime)]
  ├── Presentation & Client Components (InteractiveRoomGrid, AlertTicker, PortalClient)
  ├── Auth Guard Middleware (JWT verify via jose)
  ├── Server Actions (Zod validator + mutation controllers)
  ├── Domain Services (RoomService, MeterService, BillingService, TenantService)
  └── Drizzle ORM Driver (@neondatabase/serverless)
        │
        ▼ (TLS/SSL Connection String)
[Neon Database Serverless PostgreSQL]
  ├── Pooling Connection (Port 5432 / 6543)
  └── Relasi schema: users, rooms, tenants, referrals, room_change_requests, meter_readings, invoices
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
│   ├── 0000_lucky_nemesis.sql
│   └── 0001_tidy_the_order.sql
├── src/
│   ├── app/                     # Presentation / HTTP Routing saja
│   │   ├── (auth)/[login, register]/
│   │   ├── (dashboard)/[rooms, tenants, meter, invoices, dashboard]/
│   │   ├── (portal)/portal/
│   │   └── api/[cron, webhooks]/
│   ├── components/              # UI Components murni
│   │   ├── ui/                  # Komponen atomik (StatCard, dll)
│   │   ├── dashboard/           # Komponen dashboard (AlertTicker, InteractiveRoomGrid, OwnerDashboardView, RoomsClient, MeterClient)
│   │   └── portal/              # Komponen portal (PortalClient)
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
│   │   └── schema.ts            # Definisi entitas tabel & relasi Drizzle
│   ├── lib/                     # Infrastruktur & Integrasi Pihak Ketiga
│   │   ├── auth.ts              # Konfigurasi Session Cookie JWT
│   │   ├── midtrans.ts          # Driver SDK Midtrans & Signature SHA512
│   │   ├── whatsapp.ts          # Formatter URL wa.me
│   │   └── utils.ts             # Formatting mata uang & tanggal Indo
│   └── types/                   # Definisi tipe DTO dan interface domain
```

---

## 3. Skema Data Relasional Terkini (Neon PostgreSQL via Drizzle)

### 3.1. Enums
- `role`: `'OWNER'`, `'STAFF'`, `'TENANT'`
- `room_status`: `'AVAILABLE'`, `'OCCUPIED'`, `'MAINTENANCE'`
- `invoice_status`: `'UNPAID'`, `'PAID'`, `'EXPIRED'`, `'CANCELLED'`
- `room_change_status`: `'PENDING'`, `'APPROVED'`, `'REJECTED'`

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
   - `name`: Text (Nama/label kamar opsional)
   - `type`: Text, Not Null
   - `base_price`: Numeric(12, 2), Not Null
   - `facilities`: Text[ ] (Array teks multi-fasilitas), Default `[]`, Not Null
   - `status`: `room_status` enum, Default `'AVAILABLE'`, Not Null
   - `created_at`: Timestamp, Default Now

3. **`tenants`**
   - `id`: UUID (Primary Key, defaultRandom)
   - `user_id`: UUID, References `users.id`, Unique, Not Null
   - `room_id`: UUID, References `rooms.id`, Not Null
   - `rent_start_date`: Timestamp, Not Null
   - `billing_day`: Integer (1-31), Not Null (sesuai tgl check-in)
   - `ktp_number`: Text
   - `emergency_phone`: Text
   - `referral_code`: Text, Unique (Kode unik milik tenant)
   - `is_active`: Boolean, Default `true`, Not Null
   - `created_at`: Timestamp, Default Now

4. **`referrals`**
   - `id`: UUID (Primary Key, defaultRandom)
   - `referrer_tenant_id`: UUID, References `tenants.id`, Not Null
   - `referee_tenant_id`: UUID, References `tenants.id`, Not Null
   - `discount_percentage`: Integer, Default `10`, Not Null (10%)
   - `months_remaining`: Integer, Default `6`, Not Null (6 bulan siklus tagihan)
   - `is_active`: Boolean, Default `true`, Not Null
   - `created_at`: Timestamp, Default Now

5. **`room_change_requests`**
   - `id`: UUID (Primary Key, defaultRandom)
   - `tenant_id`: UUID, References `tenants.id`, Not Null
   - `target_room_id`: UUID, References `rooms.id`, Not Null
   - `reason`: Text, Not Null
   - `status`: `room_change_status` enum, Default `'PENDING'`, Not Null
   - `created_at`: Timestamp, Default Now

6. **`meter_readings`**
   - `id`: UUID (Primary Key, defaultRandom)
   - `room_id`: UUID, References `rooms.id`, Not Null
   - `period_start_date`: Timestamp (Opsional, awal siklus)
   - `period_end_date`: Timestamp (Opsional, akhir siklus)
   - `period_date`: Timestamp, Not Null
   - `start_kwh`: Numeric(10, 2), Not Null (Terkunci dari pembacaan sebelumnya)
   - `end_kwh`: Numeric(10, 2), Not Null
   - `rate_per_kwh`: Numeric(10, 2), Not Null
   - `created_at`: Timestamp, Default Now

7. **`invoices`**
   - `id`: UUID (Primary Key, defaultRandom)
   - `tenant_id`: UUID, References `tenants.id`, Not Null
   - `invoice_number`: Text, Unique, Not Null
   - `month_period`: Timestamp, Not Null
   - `due_date`: Timestamp, Not Null
   - `rent_fee`: Numeric(12, 2), Not Null
   - `discount_fee`: Numeric(12, 2), Default `0`, Not Null (Potongan referral)
   - `electricity_fee`: Numeric(12, 2), Default `0`, Not Null
   - `total_amount`: Numeric(12, 2), Not Null
   - `status`: `invoice_status` enum, Default `'UNPAID'`, Not Null
   - `midtrans_snap_token`: Text
   - `paid_at`: Timestamp
   - `created_at`: Timestamp, Default Now
