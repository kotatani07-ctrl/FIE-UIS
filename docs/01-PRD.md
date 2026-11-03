# 01 — PRD: Website Informasi FIE

## 1. Latar belakang
Situs lama (`fie.universitasichsansatya.ac.id`, CodeIgniter) dianalisis pada
3 Nov 2026 dan mendapat skor 3,5/10: soft-404, tautan mati, prodi kosong,
placeholder, 64,4 MB per beranda (load 58 dtk), meta SEO rusak, kontras buruk,
tanpa paginasi/pencarian/form kontak. Website baru harus **memperbaiki semuanya**
dan tidak mengulangi akar masalahnya (konten tak terkelola, gambar tak
dioptimasi, validasi lemah).

## 2. Tujuan & metrik
| Tujuan | Metrik keberhasilan |
|---|---|
| Cepat | Beranda ≤ 1,5 MB transfer awal (di luar 3D), LCP ≤ 2,0 dtk (4G), CLS ≤ 0,05 |
| Aman | Lulus `07-SECURITY.md`; header grade A+ (securityheaders.com); 0 temuan high pada audit dependency |
| Mudah dikelola | Admin non-teknis dapat CRUD berita/agenda/dll tanpa developer |
| Ditemukan | Lighthouse SEO ≥ 95; sitemap dinamis; meta unik tiap halaman |
| Inklusif | Lighthouse A11y ≥ 95; WCAG 2.2 AA |
| Memikat | Gaya setara situs SaaS modern (referensi Webflow) + 3D hero ringan |

## 3. Pengguna
1. **Calon mahasiswa & orang tua** — cari prodi, akreditasi, PMB, biaya, kontak. (mobile-first)
2. **Mahasiswa aktif** — pengumuman, agenda, kalender akademik, pedoman, unduhan.
3. **Dosen/peneliti** — publikasi, penelitian, pengabdian, opini.
4. **Mitra/alumni/media** — profil, kerja sama, berita.
5. **Admin/editor fakultas** — mengelola semua konten via Django Admin.

## 4. Peta situs (Information Architecture)
```
/                              Beranda
/profil/sejarah                Sejarah
/profil/visi-misi              Visi & Misi
/profil/tujuan                 Tujuan
/profil/struktur-organisasi    Struktur Organisasi
/profil/mitra-kerja-sama       Mitra Kerja Sama
/prodi                         Daftar Program Studi
/prodi/:slug                   Detail Prodi (awal: s1-perpajakan, s1-manajemen-retail; sisanya dari Admin)
/informasi/berita              Daftar Berita (paginasi, cari, filter kategori/tag)
/informasi/berita/:slug        Detail Berita
/informasi/pengumuman          Pengumuman
/informasi/agenda              Agenda (mendatang/lampau dipisah)
/informasi/artikel             Artikel & Opini Dosen
/riset/publikasi               Publikasi
/riset/penelitian              Penelitian
/riset/pengabdian-kepada-masyarakat
/unduhan                       Pusat Unduhan (panduan, kalender akademik, pedoman akademik)
/kontak                        Kontak + formulir + peta
/cari?q=                       Hasil pencarian global
*                              404 sungguhan (status 404, noindex, bahasa Indonesia)
```
Semua slug berasal dari data/Admin; rute FE tidak boleh menaut ke path yang tidak ada.

## 5. Fitur (MoSCoW)
### Must
- Beranda: hero (slide dari Admin, bisa diklik, kontrol selalu terlihat) + 3D ringan,
  statistik fakultas, prodi unggulan, berita terbaru (kronologis, tanpa duplikat),
  agenda mendatang (hanya `start >= sekarang`), pengumuman, mitra, CTA PMB.
- Halaman statis dari Admin (rich text bersih): sejarah, visi-misi, tujuan, struktur, dll.
- Prodi: ringkasan, visi-misi, **akreditasi sebagai teks** (+ gambar sertifikat opsional
  dengan alt), kurikulum, prospek karier, dosen/kaprodi, CTA daftar.
- Berita: daftar + paginasi + pencarian + filter kategori/tag + detail + berita terkait + share.
- Agenda, pengumuman, artikel, riset (3 jenis), unduhan (file valid & terverifikasi).
- Kontak: formulir aman (honeypot + Turnstile + rate limit), alamat, peta (iframe ber-`title`).
- Pencarian global.
- Dark/light/system theme yang **benar** (lihat `03-DESIGN-SYSTEM.md`).
- SEO penuh: title/description unik, canonical, Open Graph, Twitter Card, JSON-LD,
  `sitemap.xml` dinamis, `robots.txt` benar, 1 H1 per halaman.
- Aksesibilitas penuh: skip link, fokus terlihat, label ARIA, kontras ≥ 4,5:1, target sentuh ≥ 44 px.
- Halaman 404/500/offline ramah dan berstatus HTTP benar.
### Should
- Pratinjau draft untuk editor, penjadwalan publikasi, riwayat perubahan konten.
- RSS feed berita. · Tombol "bagikan" (Web Share API + salin tautan).
- Skeleton loading + error state di semua daftar.
### Could
- Versi bahasa Inggris (struktur i18n disiapkan, konten ditunda).
- PWA ringan (cache aset statis saja).
### Won't (sekarang)
- Login publik/akun mahasiswa/SSO (SIDA diintegrasikan lewat tautan saja).
- Komentar publik, forum, e-commerce.

## 6. Model konten yang dikelola di Admin
Lihat skema lengkap di `06-BACKEND-RULES.md`. Ringkasnya:
`SiteSetting` (singleton) · `HeroSlide` · `StaticPage` · `StudyProgram` ·
`NewsCategory`/`Tag` · `NewsPost` (berita/artikel/opini) · `Announcement` · `Event` ·
`ResearchItem` · `DownloadItem` · `Partner` · `ContactMessage` (baca-saja).

## 7. Pemetaan Temuan Analisis → Requirement (anti-regresi)
Agent WAJIB memverifikasi tiap baris ini lulus pada Fase 6–7.
| ID analisis | Masalah situs lama | Requirement baru | Fase |
|---|---|---|---|
| F-01, F-36 | Semua URL tak dikenal → HTTP 200 | 404 asli di API & FE (`<NotFound/>` + noindex, bahasa Indonesia); Nginx fallback SPA hanya untuk rute valid | 3,4 |
| F-02, F-34 | Tautan footer ke path salah | Tautan dibuat dari satu `routes.ts`; test crawler internal (0 tautan 404) | 4,6 |
| F-03, F-04 | Prodi kosong, placeholder | Validasi publish: field wajib + deteksi pola placeholder; halaman tanpa konten tidak tampil di navigasi | 1,2 |
| F-05, F-35 | 64 MB, tanpa lazy/srcset/dimensi, cache buruk | Pipeline gambar server (WebP/AVIF, varian, resize, strip EXIF, CMYK→RGB); `<Picture>` wajib; cache header aset `immutable` | 1,3,6 |
| F-06, F-14, F-15, F-24 | Meta rusak, tanpa canonical/OG/JSON-LD/H1, host ganda | Komponen `<Seo/>`, 1 H1/halaman, redirect host kanonik 301 | 3,6 |
| F-07 | `<img src=".../informasi/">` → 403 | Fallback cover otomatis (placeholder SVG ringan) bila gambar kosong; tak pernah render `<img>` dengan src kosong | 3 |
| F-08 | Sisa markup Word (`mso-*`, `file:///`) | Editor rich text + sanitasi server (`nh3`) membuang `style`, `mso-*`, VML, `file:`, `javascript:` | 1 |
| F-09, F-10, F-18 | Duplikat, urutan acak, paginasi palsu, agenda lampau | `slug` unik, `ORDER BY published_at DESC`, paginasi sungguhan, filter agenda `>= now` | 2,4 |
| F-11 | Slider rusak | Hero baru: kontrol permanen, slide dapat diklik, rasio gambar tetap, dukung sentuh/keyboard | 4 |
| F-12 | Unduhan "File not found" | File dihosting lokal via model `DownloadItem` + cek keberadaan file saat simpan + health-check | 1,2 |
| F-13, F-33 | Nama fakultas salah, email gmail | Identitas dari `SiteSetting`; validasi di Admin | 1 |
| F-16 | robots/sitemap salah | Dinamis dari Django, tipe konten benar | 2 |
| F-17, F-25, F-26, F-27 | Kontras, target sentuh, label ARIA, teks-dalam-gambar | Token warna lolos AA; komponen aksesibel; Admin mewajibkan `alt` | 3,6 |
| F-19 | Badge/tag `href="#"` | Badge = tautan nyata ke `/informasi/berita?kategori=` atau bukan tautan | 4 |
| F-20 | Bug dark mode | Logika tema tri-state yang benar + test | 3 |
| F-21, F-31, F-32 | Bug JS laten, ID duplikat, `rel` hilang | TS strict, lint a11y, komponen link eksternal otomatis `rel="noopener noreferrer"` | 3 |
| F-22 | Menu mobile tanpa scroll lock | Drawer aksesibel + focus trap + scroll lock | 3 |
| F-23 | Tanggal mentah | `Intl.DateTimeFormat('id-ID')` via satu util `formatDate` | 3 |
| F-28–F-30 | Tanpa header keamanan, PHP EOL | Lihat `07-SECURITY.md` | 7 |

## 8. Konten awal (seed)
- Dev: fixture DUMMY ber-prefix `[DUMMY]` + command `seed_dummy` yang **menolak jalan bila `DJANGO_ENV=production`**.
- Produksi: konten nyata dimasukkan admin. Agent tidak boleh mengarang konten institusi.

## 9. Di luar lingkup
Migrasi data dari CodeIgniter lama (opsional, fase terpisah jika diminta), SIDA, sistem akademik.
