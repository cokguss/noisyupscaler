<div align="center">

# Noisy Uspcaler

**Perbesar resolusi gambar hingga 4x dengan rekonstruksi detail berbasis AI**

Gratis · Tanpa daftar akun · Langsung dari browser

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Node](https://img.shields.io/badge/Node-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/Penggunaan-pribadi-84cc16)](#-lisensi)

</div>

---

## ✨ Fitur

| Bagian | Kemampuan |
|--------|-----------|
| **Dua engine** | Live3D (cepat, WebP) + Swiftspeed (kualitas maksimal, PNG lossless) |
| **Fallback otomatis** | Bila engine pilihan gagal, engine satunya langsung menggantikan |
| **Pembesaran** | 2x atau 4x, dengan resolusi hasil yang identik antar engine |
| **Pembanding** | Slider sebelum/sesudah yang bisa digeser + zoom hingga 4x |

**Fitur umum**

- 🎨 Tampilan dark-tech dengan aksen acid lime & animasi (Motion)
- ⏳ Intro loading animation bergaya glitch dengan penghitung 0–100%
- 📊 Progress bar nyata berbasis streaming NDJSON dari engine
- 🌐 Dua bahasa: Indonesia & English (toggle langsung)
- 🌗 Tema gelap & terang dengan anti-flash
- 📱 Responsif penuh — desktop maupun mobile
- 📄 Halaman Ketentuan & Privasi terpisah
- 🔒 Tanpa daftar akun, tanpa watermark, gambar tidak disimpan di server

## 🚀 Menjalankan Secara Lokal

**Prasyarat:** Node.js 18+

```bash
# 1. Install dependensi
npm install

# 2. Jalankan (web + server proxy sekaligus)
npm run dev
```

Buka **http://localhost:5173** — selesai.

> ⚠️ **Kenapa perlu server proxy?** Engine upscaler (Live3D & Swiftspeed) menuntut header dan alur permintaan yang hanya bisa dikirim dari sisi server, bukan langsung dari browser. Server proxy di port `8787` menangani ini sekaligus mengubah hasil menjadi data URL agar aman berjalan di lingkungan serverless.

### Script yang tersedia

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Vite + server proxy sekaligus (untuk pengembangan) |
| `npm run server` | Hanya server proxy |
| `npm run build` | Build produksi ke folder `dist/` |
| `npm run preview` | Build lalu sajikan lewat server (self-host) |
| `npm run benchmark` | Ukur kecepatan & keluaran tiap engine |

## 🧠 Cara Kerja

```
Browser ──► Vite (frontend, React 19)
   │
   └── POST /api/upscale ──► Express proxy (serverless di Vercel)
                               │
                               ├── Live3D     : cepat, WebP    (~7–11 dtk)  ← bawaan
                               └── Swiftspeed : kualitas, PNG  (~30–80 dtk)
                               │
                               └── fallback otomatis bila salah satu gagal
   │
   hasil ◄── data URL base64 di dalam stream (stateless, tanpa cache server)
```

**Kenapa hasil dikirim sebagai data URL?** Fungsi serverless bersifat sementara — instans bisa berbeda antar-permintaan, jadi tidak bisa diandalkan menyimpan hasil lalu mengambilnya lewat endpoint kedua. Hasil di-encode base64 dan dialirkan langsung di baris terakhir stream NDJSON, jadi berjalan mulus di Vercel tanpa penyimpanan.

**Kenapa dua engine?** Keduanya menghasilkan resolusi 4x yang identik; yang berbeda adalah kecepatan dan cara kompresi. Live3D cepat dan ringan (WebP) untuk kebutuhan web, Swiftspeed lambat tapi lossless (PNG) untuk cetak & arsip. Bila satu penuh atau gagal, satunya menggantikan otomatis.

## 📁 Struktur Proyek

```
noisy-upscaler/
├── api/
│   └── index.js          # Entri serverless Vercel (mengekspor app Express)
├── server/
│   ├── app.js            # Factory createApp() — logika proxy bersama
│   ├── index.js          # Entri dev / self-host (app.listen)
│   ├── imageinfo.js      # Pembaca dimensi PNG/JPEG/WebP dari magic bytes
│   └── upscalers/        # Integrasi Live3D & Swiftspeed
├── src/
│   ├── components/       # Nav, Hero, Studio, CompareSlider, Loader, dll.
│   ├── pages/            # Landing, Legal (Ketentuan & Privasi)
│   ├── lib/              # api.js (klien) + i18n.jsx (ID/EN)
│   └── index.css         # Token tema & gaya global (Tailwind v4)
├── vercel.json           # Build, serverless, & rewrite SPA/API
└── package.json
```

## ☁️ Deploy ke Vercel

Aplikasi ini dirancang stateless, jadi frontend statis dan API serverless bisa satu deployment yang sama.

1. Impor repo ini ke Vercel.
2. Biarkan pengaturan bawaan — `vercel.json` sudah mengatur build (`vite build` → `dist/`), fungsi serverless (`api/index.js`), dan rewrite untuk SPA + `/api/*`.
3. Deploy. Selesai.

> ⚠️ **Catatan paket Hobby (gratis):** `maxDuration` diset `60` detik. Engine **Cepat** (bawaan, ~7–11 dtk) aman. Engine **Kualitas maksimal** (~30–80 dtk) sesekali bisa melewati batas ini dan timeout — fallback otomatis akan menanganinya. Bila upgrade ke Pro, naikkan `maxDuration` di `vercel.json` menjadi `300`.

## ⚠️ Catatan

- Hormati hak cipta — perbesar hanya gambar yang kamu miliki izinnya.
- Aplikasi mengandalkan kuota gratis engine pihak ketiga yang dapat berubah sewaktu-waktu di luar kendali kita.
- Gambar hanya diteruskan untuk diproses, tidak disimpan permanen di server.

## 📄 Lisensi

Penggunaan pribadi & non-komersial. Lihat [LICENSE.md](LICENSE.md) untuk ketentuan lengkap.

---

<div align="center">
Dibuat dengan 💚 — Noisy Uspcaler
</div>
