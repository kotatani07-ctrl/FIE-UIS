# 03 — Design System (bahasa desain FIE)

> Gunakan karakter visual dari `website_informasi_fie_universitas_ichsan_satya.tsx`
> tanpa menyalin data contoh yang belum terverifikasi. Logo dan warna resmi diambil
> dari `frontend/asset/LOGO_UIS_PNG_(2).png`.

## 0. Arah dan dial

- Dial: **ENERGY 2 / RHYTHM 2 / MOTION 2**.
- Kesan yang dituju: hangat, institusional, mudah dibaca. Bukan landing page SaaS.
- Identitas: tipografi serif untuk judul (tradisi akademik) + Inter untuk UI/isi,
  palet navy dari logo, aksen sian yang dipakai hemat, merah hanya untuk status
  penting/error, dan netral krem hangat untuk permukaan.
- Hero memakai video loop animasi ekonomi 3D (`frontend/asset/economy-loop.mp4`,
  800x600, 10 detik, tanpa suara): grafik garis, diagram lingkaran, dan grafik batang
  yang bergerak. Poster statis dipakai saat reduced-motion atau sebelum video siap.
- Motion: reveal halus satu kali per section (bukan per elemen), hover-lift pada
  tombol, dan video hero yang bisa dijeda/diputar. Semua berhenti saat reduced-motion.
- Pola yang **tidak** dipakai: bento grid, marquee, latar grid/garis, glow/blob
  dekoratif, hover-lift pada kartu non-klik, label uppercase ber-tracking di atas
  setiap judul, dan animasi loop tanpa trigger pengguna.

## 1. Karakter visual
- Judul besar dan percaya diri, banyak ruang putih, hierarki jelas: 1 H1 dan 1 CTA
  utama per layar.
- Komposisi section **tidak seragam**: hero asimetris, program studi berupa daftar
  bernomor, berita unggulan + daftar, agenda/pengumuman berupa baris, kontak dua kolom.
- Kartu memakai border tipis, radius 1rem, tanpa bayangan dekoratif dan tanpa
  animasi hover yang menjanjikan klik yang tidak ada.
- Navigasi menuju **halaman nyata** lewat React Router (`/prodi`, `/informasi/berita`,
  `/informasi/agenda`, `/informasi/pengumuman`, `/kontak`), bukan anchor gulir.
  Setiap item punya motion hover/focus: naik 2px, latar lembut, dan underline
  aksen yang muncul dari kiri; item aktif diberi underline tetap dan
  `aria-current="page"`.
- Data yang belum tersedia ditulis jujur ("Belum tersedia"), tidak diisi angka atau
  logo karangan.

## 2. Token (Tailwind v4 `@theme` di `src/styles.css`)
```css
@theme {
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif;
  --radius-card: 1rem;

  /* Navy dari logo UIS, ramp konsisten 50-900. */
  --color-brand-50:#eef4fb; --color-brand-100:#dbe7f5; --color-brand-200:#b9cfe9;
  --color-brand-300:#8fb0d8; --color-brand-400:#5f8bc4; --color-brand-500:#2f5ba6;
  --color-brand-600:#254f95; --color-brand-700:#1e427e; --color-brand-800:#163462;
  --color-brand-900:#10274c;
  /* Aksen sian logo, dipakai hemat. */
  --color-accent-300:#82d5f3; --color-accent-400:#0caceb; --color-accent-500:#0788bc;
  /* Merah logo = status/error, bukan dekorasi. */
  --color-danger-300:#f2a1a5; --color-danger-500:#db3a41; --color-danger-600:#b4232f;
  /* Netral hangat untuk permukaan dan hero. */
  --color-sand-50:#fbf7ef; --color-sand-100:#f4ebda;
  --color-ink:#0b1220; --color-muted:#475467; --color-surface:#ffffff;
  --color-surface-2:#f7f4ee; --color-line:#e7e1d6;
  --color-focus: var(--color-brand-500);
}
```
Dark mode: definisikan pasangan token di bawah `[data-theme="dark"]`. **Semua pasangan
teks/latar harus ≥ 4,5:1** (teks besar ≥ 3:1). `danger-600` di tema gelap dipetakan ke
`#ffb3b7`, dan tautan `text-brand-600/700` dipetakan ke `brand-300`. Fokus memakai
`accent-400` di tema gelap.

## 3. Tipografi & ritme
- Display: serif sistem (Iowan/Palatino/Georgia). Body/UI: Inter self-host.
- Skala fluid: H1 `clamp(2.25rem, 5vw + 1rem, 4.5rem)`, body 16–18 px, line-height 1,6.
- Lebar baca maks `65ch`. Spasi vertikal antar-section 80–96 px desktop, 56–72 px mobile.
- Tidak ada label uppercase ber-tracking lebar di atas judul. Label kecil memakai
  kalimat biasa (`text-sm font-medium text-muted`).
- Berkas font yang benar-benar diminta browser ≤ 120 KB; tidak memuat font dari CDN.

## 4. Komponen wajib (di `components/ui` & `sections`)
Button (primary/secondary/ghost, min 44 px, radius `rounded-lg`) · Badge (label status
nyata, bukan pil dekoratif) · Card (berita/prodi/agenda) · Input/Textarea/Select
(label terlihat, error terhubung `aria-describedby`) · Dialog/Drawer (focus trap, Esc,
scroll lock, `aria-modal`) · Tabs · Accordion · Breadcrumb · Pagination · SearchBox ·
Skeleton · EmptyState · ErrorState · Toast · `Picture` (srcset+sizes+width+height+lazy,
fallback bila `src` kosong) · `ExternalLink` (otomatis `rel="noopener noreferrer"`,
teks SR "membuka tab baru") · `Prose` (styling rich text) · `Seo` · `Reveal` (satu kali per section).

## 5. Section beranda (urutan)
1. **Hero**: H1, deskripsi, 2 CTA (Lihat Program Studi, Baca Pengumuman), dan video
   loop animasi ekonomi di kanan (poster fallback, tombol jeda). Tanpa chart contoh
   atau badge "Data contoh".
2. **Statistik**: angka dari `SiteSetting` lewat API; section disembunyikan bila
   seluruh nilai masih 0.
3. **Program Studi**: daftar bernomor (01/02), nama, jenjang, ringkasan, tautan
   informasi pendaftaran.
4. **Berita terbaru**: 1 unggulan + daftar kecil, masing-masing dengan gambar dari
   CMS. Tanpa gambar gradien palsu dan tanpa tautan "Baca selengkapnya" yang
   tidak punya tujuan.
5. **Agenda mendatang**: baris tanggal, judul, lokasi.
6. **Pengumuman**: daftar dengan tanggal besar, label "Disematkan"/"Terbaru", dan satu
   panel visual dari aset video.
7. **Informasi dan kontak**: penjelasan singkat + kanal yang benar-benar ada. Selama
   data resmi belum tersedia, tampilkan "Belum tersedia", bukan angka/alamat karangan.
8. **Footer**: identitas, tautan navigasi, dan peta lokasi interaktif (Google Maps
   embed dengan `loading="lazy"`, judul, dan tautan "Buka di Google Maps").

Beranda adalah landing ringkas; setiap item navbar membuka halaman penuhnya sendiri
(`/prodi`, `/informasi/berita`, `/informasi/agenda`, `/informasi/pengumuman`,
`/kontak`) dengan filter, paginasi, dan state loading/error/empty dari API.

Statistik dan mitra **tidak ditampilkan** sampai ada data resmi. Jangan mengarang
angka, logo, atau testimoni.

## 6. Motion
- Durasi 150–650 ms, easing `cubic-bezier(.22,1,.36,1)`. Hanya `transform`/`opacity`.
- Scroll reveal dipakai **satu kali per section** lewat `Reveal`, bukan per elemen.
  Ada fallback 3 detik agar konten tidak pernah tertahan transparan.
- Tombol naik 2 px saat hover/focus sebagai affordance.
- Video hero bergerak pelan dan berulang, berhenti saat di luar viewport atau tab
  tersembunyi, dan punya tombol "Jeda animasi"/"Putar animasi".
- Semua motion berhenti saat `prefers-reduced-motion: reduce`; video tidak autoplay
  dan menampilkan poster.
- Library animasi tidak diperlukan; CSS + IntersectionObserver + elemen video cukup.

## 7. Tema (tri-state)
Tri-state `light | dark | system` disimpan di `localStorage["theme"]`. Aturan:
```ts
type ThemePref = 'light' | 'dark' | 'system';
const resolve = (p: ThemePref) =>
  p === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : p;
// set document.documentElement.dataset.theme = resolve(pref)  → HANYA 'light' atau 'dark'
// Dengarkan perubahan OS HANYA saat pref === 'system'.
```
Script inline kecil (ber-hash CSP) di `index.html` mencegah flash tema. Tombol tema punya
`aria-label` Indonesia. Tulis unit test untuk tiga kasus.

## 8. Responsif
Mobile-first; uji 320, 390, 768, 1024, 1280, 1440 px. Tidak ada scroll horizontal.
Navigasi mobile = **drawer** (focus trap, scroll lock, tombol tutup, label Indonesia).
