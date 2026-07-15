# Clean Code & Arsitektur Sistem (Company Lookup)

Dokumen ini menjelaskan prinsip **Clean Code**, pola desain, dan struktur logika yang diterapkan pada proyek **Company Lookup** agar mudah dipahami saat penilaian/presentasi.

---

## 1. Prinsip Desain Utama

Proyek ini dibangun mengikuti prinsip-prinsip desain perangkat lunak modern untuk menjaga kebersihan kode dan pemisahan tanggung jawab (Separation of Concerns).

### A. Single Responsibility Principle (SRP)
> *"Satu modul/file hanya memiliki satu alasan untuk berubah."*
- **Satu file = satu tanggung jawab**.
- File service (`website.service.ts`, `domain.service.ts`, `location.service.ts`) murni melakukan pemanggilan I/O dan parser data masing-masing.
- Validasi data dipisahkan ke dalam layer middleware (`validateRequest.ts`).
- Response formatting disentralisasi di helper (`responseFormatter.ts`).
- Pengendalian alur HTTP ditangani terpisah oleh Controller.

### B. Service Layer Pattern
- **Controller** (`company.controller.ts`) hanya bertugas menangani request-response HTTP, validasi, dan memanggil Service.
- **Service** (`company.service.ts` & sub-services) bertugas mengeksekusi logika bisnis murni, kalkulasi, integrasi data, dan integrasi dengan API pihak ketiga.
- Keuntungan: Logika bisnis dapat dites secara unit tanpa harus menjalankan server HTTP/Express.

### C. Graceful Partial Failure Handling (Penanganan Kegagalan Sebagian)
- Masalah: Jika salah satu API eksternal (misalnya geocoding Nominatim) down atau rate-limited, kita tidak ingin seluruh request lookup gagal.
- Solusi: `CompanyService` menggunakan **`Promise.allSettled()`** untuk mengeksekusi ketiga sub-service secara paralel.
- Hasil dari masing-masing service dianalisis:
  - Jika **berhasil (fulfilled)**: Datanya diambil.
  - Jika **gagal (rejected)**: Error-nya ditangkap, nilainya di-set ke `null`, dan detail error dimasukkan ke dalam array `warnings`.
  - Endpoint tetap mengembalikan HTTP 200 dengan status `success: true` agar frontend tetap dapat menampilkan data website & domain dengan normal.

---

## 2. Struktur Kode & Implementasi Penting

### A. Location Rate Limiting & Queue
Nominatim memiliki kebijakan ketat: **Maksimum 1 request per detik**.
- **Penerapan**: `LocationService` menggunakan antrean berbasis Promise chaining (`Promise.all` queue) untuk membatasi eksekusi request geocoding berturut-turut agar berjarak minimal 1 detik, mencegah IP diblokir oleh OpenStreetMap.

### B. Standardized Response Format
Setiap endpoint API mengembalikan format response JSON yang seragam dengan tipe global `ApiResponse<T>`:
```typescript
{
  "success": boolean,
  "message": string,
  "data"?: T,
  "warnings"?: Array<{ source: string; message: string }>
}
```

### C. Centralized Error Handling
Setiap error yang tidak tertangkap di Controller akan diteruskan ke global Express middleware `errorHandler.ts`.
- Mengamankan server agar tidak crash jika terjadi error tak terduga.
- Menyembunyikan informasi error sensitif (stack trace) saat di production mode demi alasan keamanan.

---

## 3. Struktur Direktori Proyek

```
backend/
├── src/
│   ├── config/          # Centralized configuration (.env loader)
│   ├── controllers/     # HTTP controllers (Express request/response)
│   ├── middlewares/     # Express middlewares (Validation, Error handler)
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic & 3rd party API integration
│   ├── types/           # Global TypeScript type definitions
│   ├── utils/           # Helper utilities
│   ├── __tests__/       # Automated Unit Tests (Jest & Supertest)
│   ├── app.ts           # Express App initialization
│   └── server.ts        # Entrypoint (Start HTTP server)
```
