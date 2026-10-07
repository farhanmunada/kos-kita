# PRD: Kos-Kosan Management System

## 1. Pendahuluan
Kos-Kosan Management System adalah aplikasi web terintegrasi untuk mendigitalkan operasional kos, mulai dari pencatatan sewa, kalkulasi penggunaan listrik pascabayar, penagihan dinamis berbasis tanggal masuk penghuni, hingga penerimaan pembayaran digital.

## 2. Sasaran & Metrik Keberhasilan
- Memangkas waktu pencatatan dan kalkulasi tagihan manual pengelola kos.
- Menghilangkan selisih perhitungan listrik dengan log pencatatan meteran awal & akhir.
- Memberikan transparansi tagihan dan kemudahan pembayaran kepada penghuni.
- Tingkat keberhasilan verifikasi otomatis pembayaran via Midtrans Sandbox mencapai 100%.

## 3. Hak Akses & Peran Pengguna (RBAC)
Sistem memiliki 3 tingkat peran:
1. **OWNER (Pemilik Kos):**
   - Mengelola akun staf.
   - Mengakses seluruh data kamar, penghuni, dan invoice.
   - Mengakses rekap laporan pemasukan, tunggakan, dan okupansi.
   - Mengatur tarif sewa kamar dan tarif listrik per kWh.
2. **STAFF (Pengelola / Penjaga Kos):**
   - Menambah dan memperbarui data kamar serta penghuni.
   - Mencatat angka meteran listrik bulanan per kamar.
   - Memicu pembuatan invoice dan memantau status pembayaran.
   - Mengirim pengingat WhatsApp ke penghuni via tombol generator `wa.me`.
3. **TENANT (Penghuni Kos):**
   - Melihat rincian kamar dan masa aktif sewa.
   - Melihat daftar invoice (sewa kamar + tagihan listrik).
   - Membayar invoice via modal Midtrans Snap.
   - Mengakses riwayat pembayaran dan bukti transaksi.

## 4. Fitur Utama & Kebutuhan Fungsional

### 4.1. Autentikasi & Profil
- Login berbasis email & kata sandi dengan proteksi sesi cookie (Auth.js / NextAuth v5).
- Redirect otomatis sesuai role setelah login:
  - `OWNER` / `STAFF` -> `/dashboard` (Manajemen Kos).
  - `TENANT` -> `/portal` (Portal Penghuni).

### 4.2. Manajemen Kamar & Status Okupansi
- Data kamar: Nomor kamar, tipe kamar, harga sewa dasar, status (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`).
- Status kamar otomatis berubah menjadi `OCCUPIED` saat penghuni didaftarkan dan aktif.

### 4.3. Manajemen Penghuni
- Data penghuni: Relasi akun user, kamar terhubung, tanggal mulai sewa, tanggal siklus tagihan (`billingDay`: 1–31), nomor KTP, kontak darurat, status aktif.
- Siklus penagihan dinamis mengikuti tanggal masuk (misal: masuk tanggal 15, tagihan berikutnya terbit tiap tanggal 15).

### 4.4. Pencatatan Meteran Listrik
- Form input bulanan: Angka kWh awal, angka kWh akhir, tanggal pencatatan, tarif per kWh.
- Kalkulasi otomatis total biaya listrik: `(endKwh - startKwh) * ratePerKwh`.
- Validasi data: kWh akhir tidak boleh lebih kecil dari kWh awal.

### 4.5. Pembuatan Tagihan Otomatis & Manual (Invoicing)
- Endpoint cron `/api/cron/billing`:
  - Dijalankan harian.
  - Memfilter penghuni aktif yang `billingDay` cocok dengan tanggal hari ini.
  - Otomatis membuat record invoice baru berstatus `UNPAID` dengan batas jatuh tempo `H+3`.
- Pengelola juga dapat membuat atau memicu penagihan manual jika diperlukan.
- Format invoice unik: `INV-YYYYMMDD-[Kamar]-[RandomHash]`.

### 4.6. Integrasi Pembayaran Digital (Midtrans Sandbox)
- Tombol "Bayar Sekarang" pada portal penghuni membuka pop-up Midtrans Snap.
- Pembuatan Snap Token dinamis dari server saat invoice dibuka/dibayar.
- Webhook endpoint `/api/webhooks/midtrans`:
  - Menerima event notifikasi dari Midtrans.
  - Verifikasi signature hash dengan `ServerKey`.
  - Jika transaksi `settlement` atau `capture`, perbarui status invoice menjadi `PAID` dan rekam timestamp pembayaran.

### 4.7. Pengingat Tagihan (WhatsApp wa.me)
- Solusi bebas biaya API pihak ketiga.
- Tombol "Kirim Pengingat WA" pada daftar invoice yang belum lunas.
- Menghasilkan tautan:
  `https://wa.me/{nomor_telepon}?text={pesan_tagihan_terenkode}`
- Format pesan memuat: Nama penghuni, nomor kamar, rincian biaya (sewa + listrik), batas waktu bayar, serta tautan portal invoice.

## 5. Batasan & Syarat Non-Fungsional
- **Kinerja:** Halaman dashboard dan portal termuat di bawah 2 detik.
- **Keamanan:**
  - Password dienkripsi menggunakan bcrypt / argon2.
  - Endpoint internal dan webhook dilindungi otorisasi dan verifikasi signature.
  - Data KTP dan kontak darurat hanya dapat dilihat oleh `OWNER` dan `STAFF`.
- **Integritas Data:** Foreign key constraints ketat menggunakan PostgreSQL.

## 6. Kriteria Penerimaan (Acceptance Criteria)
- [ ] User dapat login dan diarahkan sesuai role (`OWNER`, `STAFF`, `TENANT`).
- [ ] Role `STAFF`/`OWNER` dapat membuat kamar dan mendaftarkan penghuni.
- [ ] Role `STAFF` dapat menginput kWh meteran dan total tagihan listrik terhitung akurat.
- [ ] Cron endpoint menghasilkan invoice sesuai siklus `billingDay` penghuni.
- [ ] Penghuni dapat membuka invoice dan melakukan simulasi pembayaran via Midtrans Snap Sandbox.
- [ ] Webhook Midtrans berhasil mengubah status invoice dari `UNPAID` ke `PAID`.
- [ ] Tombol pengingat WA membuka WhatsApp dengan template pesan tagihan yang tepat.
