# Technology Stack

## 1. Backend

| Teknologi | Peran | Alasan |
|---|---|---|
| Node.js | Runtime | Konsisten dengan ekosistem JS di frontend, cepat untuk I/O-bound (banyak call ke API eksternal) |
| Express.js | REST API framework | Ringan, cukup untuk scope challenge, mudah dijelaskan saat review |
| TypeScript | Static typing | Mengurangi bug saat menormalisasi data dari 3 sumber eksternal berbeda; kontrak tipe (`types/`) jadi dokumentasi hidup |
| Axios | HTTP client | Timeout & header custom (mis. User-Agent untuk Nominatim) mudah dikonfigurasi |
| Cheerio | HTML parser | Parsing metadata website (title, OG tags, dsb.) tanpa overhead headless browser |
| dotenv | Environment config | Memisahkan konfigurasi (base URL API eksternal, port, timeout) dari kode |
| cors | Cross-Origin | Frontend (port berbeda) perlu akses API backend saat development |
| nodemon | Dev server | Auto-reload saat development |

**Catatan pemilihan:** brief challenge menyebutkan Laravel sebagai nilai tambah, namun bebas menggunakan bahasa/framework apa pun. Node.js/Express/TypeScript dipilih karena kesamaan bahasa dengan frontend (React) mempercepat development dalam waktu terbatas, dan TypeScript memberi type-safety yang relevan untuk project yang banyak menormalisasi data dari sumber eksternal berbeda-beda.

---

## 2. Frontend

| Teknologi | Peran |
|---|---|
| React | UI library |
| Vite | Build tool / dev server |
| TypeScript | Type safety, berbagi tipe response dengan backend jika perlu |
| Axios | Konsumsi backend API |
| TailwindCSS | Styling utility-first, cukup untuk tampilan sederhana (bukan objek penilaian) |

### 2.1 Nama Produk

**Company Lookup** — nama ini dipakai konsisten di judul halaman (`<title>`), header aplikasi, `package.json` (`name: "company-lookup"`), dan README. Nama menggambarkan fungsi aplikasi apa adanya: alat pencari/lookup informasi perusahaan dari satu input (domain atau nama perusahaan).

### 2.2 Desain UI/UX

Frontend bukan objek penilaian utama (lihat `documentation.md` §3.2), tapi tetap dibuat rapi dan terarah supaya enak dipakai saat demo/review. Berikut token desain yang **wajib diikuti** oleh AI assistant saat membangun frontend — bukan sekadar "pakai Tailwind default", tapi desain yang disengaja.

**Prinsip:** sederhana seperti tools pencarian modern (mirip pengalaman search/lookup tool), latar putih bersih, satu warna aksen biru muda terang yang konsisten dipakai di seluruh elemen interaktif.

#### Palet Warna (token, jangan pakai warna Tailwind default asal comot)

| Token | Hex | Peran |
|---|---|---|
| `--color-bg` | `#FFFFFF` | Latar utama halaman |
| `--color-surface` | `#F5F9FF` | Latar card/panel hasil (biru sangat muda, bukan abu-abu generik) |
| `--color-accent` | `#3B82F6` | Warna aksen utama — tombol, border fokus, ikon aktif, link |
| `--color-accent-hover` | `#2563EB` | State hover/pressed dari elemen aksen |
| `--color-text` | `#0F172A` | Teks utama (judul, isi penting) |
| `--color-text-muted` | `#64748B` | Teks sekunder (label, caption, placeholder) |
| `--color-border` | `#E2E8F0` | Border card, input, divider |

Jangan menambah warna lain di luar tabel ini (termasuk jangan pakai gradient warna-warni atau warna gelap sebagai latar) — konsistensi satu aksen biru inilah yang bikin aplikasinya terasa rapi, bukan template generik.

#### Tipografi

| Peran | Font | Alasan |
|---|---|---|
| Display (judul, nama produk) | **Space Grotesk** | Karakter geometris-modern, cocok untuk brand tools teknis tanpa terkesan kaku |
| Body (teks umum, label, tombol) | **Inter** | Netral, sangat mudah dibaca di ukuran kecil, standar untuk UI aplikasi |
| Data/monospace (raw JSON, domain, kode status) | **JetBrains Mono** | Menegaskan bagian yang menampilkan data mentah/teknis, membedakan dari teks UI biasa |

#### Layout (single page, sesuai `project.md` §5)

```
┌───────────────────────────────────────────────┐
│  Company Lookup                                │  ← header, logo teks + accent dot
│                                                 │
│         Temukan informasi perusahaan           │
│         dari domain atau nama                  │  ← subheading, text-muted
│                                                 │
│   ┌───────────────────────────────┐  ┌───────┐ │
│   │  cth: paper.id                 │  │ Cari →│ │  ← input + tombol accent
│   └───────────────────────────────┘  └───────┘ │
│                                                 │
│   ○────────────○────────────○                  │  ← status 3 node (lihat "elemen khas")
│  Website      Domain      Location              │
│                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │ Website │  │ Domain  │  │Location │         │  ← 3 card hasil, stack di mobile
│  │ ...     │  │ ...     │  │ ...     │         │
│  └─────────┘  └─────────┘  └─────────┘         │
│                                                 │
│  ▸ Lihat Raw JSON                              │  ← collapsible, font monospace
└───────────────────────────────────────────────┘
```

- Card hasil pakai `--color-surface` sebagai latar, `--color-border` sebagai outline tipis, radius sedang (~12px) — bukan kotak tajam, bukan juga bulat berlebihan.
- Tombol utama solid `--color-accent`, teks putih, radius sama dengan card.
- Input search jadi elemen paling menonjol di atas fold — ini "search-first" tool, bukan dashboard.

#### Elemen Khas (signature)

Saat request ke `GET /company-information` sedang berjalan, tampilkan **3 node status yang saling terhubung garis** (bukan spinner generik) — merepresentasikan 3 connector (Website, Domain, Location) yang berjalan paralel secara nyata di backend. Tiap node berubah dari abu-abu → `--color-accent` begitu data connector tersebut selesai diterima. Elemen ini jujur terhadap cara kerja aplikasi (bukan dekorasi kosong) dan jadi identitas visual yang membedakan dari tools sejenis.

#### Prompt Desain (siap dipakai untuk AI assistant/tool desain)

Gunakan teks berikut sebagai prompt saat meminta AI (Claude, atau tool desain UI lain) membangun komponen frontend, supaya hasilnya konsisten dengan token di atas:

> Desain sebuah single-page web app bernama **"Company Lookup"** — tool pencari informasi perusahaan (website metadata, domain intelligence, lokasi) dari satu input domain/nama. Gaya: bersih, minim, latar putih (`#FFFFFF`), warna aksen tunggal biru muda terang (`#3B82F6`, hover `#2563EB`), card hasil dengan latar biru sangat muda (`#F5F9FF`) dan border tipis (`#E2E8F0`), radius sudut medium (~12px), tanpa gradient dan tanpa warna lain di luar palet ini. Tipografi: judul pakai Space Grotesk, teks body pakai Inter, area data mentah (JSON) pakai JetBrains Mono. Layout: header sederhana → search bar besar di tengah sebagai fokus utama → indikator status 3-node (Website/Domain/Location) yang menyala satu per satu saat data masuk → 3 card hasil berdampingan (stack vertikal di mobile) → panel collapsible untuk raw JSON di bagian bawah. Tidak ada login, tidak ada sidebar, tidak ada dashboard — murni alur cari lalu lihat hasil. Responsive sampai ukuran mobile, fokus keyboard terlihat jelas di input dan tombol.

---

## 3. External Services (Sumber Data)

| Sumber | Digunakan untuk | Catatan |
|---|---|---|
| Target website (HTML) | Metadata website | Diparsing via Cheerio |
| RDAP (`rdap.org`) | Domain intelligence | Response struktur bisa bervariasi antar TLD/registrar |
| OpenStreetMap Nominatim | Company location | Wajib set `User-Agent`, rate limit 1 req/detik |

---

## 4. Version Control

- Git + GitHub (Public repository).
- Commit bertahap & deskriptif sejak awal — **ini dinilai secara eksplisit**, jangan squash jadi satu commit besar di akhir.
- Saran alur commit: init project → setup Express+TS → Website connector → Domain connector → Location connector → Integration endpoint → error handling → README → (value-add: test/Docker/dsb).

---

## 5. Prioritas Pengembangan (Roadmap Ringkas)

Urutan ini selaras dengan fokus penilaian di `documentation.md` §5 — kerjakan dari atas ke bawah:

1. Setup project (backend + frontend skeleton, struktur folder sesuai `project.md`).
2. Website connector (`POST /extract/website`) + error handling.
3. Domain connector (`POST /extract/domain`) + error handling.
4. Location connector (`POST /extract/location`) + error handling.
5. Integration endpoint (`GET /company-information`) + partial failure handling.
6. Frontend demo (single page, konsumsi integration endpoint).
7. README lengkap (`docs/api.md` bisa dipisah dari README jika perlu).
8. **Baru setelah semua di atas selesai dan stabil** — kerjakan value-add sesuai kapasitas waktu tersisa terhadap deadline (22 Juli 2026, 17:00 WIB):
   - Unit test / feature test (prioritas tertinggi di antara value-add — langsung terlihat di kriteria penilaian)
   - Dokumentasi OpenAPI/Swagger
   - Docker
   - Logging (Winston)
   - Caching (Redis)
   - CI/CD

> Catatan untuk AI assistant: jangan lompat ke item value-add sebelum item 1–7 selesai dan bisa dijalankan end-to-end. Jika waktu mepet mendekati deadline, hentikan di item 7 dan pastikan README + video presentasi selesai — dua hal ini termasuk syarat gugur/diskualifikasi jika tidak ada.
