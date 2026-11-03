# 08 — Kontrak API v1

Base: `/api/v1/` · JSON UTF-8 · Hanya `GET` publik (+ `POST /contact/`). Bahasa pesan: Indonesia.
Konten selalu hanya yang `published` dan `published_at <= now`. Tanggal: ISO-8601 (`+07:00`).

## 1. Objek bersama
```jsonc
// Image (dari pipeline upload)
{ "src": "/media/img/abc-960.webp", "srcset": "/media/img/abc-480.webp 480w, /media/img/abc-960.webp 960w, /media/img/abc-1440.webp 1440w",
  "avif_srcset": "...", "width": 1440, "height": 810, "alt": "Deskripsi gambar", "blur": "data:image/webp;base64,..." }
// Paginasi (DRF)
{ "count": 52, "next": "…?page=2", "previous": null, "results": [ … ] }
// Error
{ "detail": "Halaman tidak ditemukan.", "code": "not_found", "errors": { "field": ["pesan"] } }
```

## 2. Endpoint
| Metode & path | Keterangan | Query |
|---|---|---|
| `GET /site/` | Pengaturan situs (identitas, kontak, sosial, statistik, pmb_url, maps_embed_url) | — |
| `GET /hero-slides/` | Slide aktif & dalam rentang tanggal, urut `order` | — |
| `GET /pages/{key}/` | Halaman statis (`sejarah`, `visi-misi`, `tujuan`, `struktur-organisasi`, `mitra-kerja-sama` …). 404 bila belum terbit | — |
| `GET /programs/` | Daftar prodi (ringkas) | — |
| `GET /programs/{slug}/` | Detail prodi | — |
| `GET /news/` | Daftar berita/artikel/opini (ringkas) | `page, page_size, q, kategori, tag, jenis, tahun` |
| `GET /news/{slug}/` | Detail + `related[]` (maks 3) | — |
| `GET /news/featured/` | Maks 5 untuk beranda | — |
| `GET /categories/`, `GET /tags/` | Dengan jumlah item (`count`) | — |
| `GET /announcements/` | Pinned dulu, lalu terbaru; sembunyikan yang `expires_at` lewat | `page, q` |
| `GET /announcements/{slug}/` | Detail | — |
| `GET /events/` | Agenda | `when=upcoming\|past\|all` (default `upcoming`), `page` |
| `GET /events/{slug}/` | Detail agenda | — |
| `GET /research/` | Riset | `type=publikasi\|penelitian\|pengabdian, tahun, q, page` |
| `GET /downloads/` | Unduhan aktif | `category` |
| `GET /partners/` | Mitra aktif | — |
| `GET /search/` | Pencarian global lintas berita, pengumuman, agenda, prodi, halaman | `q` (min 2, maks 80), `page` |
| `POST /contact/` | Kirim pesan | body di bawah |
| `GET /preview/{model}/{id}/` | Pratinjau draf (staf, token bertanda tangan) | `token` |
| `GET /health/` | `{status:"ok"}` (tanpa detail internal) | — |

Di luar `/api/v1/` (Django, diproksi Nginx): `GET /sitemap.xml`, `GET /robots.txt` (text/plain),
`GET /rss.xml`, `GET /seo/<path>` (HTML ringkas untuk bot), `GET /.well-known/security.txt`.

## 3. Contoh bentuk
```jsonc
// GET /news/ → results[i]
{ "slug": "judul-berita", "kind": "berita", "title": "…", "excerpt": "…",
  "cover": { /* Image */ }, "categories": [{ "name": "Berita", "slug": "berita" }],
  "tags": [{ "name": "PMB", "slug": "pmb" }], "published_at": "2026-05-19T10:22:31+07:00", "author_name": "Humas FIE" }

// GET /news/{slug}/ → ditambah:
{ "body_html": "<p>…</p>", "meta": { "title": "…", "description": "…", "og_image": { … } }, "related": [ … ] }

// GET /events/ → results[i]
{ "slug": "…", "title": "…", "start_at": "…", "end_at": "…", "location": "…", "cover": { … }, "registration_url": "https://…" }

// GET /programs/{slug}/
{ "slug": "s1-perpajakan", "name": "S1 Perpajakan", "degree": "S1", "summary": "…", "vision": "…", "mission": "…",
  "accreditation": { "body": "…", "grade": "…", "number": "…", "valid_until": "2030-01-01", "certificate": { /* Image|null */ } },
  "curriculum_html": "…", "career_prospects_html": "…", "head": { "name": "…", "photo": { … } }, "cover": { … }, "meta": { … } }

// POST /contact/  (JSON)
// req : { "name": "…", "email": "…", "subject": "…", "message": "…", "turnstile_token": "…", "website": "" /* honeypot, harus kosong */ }
// 201 : { "detail": "Pesan terkirim. Terima kasih." }
// 400 : validasi · 429 : throttle · 403 : gagal Turnstile
```

## 4. Aturan perilaku (wajib diuji)
1. Slug tak ada / belum terbit → **404** JSON. `?page=` di luar rentang → **404**.
2. `GET /news/` urut `-published_at, -id`; **tidak ada duplikat** `slug`; item masa depan tidak muncul.
3. `GET /events/?when=upcoming` hanya `start_at >= now` (atau `end_at >= now`), urut naik; `past` urut turun.
4. Semua `*_html` sudah disanitasi; semua `Image` punya `width/height/alt`; field gambar kosong → `null` (FE memakai fallback).
5. `X-Total-Count` tidak diperlukan; gunakan `count`. `page_size` maks 50.
6. Respons GET publik membawa `Cache-Control` + `ETag`; mendukung `If-None-Match` (304).
7. Skema OpenAPI dihasilkan `drf-spectacular`; FE men-generate tipe (`openapi-typescript`) atau menyalin manual **dan** dites terhadap skema.
8. Versi: perubahan yang memecah kontrak → `/api/v2/`.
