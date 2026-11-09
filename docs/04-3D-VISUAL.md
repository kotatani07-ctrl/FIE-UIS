# 04 — Visual 3D (video loop)

> Hero memakai video animasi 3D yang disediakan, bukan scene WebGL yang dirender
> saat runtime. Ini menjaga bundle tetap ringan dan hasil visual sesuai aset.

## 1. Prinsip
3D adalah **hiasan progresif**, bukan syarat. Situs harus utuh, cepat, dan informatif
tanpa video. Jika perangkat/preferensi tidak cocok, tampilkan poster statis.

## 2. Aset
| Aset | Ukuran | Fungsi |
|---|---:|---|
| `frontend/asset/economy-loop.mp4` | 474 KB | Video hero, 800x600, 10 detik, tanpa audio, loop |
| `frontend/asset/hero-economy.jpg` | 42 KB | Poster hero sebelum video siap / reduced-motion |
| `frontend/asset/news-pmb.jpg` | 40 KB | Gambar berita unggulan (crop 16:9) |
| `frontend/asset/news-pie.jpg` | 26 KB | Gambar berita kedua |
| `frontend/asset/news-bars.jpg` | 19 KB | Gambar berita ketiga |
| `frontend/asset/announcement-visual.jpg` | 15 KB | Panel visual pengumuman |

Semua gambar berasal dari frame video yang sama. Alt text menjelaskan bahwa itu
ilustrasi 3D, bukan foto kegiatan.

## 3. Implementasi
- `frontend/src/components/HeroVisual.tsx` memakai elemen video native:
  `<video autoPlay loop muted playsInline preload="metadata" poster=...>`.
- Tombol "Jeda animasi"/"Putar animasi" tersedia. Video dijeda saat tab tersembunyi
  atau elemen keluar viewport (`IntersectionObserver`) dan dilanjutkan saat terlihat.
- `prefers-reduced-motion: reduce` → video tidak autoplay, poster tampil, pengguna
  bisa menekan "Putar animasi".
- Video dekoratif: `aria-hidden="true"`, `tabIndex={-1}`, tanpa audio, tanpa kontrol
  pemutar bawaan.
- **Tidak ada `three`/R3F di runtime.** Dependency 3D sudah dihapus dari proyek.
- Poster dan gambar berita memakai `Picture`/`img` dengan `width`, `height`, `alt`,
  `loading="lazy"`, dan `decoding="async"`.

## 4. Budget
| Item | Target | Terukur |
|---|---|---|
| Video hero | ≤ 1 MB | 474 KB |
| Poster hero | ≤ 100 KB | 42 KB |
| Gambar berita (3) | ≤ 150 KB | 85 KB |
| Panel pengumuman | ≤ 50 KB | 15 KB |
| Chunk 3D | tidak ada | 0 KB |
| JS awal (gzip) | ≤ 180 KB | 96,7 KB |

## 5. Aksesibilitas & ketahanan
- Konten hero (H1, CTA) berada di luar video dan dapat dibaca screen reader.
- Tombol jeda berlabel Indonesia dan punya `aria-pressed`.
- `poster` memastikan tidak ada kotak kosong sebelum video dimuat.
- Tidak ada error konsol saat load; jika video gagal, poster tetap tampil.

## 6. Peta footer
- Google Maps embed: `https://www.google.com/maps?q=-6.2912708,106.7051347&z=17&output=embed`.
- `loading="lazy"`, `title="Peta lokasi Universitas Ichsan Satya"`,
  `referrerpolicy="no-referrer-when-downgrade"`, `allowfullscreen`, rasio 4:3.
- Tautan "Buka di Google Maps" memakai `ExternalLink` sehingga otomatis
  `rel="noopener noreferrer"` dan teks SR "membuka tab baru".
- Jika nanti CSP dipasang, tambahkan `frame-src https://www.google.com`.

## 7. Verifikasi
- [x] Video autoplay, muted, loop, durasi 10 detik, lebar 800 px.
- [x] Reduced-motion menampilkan poster, bukan video bergerak.
- [x] Tidak ada error konsol saat load.
- [x] Bundle awal tidak mengandung `three` (dependency 3D dihapus).
- [x] Peta footer ter-render dan tautan Maps bekerja.
