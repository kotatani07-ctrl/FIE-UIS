# Website Fakultas Ilmu Ekonomi

Fondasi aplikasi informasi **Fakultas Ilmu Ekonomi, Universitas Ichsan Satya**.
Aturan produk, desain, API, keamanan, dan fase pengerjaan tetap berada di `docs/`.

## Menjalankan aplikasi lokal

1. Salin `.env.example` menjadi `.env` untuk konfigurasi lokal. Nilai di contoh
   hanya untuk development dan tidak boleh dipakai di produksi.
2. Jalankan `docker compose -f deploy/docker-compose.yml up --build`.
3. Buka `http://localhost:8080`. Frontend Vite, Django, PostgreSQL, dan Nginx
   development dijalankan sebagai layanan terpisah.

Tanpa Docker, frontend dapat dijalankan dari `frontend/` dengan `npm ci --allow-remote=all` lalu
`npm run dev`. Backend berada di `backend/`; detail dependensi dan settings ada
di direktori tersebut. Pengujian backend menggunakan SQLite in-memory. Compose
telah divalidasi, tetapi menjalankan stack memerlukan akses user ke Docker daemon.

## Analisis aturan dan cakupan saat ini

- Sumber konten produksi harus berasal dari Django Admin; konten institusi
  seperti visi-misi, sejarah, logo, dan kontak tidak boleh direkayasa.
- UI berbahasa Indonesia, aksesibilitas WCAG 2.2 AA, keamanan default-deny,
  URL yang hilang berstatus 404, dan performa mengikuti budget dokumen.
- Situs mengikuti struktur monorepo React/Vite/TypeScript + Django/DRF +
  PostgreSQL yang dipatok di `AGENTS.md` dan `docs/`.
- Implementasi dilakukan per fase sesuai `docs/10-TASKS.md`. Fondasi Fase 0
  sedang disiapkan; fitur publik/CMS/API dikerjakan pada fase berikut setelah
  persetujuan dan verifikasi Docker.

## Dokumen aturan

`AGENTS.md`, `docs/01-PRD.md` sampai `docs/10-TASKS.md` memuat aturan resmi,
termasuk definisi fase, standar keamanan, dan quality gates.
