# Company Lookup (Data Acquisition Engine)

**Company Lookup** adalah aplikasi pencari informasi perusahaan otomatis. Pengguna cukup memasukkan nama domain website (seperti `paper.id` atau `tokopedia.com`), dan aplikasi ini akan secara otomatis menarik 3 jenis informasi penting sekaligus:
1. **Metadata & Kontak Website** (judul, deskripsi, email, nomor telepon, dan tautan media sosial).
2. **Data Registrasi Domain / RDAP** (siapa pengelolanya, tanggal pendaftaran, dan nama server).
3. **Lokasi Fisik Perusahaan** (koordinat latitude/longitude dan alamat lengkap di peta OpenStreetMap).

Seluruh data ditarik secara bersamaan (*paralel*) dan langsung disajikan secara rapi dalam satu layar dashboard yang bersih dan interaktif.

---

## Teknologi yang Digunakan (Tech Stack)

### Backend
- **Node.js (v18+)** & **TypeScript** — Penulisan kode bertipe ketat demi keandalan sistem.
- **Express.js** — Framework backend server utama.
- **Cheerio** & **Axios** — Parser dokumen HTML untuk Website Metadata Extractor.
- **Nominatim Client** (OpenStreetMap API) — Geolokasi koordinat.
- **RDAP Client** — Pengambilan informasi pendaftaran domain secara real-time.

### Frontend
- **React.js (v18)** & **TypeScript** — Framework UI utama.
- **Vite** — Build tool ultra cepat untuk bundling.
- **Tailwind CSS v4 & PostCSS** — Styling layout dan token desain visual premium.
- **Axios** — HTTP client untuk komunikasi data ke Backend.

---

## Fitur Utama & Kepatuhan Arsitektur

1. **Service Layer Pattern**: Setiap konektor (`WebsiteService`, `DomainService`, `LocationService`) berdiri sebagai modul independen dan terisolasi. Controller hanya mengatur input/output tipis, sedangkan business logic seutuhnya dikelola oleh Service.
2. **Partial Failure Handling**: Endpoint integrasi `/company-information` memanggil ketiga service secara paralel menggunakan `Promise.allSettled`. Jika salah satu layanan eksternal gagal, request tidak akan gagal total secara keseluruhan melainkan menampilkan data yang sukses dan menyematkan deskripsi kesalahan di array `warnings`.
3. **Nominatim Rate Limiting Compliance**: Sesuai kebijakan resmi OpenStreetMap Nominatim, service lokasi mengimplementasikan *promise-chaining queue* untuk menserialisasikan request sehingga maksimal hanya mengirim **1 request per detik**, menghindari pemblokiran IP.
4. **Centralized Error Handling**: Menggunakan middleware Express terpusat untuk menangkap semua kesalahan (`AppError`), memetakan status HTTP dengan benar (400, 404, 502, 500), serta mencegah kebocoran detail internal library (seperti `AxiosError`) ke client.
5. **Tailwind CSS Premium UI**: Desain minimalis elegan yang didesain secara sengaja menggunakan token warna dan tipografi khusus. Terdapat visualisasi unik berupa status 3-node yang saling terhubung dan menyala sesuai respon konektor.

---

## Struktur Folder Project

```text
company-information-engine/
├── backend/
│   ├── src/
│   │   ├── config/             # Konfigurasi environmental loader
│   │   ├── controllers/        # Express request orchestration
│   │   ├── middlewares/        #ErrorHandler & Request Validator
│   │   ├── routes/             # Endpoint routing
│   │   ├── services/           # Business logic & External integrations
│   │   ├── types/              # Type safety definitions
│   │   └── utils/              # Response formatter helper
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Single-page UI & State management
│   │   ├── index.css           # Google font imports & Tailwind layer directives
│   │   └── main.tsx
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── package.json
│
├── docs/                       # Dokumentasi project original
└── README.md                   # Panduan setup & API ini
```

---

## Persyaratan Awal (Prerequisites)

- Node.js versi 18 ke atas
- npm atau yarn

---

## Setup & Instalasi

### 1. Backend Setup

1. Buka folder `backend/`:
   ```bash
   cd backend
   ```
2. Instal semua dependency:
   ```bash
   npm install
   ```
3. Salin file environment:
   ```bash
   cp .env.example .env
   ```
4. Ubah isi `.env` jika diperlukan (port default adalah `3000`).

### 2. Frontend Setup

1. Buka folder `frontend/`:
   ```bash
   cd ../frontend
   ```
2. Instal semua dependency:
   ```bash
   npm install
   ```

---

## Cara Menjalankan Aplikasi

### 1. Jalankan Backend (Development Mode)

Dari folder `backend/`:
```bash
npm run dev
```
Server backend akan berjalan di [http://localhost:3000](http://localhost:3000). Anda dapat mengecek status kesehatan server di [http://localhost:3000/health](http://localhost:3000/health).

### 2. Jalankan Frontend

Dari folder `frontend/`:
```bash
npm run dev
```
Aplikasi frontend web akan berjalan di [http://localhost:5173](http://localhost:5173).

---

## Dokumentasi API Endpoint

Backend mengembalikan format JSON terstandarisasi untuk semua response:
- **Respon Sukses (HTTP 200)**: `{ "success": true, "message": "...", "data": { ... } }`
- **Respon Gagal (HTTP 400/404/502)**: `{ "success": false, "message": "...", "error": "CODE" }`

---

### 1. Website Metadata Extractor
- **URL**: `/extract/website`
- **Method**: `POST`
- **Request Body**:
  ```json
  { "url": "https://paper.id" }
  ```
- **Respon Sukses (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Website metadata extracted successfully",
    "data": {
      "url": "https://paper.id",
      "title": "Paper.id - Invoice & Pembayaran Bisnis No.1 di Indonesia",
      "description": "Buat invoice online gratis dengan mudah...",
      "canonical": "https://paper.id",
      "favicon": "https://paper.id/favicon.ico",
      "emails": ["support@paper.id"],
      "phones": ["+6285574677916"],
      "social_media": ["https://instagram.com/paper.id"],
      "open_graph": { "title": "Paper.id", "description": "...", "image": "..." }
    }
  }
  ```
- **Respon Gagal (400 Bad Request)**:
  ```json
  {
    "success": false,
    "message": "Invalid URL format",
    "error": "VALIDATION_ERROR"
  }
  ```
- **Contoh Domain Pengujian**: `paper.id`, `tokopedia.com`, `unilever.co.id`, `google.com`

---

### 2. Domain Intelligence (RDAP)
- **URL**: `/extract/domain`
- **Method**: `POST`
- **Request Body**:
  ```json
  { "domain": "tokopedia.com" }
  ```
- **Respon Sukses (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Domain information extracted successfully",
    "data": {
      "domain": "tokopedia.com",
      "registrar": "MarkMonitor Inc.",
      "registered_at": "2009-12-17T00:00:00Z",
      "expired_at": "2030-12-17T00:00:00Z",
      "last_updated": "2025-11-15T00:00:00Z",
      "status": ["clientTransferProhibited"],
      "nameservers": ["ns1.cloudflare.com", "ns2.cloudflare.com"]
    }
  }
  ```
- **Respon Gagal (404 Not Found)**:
  ```json
  {
    "success": false,
    "message": "Domain not found in RDAP registry",
    "error": "DOMAIN_NOT_FOUND"
  }
  ```
- **Contoh Domain Pengujian**: `tokopedia.com`, `paper.id`, `unilever.co.id`, `google.com`

---

### 3. Company Location Finder (OSM Nominatim)
- **URL**: `/extract/location`
- **Method**: `POST`
- **Request Body**:
  ```json
  { "query": "Tokopedia" }
  ```
- **Respon Sukses (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Location extracted successfully",
    "data": {
      "display_name": "Tokopedia Tower, Jalan Prof. Dr. Satrio, Jakarta Selatan...",
      "latitude": "-6.2297494",
      "longitude": "106.8195316",
      "importance": 0.7012,
      "osm_type": "way",
      "address": { "building": "Tokopedia Tower", "city": "Jakarta Selatan", "country": "Indonesia" }
    }
  }
  ```
- **Respon Gagal (404 Not Found)**:
  ```json
  {
    "success": false,
    "message": "Location not found for query: \"domain-tidak-ada.com\"",
    "error": "LOCATION_NOT_FOUND"
  }
  ```

---

### 4. Integrated Company Information (GET)
- **URL**: `/company-information`
- **Method**: `GET`
- **Query Params**: `domain=tokopedia.com`
- **Respon Sukses Lengkap (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Company information retrieved successfully",
    "data": {
      "website": { "title": "Tokopedia", "url": "https://tokopedia.com", "...": "..." },
      "domain": { "registrar": "MarkMonitor Inc.", "...": "..." },
      "location": { "display_name": "Tokopedia Tower...", "...": "..." }
    },
    "warnings": []
  }
  ```
- **Respon Sukses dengan Partial Failure (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Company information retrieved successfully",
    "data": {
      "website": { "title": "Paper.id", "...": "..." },
      "domain": { "registrar": "PANDI", "...": "..." },
      "location": null
    },
    "warnings": [
      { "source": "location", "message": "Location not found for query: \"paper.id\"" }
    ]
  }
  ```

---

## Asumsi & Kendala Pengerjaan

### Asumsi yang Saya Gunakan
1. **Pembersihan Alamat Domain**: Saya berasumsi pengguna bisa saja tidak sengaja memasukkan URL lengkap (seperti `https://paper.id/invoice`). Oleh karena itu, sistem yang saya buat otomatis membersihkannya menjadi nama domain murni (`paper.id`) sebelum diproses lebih lanjut.
2. **Kata Kunci Pencarian Alamat**: Saya menggunakan nama domain atau nama perusahaan sebagai kata kunci utama saat mencari titik lokasi fisik ke layanan peta.
3. **Pencegahan Error Total**: Saya menerapkan prinsip *partial failure*. Jika salah satu layanan eksternal (seperti peta) tidak menemukan data atau mengalami kendala, aplikasi buatan saya tidak akan error total, melainkan tetap menampilkan informasi dari layanan yang berhasil didapatkan.

### Kendala Teknis & Solusi yang Saya Terapkan

1. **Website Mengembalikan Error HTTP 403 (Diblokir Anti-Bot)**
   - **Kendala**: Saat saya mencoba menarik metadata dari beberapa website besar (seperti `unilever.co.id`), request otomatis dari script sering diblokir oleh sistem keamanan Cloudflare atau WAF mereka.
   - **Solusi**: Di file `website.service.ts`, saya menambahkan header peramban (browser) modern secara lengkap agar request dianggap seperti manusia yang sedang membuka browser Chrome asli, serta menambahkan fitur percobaan ulang otomatis (*retry*) dengan awalan `www.` jika alamat utama ditolak.

2. **Batasan Kecepatan Pencarian Peta (OpenStreetMap Nominatim)**
   - **Kendala**: Layanan peta OpenStreetMap Nominatim melarang permintaan data lebih dari 1 kali dalam 1 detik. Jika saya mengirim permintaan terlalu cepat, IP komputer saya bisa diblokir sementara.
   - **Solusi**: Di file `location.service.ts`, saya membuat sistem antrean (*queue*) yang memberikan jeda otomatis 1 detik untuk setiap pencarian lokasi agar selalu aman dan mematuhi aturan Nominatim.

3. **Format Data Domain RDAP yang Berbeda-Beda**
   - **Kendala**: Respon JSON dari penyedia registri domain internasional (seperti `google.com` atau `tokopedia.com`) dan domain lokal (seperti `paper.id` atau `unilever.co.id`) memiliki struktur yang tidak sama.
   - **Solusi**: Di file `domain.service.ts`, saya membuat fungsi pemetaan (*data normalization*) untuk menyamakan format tanggal, pengelola domain (registrar), dan nameserver sehingga informasi yang tampil di layar selalu konsisten.




