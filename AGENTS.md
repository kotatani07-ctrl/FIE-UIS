# AGENTS.md — Aturan Utama Proyek Website FIE

File ini dibaca agent di setiap sesi. Ringkas dan mengikat. Detail ada di `docs/`.

## 1. Identitas proyek
- **Nama**: Website Informasi Fakultas Ilmu Ekonomi (FIE) — Universitas Ichsan Satya
- **Bahasa UI & konten**: Indonesia (`id-ID`). Kode, nama variabel, commit: Inggris.
- **Nama resmi yang benar**: "Fakultas Ilmu Ekonomi" (situs lama salah menulis
  "Fakulas Ilmu Komputer" — jangan terulang).
- **Tujuan**: situs informasi fakultas (profil, prodi, berita, agenda, unduhan,
  riset, kontak) yang cepat, aman, mudah dikelola admin non-teknis.

## 2. Stack terkunci
| Lapisan | Teknologi |
|---|---|
| FE | React 19 + Vite + TypeScript (strict) + Tailwind CSS v4 + React Router + TanStack Query |
| 3D | three + @react-three/fiber + @react-three/drei (lazy, 1 canvas) |
| BE | Python 3.12+, Django 5.2 LTS, Django REST Framework |
| DB | PostgreSQL 16+ |
| Server | Nginx + Gunicorn, Docker Compose |
| Admin | Django Admin (dikeraskan, 2FA) |

Versi: pakai rilis **stabil terbaru yang kompatibel** saat Fase 0, verifikasi di
dokumentasi resmi, lalu **pin** versi persis di lockfile. Catat di `docs/VERSIONS.md`.

## 3. Struktur repo
```
fie-web/
├── AGENTS.md  CLAUDE.md
├── docs/                 # dokumen kit ini
├── backend/              # Django project (lihat 06-BACKEND-RULES)
├── frontend/             # React app (lihat 05-FRONTEND-RULES)
├── deploy/               # nginx, compose, env contoh
└── .github/workflows/    # CI
```

## 4. Prinsip kerja (non-negotiable)
1. **Security by default**: tolak dulu, izinkan seperlunya. Lihat `07-SECURITY.md`.
2. **Tanpa placeholder di produksi**: tidak ada "lorem ipsum", "abc...", "ini isi content".
3. **Status HTTP jujur**: halaman/URL tak ada = 404 sungguhan, bukan 200.
4. **Performa adalah fitur**: ada budget di `09-QUALITY-GATES.md`; melanggar = gagal.
5. **Aksesibilitas WCAG 2.2 AA** sejak awal, bukan perbaikan belakangan.
6. **Konten dikelola dari Admin**, bukan hard-code di FE (kecuali teks UI statis).
7. **Satu sumber kebenaran**: tipe API di FE dibuat dari kontrak `08-API-SPEC.md`.
8. **Kecil, bertahap, teruji**: satu fase, satu PR logis, ada test.

## 5. Konvensi kode
- Python: `ruff` (lint+format), `mypy`/`django-stubs` bila praktis, type hints publik.
- TS: `eslint` + `prettier`, `strict: true`, dilarang `any` tanpa komentar alasan.
- Commit: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `perf:`, `sec:`).
- Nama file FE: komponen `PascalCase.tsx`, hook `useXxx.ts`, util `camelCase.ts`.
- Tidak ada `console.log`, `print()` debug, atau kode mati yang tertinggal.
- Setiap fungsi non-trivial: satu baris docstring/komentar "kenapa", bukan "apa".

## 6. Definition of Done (berlaku untuk setiap fase)
- [ ] Semua perintah di `09-QUALITY-GATES.md` lulus (lint, type, test, audit, build).
- [ ] Tidak ada secret/dummy bocor ke repo atau build produksi.
- [ ] Checklist fase di `10-TASKS.md` dicentang dengan bukti (output perintah/screenshot).
- [ ] Dokumen terkait diperbarui bila ada keputusan baru.

## 7. Format "Laporan Fase" (wajib di akhir tiap fase)
```
## Laporan Fase N — <nama>
**Selesai**: (daftar singkat)
**Bukti**: (output perintah penting: test, lint, audit, Lighthouse)
**Keputusan/asumsi**: (apa yang kamu putuskan sendiri & kenapa)
**Risiko/utang teknis**: (jujur)
**Butuh dari saya**: (pertanyaan / data nyata yang diperlukan)
**Fase berikutnya**: (rencana singkat, tunggu persetujuan)
```

## 8. Kapan harus BERTANYA, bukan menebak
- Data institusi nyata (visi-misi, sejarah, struktur, kontak, daftar prodi lengkap).
- Warna/logo resmi, domain produksi, penyedia hosting/email.
- Perubahan stack, penambahan dependency besar, atau pelonggaran aturan keamanan.

## 9. Anti-pola yang dilarang
- `dangerouslySetInnerHTML` tanpa sanitasi · `fields = "__all__"` di serializer
- `DEBUG=True` / `ALLOWED_HOSTS=["*"]` / `CORS_ALLOW_ALL_ORIGINS=True` di prod
- Menyimpan token/secret di `localStorage` atau bundel FE
- Gambar tanpa `width`/`height`/`alt`/`loading` · `href="#"` sebagai tautan palsu
- Menaruh logika bisnis di komponen UI · query N+1 di API
- Google Fonts via CDN (self-host) · skrip pihak ketiga tanpa persetujuan
