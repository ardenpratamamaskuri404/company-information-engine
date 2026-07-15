# Application Flow

## 1. Website Extractor

```
User
  → POST /extract/website { url }
  → validateRequest (url wajib, harus format URL valid)
  → WebsiteController
  → WebsiteService
      → Axios GET ke url (timeout, mis. 8s)
      → Cheerio load HTML
      → Ekstrak: title, description, canonical, favicon,
        emails (regex mailto: + teks), phones (regex),
        social_media (link ke domain dikenal: instagram/facebook/
        twitter-x/linkedin/tiktok/youtube), open_graph (meta og:*)
  → Response Formatter
  → JSON Response
```

**Edge case yang wajib ditangani:**
- URL tidak valid → 400, sebelum melakukan request keluar.
- Target website timeout/tidak bisa diakses (DNS error, 5xx, dsb.) → 502, message jelas ("Website cannot be reached").
- Field yang tidak ditemukan di HTML (mis. tidak ada favicon) → tetap kembalikan string kosong `""` atau array kosong `[]`, jangan `undefined`/menghilangkan key.

---

## 2. Domain Intelligence

```
User
  → POST /extract/domain { domain }
  → validateRequest (domain wajib, format domain valid — tanpa protokol/path)
  → DomainController
  → DomainService
      → Axios GET https://rdap.org/domain/{domain}
      → Normalisasi response RDAP (struktur RDAP cukup kompleks,
        map ke skema minimal yang diminta)
  → Response Formatter
  → JSON Response
```

**Edge case yang wajib ditangani:**
- Domain tidak valid (mis. mengandung `http://` atau spasi) → 400.
- RDAP mengembalikan 404 (domain tidak terdaftar/tidak ditemukan) → teruskan sebagai 404 dengan message jelas.
- RDAP down/timeout → 502.

---

## 3. Company Location

```
User
  → POST /extract/location { query }
  → validateRequest (query wajib, tidak boleh string kosong)
  → LocationController
  → LocationService
      → Axios GET https://nominatim.openstreetmap.org/search
        ?q={query}&format=jsonv2
      → Wajib set User-Agent header (Nominatim menolak request
        tanpa User-Agent yang jelas — cantumkan nama project/kontak)
      → Ambil hasil pertama (paling relevan/importance tertinggi)
  → Response Formatter
  → JSON Response
```

**Edge case yang wajib ditangani:**
- Query kosong → 400.
- Nominatim mengembalikan array kosong (tidak ada hasil) → 404, message jelas ("Location not found").
- Nominatim down/timeout/rate-limited → 502.
- Rate limit Nominatim: gunakan **max 1 request/detik** (kebijakan resmi Nominatim), jangan spam saat testing.

---

## 4. Final Integration

```
User
  → GET /company-information?domain={domain}
  → validateRequest (domain wajib)
  → CompanyController
  → CompanyService
      → Promise.allSettled([
          WebsiteService.extract(`https://${domain}`),
          DomainService.extract(domain),
          LocationService.extract(domain)   // atau nama perusahaan jika tersedia
        ])
      → Merge hasil: fulfilled → data asli, rejected → null + error message
  → Response Formatter
  → JSON Response
```

### Partial Failure (penting)

Endpoint integrasi **tidak boleh gagal total** hanya karena satu connector gagal. Gunakan `Promise.allSettled`, bukan `Promise.all`. Contoh response saat `location` gagal tapi `website` & `domain` sukses:

```json
{
  "success": true,
  "data": {
    "website": { "...": "..." },
    "domain": { "...": "..." },
    "location": null
  },
  "warnings": [
    { "source": "location", "message": "Location not found" }
  ]
}
```

Endpoint hanya mengembalikan `success: false` jika **ketiganya** gagal.

---

## 5. Frontend Flow

```
User Input Domain
  → Validasi sederhana di client (tidak boleh kosong)
  → Axios Request ke GET /company-information?domain=...
  → Loading state aktif
  → Terima JSON
  → Jika success: tampilkan Website / Domain / Location secara terpisah
  → Jika ada warnings: tampilkan indikator "sebagian data tidak tersedia"
  → Selalu tampilkan Raw JSON (collapsible, untuk keperluan review)
```

---

## 6. Error Handling — Standar Global

Semua error ditangani lewat satu `errorHandler` middleware terpusat (jangan try/catch berulang dengan format berbeda di tiap controller).

**Format error standar:**
```json
{
  "success": false,
  "message": "Website cannot be reached",
  "error": "UPSTREAM_UNAVAILABLE"
}
```

**Mapping status code:**
| Situasi | HTTP Status |
|---|---|
| Input tidak valid / field wajib kosong | 400 |
| Data tidak ditemukan di sumber eksternal | 404 |
| Sumber eksternal timeout/down/error | 502 |
| Error tak terduga di server sendiri | 500 |

> Catatan untuk AI assistant: jangan biarkan error dari axios (mis. `AxiosError`) bocor langsung ke response. Selalu tangkap, petakan ke status code di atas, dan format ulang lewat Response Formatter.
