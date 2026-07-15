# Panduan Pengujian (Testing Manual & Otomatis)

Dokumen ini memandu Anda dalam melakukan pengujian fungsionalitas dan integrasi sistem **Company Lookup**.

---

## 1. Pengujian Unit Otomatis (Automated Unit Testing)

Backend dilengkapi dengan pengujian unit ter-mock untuk memverifikasi fungsionalitas parsing HTML (Cheerio), normalisasi data RDAP, geocoding Nominatim (OpenStreetMap), serta partial failure handling.

### Cara Menjalankan:
1. Buka terminal baru dan masuk ke direktori `backend/`:
   ```bash
   cd backend
   ```
2. Jalankan perintah test:
   ```bash
   npm run test
   ```
3. **Hasil yang Diharapkan**:
   - Total 9 test suite berhasil lolos (`PASS`).
   - Evaluasi mencakup sukses skenario, error upstream, serta penanganan partial failure.

---

## 2. Pengujian Manual End-to-End via UI

Ikuti langkah-langkah di bawah ini untuk menguji secara langsung menggunakan antarmuka web.

### Langkah Persiapan:
1. Pastikan server backend aktif di port 3000 (`cd backend && npm run dev`).
2. Pastikan server frontend aktif di port 5173 (`cd frontend && npm run dev`).
3. Buka browser dan arahkan ke alamat: [http://localhost:5173](http://localhost:5173).

### Skenario Pengujian 1: Pencarian Sukses Lengkap
1. Masukkan domain `paper.id` pada input pencarian.
2. Klik tombol **Cari**.
3. **Hasil yang Diharapkan**:
   - Status konektor (Website, Domain, Location) akan melakukan animasi loading dan menyala biru jika berhasil.
   - Card **Website Metadata** menampilkan ikon favicon, judul, deskripsi, email (`support@paper.id`), no telepon, serta tautan sosial media resmi.
   - Card **Domain Intelligence** menampilkan Registrar PANDI, tanggal pendaftaran/kedaluwarsa, status domain, dan daftar nameserver.
   - Card **Company Location** menampilkan nama lokasi lengkap dari Nominatim beserta koordinat Latitude/Longitude.
   - Klik tombol **Lihat Raw JSON Response** di bagian bawah untuk melihat visualisasi data mentah secara collapsible.

### Skenario Pengujian 2: Penanganan Gagal Sebagian (Partial Failure)
1. Coba masukkan domain internasional yang terdaftar tetapi lokasinya mungkin tidak spesifik, atau putuskan sambungan internet sesaat setelah menekan cari untuk mensimulasikan kegagalan koneksi ke salah satu API eksternal.
2. **Hasil yang Diharapkan**:
   - Endpoint tetap merespon dengan `success: true` dan menampilkan data dari konektor yang berhasil.
   - Konektor yang gagal akan menyala **merah** pada bar status.
   - Muncul alert warning berwarna kuning di atas hasil pencarian: *"Beberapa sumber data tidak tersedia"*.
   - Card yang gagal akan menampilkan pesan *"Data tidak tersedia"* secara elegan tanpa membuat aplikasi crash.

### Skenario Pengujian 3: Validasi Format Input
1. Masukkan input berupa url lengkap seperti `https://paper.id/invoice` atau input kosong.
2. Klik **Cari**.
3. **Hasil yang Diharapkan**:
   - Form pencarian atau API validator akan langsung menolak request dengan memunculkan pesan error *"Invalid domain format"*.
   - Mencegah request dikirim ke backend sebelum divalidasi.
