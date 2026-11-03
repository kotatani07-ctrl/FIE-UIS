# 02 — Arsitektur

## 1. Gambaran
```
Browser ──HTTPS──> Nginx ──┬─ /            → static build React (SPA + prerender)
                           ├─ /api/        → Gunicorn (Django + DRF)
                           ├─ /kelola-xxx/ → Gunicorn (Django Admin, path rahasia dari env)
                           ├─ /media/      → file upload (nosniff, tanpa eksekusi)
                           └─ /sitemap.xml, /robots.txt, /rss.xml → Django
                                         │
                                    PostgreSQL
```
- FE dan BE **terpisah**; komunikasi hanya lewat REST JSON `/api/v1/`.
- API publik **read-only** kecuali `POST /contact/`. Tidak ada login publik, jadi tidak
  ada JWT/session publik (mengurangi permukaan serangan).
- Admin hanya diakses editor, dilindungi 2FA, rate limit, dan path non-default.

## 2. SEO untuk SPA (keputusan terkunci)
Situs informasi butuh SEO kuat, sementara SPA murni lemah. Solusi **tanpa ganti ke Next.js**:
1. **Prerender statis saat build** untuk rute stabil (beranda, profil, daftar prodi, kontak)
   memakai `vite-react-ssg` atau setara yang terverifikasi aktif dirawat.
2. **Rute dinamis (berita/prodi detail)**: Nginx mendeteksi user-agent crawler/social bot
   dan meneruskan ke endpoint Django `/seo/<path>` yang mengembalikan HTML minimal
   (title, description, canonical, OG, JSON-LD, ringkasan konten) — bukan SPA.
3. Pengguna biasa tetap mendapat SPA; meta diperbarui klien via `<Seo/>`.
4. Jika agent menilai opsi ini terlalu rapuh, **berhenti dan ajukan alternatif** (mis. Next.js/Remix)
   beserta tradeoff — jangan mengganti diam-diam.

## 3. Struktur backend
```
backend/
├── manage.py
├── config/
│   ├── settings/{base,dev,prod,test}.py
│   ├── urls.py  asgi.py  wsgi.py
├── apps/
│   ├── core/        # SiteSetting, mixin (Timestamped, Publishable, SEO), utils, validators, sanitizer
│   ├── content/     # StaticPage, HeroSlide, Partner
│   ├── academics/   # StudyProgram
│   ├── news/        # NewsCategory, Tag, NewsPost, Announcement
│   ├── events/      # Event
│   ├── research/    # ResearchItem
│   ├── downloads/   # DownloadItem
│   ├── contact/     # ContactMessage + endpoint
│   └── seo/         # sitemap, robots, rss, bot-render
├── requirements/{base,dev,prod}.txt  (hash-pinned)
└── tests/
```

## 4. Struktur frontend
```
frontend/
├── index.html  vite.config.ts  tailwind (v4 via @theme di CSS)  tsconfig.json
├── public/ (favicon, robots fallback, og-default.jpg)
└── src/
    ├── app/            # router, providers, routes.ts (satu-satunya sumber path)
    ├── api/            # client.ts (fetch wrapper), types.ts, hooks (TanStack Query)
    ├── components/
    │   ├── ui/         # Button, Badge, Card, Input, Dialog, Skeleton, Picture, ExternalLink
    │   ├── layout/     # Header, MegaMenu, MobileDrawer, Footer, SkipLink, ThemeToggle
    │   ├── sections/   # Hero, Stats, ProgramGrid, NewsGrid, AgendaList, PartnerMarquee, CTA
    │   └── three/      # HeroScene.tsx, scene assets, useCanRender3D.ts  (lazy chunk)
    ├── pages/          # satu file per halaman
    ├── lib/            # formatDate, seo, sanitize, a11y, cn
    ├── styles/         # globals.css (tokens @theme), prose.css
    └── test/
```

## 5. Environment variables
Backend (`.env`, jangan di-commit; sediakan `.env.example`):
`DJANGO_ENV, DJANGO_SECRET_KEY, DJANGO_ALLOWED_HOSTS, DATABASE_URL, FRONTEND_BASE_URL,
CORS_ALLOWED_ORIGINS, CSRF_TRUSTED_ORIGINS, ADMIN_URL_PREFIX, TURNSTILE_SECRET_KEY,
EMAIL_*, SENTRY_DSN (opsional), MEDIA_ROOT, STATIC_ROOT`.

Frontend (`.env`, hanya nilai **publik**): `VITE_API_BASE_URL, VITE_SITE_URL, VITE_TURNSTILE_SITE_KEY`.
Dilarang menaruh secret apa pun berawalan `VITE_`.

## 6. Pengelolaan media
- Upload via Admin → validasi (ekstensi, MIME nyata, ukuran ≤ 5 MB gambar, ≤ 20 MB dokumen)
  → proses: auto-orient, strip EXIF, CMYK→RGB, resize maks 2000 px, simpan **WebP + AVIF**
  varian lebar 480/960/1440 + `blurhash`/LQIP kecil.
- API mengembalikan objek gambar `{ src, srcset, width, height, alt, blur }`.
- Media disajikan Nginx dengan `X-Content-Type-Options: nosniff`, cache `public, max-age=31536000, immutable`
  (nama file ber-hash), tanpa direktori listing.

## 7. Deployment
- Docker Compose: `nginx`, `backend`, `db`, (opsional `redis` untuk throttle/cache).
- Build FE di CI → artefak statis ke Nginx. Backend image non-root, read-only FS bila bisa.
- Migrasi dijalankan eksplisit, bukan otomatis saat start.
- Backup harian DB + media; uji restore sekali per kuartal (catat di `docs/RUNBOOK.md`).
- Header cache: HTML pendek/`no-cache` + ETag; aset ber-hash `immutable`; API publik `s-maxage` singkat.
