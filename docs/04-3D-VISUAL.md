# 04 — Visual 3D (bagus tapi ringan)

## 1. Prinsip
3D adalah **hiasan progresif**, bukan syarat. Situs harus utuh, cepat, dan informatif
**tanpa** 3D. Jika perangkat/preferensi tidak cocok, tampilkan poster statis.

## 2. Konsep visual (tema ekonomi, low-poly, gaya "glass & gradient")
Pilih **satu** (default: A), dibuat **prosedural** (tanpa model besar):
- **A. "Bar Growth"**: 5–7 balok semi-transparan bergradien naik-turun pelan seperti grafik batang,
  ditambah 3–4 koin low-poly berputar lambat dan garis tren ber-glow.
- **B. "Globe of Dots"**: bola titik (instanced points) dengan arc koneksi tipis (kemitraan).
- **C. "Floating Shapes"**: kubus/ikosahedron/torus berkilau mengambang mengikuti kursor halus.
Sorot dengan warna token brand/accent; latar transparan agar menyatu dengan hero.

## 3. Stack & aturan teknis
- `three`, `@react-three/fiber`, `@react-three/drei` (impor **per-simbol**, tree-shaking; dilarang `import * as THREE`
  kecuali terbukti perlu).
- **Satu** `<Canvas>` di seluruh situs. Hanya di hero beranda.
- Komponen dimuat dengan `React.lazy` + `Suspense`; chunk terpisah (`manualChunks: { three: [...] }`),
  **dimuat setelah LCP** lewat `requestIdleCallback` (fallback `setTimeout`) dan `IntersectionObserver`.
- `dpr={[1, 1.5]}`, `antialias` hanya bila `devicePixelRatio < 2`, `powerPreference: 'low-power'`,
  `alpha: true`, `frameloop="demand"` + `invalidate()` saat animasi aktif; **jeda** saat tab tersembunyi
  atau scene keluar viewport.
- Geometri: instancing (`InstancedMesh`) untuk objek berulang; segmen rendah; **≤ 30.000 segitiga total**;
  ≤ 12 draw call. Material: `MeshStandardMaterial`/`MeshPhysicalMaterial` sederhana atau `MeshBasicMaterial` gradien;
  hindari transmission/refraksi berat dan post-processing (bloom, SSAO) — palsukan glow dengan sprite/gradien.
- Pencahayaan: 1 ambient + 1–2 directional; **tanpa shadow map**. Environment: gradien kecil / `Environment preset`
  hanya bila ≤ 50 KB, jika tidak pakai pencahayaan manual.
- Bila memakai glTF: ≤ 300 KB, kompresi **Meshopt/Draco**, tekstur KTX2/WebP ≤ 512 px. Prosedural lebih disukai.
- Interaksi: parallax kursor halus (lerp), **tidak** menangkap scroll/gesture (jangan `OrbitControls` di mobile).
  `touch-action: pan-y` agar scroll halaman tetap berfungsi.

## 4. Kapan 3D dirender (`useCanRender3D`)
Render **hanya jika semua** terpenuhi:
- WebGL tersedia (uji `canvas.getContext('webgl2'|'webgl')` dalam try/catch)
- `prefers-reduced-motion: no-preference`
- `navigator.connection?.saveData !== true` dan `effectiveType` bukan `2g/3g` (bila API tersedia)
- Lebar viewport ≥ 768 px **atau** perangkat mobile dengan `hardwareConcurrency ≥ 6` (default: mobile = poster)
- `navigator.deviceMemory` (bila ada) ≥ 4
- Tab terlihat
Jika tidak → tampilkan **poster**: gambar WebP/AVIF ≤ 60 KB (render dari scene yang sama) atau SVG/CSS gradien,
dengan dimensi tetap (tanpa CLS). Poster juga dipakai sebagai placeholder selama chunk 3D dimuat.

## 5. Ketahanan
- `ErrorBoundary` di sekitar canvas: error WebGL/context lost → otomatis poster, tanpa crash halaman.
- Tangani `webglcontextlost`/`restored`. Bersihkan geometri/material/tekstur saat unmount (`dispose`).
- Konten hero (H1, CTA) **di luar** canvas dan dapat dibaca screen reader; canvas diberi `aria-hidden="true"`.
- Tombol "Jeda animasi" kecil (aksesibel) untuk pengguna yang ingin menghentikan gerak.

## 6. Budget & verifikasi
| Item | Batas |
|---|---|
| Chunk 3D (gzip, tanpa model) | ≤ 200 KB |
| Aset 3D tambahan | ≤ 300 KB |
| Dampak ke LCP/CLS | 0 (3D tak boleh jadi elemen LCP; poster yang jadi LCP) |
| Frame rate | ≥ 50 fps di laptop menengah; turun otomatis (DPR 1, kurangi objek) bila rata-rata < 40 fps selama 2 detik |
| Total Blocking Time akibat 3D | ≤ 50 ms |
Verifikasi: Lighthouse (mobile & desktop) **dengan dan tanpa** 3D, Performance panel, `rollup-plugin-visualizer`.
Jika melanggar → kecilkan scene, **jangan** longgarkan budget.

## 7. Akseptasi
- [ ] Beranda memuat & interaktif tanpa menunggu 3D.
- [ ] Poster tampil pada mobile, reduced-motion, saveData, dan tanpa WebGL.
- [ ] Tidak ada error konsol saat context lost.
- [ ] Bundle awal tidak mengandung `three`.
