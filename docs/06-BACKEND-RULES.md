# 06 — Aturan Backend (Django + DRF + Admin)

## 1. Setup
- Django 5.2 LTS, DRF, PostgreSQL (`psycopg`), `django-environ`, `django-cors-headers`, `django-csp`,
  `django-axes`, `django-otp` + `django-two-factor-auth` (atau `django-otp` + TOTP admin), `django-simple-history`,
  `django-filter`, `drf-spectacular` (skema OpenAPI), `nh3` (sanitasi HTML), `Pillow` (+ `pillow-avif-plugin`),
  `django-ckeditor-5` (editor, paste-from-Word), `whitenoise` hanya untuk static admin, `gunicorn`, `sentry-sdk` (opsional).
- Settings dipecah `base/dev/prod/test`. Prod **gagal start** bila `DEBUG=True`, `SECRET_KEY` default, atau host kosong.
- Lint `ruff`, test `pytest-django`, coverage ≥ 80% untuk `apps/`.

## 2. Mixin inti (`apps/core`)
- `TimeStamped`: `created_at`, `updated_at`.
- `Publishable`: `status` (`draft|scheduled|published|archived`), `published_at`; manager `.live()` =
  `status=published AND published_at <= now`. Penjadwalan: command `publish_scheduled` (cron tiap menit) atau cek saat query.
- `SeoFields`: `meta_title` (≤ 60), `meta_description` (120–160), `og_image` (opsional) — wajib terisi sebelum publish (lihat §6).
- `SlugMixin`: `slug` unik, dibuat dari judul (`python-slugify`, transliterasi), **tidak berubah otomatis** setelah publish.

## 3. Model (ringkas; semua dengan `verbose_name` Indonesia)
| Model | Field penting |
|---|---|
| `SiteSetting` (singleton) | `faculty_name`, `university_name`, `tagline`, `address`, `phone`, `email` (validasi: domain institusi diperingatkan), `maps_embed_url` (allowlist host Google Maps), `social_*`, `stats_*` (prodi/dosen/mahasiswa/mitra), `default_og_image`, `pmb_url` |
| `HeroSlide` | `title`, `subtitle`, `image` (wajib rasio 16:9 disarankan, validator dimensi min), `alt`, `link_url`/`link_page`, `link_label`, `order`, `is_active`, `starts_at`, `ends_at` |
| `StaticPage` | `key`(enum: sejarah, visi-misi, tujuan, struktur-organisasi, …), `title`, `body` (rich), `cover`, SEO. Satu per `key`. |
| `StudyProgram` | `name`, `slug`, `degree`, `summary`, `vision`, `mission`, `accreditation_body/grade/number/valid_until` (**teks**), `accreditation_certificate` (gambar+alt, opsional), `curriculum` (rich), `career_prospects`, `head_name`, `head_photo`, `cover`, `is_published`, `order`, SEO |
| `NewsCategory`, `Tag` | `name`, `slug` unik |
| `NewsPost` | `kind`(berita/artikel/opini), `title`, `slug` unik, `excerpt`, `body` (rich), `cover` (+`alt`), `categories` M2M, `tags` M2M, `author_name`, Publishable, SEO. Indeks `(status, -published_at)` |
| `Announcement` | `title`, `slug`, `body`, `attachment` (opsional), `is_pinned`, `expires_at`, Publishable |
| `Event` | `title`, `slug`, `description`, `start_at`, `end_at`, `location`, `registration_url`, `cover`, Publishable. Validasi `end_at >= start_at` |
| `ResearchItem` | `type`(publikasi/penelitian/pengabdian), `title`, `authors`, `year`, `abstract`, `external_url`, `file`, Publishable |
| `DownloadItem` | `title`, `category`(panduan/kalender/pedoman/lainnya), `file`, `file_size`(otomatis), `description`, `order`, `is_active` |
| `Partner` | `name`, `logo` (alt otomatis = name), `url`, `order`, `is_active` |
| `ContactMessage` | `name`, `email`, `subject`, `message`, `ip_hash`, `user_agent`, `created_at`, `is_read` — **read-only di Admin** untuk editor biasa |

Riwayat perubahan (`simple_history`) pada `NewsPost`, `StaticPage`, `StudyProgram`, `Announcement`, `Event`, `SiteSetting`.

## 4. Admin (Django Admin sebagai CMS)
- Setiap model: `list_display`, `list_filter`, `search_fields`, `date_hierarchy` (jika ada tanggal), `list_per_page=25`,
  `prepopulated_fields` slug, `readonly_fields` (timestamp), `autocomplete_fields`, `save_on_top`, pratinjau gambar kecil.
- Aksi massal: **Terbitkan**, **Jadikan draf**, **Arsipkan** (dengan validasi publish).
- **Peran** (Groups, dibuat via data migration): `Editor` (CRUD konten, tanpa user/setting), `Admin Fakultas`
  (semua konten + `SiteSetting` + kotak masuk kontak), Superuser hanya teknis. Prinsip hak minimal.
- Admin dibatasi: path dari `ADMIN_URL_PREFIX` (bukan `/admin/`), login **2FA wajib** untuk semua staf,
  `django-axes` (kunci setelah 5 gagal/15 menit), sesi 8 jam, logout saat idle, `SESSION_COOKIE_AGE`, nama situs admin Indonesia.
- Pratinjau draf: tombol "Lihat di situs" memakai token pratinjau bertanda tangan (`signing.TimestampSigner`, kedaluwarsa 30 mnt),
  endpoint `/api/v1/preview/<model>/<id>/?token=` hanya untuk staf.
- Editor rich text: toolbar dibatasi (heading 2–4, bold/italic, list, link, tabel, gambar via media library, kutipan).
  **Tempel dari Word dibersihkan otomatis**.

## 5. Sanitasi HTML (cegah regresi F-08)
Di `core/sanitizer.py` memakai `nh3` dengan allowlist ketat: tag `p,br,h2,h3,h4,ul,ol,li,a,strong,em,blockquote,figure,figcaption,
img,table,thead,tbody,tr,th,td,code,pre,hr`; atribut: `a[href,title,rel,target]`, `img[src,alt,width,height,loading]`,
`td/th[colspan,rowspan]`. Skema URL: `http,https,mailto,tel` (dan path relatif media). **Buang** `style`, `class`, `id` bebas,
`on*`, `mso-*`, `<o:p>`, VML, komentar kondisional, URL `file:`/`data:`/`javascript:`. Terapkan di `save()`/`clean()`
**dan** ulang saat serialisasi (defense in depth). Tambahkan test dengan fixture HTML dari Word (termasuk `file:///C:/...`).

## 6. Validasi "layak terbit" (cegah F-03, F-04, F-06, F-13)
`Publishable.clean()` menolak status `published` bila:
- field wajib kosong (judul, isi ≥ 80 karakter teks, cover+alt untuk berita, meta description 120–160),
- teks mengandung pola placeholder (regex: `lorem ipsum`, `ini isi content`, `abc\.{3,}`, `TODO`, `[DUMMY]` di produksi, `xxx`),
- HTML mengandung `file:///` atau `mso-`,
- `slug` bentrok atau judul identik dengan postingan live lain (cegah duplikasi F-09).
Pesan error Indonesia dan spesifik.

## 7. Pemrosesan upload (cegah F-05)
- `ImageField` memakai `validate_image(max_mb=5, min_w, max_w=6000, formats={jpeg,png,webp,avif})`, tolak **SVG** (kecuali disanitasi ketat — default: tolak).
- Pada `post_save`/`pre_save`: buka dengan Pillow → `exif_transpose` → strip metadata → CMYK/P → RGB →
  skala maks 2000 px → hasilkan varian lebar **480/960/1440** dalam WebP (q≈78) dan AVIF (q≈55) → simpan `blur` (LQIP 20 px base64) → nama file `uuid4` (bukan nama asli).
- Dokumen (`DownloadItem.file`): ekstensi allowlist `pdf, docx, xlsx, pptx, zip` (zip opsional), cek MIME nyata (`python-magic`),
  ≤ 20 MB, nama di-slugify, simpan `file_size`. Saat simpan: pastikan file benar-benar ada & bisa dibaca (cegah "File not found").
- Management command `check_files` memverifikasi semua `FileField/ImageField` ada di disk; dijalankan di CI/cron.

## 8. Konvensi API (DRF)
- Prefix `/api/v1/`. `ReadOnlyModelViewSet` untuk semua sumber publik; hanya `ContactViewSet.create`.
- Serializer **eksplisit** (`fields = (...)`), terpisah `ListSerializer` (ringkas) dan `DetailSerializer`.
- `select_related`/`prefetch_related` wajib; test `assertNumQueries` pada endpoint daftar.
- Filter: `django-filter` (kategori, tag, tahun, jenis), pencarian `SearchFilter`/PostgreSQL FTS (`SearchVector`, konfigurasi `indonesian`/`simple`).
- Pagination: `PageNumberPagination` `page_size=12`, `max_page_size=50`; halaman di luar rentang → **404** (bukan data pertama).
- Urutan default eksplisit: berita `-published_at, -id`; agenda mendatang `start_at`; agenda lampau `-start_at`.
- Kesalahan: JSON seragam `{ "detail": "...", "code": "...", "errors": {...} }`; status HTTP **jujur** (404 untuk tak ada, 400 validasi, 429 throttle).
- Renderer: `JSONRenderer` saja di produksi (browsable API mati). Skema OpenAPI via `drf-spectacular` (dinonaktifkan/diproteksi di prod).
- Cache: `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600` untuk GET publik (lewat middleware/decorator); `ETag`.
- Waktu: simpan UTC, `TIME_ZONE="Asia/Jakarta"`, `USE_TZ=True`, keluaran ISO-8601.

## 9. Perintah manajemen
`seed_dummy` (hanya non-produksi) · `publish_scheduled` · `check_files` · `purge_old_messages` (retensi kotak masuk 12 bulan) ·
`generate_sitemap` (opsional bila di-cache).

## 10. Test minimum
Model/validasi terbit, sanitizer (fixture Word), upload gambar (CMYK→RGB, resize, varian), API (status, paginasi di luar rentang = 404,
filter agenda, urutan, tanpa duplikat), throttle kontak, izin Admin per peran, sitemap/robots, `seed_dummy` menolak di produksi.
