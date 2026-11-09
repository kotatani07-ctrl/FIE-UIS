# 09 — Quality Gates (wajib lulus tiap fase)

## 1. Perintah (jalankan dan tempel ringkasan hasil di Laporan Fase)
**Backend** (`backend/`)
```bash
ruff check . && ruff format --check .
mypy apps config                       # bila dikonfigurasi
pytest -q --cov=apps --cov-fail-under=80
python manage.py check --deploy --settings=config.settings.prod
python manage.py makemigrations --check --dry-run
pip-audit -r requirements/prod.txt
gitleaks detect --no-banner
```
**Frontend** (`frontend/`)
```bash
npm ci
npm run lint && npm run typecheck
npm run test -- --run
npm run build && npm run analyze:size   # cek budget gzip JS/CSS di halaman awal
npm audit --audit-level=high
npx playwright test                     # e2e + axe
npx lhci autorun                        # Lighthouse CI (mobile & desktop)
```

## 2. Budget performa (gagal bila dilanggar)
| Metrik | Mobile (4G lambat, CPU 4×) | Desktop |
|---|---|---|
| Lighthouse Performance | ≥ 90 | ≥ 95 |
| LCP | ≤ 2,5 dtk (target 2,0) | ≤ 1,5 dtk |
| CLS | ≤ 0,05 | ≤ 0,05 |
| INP / TBT | INP ≤ 200 ms / TBT ≤ 200 ms | TBT ≤ 100 ms |
| Transfer awal beranda (tanpa 3D) | ≤ 1,5 MB | ≤ 1,5 MB |
| JS awal (gzip) / CSS (gzip) | ≤ 180 KB / ≤ 30 KB | sama |
| Gambar | semua WebP/AVIF, `srcset`, `lazy` (kecuali LCP), `width/height`; **tidak ada** > 200 KB | sama |
| Chunk 3D | ≤ 200 KB gzip, dimuat setelah LCP | sama |
Perbandingan: situs lama 64,4 MB & load 58 dtk — itu yang **tidak boleh** terulang.

## 3. Kualitas lain
| Area | Target |
|---|---|
| Lighthouse A11y / SEO / Best Practices | ≥ 95 / ≥ 95 / ≥ 95 |
| axe-core | 0 pelanggaran serius/kritis di semua rute utama (light & dark) |
| Kontras | semua pasangan token ≥ 4,5:1 (teks besar ≥ 3:1) — test otomatis menghitung rasio dari token |
| Target sentuh | ≥ 44×44 px pada kontrol utama (≥ 24 px mutlak) |
| Tautan | crawler E2E: 0 tautan internal 404/soft-404; 0 `href="#"`; semua eksternal ber-`rel` aman |
| HTTP | URL tak dikenal → 404 (diuji di Nginx **dan** API); `robots.txt` text/plain; `sitemap.xml` memuat semua URL publik |
| HTML | 1 H1/halaman; ID unik; validator W3C tanpa error pada halaman utama |
| Keamanan | `07-SECURITY.md` §D |
| i18n/format | tanggal `id-ID` di semua tempat (grep test: tak ada format `YYYY-MM-DD HH:mm:ss` di UI) |
| Browser | Chrome, Firefox, Safari (iOS & macOS), Edge — 2 versi terakhir |
| Viewport | 320, 390, 768, 1024, 1280, 1440 — tanpa scroll horizontal |

## 4. Uji regresi dari analisis situs lama (checklist akhir)
- [ ] URL acak `/informasi/berita/tidak-ada` → **404** + halaman Indonesia + `noindex`
- [ ] Semua tautan footer/nav berfungsi (dibangkitkan dari `routes.ts`)
- [ ] Tidak ada halaman prodi kosong (publish diblokir bila kosong)
- [ ] Tidak ada placeholder (`ini isi content`, `abc...`, `lorem`) di build produksi/DB produksi
- [ ] Tidak ada `<img src="">`; artikel tanpa cover → fallback
- [ ] Artikel hasil tempel Word → bersih (tanpa `mso-`, `file:///`, VML, inline style)
- [ ] Berita tanpa duplikat, kronologis, paginasi & pencarian berfungsi, `?page=999` → 404
- [ ] Agenda "mendatang" tidak memuat acara lampau
- [ ] Hero: dot/panah terlihat di sentuh, slide dapat diklik, gambar tidak terpotong buruk
- [ ] Tema: memilih Light lalu OS berubah ke gelap → tetap Light; "Sistem" mengikuti OS
- [ ] Drawer mobile mengunci scroll, `aria-label` Indonesia, fokus terjebak lalu kembali
- [ ] Unduhan: semua file ada & terunduh; `check_files` bersih
- [ ] Footer: "Fakultas Ilmu Ekonomi", email dari `SiteSetting`, tautan eksternal ber-`rel`
- [ ] Meta unik per halaman; canonical; OG/Twitter; JSON-LD valid (Rich Results Test)
- [ ] `robots.txt` & `sitemap.xml` benar; host kanonik 301

## 5. CI (GitHub Actions / setara)
Job paralel: `backend-test`, `frontend-test`, `e2e`, `lighthouse`, `security` (pip-audit, npm audit, gitleaks, ZAP baseline terjadwal).
Merge diblokir bila ada job merah. Cache dependency; artefak laporan Lighthouse/axe di-upload.
