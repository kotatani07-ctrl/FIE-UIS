# 07 — Keamanan (tingkat tinggi, FE + BE)

> Dokumen ini berprioritas **tertinggi**. Referensi acuan: OWASP ASVS (L2), OWASP Top 10,
> OWASP Cheat Sheet Series. Bila ada konflik dengan kenyamanan/fitur, keamanan menang
> dan agent wajib melaporkannya.

## A. Backend

### A1. Konfigurasi Django (`settings/prod.py`)
```python
DEBUG = False
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")        # tanpa "*"
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")   # hanya bila di belakang Nginx tepercaya
SECURE_HSTS_SECONDS = 63072000; SECURE_HSTS_INCLUDE_SUBDOMAINS = True; SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True; CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = CSRF_COOKIE_SAMESITE = "Lax"   # "Strict" untuk admin bila memungkinkan
SESSION_COOKIE_AGE = 60*60*8; SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS")
DATA_UPLOAD_MAX_MEMORY_SIZE = 2_621_440; FILE_UPLOAD_MAX_MEMORY_SIZE = 2_621_440
DATA_UPLOAD_MAX_NUMBER_FIELDS = 200
AUTH_PASSWORD_VALIDATORS = [... MinimumLength(12), CommonPassword, NumericPassword, UserAttributeSimilarity]
PASSWORD_HASHERS = ["django.contrib.auth.hashers.Argon2PasswordHasher", ...]   # argon2-cffi
```
- `SECRET_KEY` dari env, panjang ≥ 50, rotasi terdokumentasi. Tes startup gagal bila lemah.
- Jalankan `python manage.py check --deploy` — **harus 0 peringatan** (kecuali yang disetujui & didokumentasikan).
- Header `Server`/versi disembunyikan di Nginx (`server_tokens off`). Tidak ada `X-Powered-By`.

### A2. Admin
- Path rahasia dari env (`ADMIN_URL_PREFIX`), **2FA TOTP wajib** (staf tanpa perangkat 2FA tidak bisa masuk),
  `django-axes` (5 gagal → kunci 15 mnt, per IP+username), pesan login generik, tanpa enumerasi user.
- Opsi lapis tambahan: batasi admin per IP/VPN di Nginx (`allow/deny`), atau subdomain terpisah.
- Hak minimal per grup (lihat `06` §4). Superuser ≤ 2 orang. Semua perubahan konten tercatat (`simple_history`) +
  log akses admin ke file terpisah.
- Pemulihan akun lewat prosedur manual terdokumentasi (bukan reset email otomatis) atau reset dengan token sekali pakai + 2FA.

### A3. API (DRF)
- Default permission `AllowAny` **hanya** pada view publik read-only yang eksplisit; selebihnya `IsAdminUser`. Tambahkan test yang gagal
  bila ada view baru tanpa `permission_classes` eksplisit.
- Tidak ada metode tulis publik selain `POST /contact/`. Metode lain → 405.
- Throttle: `AnonRateThrottle` 120/menit global; `ScopedRateThrottle` `contact` 5/jam/IP + 20/hari/email; `search` 30/menit.
  Cache backend untuk throttle = Redis (bukan LocMem) di produksi multi-worker.
- Serializer eksplisit; **tidak** membocorkan field internal (`status`, `created_by`, `ip_hash`, path file server).
- Input: batasi panjang semua field teks; tolak payload > 100 KB; `parser_classes = [JSONParser]` untuk contact.
- Formulir kontak: **honeypot** + **Cloudflare Turnstile** (verifikasi server-side, timeout, fail-closed) + validasi email +
  pembersihan header-injection + tidak mengirim email berisi HTML mentah dari input. Simpan `ip_hash` (HMAC+salt), bukan IP mentah.
- Query hanya via ORM/parameter; `.raw()`/`extra()` dilarang kecuali dengan parameter terikat + review.
- Open redirect: URL `link_url`/`registration_url`/`external_url` divalidasi (`http/https` saja) dan host ditampilkan jelas.
- Respons error produksi tidak membocorkan stack trace/SQL; `handler404/500` JSON.
- CORS: `CORS_ALLOWED_ORIGINS` = origin FE saja; `CORS_ALLOW_CREDENTIALS=False`; metode `GET, POST, OPTIONS`; header terbatas.
- Header untuk respons API: `Cache-Control` sesuai, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`.

### A4. Upload & file
- Validasi ekstensi **dan** MIME nyata **dan** ukuran; nama acak; simpan di luar webroot eksekusi; Nginx `location /media/ { add_header X-Content-Type-Options nosniff; … }`
  tanpa menjalankan skrip; `Content-Disposition: attachment` untuk dokumen. Tolak SVG/HTML/JS/EXE. (Opsional: pindai ClamAV.)
- Gambar diproses ulang oleh Pillow (menghapus payload tersembunyi/EXIF), batasi `Image.MAX_IMAGE_PIXELS` (anti decompression bomb).

### A5. Data & rahasia
- PostgreSQL: user aplikasi hak minimal, koneksi TLS bila lintas host, backup terenkripsi, tidak ada port DB terbuka publik.
- Tidak ada secret di repo (`git-secrets`/`gitleaks` di pre-commit & CI). `.env` di `.gitignore`. Rotasi bila bocor.
- Data pribadi minimum (kontak: nama, email, pesan). Retensi 12 bulan (`purge_old_messages`). Cantumkan kebijakan privasi.
- Logging terstruktur tanpa PII/secret; alert untuk lonjakan 4xx/5xx & gagal login admin.

### A6. Rantai pasok
`pip-audit` + `safety`/OSV di CI; requirements **hash-pinned** (`pip-compile --generate-hashes`); Dependabot/Renovate; image Docker dipin digest,
non-root, minimal (slim). Jangan pasang paket tanpa alasan tertulis.

## B. Frontend

### B1. Content Security Policy (di header Nginx, bukan hanya meta)
```
default-src 'self';
script-src 'self' 'sha256-<hash-skrip-tema>' https://challenges.cloudflare.com;
style-src 'self';                       # tanpa 'unsafe-inline' (Tailwind menghasilkan file CSS)
img-src 'self' data: https://<media-host>;
font-src 'self';
connect-src 'self' https://<api-host>;
frame-src https://challenges.cloudflare.com https://www.google.com/maps/;
object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
upgrade-insecure-requests; require-trusted-types-for 'script'   # opsional, bila lib kompatibel
```
Mulai `Content-Security-Policy-Report-Only` → perbaiki → paksa. Dilarang `unsafe-eval`; `unsafe-inline` hanya jika tak terhindarkan dan harus disetujui.
Jika `style` inline dibutuhkan three/framer, gunakan nonce/hash — **jangan** longgarkan global.

### B2. Header lain (Nginx, semua respons)
`Strict-Transport-Security` · `X-Content-Type-Options: nosniff` · `X-Frame-Options: DENY` ·
`Referrer-Policy: strict-origin-when-cross-origin` ·
`Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()` ·
`Cross-Origin-Opener-Policy: same-origin` · `Cross-Origin-Resource-Policy: same-site` (sesuaikan untuk media).
Hapus `X-XSS-Protection` (usang). `server_tokens off`. TLS 1.2+ (prefer 1.3), cipher modern, OCSP stapling, HTTP→HTTPS 301, redirect host kanonik `www`↔apex 301.

### B3. Kode
- Tidak ada `dangerouslySetInnerHTML` selain komponen `SafeHtml` (DOMPurify allowlist ketat, 1 tempat).
- Tidak ada `eval`, `new Function`, `document.write`, `innerHTML` manual, `target="_blank"` tanpa `rel`.
- URL dari data (link, gambar) lewat `safeUrl()` (hanya `http/https/mailto/tel`, host diperiksa); blokir `javascript:`/`data:`.
- Tidak ada secret/ token di bundel atau `localStorage` (hanya preferensi tema). Tidak ada kunci API pribadi di FE; Turnstile **site key** publik boleh.
- Formulir: validasi Zod di klien **dan** server; tombol kirim dinonaktifkan saat proses; tampilkan pesan generik pada kegagalan server.
- Iframe: `title`, `loading="lazy"`, `referrerpolicy="no-referrer-when-downgrade"` + `sandbox` bila memungkinkan; peta lewat facade.
- Hindari skrip pihak ketiga (analytics hanya privacy-friendly, self-hosted, atas persetujuan; wajib masuk CSP).
- Font & ikon **self-host** (tak ada Google Fonts CDN). Bila ada `<script>/<link>` eksternal wajib **SRI** + `crossorigin`.

### B4. Rantai pasok FE
`npm ci` (bukan `install`) di CI, lockfile wajib commit, `npm audit --audit-level=high` harus lulus,
Renovate/Dependabot, larang paket tanpa pemeliharaan jelas, `overrides` untuk kerentanan transitif, `ignore-scripts` untuk instalasi CI bila memungkinkan.

## C. Operasional
- Docker: user non-root, `read_only` FS + tmpfs bila bisa, `cap_drop: [ALL]`, jaringan internal untuk DB, tanpa port DB/Redis ke publik.
- Firewall: hanya 80/443 (+ SSH via kunci, tanpa password, fail2ban). Pembaruan keamanan OS otomatis.
- Monitoring: uptime, sertifikat (kedaluwarsa), error rate, gagal login admin. Runbook insiden di `docs/RUNBOOK.md`.
- `security.txt` di `/.well-known/security.txt` dengan kontak pelaporan.
- Backup 3-2-1, uji restore terjadwal.

## D. Checklist keamanan (harus tercentang sebelum rilis)
- [ ] `manage.py check --deploy` bersih · `pip-audit` & `npm audit` (high+) bersih · `gitleaks` bersih
- [ ] securityheaders.com ≥ A+ · SSL Labs ≥ A · CSP tanpa `unsafe-inline/eval`
- [ ] Admin: path rahasia, 2FA wajib, axes aktif, peran diuji (Editor tak bisa kelola user/setting)
- [ ] API: tidak ada endpoint tulis selain kontak; throttle terbukti (429); CORS hanya origin FE
- [ ] Upload: tolak SVG/EXE/ekstensi ganda/MIME palsu; gambar diproses ulang; file hilang terdeteksi `check_files`
- [ ] XSS: payload uji (`<img onerror>`, `javascript:`, `<svg onload>`) disanitasi di server **dan** klien
- [ ] CSRF admin aktif · tidak ada `AllowAny` pada view tulis · tidak ada stack trace di respons produksi
- [ ] Tidak ada secret/dummy dalam repo & build · `.env.example` lengkap tanpa nilai nyata
- [ ] Pen-test ringan (OWASP ZAP baseline) tanpa temuan High
