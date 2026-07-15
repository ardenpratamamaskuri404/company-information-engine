# Panduan Testing API di Postman

> Base URL: `http://localhost:3000`

---

## Endpoint 1 — Health Check

Digunakan untuk memverifikasi server berjalan dengan baik.

- **Method**: `GET`
- **URL**: `http://localhost:3000/health`
- **Body**: tidak diperlukan

**Response sukses:**
```json
{
  "success": true,
  "message": "Server is healthy"
}
```

---

## Endpoint 2 — Company Information (Main Endpoint)

Endpoint utama yang mengintegrasikan ketiga konektor sekaligus (website + domain + location). Ini endpoint yang digunakan frontend.

- **Method**: `GET`
- **URL**: `http://localhost:3000/company-information`
- **Params** (Query Parameter, bukan Body):

  | Key      | Value         | Wajib? |
  |----------|---------------|--------|
  | `domain` | `tokopedia.com` | ✅ Ya |

**Cara set di Postman:**
1. Pilih method `GET`
2. Masukkan URL: `http://localhost:3000/company-information`
3. Klik tab **Params**
4. Tambahkan key `domain` dengan value `tokopedia.com`

**Contoh URL lengkap:**
```
http://localhost:3000/company-information?domain=tokopedia.com
```

**Response sukses (sebagian):**
```json
{
  "success": true,
  "message": "Company information retrieved successfully",
  "data": {
    "website": {
      "url": "https://tokopedia.com",
      "title": "...",
      "emails": [...],
      "social_media": [...]
    },
    "domain": {
      "registrar": "...",
      "registered_at": "...",
      "nameservers": [...]
    },
    "location": {
      "display_name": "...",
      "latitude": "...",
      "longitude": "..."
    }
  },
  "warnings": []
}
```

**Contoh partial failure (location gagal):**
```json
{
  "success": true,
  "data": {
    "website": { ... },
    "domain": { ... },
    "location": null
  },
  "warnings": [
    {
      "source": "location",
      "message": "Location not found for query: ..."
    }
  ]
}
```

**Domain yang direkomendasikan untuk testing:**

| Domain | Keterangan |
|---|---|
| `tokopedia.com` | Sukses lengkap (website + domain + location) |
| `google.com` | Sukses lengkap internasional |
| `paper.id` | Domain lokal, location mungkin partial |
| `telkom.co.id` | Domain `.co.id` dengan RDAP PANDI |

---

## Endpoint 3 — Extract Website Metadata (Sub-Extractor)

Mengambil metadata dari satu URL website tertentu secara langsung.

- **Method**: `POST`
- **URL**: `http://localhost:3000/extract/website`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
```json
{
  "url": "https://tokopedia.com"
}
```

**Response sukses:**
```json
{
  "success": true,
  "message": "Website metadata extracted successfully",
  "data": {
    "url": "https://tokopedia.com",
    "title": "...",
    "description": "...",
    "canonical": "...",
    "favicon": "...",
    "emails": ["support@tokopedia.com"],
    "phones": [],
    "social_media": ["https://instagram.com/tokopedia"],
    "open_graph": {
      "title": "...",
      "description": "...",
      "image": "..."
    }
  }
}
```

**Contoh URL lain untuk dicoba:**
```json
{ "url": "https://paper.id" }
{ "url": "https://unilever.co.id" }
{ "url": "https://spotify.com" }
```

---

## Endpoint 4 — Extract Domain Intelligence (Sub-Extractor)

Mengambil data registrasi domain via protokol RDAP.

- **Method**: `POST`
- **URL**: `http://localhost:3000/extract/domain`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
```json
{
  "domain": "tokopedia.com"
}
```

**Response sukses:**
```json
{
  "success": true,
  "message": "Domain information extracted successfully",
  "data": {
    "domain": "tokopedia.com",
    "registrar": "...",
    "registered_at": "2009-12-17T...",
    "expired_at": "2030-12-17T...",
    "last_updated": "...",
    "status": ["clientTransferProhibited"],
    "nameservers": ["ns1.cloudflare.com", "ns2.cloudflare.com"]
  }
}
```

**Contoh domain lain:**
```json
{ "domain": "paper.id" }
{ "domain": "google.com" }
{ "domain": "bca.co.id" }
```

---

## Endpoint 5 — Extract Company Location (Sub-Extractor)

Melakukan geocoding berdasarkan nama perusahaan/lokasi via OpenStreetMap Nominatim.

- **Method**: `POST`
- **URL**: `http://localhost:3000/extract/location`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
```json
{
  "company_name": "Tokopedia",
  "domain": "tokopedia.com"
}
```

**Response sukses:**
```json
{
  "success": true,
  "message": "Location extracted successfully",
  "data": {
    "display_name": "Tokopedia Tower, Jl. Prof. Dr. Satrio, Jakarta Selatan, ...",
    "latitude": "-6.2297...",
    "longitude": "106.8195...",
    "importance": 0.7012,
    "osm_type": "way",
    "address": {
      "building": "Tokopedia Tower",
      "road": "Jl. Prof. Dr. Satrio",
      "city": "Jakarta Selatan",
      "country": "Indonesia"
    }
  }
}
```

**Query lain untuk dicoba:**
```json
{ "company_name": "Google", "domain": "google.com" }
{ "company_name": "Unilever Indonesia", "domain": "unilever.co.id" }
{ "company_name": "Spotify", "domain": "spotify.com" }
```

---

## Pengujian Error / Edge Cases

### 1. Domain format tidak valid
```
GET http://localhost:3000/company-information?domain=bukan-domain-valid!
```
**Expected:** HTTP 400 Bad Request
```json
{ "success": false, "message": "Invalid domain format" }
```

### 2. Domain tidak ada di registri
```json
POST /extract/domain
{ "domain": "domain-yang-tidak-ada-12345.xyz" }
```
**Expected:** HTTP 404 — domain not found in RDAP

### 3. Body kosong (POST endpoint)
```json
POST /extract/website
{}
```
**Expected:** HTTP 400 — validation error

---

## Cara Import ke Postman Collection

1. Buka Postman → klik **"Collections"** di sidebar kiri.
2. Klik tombol **"+"** → **"Blank Collection"**.
3. Beri nama: `Company Lookup API`.
4. Tambahkan requests satu per satu sesuai daftar di atas.
5. Opsional: set **Environment Variable** `baseUrl = http://localhost:3000` untuk kemudahan.
