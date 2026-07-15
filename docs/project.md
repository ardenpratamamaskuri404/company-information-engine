# Project Structure

## 1. Struktur Folder

```
company-information-engine/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── website.controller.ts
│   │   │   ├── domain.controller.ts
│   │   │   ├── location.controller.ts
│   │   │   └── company.controller.ts
│   │   ├── services/
│   │   │   ├── website.service.ts
│   │   │   ├── domain.service.ts
│   │   │   ├── location.service.ts
│   │   │   └── company.service.ts
│   │   ├── routes/
│   │   │   ├── website.routes.ts
│   │   │   ├── domain.routes.ts
│   │   │   ├── location.routes.ts
│   │   │   ├── company.routes.ts
│   │   │   └── index.ts
│   │   ├── middlewares/
│   │   │   ├── errorHandler.ts
│   │   │   └── validateRequest.ts
│   │   ├── utils/
│   │   │   ├── httpClient.ts
│   │   │   └── responseFormatter.ts
│   │   ├── types/
│   │   │   ├── website.types.ts
│   │   │   ├── domain.types.ts
│   │   │   ├── location.types.ts
│   │   │   └── common.types.ts
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── docs/
│   ├── documentation.md
│   ├── project.md
│   ├── alurlogic.md
│   ├── stackflow.md
│   ├── api.md
│   ├── roadmap.md
│   └── architecture.md
│
├── README.md
└── .gitignore
```

> Catatan untuk AI assistant: satu file = satu tanggung jawab. Jangan menaruh logic pemanggilan API eksternal di dalam controller — controller hanya menerima request, memanggil service, dan mengembalikan response. Semua fetching/parsing ada di service.

---

## 2. Backend Architecture

```
Route → Middleware (validasi) → Controller → Service → External API → Response Formatter → JSON Response
```

- **Route**: mendefinisikan path + HTTP method, tidak berisi logic.
- **Middleware**: validasi input (mis. domain/URL wajib ada dan valid) sebelum masuk controller.
- **Controller**: orchestration tipis — panggil service, tangani try/catch, kirim response. Tidak ada business logic di sini.
- **Service**: seluruh logic — memanggil API eksternal, parsing, normalisasi data.
- **Response Formatter**: membungkus semua response (sukses maupun error) ke format standar (lihat §4).

---

## 3. Service Layer

| Service | Tanggung Jawab |
|---|---|
| `WebsiteService` | Download HTML target, parsing dengan Cheerio, ekstraksi metadata |
| `DomainService` | Query RDAP, normalisasi field domain |
| `LocationService` | Query Nominatim, normalisasi field lokasi |
| `CompanyService` | Memanggil ketiga service di atas (parallel via `Promise.allSettled`), menggabungkan hasil, menangani partial failure |

---

## 4. Kontrak Endpoint

Semua endpoint mengembalikan **format response standar**:

Sukses:
```json
{
  "success": true,
  "data": { }
}
```

Gagal:
```json
{
  "success": false,
  "message": "deskripsi error yang jelas",
  "error": "kode/tipe error (opsional)"
}
```

### 4.1 `POST /extract/website`
**Request body**
```json
{ "url": "https://paper.id" }
```
**Response 200**
```json
{
  "success": true,
  "data": {
    "url": "https://paper.id",
    "title": "",
    "description": "",
    "canonical": "",
    "favicon": "",
    "emails": [],
    "phones": [],
    "social_media": [],
    "open_graph": { "title": "", "description": "", "image": "" }
  }
}
```
**Response error** — 400 (url tidak valid/tidak ada), 502 (target tidak bisa diakses).

### 4.2 `POST /extract/domain`
**Request body**
```json
{ "domain": "paper.id" }
```
**Response 200**
```json
{
  "success": true,
  "data": {
    "domain": "paper.id",
    "registrar": "",
    "registered_at": "",
    "expired_at": "",
    "last_updated": "",
    "status": [],
    "nameservers": []
  }
}
```
**Response error** — 400 (domain tidak valid), 404 (domain tidak ditemukan di RDAP), 502 (RDAP tidak bisa diakses).

### 4.3 `POST /extract/location`
**Request body**
```json
{ "query": "PT Telkom Indonesia" }
```
**Response 200**
```json
{
  "success": true,
  "data": {
    "display_name": "",
    "latitude": "",
    "longitude": "",
    "importance": "",
    "osm_type": "",
    "address": {}
  }
}
```
**Response error** — 400 (query kosong), 404 (tidak ditemukan), 502 (Nominatim tidak bisa diakses).

### 4.4 `GET /company-information?domain={domain}`
**Response 200**
```json
{
  "success": true,
  "data": {
    "website": {},
    "domain": {},
    "location": {}
  }
}
```
Jika salah satu source gagal, field terkait berisi `null` beserta `error` singkat di dalamnya — **bukan** membuat seluruh request gagal (lihat `alurlogic.md` §"Partial Failure"). `location` menggunakan nama perusahaan/domain sebagai query pencarian.

---

## 5. Frontend

Satu halaman saja (single page), tanpa routing kompleks:
- Input domain/URL.
- Trigger request ke `GET /company-information`.
- Tampilkan hasil Website / Domain / Location dalam bentuk terpisah.
- Tampilkan Raw JSON (collapsible).
- Loading state & error state sederhana.

Tidak ada Login, tidak ada Dashboard Admin, tidak ada state management library — `useState`/`useEffect` cukup.

---

## 6. Clean Code — Aturan Konkret

"Clean Code" masuk fokus penilaian (`documentation.md` §5), jadi ini bukan saran opsional — ikuti aturan berikut di seluruh backend maupun frontend:

**Penamaan**
- Nama variabel/fungsi menjelaskan isi/tujuannya, bukan tipe atau singkatan ambigu. `extractWebsiteMetadata()` bukan `getData()` atau `process()`.
- Konsisten: camelCase untuk variabel/fungsi, PascalCase untuk class/type/interface, UPPER_SNAKE_CASE untuk konstanta (mis. `DEFAULT_TIMEOUT_MS`).
- Nama file mengikuti isinya: `website.service.ts` isinya `WebsiteService`, bukan campuran isi tak terkait.

**Fungsi & Struktur**
- Satu fungsi = satu tanggung jawab. Kalau sebuah fungsi butuh dijelaskan pakai kata "dan" (mis. "fetch HTML dan parsing dan validasi"), pecah jadi beberapa fungsi.
- Controller tetap tipis (lihat §2) — logic berat selalu di service, bukan di controller atau route.
- Hindari nesting `if/else` lebih dari 2 level — pakai early return untuk validasi/error di awal fungsi.
- Hindari magic number/string tersebar di kode. Timeout, base URL, rate limit → taruh di `config/env.ts` atau konstanta bernama.

**Tipe & Kontrak Data**
- Setiap response/request punya `type`/`interface` eksplisit di `types/` — jangan pakai `any`.
- Field yang sifatnya opsional dari sumber eksternal (mis. RDAP kadang tidak punya `expired_at`) ditandai eksplisit di type (`expired_at?: string`), bukan diasumsikan selalu ada.

**Komentar**
- Komentar menjelaskan **kenapa**, bukan **apa** (kode yang jelas sudah menjelaskan "apa"-nya sendiri). Contoh yang berguna: `// Nominatim menolak request tanpa User-Agent, lihat alurlogic.md §3`.
- Jangan biarkan kode yang di-comment-out ikut ke commit — hapus, bukan disimpan "siapa tahu kepakai".

**Konsistensi**
- Format otomatis pakai Prettier + ESLint (satu config untuk seluruh project), supaya gaya kode tidak berubah-ubah antar file.
- Struktur error handling, response formatting, dan penamaan endpoint konsisten di seluruh connector — connector Website, Domain, dan Location harus terasa ditulis oleh "satu orang", bukan tiga gaya berbeda.

> Catatan untuk AI assistant: aturan di atas berlaku dari commit pertama, bukan dirapikan belakangan sebelum submit. Ini karena reviewer menilai *history* commit (lihat `stackflow.md` §4) — kode berantakan yang "dibersihkan" di commit terakhir tetap kelihatan di history-nya.

