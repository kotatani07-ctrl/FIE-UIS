# 10 — Rencana Kerja Bertahap

Aturan: kerjakan **satu fase per giliran**, ikuti urutan, jalankan `09-QUALITY-GATES.md`,
kirim "Laporan Fase" (format di `AGENTS.md` §7), lalu **berhenti menunggu persetujuan**.
Centang `[x]` hanya jika ada bukti. Jangan mengerjakan hal di luar fase.

---
## Fase 0 — Fondasi repo & tooling
- [x] Struktur monorepo (`AGENTS.md` §3), `.gitignore`, `.editorconfig`, `.env.example` (BE & FE), pre-commit (ruff, eslint, prettier, gitleaks)
- [x] Verifikasi & pin versi stabil terbaru → `docs/VERSIONS.md`
- [x] `backend/`: Django project, settings pecah (base/dev/prod/test), PostgreSQL via Docker; 24 tes backend lulus, coverage 89,79%; Compose berjalan
- [x] `frontend/`: Vite+React+TS strict+Tailwind v4, ESLint/Prettier/Vitest/Playwright terpasang; beranda pratinjau berjalan, belum terhubung ke API CMS
- [x] `deploy/`: docker-compose dev, Nginx dev, CI minimal (lint+test); stack FE+BE+DB+Nginx telah diuji langsung melalui Docker
**Selesai bila**: `docker compose up` menjalankan FE+BE+DB; CI hijau; belum ada fitur.

## Fase 1 — Backend: model, admin, sanitasi, media
- [x] App `core` (mixin, `SiteSetting` singleton, sanitizer `nh3`, validator upload, pipeline gambar WebP/AVIF)
- [x] Model & migrasi sesuai `06-BACKEND-RULES.md` §3 + `simple_history`
- [x] Admin konten (list/filter/search/aksi massal, pratinjau gambar, editor rich text; sanitizer membersihkan markup Word)
- [x] Validasi layak terbit (§6), grup & izin (Editor/Admin Fakultas), data migration grup
- [x] `seed_dummy` (ditolak di prod), `check_files`, `publish_scheduled`
- [x] Test: sanitizer (markup Word), upload (CMYK→RGB, varian), validasi terbit, izin peran
**Selesai bila**: editor dapat CRUD semua konten di Admin; tempel Word menghasilkan HTML bersih; gambar menjadi varian ringan.
**Bukti validasi**: 24 tes lulus (coverage 89,79%); Django checks, cek migrasi, `check_files`, Ruff lint/format, dan konfigurasi Compose lulus. Smoke test lokal: beranda 200, login Admin 200, `/media/` untuk berkas yang tidak ada 404.

**Catatan frontend pada akhir Fase 3**: fondasi dan design system telah
diimplementasikan serta divalidasi. Beranda masih pratinjau dengan sebagian
data contoh; integrasi konten CMS dan halaman publik lengkap termasuk Fase 4.

## Fase 2 — Backend: API publik, SEO endpoint, keamanan API
- [x] Endpoint `08-API-SPEC.md` + filter/paginasi/pencarian + OpenAPI
- [x] Throttle, CORS ketat, renderer JSON saja, error seragam, caching/ETag
- [x] `POST /contact/` (honeypot + Turnstile + throttle + simpan aman + email notifikasi)
- [x] `sitemap.xml`, `robots.txt`, `rss.xml`, `/seo/<path>`, `security.txt`, `/health/`
- [x] Test perilaku API §4 (404 di luar rentang, batas paginasi, sanitasi, throttle lintas IP, agenda upcoming, `assertNumQueries`)
**Selesai bila**: seluruh kontrak lulus test; `check --deploy` bersih.
**Bukti validasi**: 64 tes lulus, coverage 90%; Ruff lint/format, validasi skema
OpenAPI, Django checks, cek migrasi, cek media, konfigurasi Compose, dan
`check --deploy` lulus. Endpoint API/SEO, Admin, unduhan, dan beranda diuji lagi
setelah layanan Compose diperbarui.

## Fase 3 — Frontend: fondasi & design system
- [x] Token Tailwind, tema tri-state (+test), font self-host, `prose`
- [x] `routes.ts`, router, layout (Header + MegaMenu, MobileDrawer, Footer, SkipLink, ThemeToggle)
- [x] Komponen UI (`03` §4) dengan Storybook opsional atau halaman `/__ui` (non-prod)
- [x] `api/client.ts`, tipe, hooks Query; `Seo`, `Picture`, `ExternalLink`, `SafeHtml`, `formatDate`
- [x] `NotFoundPage` (noindex, Indonesia), ErrorBoundary global
- [x] Test: tema, formatDate, Picture fallback, ExternalLink, drawer (scroll lock/focus trap)
**Selesai bila**: kerangka situs tampil konsisten light/dark, axe bersih pada layout.
**Bukti validasi**: TypeScript, ESLint, Prettier, build, dan `npm audit` lulus
(0 temuan); 27 tes unit dan 4 tes Playwright/axe lulus. Smoke test Docker:
beranda, health API, dan Admin 200; path tidak dikenal 404; halaman beranda
terlihat di `http://localhost:8080`.

## Fase 4 — Frontend: halaman & fitur
- [ ] Beranda (kecuali 3D): hero carousel aksesibel, statistik, prodi, berita, agenda, pengumuman, mitra, CTA
- [ ] Profil (5 halaman), Prodi (daftar+detail), Berita (daftar: paginasi/cari/filter, detail+terkait+share), Pengumuman, Agenda, Artikel, Riset (3), Unduhan, Kontak (form+Turnstile+peta facade), Pencarian
- [ ] Skeleton/Error/Empty di semua daftar; query string tersinkron URL
- [ ] SEO per halaman + JSON-LD; prerender rute statis (`02` §2)
- [ ] E2E: crawler tautan internal (0 404), paginasi, pencarian, form kontak (mock), axe
**Selesai bila**: seluruh peta situs `01-PRD.md` §4 berfungsi dengan data dummy dari API.

## Fase 5 — Visual 3D & polish gerak
- [ ] `HeroScene` sesuai `04-3D-VISUAL.md` (prosedural, lazy, setelah LCP, poster fallback, ErrorBoundary, jeda)
- [ ] `useCanRender3D` + test; adaptasi performa dinamis
- [ ] Animasi reveal/hover/marquee (hormati reduced-motion)
- [ ] Ukur: chunk 3D, TBT, FPS, LCP dengan/ tanpa 3D
**Selesai bila**: budget 3D lulus; mobile/reduced-motion/saveData menampilkan poster; 0 CLS.

## Fase 6 — SEO, aksesibilitas, performa (hardening kualitas)
- [ ] Lighthouse CI lulus budget; perbaiki LCP/CLS/INP
- [ ] Audit a11y manual (keyboard-only, NVDA/VoiceOver singkat), kontras otomatis lulus
- [ ] Validasi JSON-LD, OG preview (WhatsApp/LinkedIn debugger), sitemap & robots
- [ ] Regresi analisis (`09` §4) — **semua dicentang**
**Selesai bila**: seluruh target `09` §2–§4 hijau dengan bukti.

## Fase 7 — Hardening keamanan & uji
- [ ] Nginx: header, CSP (Report-Only → enforce), TLS, redirect host kanonik, `server_tokens off`, rate limit
- [ ] Admin: path rahasia, 2FA wajib, axes, batasan IP opsional; uji peran
- [ ] Uji XSS/CSRF/upload/IDOR/throttle/CORS (otomatis + manual); OWASP ZAP baseline
- [ ] Audit dependensi & secret scan bersih; image Docker non-root
- [ ] `07-SECURITY.md` §D tercentang penuh dengan bukti
**Selesai bila**: tidak ada temuan High/Critical terbuka.

## Fase 8 — Deploy, dokumentasi, serah terima
- [ ] `deploy/` produksi (compose, Nginx, contoh systemd/cron: `publish_scheduled`, `check_files`, `purge_old_messages`, backup)
- [ ] `README.md` (setup, perintah), `docs/RUNBOOK.md` (backup/restore, rotasi secret, insiden), `docs/ADMIN-GUIDE.md` (panduan editor: cara menulis berita, tempel dari Word, jadwalkan, unggah file)
- [ ] Smoke test pasca-deploy + rollback prosedur
- [ ] Daftar utang teknis & ide lanjutan (i18n Inggris, PWA, migrasi data lama)
**Selesai bila**: tim non-teknis dapat memakai Admin dari panduan; pemulihan backup teruji.
