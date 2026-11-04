# Website Fakultas Ilmu Ekonomi

Fondasi aplikasi informasi **Fakultas Ilmu Ekonomi, Universitas Ichsan Satya**.
Aturan produk, desain, API, keamanan, dan fase pengerjaan tetap berada di `docs/`.

## Menjalankan aplikasi lokal

1. Salin `.env.example` menjadi `.env` untuk konfigurasi lokal. Nilai di contoh
   hanya untuk development dan tidak boleh dipakai di produksi.
2. Jalankan `docker compose -f deploy/docker-compose.yml up --build`.
3. Terapkan skema database: `docker compose -f deploy/docker-compose.yml exec backend python manage.py migrate`.
4. Buka `http://localhost:8080`. Frontend Vite, Django, PostgreSQL, dan Nginx
   development dijalankan sebagai layanan terpisah.

Tanpa Docker, frontend dapat dijalankan dari `frontend/` dengan `npm ci --allow-remote=all` lalu
`npm run dev`. Backend berada di `backend/`; detail dependensi dan settings ada
di direktori tersebut. Pengujian backend menggunakan SQLite in-memory. Untuk
contoh konten lokal, jalankan
`docker compose -f deploy/docker-compose.yml exec backend python manage.py seed_dummy`.
Perintah tersebut hanya boleh berjalan di development. Buat akun admin lokal
dengan `docker compose -f deploy/docker-compose.yml exec backend python manage.py createsuperuser`.

## Analisis aturan dan cakupan saat ini

- Sumber konten produksi harus berasal dari Django Admin; konten institusi
  seperti visi-misi, sejarah, logo, dan kontak tidak boleh direkayasa.
- UI berbahasa Indonesia, aksesibilitas WCAG 2.2 AA, keamanan default-deny,
  URL yang hilang berstatus 404, dan performa mengikuti budget dokumen.
- Situs mengikuti struktur monorepo React/Vite/TypeScript + Django/DRF +
  PostgreSQL yang dipatok di `AGENTS.md` dan `docs/`.
- Implementasi dilakukan per fase sesuai `docs/10-TASKS.md`. Fase 1 menyiapkan
  model CMS, Admin, sanitasi, unggahan media, dan validasi penerbitan. API dan
  integrasi konten frontend dikerjakan pada fase berikutnya.

## Dokumen aturan

`AGENTS.md`, `docs/01-PRD.md` sampai `docs/10-TASKS.md` memuat aturan resmi,
termasuk definisi fase, standar keamanan, dan quality gates.
