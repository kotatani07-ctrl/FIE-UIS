# Website Fakultas Ilmu Ekonomi

Website informasi **Fakultas Ilmu Ekonomi, Universitas Ichsan Satya**. Frontend
React mengambil konten (berita + gambar, agenda, pengumuman, program studi,
statistik, kontak) dari API CMS Django; semuanya dapat dikelola lewat Django
Admin.

## Menjalankan aplikasi lokal (tanpa Docker)

1. Backend: dari `backend/`, siapkan virtualenv lalu
   `DATABASE_URL="sqlite:///$(pwd)/db.sqlite3" MEDIA_ROOT=/tmp/fie-media .venv/bin/python manage.py migrate`
   dan `... manage.py runserver 127.0.0.1:8000`. Server dev Vite mem-proxy
   `/api`, `/media`, dan `/files` ke `127.0.0.1:8000`.
2. Isi data contoh development: `... manage.py seed_dummy`. Data ini bertanda
   `[DUMMY]`, bukan data institusi resmi, dan tidak boleh dipakai di produksi.
3. Buat akun Admin: `... manage.py createsuperuser`.
4. Frontend: dari `frontend/`, `npm ci` lalu `npm run dev`, buka
   `http://127.0.0.1:5173/`.
5. Kelola konten di `http://127.0.0.1:8000/kelola-lokal/` (samakan dengan
   `ADMIN_URL_PREFIX` di `.env`; jangan gunakan `/admin/`). Berita beserta
   gambar sampul, kategori, agenda, pengumuman, program studi, statistik, dan
   kontak semuanya di-CRUD dari sana.

## Menjalankan dengan Docker

1. Salin `.env.example` menjadi `.env` untuk konfigurasi lokal. Di lokal,
   `DJANGO_SECRET_KEY` boleh kosong; `config.settings.dev` akan membuat kunci
   acak. Di produksi kunci wajib diisi (minimal 50 karakter) dan tidak boleh
   memakai nilai yang pernah ada di repo.
2. Jalankan `docker compose -f deploy/docker-compose.yml up --build -d`.
3. Terapkan skema database: `docker compose -f deploy/docker-compose.yml exec backend python manage.py migrate`.
4. Buka `http://localhost:8080`. Frontend Vite, Django, PostgreSQL, dan Nginx
   development dijalankan sebagai layanan terpisah.
5. Untuk mengisi CMS dengan data contoh development, jalankan
   `docker compose -f deploy/docker-compose.yml exec backend python manage.py seed_dummy`.
6. Buat akun Admin lokal dengan
   `docker compose -f deploy/docker-compose.yml exec backend python manage.py createsuperuser`,
   lalu buka `http://localhost:8080/kelola-lokal/`.

Backend berada di `backend/`; dependensi dan konfigurasi ada di direktori
tersebut. Tes backend menggunakan SQLite in-memory:
`DJANGO_SETTINGS_MODULE=config.settings.test pytest -q`.

API v1 tersedia di `http://localhost:8080/api/v1/`; kontraknya didokumentasikan
di [`docs/08-API-SPEC.md`](./docs/08-API-SPEC.md). Skema OpenAPI hanya aktif
saat `DEBUG=True`, di `/api/v1/schema/`. Endpoint formulir kontak menolak
permintaan bila Turnstile atau konfigurasi email belum tersedia, sesuai prinsip
fail-closed.

## Analisis aturan dan cakupan saat ini

- Sumber konten produksi harus berasal dari Django Admin; konten institusi
  seperti visi-misi, sejarah, logo, dan kontak tidak boleh direkayasa.
- UI berbahasa Indonesia, aksesibilitas WCAG 2.2 AA, keamanan default-deny,
  URL yang hilang berstatus 404, dan performa mengikuti budget dokumen.
- Situs mengikuti struktur monorepo React/Vite/TypeScript + Django/DRF +
  PostgreSQL yang dipatok di `AGENTS.md` dan `docs/`.
- Implementasi dilakukan per fase sesuai `docs/10-TASKS.md`. Fase 1 menyiapkan
  model CMS, Admin, sanitasi, unggahan media, dan validasi penerbitan. Fase 2
  menyiapkan API publik dan endpoint SEO. Integrasi frontend ke CMS serta
  halaman situs lengkap termasuk fase berikutnya.

## Dokumen aturan

`AGENTS.md`, `docs/01-PRD.md` sampai `docs/10-TASKS.md` memuat aturan resmi,
termasuk definisi fase, standar keamanan, dan quality gates.
