# 03 — Design System (terinspirasi webflow.com)

> Ambil **karakter**-nya, bukan aset/merek. Dilarang menyalin teks, logo, ilustrasi,
> atau kode Webflow. Warna & logo FIE nyata: **tanyakan** ke pemilik proyek; sebelum itu
> pakai token sementara di bawah dan tandai `TODO(brand)`.

## 1. Karakter visual yang diadopsi
- Tipografi besar & percaya diri; judul hero 56–80 px (fluid), banyak ruang putih.
- Layout **bento grid** untuk fitur/statistik; kartu bersudut besar (16–24 px), border tipis, bayangan lembut.
- Navigasi **sticky transparan-blur** + **mega menu** (Profil, Prodi, Informasi, Riset).
- Interaksi halus: reveal saat scroll, hover kartu terangkat, mikro-animasi tombol, marquee mitra.
- Gradien aksen terukur (bukan pelangi), latar bergaris/grid halus, glow lembut di belakang 3D.
- Kontras tinggi dan hierarki jelas: 1 H1, 1 CTA utama per layar.

## 2. Token (Tailwind v4 `@theme` di `styles/globals.css`)
```css
@theme {
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;   /* self-host via @fontsource */
  --font-display: "Plus Jakarta Sans Variable", var(--font-sans);        /* TODO(brand) */
  --radius-card: 1.25rem;
  /* warna sementara TODO(brand): navy + amber (nuansa ekonomi) */
  --color-brand-50:#eef4ff; --color-brand-500:#2f5bea; --color-brand-600:#2246c4; --color-brand-900:#0b1a4a;
  --color-accent-400:#fbbf24; --color-accent-600:#d97706;
  --color-ink:#0b1220; --color-muted:#475467;      /* muted di atas putih ≥ 7:1 */
  --color-surface:#ffffff; --color-surface-2:#f6f7fb; --color-line:#e4e7ec;
}
```
Dark mode: definisikan pasangan token di bawah `[data-theme="dark"]`. **Semua pasangan teks/latar
harus ≥ 4,5:1** (teks besar ≥ 3:1) — diverifikasi otomatis (lihat `09-QUALITY-GATES.md`).
Dilarang memakai putih di atas `#17a2b8`/`#9a9ea4` (kegagalan di situs lama).

## 3. Tipografi & ritme
- Skala fluid dengan `clamp()`: H1 `clamp(2.25rem, 5vw + 1rem, 4.5rem)`, body 16–18 px, line-height 1,6.
- Lebar baca artikel maks `68ch`. Spasi vertikal antar-section 80–128 px (desktop), 56–72 px (mobile).
- Font self-host, subset latin, `font-display: swap`, preload 1 font utama saja. Total font ≤ 120 KB.

## 4. Komponen wajib (di `components/ui` & `sections`)
Button (primary/secondary/ghost, ukuran min 44 px) · Badge (tautan nyata atau non-link) ·
Card (berita/prodi/agenda) · Input/Textarea/Select (label terlihat, error terhubung `aria-describedby`) ·
Dialog/Drawer (focus trap, Esc, scroll lock, `aria-modal`) · Tabs · Accordion · Breadcrumb ·
Pagination · SearchBox · Skeleton · EmptyState · ErrorState · Toast ·
`Picture` (srcset+sizes+width+height+lazy+blur, fallback bila `src` kosong) ·
`ExternalLink` (otomatis `rel="noopener noreferrer"`, ikon + teks SR "membuka tab baru") ·
`Prose` (styling konten rich text) · `Seo` · `Reveal` (animasi scroll).

## 5. Section beranda (urutan)
1. **Hero**: H1, subjudul, 2 CTA (Daftar/PMB, Lihat Prodi) + **scene 3D** di kanan (lihat `04-3D-VISUAL.md`);
   di bawahnya carousel **banner dari Admin** (dapat diklik, dot + panah selalu terlihat, jeda otomatis berhenti saat hover/fokus, hormati reduced-motion).
2. **Statistik** (bento): angka dari `SiteSetting` (jumlah prodi, dosen, mahasiswa, mitra) dengan count-up halus.
3. **Program Studi** (kartu).
4. **Berita terbaru** (1 unggulan besar + kartu kecil; kronologis, tanpa duplikat).
5. **Agenda mendatang** (hanya yang belum lewat; bila kosong tampilkan EmptyState jelas, bukan ruang kosong).
6. **Pengumuman** (daftar ringkas bertanggal).
7. **Mitra** (marquee; berhenti saat hover/reduced-motion).
8. **CTA PMB** + kontak cepat. 9. **Footer** (identitas dari `SiteSetting`).

## 6. Motion
- Durasi 150–300 ms, easing `cubic-bezier(.22,1,.36,1)`. Hanya animasikan `transform` & `opacity`.
- Wajib menghormati `prefers-reduced-motion` (matikan parallax, marquee, count-up, 3D bergerak).
- Library animasi: CSS + `IntersectionObserver` dahulu. `framer-motion`/`motion` hanya bila perlu dan
  di-import ringan (LazyMotion). Dilarang GSAP/Lottie besar tanpa persetujuan.

## 7. Tema (perbaikan bug lama)
Tri-state `light | dark | system` disimpan di `localStorage["theme"]`. Aturan:
```ts
type ThemePref = 'light' | 'dark' | 'system';
const resolve = (p: ThemePref) =>
  p === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : p;
// set document.documentElement.dataset.theme = resolve(pref)  → HANYA 'light' atau 'dark'
// Dengarkan perubahan OS HANYA saat pref === 'system'.
```
Script inline kecil (ber-hash CSP) di `index.html` mencegah flash tema. Tombol tema punya
`aria-label` Indonesia + `aria-pressed`/menu radio. Tulis unit test untuk tiga kasus.

## 8. Responsif
Mobile-first; uji 320, 390, 768, 1024, 1280, 1440 px. Tidak ada scroll horizontal.
Navigasi mobile = **drawer** (focus trap, scroll lock, tombol tutup, label Indonesia).
