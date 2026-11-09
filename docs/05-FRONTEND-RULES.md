# 05 — Aturan Frontend (React + Tailwind)

## 1. Setup
- Vite + React 19 + TypeScript `strict`, `noUncheckedIndexedAccess`, path alias `@/`.
- Tailwind CSS v4 (plugin Vite), token di `@theme`. Tanpa CSS-in-JS runtime.
- Router: React Router (data router), `lazy()` per halaman, `<ScrollRestoration/>`.
- Data: TanStack Query (cache, retry terbatas, `staleTime` wajar). Fetch wrapper sendiri (tanpa axios).
- Form: React Hook Form + Zod. Ikon: `lucide-react` (impor per-ikon). Font: `@fontsource-variable/*`.
- Lint: ESLint (`typescript-eslint`, `react-hooks`, `jsx-a11y`, `eslint-plugin-security`/`no-unsanitized`), Prettier.
- Test: Vitest + Testing Library; E2E: Playwright (+ `@axe-core/playwright`).

## 2. Routing
- **Semua path** hanya didefinisikan di `src/app/routes.ts` (objek konstan + builder). Header, footer, sitemap FE,
  dan test crawler membaca dari sini. Dilarang menulis string path di komponen.
- Rute tak dikenal → `<NotFoundPage/>` yang mengatur `<meta name="robots" content="noindex">` dan
  `document.title`; pada prerender/Nginx diberi status **404**.
- Parameter query untuk daftar (`?page=&q=&kategori=&tag=`) disinkronkan ke URL (bisa dibagikan/refresh).

## 3. Data & API
- `api/client.ts`: base URL dari env, `AbortController` + timeout 10 dtk, parse error terstruktur,
  **tidak** menyimpan kredensial. Permintaan hanya ke origin yang sama (`/api/v1/`); GET publik
  dan POST kontak adalah satu-satunya metode yang diizinkan.
- Tipe di `api/types.ts` mengikuti `08-API-SPEC.md`; validasi respons kritis dengan Zod (`safeParse`) dan
  tampilkan ErrorState bila bentuk tak sesuai.
- Setiap daftar punya 4 keadaan: **loading (skeleton) · error (retry) · empty · data**. Tidak boleh ada ruang kosong tanpa penjelasan.
- Dedup & urut: percayai urutan server, tetapi **jangan** render item dengan `slug` sama dua kali (pakai `Map`).

## 4. Render konten rich text
- HTML dari API sudah disanitasi server, **tetap** disanitasi ulang di klien dengan DOMPurify
  (allowlist ketat: `p,h2-h4,ul,ol,li,a,strong,em,blockquote,img,figure,figcaption,table,thead,tbody,tr,th,td,code,pre,br,hr`;
  tanpa `style`, `class` bebas, `on*`, `iframe`, `script`).
- Tautan di dalam konten: `rel="noopener noreferrer"` + `target="_blank"` hanya untuk eksternal; skema hanya `http/https/mailto/tel`.
- Gambar di konten diberi `loading="lazy"`, `decoding="async"`, dan `alt` (kosong hanya bila dekoratif).
- Dibungkus `<Prose>` agar tipografi konsisten (lebar baca 68ch).

## 5. Gambar & performa (WAJIB)
- Hanya lewat `<Picture>`; wajib `width`, `height`, `alt`, `sizes`; `loading="lazy"` kecuali gambar LCP
  (`fetchpriority="high"`, tanpa lazy). Tampilkan blur/LQIP agar tak ada CLS.
- **Dilarang** `<img src="">`/`src` kosong; jika data gambar tidak ada → komponen fallback (SVG placeholder ringan).
- Code splitting per rute; komponen berat (3D, editor, peta) dimuat lazy. Peta = iframe `loading="lazy"` + `title`,
  atau klik-untuk-muat (facade) agar tak memuat pihak ketiga otomatis.
- Prefetch rute saat hover/fokus tautan; `<link rel="preload">` hanya font utama & gambar LCP.
- Budget: JS awal ≤ 180 KB gzip, CSS ≤ 30 KB gzip, 0 skrip pihak ketiga default.

## 6. SEO di FE (`components/Seo.tsx`)
Setiap halaman menetapkan: `<title>` unik (`Judul — FIE Universitas Ichsan Satya`), meta description 120–160 karakter,
`canonical` (host tunggal dari `VITE_SITE_URL`), Open Graph + Twitter Card (gambar 1200×630), `lang="id"`,
JSON-LD: `EducationalOrganization` (beranda), `Article`/`NewsArticle` (berita), `BreadcrumbList`, `Event` (agenda),
`Course`/`EducationalOccupationalProgram` (prodi). **Tepat satu `<h1>`** per halaman; heading berurutan (tanpa lompat H2→H5).
Prerender & fallback bot: lihat `02-ARCHITECTURE.md` §2.

## 7. Aksesibilitas (WCAG 2.2 AA)
- `SkipLink` "Lewati ke konten utama" sebagai elemen fokus pertama; landmark `header/nav/main/footer`.
- Fokus terlihat jelas (`:focus-visible` ring 2 px kontras tinggi); urutan tab logis; tidak ada `tabindex>0`.
- Semua kontrol ikon punya `aria-label` Indonesia; tombol "kembali ke atas" adalah `<button>` sungguhan.
- Carousel: `role="region"` + `aria-roledescription="carousel"`, tombol berlabel, pause otomatis, tidak mengandalkan hover.
- Target sentuh ≥ 44×44 px (minimum mutlak 24×24). Tidak mengandalkan warna saja untuk makna.
- ID unik (pakai `useId`). Formulir: label terlihat, pesan error terhubung, `autocomplete` benar.
- Perubahan rute: pindahkan fokus ke `<h1>`/`main` dan umumkan via live region.

## 6b. Util wajib
- `formatDate(iso, style)` → `Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta' })` ("19 Mei 2026"); **satu-satunya** cara menampilkan tanggal.
- `ExternalLink`, `Picture`, `Seo`, `Prose`, `Reveal`, `useTheme` — jangan menduplikasi logikanya.

## 7b. Keamanan sisi FE
Lihat `07-SECURITY.md` §B. Ringkas: tanpa `eval`/`new Function`, tanpa `innerHTML` mentah, tanpa secret di bundel,
CSP ketat (tanpa `unsafe-inline`/`unsafe-eval`), `npm ci` + lockfile, `npm audit` bersih untuk severity high+.

## 8. Testing minimum
- Unit: `formatDate`, tema tri-state, `useCanRender3D`, util URL aman, sanitasi.
- Komponen: Picture (fallback), ExternalLink (rel), Pagination, Carousel (keyboard), form kontak (validasi).
- E2E (Playwright): navigasi semua rute dari `routes.ts` (0 hasil 404 internal), 404 asli, pencarian, paginasi,
  tema, mobile drawer (scroll lock), axe tanpa pelanggaran serius/kritis.
