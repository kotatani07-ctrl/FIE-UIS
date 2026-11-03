# Versi teknologi

Versi berikut diverifikasi pada 3 November 2026 melalui metadata npm dan PyPI.
Versi JavaScript dikunci persis di `frontend/package.json` dan `package-lock.json`;
versi Python dikunci di file requirements. Perbarui lockfile ketika menaikkan versi.

| Lapisan | Paket/runtime | Versi |
|---|---|---:|
| FE | React / React DOM | 19.3.1 |
| FE | Vite | 8.3.5 |
| FE | `@vitejs/plugin-react` | 6.2.1 |
| FE | Tailwind CSS / plugin Vite | 4.3.4 |
| FE | TypeScript | 5.9.3 |
| FE | ESLint | 9.39.5 |
| FE | Vitest | 5.1.0 |
| FE | Playwright | 1.64.1 |
| FE | `minimatch` security override | 11.0.1 |
| FE | Runtime lokal | Node.js 24.22.1 / npm 12.2.1 |
| BE | Django (jalur LTS 5.2) | 5.2.18 |
| BE | Django REST Framework | 3.18.3 |
| BE | psycopg | 3.3.7 |
| BE | Runtime lokal | Python 3.13.5 |
| DB | PostgreSQL (Docker development) | 16 |

Python tersedia pada runtime lokal dengan versi 3.13.5. Django 5.2 dipilih sesuai
keputusan arsitektur proyek yang secara eksplisit mengunci Django 5.2 LTS, bukan
rilis major Django yang lebih baru. Docker 29.9.2 dan Compose 5.7.0 kini terpasang;
konfigurasi Compose berhasil divalidasi, tetapi user `magnum` belum memiliki
akses ke socket daemon (`/var/run/docker.sock` dimiliki `root:docker`, sementara
user belum tergabung di grup `docker`). Image PostgreSQL dan integrasi Compose
belum dapat diuji sampai akses daemon diberikan.

Versi lint/test JavaScript dan paket backend pendukung juga dipatok persis di
manifest/requirements yang sesuai.

ESLint 9.39.5 dipilih karena `eslint-plugin-jsx-a11y` versi terbaru yang
diverifikasi masih membatasi peer dependency sampai ESLint 9. npm menandai ESLint
9 sebagai tidak lagi didukung; evaluasi ulang sebelum rilis produksi, setelah
plugin a11y mendukung ESLint 10. Tidak digunakan `--legacy-peer-deps`.
