# PRD: Kos-Kosan Management System (Revisi v2.0)

## 1. Pendahuluan
Kos-Kosan Management System adalah aplikasi web terintegrasi untuk mendigitalkan seluruh siklus operasional kos: manajemen inventaris kamar multi-fasilitas, pencatatan listrik pascabayar berbasis siklus check-in, penagihan bulanan dinamis, pembayaran digital Midtrans Sandbox, program loyalitas referral, serta portal mandiri bagi calon & penghuni kos.

## 2. Sasaran & Metrik Keberhasilan
- Memangkas waktu operasional staf dalam pencatatan meteran listrik dengan auto-fill kWh awal terkunci.
- Menghilangkan selisih perhitungan listrik dengan log pencatatan meteran transparan.
- Mempercepat pengingat tagihan dengan generator tautan instan `wa.me`.
- Memberikan visibilitas terpisah bagi Owner (ikhtisar eksekutif read-only 1 halaman) dan Staff (pusat aksi operasional & peringatan mendesak).
- Mendorong pertumbuhan hunian melalui registrasi mandiri konsumen dan program afiliasi referral diskon 10% selama 6 bulan.

## 3. Hak Akses & Peran Pengguna (RBAC)
Sistem memiliki 3 tingkat peran dengan pemisahan tanggung jawab tegas:

1. **OWNER (Pemilik Kos):**
   - Halaman dashboard murni **Read-Only** 1 halaman eksekutif (ikhtisar kas masuk, piutang tertunda, penerimaan listrik, potongan diskon afiliasi, okupansi hunian, dan rekap mutasi).
   - Tanpa tombol aksi manipulasi operasional harian guna mencegah intervensi tidak sengaja.
   - Otoritas khusus untuk menghapus data master kamar.

2. **STAFF (Pengelola / Penjaga Kos):**
   - Dashboard operasional terpadu dengan **Running Alert Ticker (Marquee)** dan **Banner Tindakan Mendesak**.
   - **Interactive Room Grid**: Visualisasi status kamar (🟢 Tersedia, 🔵 Terisi & Aman, 🟡 Perlu Catat Listrik/Mendekati Tempo, 🔴 Menunggak).
   - Form inventaris kamar cepat dengan pemilih multi-fasilitas interaktif (chips) dan backdrop modal full-screen.
   - Pencatatan meteran listrik cerdas yang otomatis mengunci kWh awal dari pembacaan periode sebelumnya dan menampilkan identitas penghuni serta tanggal check-in.
   - Pengiriman pengingat bayar bebas biaya via `wa.me`.

3. **TENANT (Penghuni & Calon Penghuni):**
   - Registrasi mandiri akun dan pemesanan kamar (`/register`).
   - Portal hunian (`/portal`): spesifikasi kamar, daftar fasilitas terpasang, siklus tanggal check-in, dan batas jatuh tempo.
   - Program Afiliasi Komunitas: Kode referral unik untuk dibagikan ke teman, dengan reward potongan sewa 10% selama 6 bulan.
   - Katalog rekomendasi dan pengajuan pindah kamar (upgrade tipe kamar).
   - Pembayaran invoice digital otomatis via modal Midtrans Snap Sandbox.

## 4. Modul & Spesifikasi Fungsional

### 4.1. Manajemen Kamar & Fasilitas Interaktif
- Input spesifikasi kamar: Nomor kamar, label/nama kamar, tipe kamar, harga sewa pokok bulanan, dan multi-fasilitas (AC, WiFi, KM Dalam, Water Heater, Smart TV, dll).
- Pemilihan fasilitas berbasis chips interaktif minim ketik.
- Modal backdrop menggunakan fixed full-screen layout.

### 4.2. Pencatatan Meteran Listrik Berbasis Tanggal Masuk
- Mengaitkan pencatatan kWh dengan siklus tanggal check-in masing-masing penghuni (`billingDay`).
- Menampilkan konteks lengkap: Nama penghuni aktif, nomor telepon, tanggal check-in, dan rentang periode siklus.
- Nilai `kWh Awal` terkunci otomatis dari `kWh Akhir` periode sebelumnya; staf hanya memasukkan `kWh Akhir` fisik saat ini.
- Live preview pemakaian kWh dan estimasi biaya listrik secara real-time.

### 4.3. Penagihan Dinamis & Integrasi Diskon Afiliasi
- Rumus tagihan bulanan: `(Harga Sewa - Potongan Referral) + Total Biaya Listrik`.
- Potongan referral sebesar 10% dipotong otomatis dari sewa pokok bagi penghuni yang memiliki referral aktif (berlaku hingga 6 siklus tagihan).
- Endpoint cron harian `/api/cron/billing` memproses tagihan otomatis bagi penghuni yang jatuh tempo pada hari berjalan.

### 4.4. Dashboard Operasional & Peringatan Mendesak
- Running Alert Ticker (Marquee) menampilkan notifikasi bergerak kamar menunggak, jadwal pencatatan listrik, dan invoice jatuh tempo.
- Banner sorotan mendesak dengan tautan langsung ke WhatsApp follow-up atau form pencatatan kWh.
- Interactive Room Cards dengan badge status warna responsif dan tombol aksi cepat.

### 4.5. Portal Penghuni & Rekomendasi Pindah Kamar
- Rincian detail kamar, masa sewa, dan riwayat invoice.
- Banner Program Afiliasi dengan tombol satu-klik "Salin Kode Referral".
- Katalog kamar kosong yang tersedia untuk opsi upgrade, dilengkapi form alasan pengajuan pindah kamar.

## 5. Batasan & Aturan Keamanan
- Kepatuhan OWASP: Validasi input menyeluruh di layer Server Actions via Zod schema.
- Enkripsi password menggunakan bcrypt / argon2.
- Session cookie dilindungi JWT HTTP-only berbasis standard jose.
- Validasi signature hash SHA-512 pada webhook Midtrans untuk mencegah manipulasi pembayaran.
