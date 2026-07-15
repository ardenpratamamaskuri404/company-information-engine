# Company Information Data Acquisition Engine

## 1. Deskripsi

Project ini merupakan implementasi Technical Challenge berupa **Data Acquisition Engine**: sebuah REST API yang mengumpulkan informasi mengenai suatu perusahaan dari beberapa sumber data publik, lalu menggabungkannya menjadi satu response terintegrasi.

Aplikasi dibangun dengan pendekatan **Service Layer** — setiap connector (website, domain, location) berdiri sebagai service independen yang tidak saling bergantung, sehingga masing-masing bisa dites, dipelihara, dan dikembangkan secara terpisah.

Frontend hanya berfungsi sebagai **client demonstrasi** yang mengonsumsi endpoint backend untuk menampilkan hasil. Frontend **bukan** objek penilaian utama (lihat §5).

> Catatan untuk AI assistant: backend adalah prioritas. Jangan menghabiskan waktu menyempurnakan UI. Jika ada trade-off waktu, backend (connector, error handling, service layer, dokumentasi) selalu didahulukan.

---

## 2. Tujuan Project

1. Mengambil metadata website perusahaan (title, description, kontak, social media, Open Graph).
2. Mengambil informasi domain menggunakan RDAP.
3. Mengambil lokasi perusahaan menggunakan OpenStreetMap Nominatim.
4. Menggabungkan ketiga sumber data di atas menjadi satu endpoint integrasi (`GET /company-information`).

Struktur response boleh dikembangkan melampaui minimum yang diminta, selama tetap konsisten dan mudah dipahami. Field minimum wajib tetap ada — lihat `project.md` §"Kontrak Response" untuk skema pasti tiap endpoint.

---

## 3. Ruang Lingkup (Scope)

### 3.1 Termasuk dalam scope
- 3 connector independen: Website, Domain, Location.
- 1 endpoint integrasi yang menggabungkan ketiganya.
- Validasi input dan error handling konsisten di seluruh endpoint.
- README lengkap (instalasi, konfigurasi, run, dokumentasi endpoint, asumsi/kendala).
- Git history bertahap dan deskriptif sejak awal pengerjaan (bukan satu commit besar di akhir).
- Video presentasi 5–10 menit (YouTube, Unlisted).

### 3.2 Di luar scope (secara eksplisit tidak dinilai)
- Kualitas visual/UI/UX frontend.
- Autentikasi, login, dashboard admin — **tidak diminta, jangan dibuat.**
- Fitur tambahan yang tidak berkaitan dengan 3 connector + integrasi, kecuali sebagai *value-add* eksplisit (lihat §5).

> Catatan untuk AI assistant: jika diminta menambah fitur di luar §3.1, konfirmasi dulu apakah itu memang value-add yang disengaja atau scope creep yang menyita waktu dari deadline.

---

## 4. Fitur per Connector

### 4.1 Website Metadata Extractor
Mengambil dan mem-parsing HTML dari URL yang diberikan (menggunakan Cheerio), menghasilkan:
- `title`, `description`, `canonical`
- `favicon`
- `emails[]`, `phones[]` (hasil ekstraksi regex dari HTML/teks halaman)
- `social_media[]`
- `open_graph` (`title`, `description`, `image`)

### 4.2 Domain Intelligence
Mengambil data domain via RDAP (`https://rdap.org/domain/{domain}`), menghasilkan:
- `registrar`, `registered_at`, `expired_at`, `last_updated`
- `status[]`, `nameservers[]`

### 4.3 Company Location Finder
Mengambil data lokasi via OpenStreetMap Nominatim, menghasilkan:
- `display_name`, `latitude`, `longitude`, `importance`, `osm_type`, `address`

### 4.4 Final Integration
`GET /company-information?domain={domain}` memanggil ketiga service di atas secara paralel, lalu menggabungkan hasil menjadi:
```json
{
  "website": {},
  "domain": {},
  "location": {}
}
```
Jika salah satu connector gagal, connector lain **tetap harus mengembalikan hasilnya** (lihat `alurlogic.md` §"Partial Failure").

---

## 5. Fokus Penilaian

Prioritas utama (wajib kuat):
- Problem Solving & Software Design (Service Layer, pemisahan tanggung jawab)
- Clean Code
- API Integration
- Data Processing
- Error Handling
- Git Workflow (commit bertahap & deskriptif)
- Dokumentasi (README, docs/)
- Presentasi & kemampuan menjelaskan keputusan teknis

Value-add (nice-to-have, dikerjakan **setelah** yang wajib selesai):
- Docker
- Unit Test / Feature Test
- Logging (Winston)
- Caching (Redis)
- Design Pattern eksplisit
- CI/CD
- Dokumentasi OpenAPI/Swagger

> Catatan untuk AI assistant: urutan pengerjaan mengikuti urutan di atas. Jangan mulai Docker/CI-CD sebelum 3 connector + integrasi + error handling + README selesai dan berjalan.

---

## 6. Deliverables & Batas Waktu

| Item | Keterangan |
|---|---|
| Source code | GitHub repository, **Public** |
| README | Di root repo, Public, berisi instalasi/konfigurasi/run/endpoint/asumsi |
| Video presentasi | YouTube, **Unlisted**, 5–10 menit |
| Screenshot / contoh output | Disertakan saat pengumpulan |
| Deployment | Opsional, nilai tambah |
| Batas pengumpulan | Rabu, 22 Juli 2026, pukul 17:00 WIB |

Kondisi yang menyebabkan gugur/diskualifikasi (ringkas dari brief, lihat sumber asli untuk detail lengkap):
- Terlambat dari batas waktu.
- Repo private/tidak bisa diakses/dihapus sebelum seleksi selesai.
- Git history tidak wajar (hanya 1–beberapa commit di akhir).
- README/dokumentasi tidak memadai.
- Tidak ada video presentasi sesuai ketentuan.
- Source code tidak bisa dijalankan sesuai dokumentasi.
- Tidak bisa menjelaskan implementasi saat review.
- Tidak menyelesaikan seluruh challenge minimal (3 connector + integrasi).
