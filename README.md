# Company Lookup (Data Acquisition Engine)

**Company Lookup** adalah aplikasi web *single-page* pencari informasi perusahaan terintegrasi. Aplikasi ini berfungsi sebagai **Data Acquisition Engine** dengan mengumpulkan metadata website, informasi domain registrasi (RDAP), dan data koordinat lokasi geografis (OSM Nominatim) secara paralel, lalu menyajikannya dalam satu dashboard premium dan ringkas.

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

Semua response dari backend mengembalikan format seragam berikut:
- **Sukses**: `{ "success": true, "data": { ... } }`
- **Gagal**: `{ "success": false, "message": "...", "error": "CODE" }`

### 1. Website Metadata Extractor
- **URL**: `/extract/website`
- **Method**: `POST`
- **Request Body**:
  ```json
  { "url": "https://paper.id" }
  ```
- **Response 200**:
  ```json
  {
    "success": true,
    "data": {
      "url": "https://paper.id",
      "title": "Paper.id - Invoice & Pembayaran Bisnis No.1 di Indonesia",
      "description": "Buat invoice online gratis dengan mudah...",
      "canonical": "https://paper.id",
      "favicon": "https://paper.id/favicon.ico",
      "emails": ["support@paper.id"],
      "phones": ["08123456789"],
      "social_media": ["https://instagram.com/paper.id"],
      "open_graph": { "title": "Paper.id", "description": "...", "image": "..." }
    }
  }
  ```

### 2. Domain Intelligence (RDAP)
- **URL**: `/extract/domain`
- **Method**: `POST`
- **Request Body**:
  ```json
  { "domain": "paper.id" }
  ```
- **Response 200**:
  ```json
  {
    "success": true,
    "data": {
      "domain": "paper.id",
      "registrar": "PANDI",
      "registered_at": "2015-10-21T09:23:11Z",
      "expired_at": "2026-10-21T09:23:11Z",
      "last_updated": "2025-10-21T09:23:11Z",
      "status": ["active"],
      "nameservers": ["ns1.dns.com", "ns2.dns.com"]
    }
  }
  ```

### 3. Company Location Finder (OSM Nominatim)
- **URL**: `/extract/location`
- **Method**: `POST`
- **Request Body**:
  ```json
  { "query": "PT Telkom Indonesia" }
  ```
- **Response 200**:
  ```json
  {
    "success": true,
    "data": {
      "display_name": "Telkom Indonesia, Jalan Jenderal Gatot Subroto...",
      "latitude": "-6.2297",
      "longitude": "106.8164",
      "importance": 0.75,
      "osm_type": "node",
      "address": { "city": "Jakarta", "country": "Indonesia" }
    }
  }
  ```

### 4. Integrated Company Information (GET)
- **URL**: `/company-information`
- **Method**: `GET`
- **Query Params**: `domain=domain_name` (e.g. `?domain=paper.id`)
- **Response 200 (Dengan Partial Failure)**:
  ```json
  {
    "success": true,
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
