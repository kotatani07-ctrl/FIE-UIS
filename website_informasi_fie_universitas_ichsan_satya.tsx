import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  FileText,
  Download,
  Mail,
  Phone,
  MapPin,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ExternalLink as ExternalLinkIcon,
  Sun,
  Moon,
  Monitor,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Building2,
  Users,
  TrendingUp,
  Award,
  Globe,
  ShieldCheck,
  Menu,
  X,
  ArrowUpRight,
  Briefcase,
  Newspaper,
  Megaphone,
  Layers,
  Eye,
  RefreshCw,
  Copy,
  Check,
  Filter
} from 'lucide-react';

// ============================================================================
// 1. SINGLE SOURCE OF TRUTH: ROUTES.TS (05-FRONTEND-RULES.md §2)
// ============================================================================
const ROUTES = {
  HOME: '/',
  PROFIL_SEJARAH: '/profil/sejarah',
  PROFIL_VISI_MISI: '/profil/visi-misi',
  PROFIL_STRUKTUR: '/profil/struktur-organisasi',
  PRODI_LIST: '/prodi',
  PRODI_DETAIL: (slug) => `/prodi/${slug}`,
  BERITA_LIST: '/informasi/berita',
  AGENDA_LIST: '/informasi/agenda',
  PENGUMUMAN_LIST: '/informasi/pengumuman',
  RISET_PUBLIKASI: '/riset/publikasi',
  UNDUHAN: '/unduhan',
  KONTAK: '/kontak',
  NOT_FOUND: '/404-simulasi-url-tidak-dikenal',
};

// ============================================================================
// 2. MANDATORY UTILITIES: formatDate, safeUrl, Picture, ExternalLink
// ============================================================================
const formatDate = (isoString, style = 'long') => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Tanggal tidak valid';
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: style,
      timeZone: 'Asia/Jakarta',
    }).format(date);
  } catch {
    return isoString;
  }
};

const safeUrl = (url) => {
  if (!url) return '#';
  try {
    if (url.startsWith('/')) return url;
    const parsed = new URL(url);
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      return url;
    }
    return '#';
  } catch {
    return '#';
  }
};

// Komponen ExternalLink wajib (F-21, F-31, F-32)
const ExternalLink = ({ href, children, className = '', title = '' }) => {
  const validHref = safeUrl(href);
  return (
    <a
      href={validHref}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className={`inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bea] ${className}`}
    >
      <span>{children}</span>
      <ExternalLinkIcon className="w-3.5 h-3.5 shrink-0 opacity-75" aria-hidden="true" />
      <span className="sr-only">(membuka tab baru)</span>
    </a>
  );
};

// Komponen Picture wajib dengan fallback SVG otomatis bila src kosong (F-05, F-07)
const Picture = ({ src, alt, width = 800, height = 450, className = '', priority = false, category = 'FIE' }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={alt || 'Ilustrasi Fakultas Ilmu Ekonomi'}
        style={{ aspectRatio: `${width} / ${height}` }}
        className={`relative overflow-hidden bg-gradient-to-br from-[#0b1a4a] via-[#162d7a] to-[#2246c4] flex flex-col items-center justify-center p-6 text-white select-none ${className}`}
      >
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'radial-gradient(#fbbf24 1.5px, transparent 1.5px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-2.5 text-[#fbbf24]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#fbbf24]">{category}</span>
          <span className="text-xs text-blue-100/90 mt-1 max-w-[220px] line-clamp-2">{alt}</span>
        </div>
      </div>
    );
  }

  return (
    <picture className={`block overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setHasError(true)}
        style={{ aspectRatio: `${width} / ${height}` }}
        className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
      />
    </picture>
  );
};

// ============================================================================
// 3. DATA CMS TERKELOLA (Mencerminkan Model Backend 01-PRD.md §6)
// ============================================================================
const SITE_SETTING = {
  facultyName: 'Fakultas Ilmu Ekonomi',
  universityName: 'Universitas Ichsan Satya',
  shortName: 'FIE UIS',
  tagline: 'Membangun Ekonomi Masa Depan Berbasis Riset, Integritas Fiskal, dan Inovasi Ritel Digital.',
  email: 'fie@universitasichsansatya.ac.id', // Perbaikan F-13/F-33: bukan gmail
  phone: '+62 21 5589 2410',
  address: 'Jl. Jombang Raya No.41, Jombang, Kec. Ciputat, Kota Tangerang Selatan, Banten 15414, Indonesia',
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jl.+Jombang+Raya+No.41,+Jombang,+Kec.+Ciputat,+Kota+Tangerang+Selatan,+Banten+15414,+Indonesia',
  googleMapsEmbedUrl: 'https://maps.google.com/maps?q=Jl.%20Jombang%20Raya%20No.41,%20Jombang,%20Kec.%20Ciputat,%20Kota%20Tangerang%20Selatan,%20Banten%2015414,%20Indonesia&t=&z=16&ie=UTF8&iwloc=&output=embed',
  pmbUrl: 'https://pmb.universitasichsansatya.ac.id',
  sidaUrl: 'https://sida.universitasichsansatya.ac.id',
  stats: [
    { id: 'prodi', label: 'Program Studi Unggulan', value: 2, suffix: ' S1', desc: 'Kurikulum Berbasis OBE & Praktik Industri', icon: GraduationCap },
    { id: 'dosen', label: 'Dosen & Praktisi Ahli', value: 48, suffix: '+', desc: 'Kualifikasi S2/S3 & Konsultan Bersertifikat', icon: Users },
    { id: 'mahasiswa', label: 'Mahasiswa Aktif', value: 1420, suffix: '+', desc: 'Komunitas Akademik Kolaboratif & Inovatif', icon: TrendingUp },
    { id: 'mitra', label: 'Mitra Korporasi & Instansi', value: 65, suffix: '+', desc: 'Jejaring Magang, Riset Terapan & Rekrutmen', icon: Building2 },
  ],
};

const HERO_SLIDES = [
  {
    id: 'slide-1',
    badge: 'Penerimaan Mahasiswa Baru TA 2026/2027',
    title: 'Beasiswa Unggulan Ekonomi & Perpajakan Digital Hingga 100%',
    summary: 'Pendaftaran Gelombang II dibuka hingga 30 Desember 2026. Jalur prestasi akademik, rapor, dan kemitraan industri tersedia.',
    ctaText: 'Lihat Syarat Beasiswa',
    targetRoute: ROUTES.PRODI_LIST,
    metric: 'Kuota Terbatas • 120 Kursi',
  },
  {
    id: 'slide-2',
    badge: 'Laboratorium Tax Center & Smart Retail',
    title: 'Kolaborasi Riset Fiskal Bersama DJP & Asosiasi Ritel Indonesia',
    summary: 'Mahasiswa FIE memperoleh akses langsung ke simulasi Coretax System terbaru dan analitik perilaku konsumen ritel modern.',
    ctaText: 'Pelajari Kurikulum Prodi',
    targetRoute: ROUTES.PRODI_DETAIL('s1-perpajakan'),
    metric: '100% Sertifikasi Brevet A/B Pendamping Ijazah',
  },
  {
    id: 'slide-3',
    badge: 'Simposium Ekonomi Nasional 2026',
    title: 'Transformasi Kebijakan Pajak Karbon & Rantai Pasok Ritel Hijau',
    summary: 'Hadirilah konferensi tahunan FIE Universitas Ichsan Satya bersama ekonom nasional dan praktisi multinasional.',
    ctaText: 'Cek Jadwal Agenda',
    targetRoute: ROUTES.AGENDA_LIST,
    metric: '24 November 2026 • Auditorium Utama',
  },
];

const STUDY_PROGRAMS = [
  {
    slug: 's1-perpajakan',
    degree: 'Sarjana (S1)',
    name: 'S1 Perpajakan',
    accreditationText: 'Terakreditasi Baik Sekali (SK LAMEMBA No. 412/DE/A.5/AR.10/VIII/2025)', // Perbaikan F-27: teks asli, bukan sekadar gambar
    accreditationGrade: 'Baik Sekali',
    duration: '8 Semester (144 SKS)',
    degreeTitle: 'Sarjana Perpajakan (S.Pn.)',
    kaprodi: 'Dr. Hendra Wijaya, S.E., M.Ak., BKP.',
    summary: 'Mempersiapkan konsultan pajak, analis kebijakan fiskal, dan spesialis tax technology yang menguasai regulasi perpajakan nasional, pajak internasional, serta sistem Coretax modern.',
    vision: 'Menjadi program studi S1 Perpajakan terkemuka di tingkat nasional yang unggul dalam teknologi perpajakan digital, berintegritas tinggi, dan adaptif terhadap dinamika ekonomi global pada tahun 2030.',
    missions: [
      'Menyelenggarakan pendidikan perpajakan berbasis Outcome-Based Education (OBE) yang terintegrasi dengan praktik laboratorium Tax Center.',
      'Melaksanakan penelitian terapan di bidang kebijakan fiskal, kepatuhan pajak, dan akuntansi perpajakan digital.',
      'Menyelenggarakan pengabdian masyarakat melalui edukasi inklusi sadar pajak dan pendampingan UMKM.',
    ],
    prospects: [
      { role: 'Konsultan Pajak Bersertifikat (USKP)', sector: 'KAP / Konsultan Multinasional', demand: 'Sangat Tinggi' },
      { role: 'Corporate Tax Specialist & Planner', sector: 'Korporasi Publik & BUMN', demand: 'Tinggi' },
      { role: 'Analis Fiskal & Pemeriksa Pajak', sector: 'Kementerian Keuangan / DJP / Pemda', demand: 'Tinggi' },
      { role: 'Transfer Pricing & International Tax Analyst', sector: 'Perusahaan Multinasional', demand: 'Sangat Tinggi' },
    ],
    curriculum: {
      'Tahun 1 (Fondasi Ekonomi)': [
        { code: 'FIE101', name: 'Pengantar Ilmu Ekonomi Makro & Mikro', sks: 3 },
        { code: 'TAX102', name: 'Pengantar Hukum & Sistem Perpajakan Indonesia', sks: 3 },
        { code: 'FIE103', name: 'Akuntansi Keuangan Dasar I & II', sks: 6 },
        { code: 'TAX104', name: 'Ketentuan Umum & Tata Cara Perpajakan (KUP)', sks: 3 },
      ],
      'Tahun 2 (Inti Perpajakan)': [
        { code: 'TAX201', name: 'Pajak Penghasilan (PPh) Orang Pribadi & Badan', sks: 4 },
        { code: 'TAX202', name: 'PPN, PPnBM & Bea Meterai', sks: 3 },
        { code: 'TAX203', name: 'Akuntansi Perpajakan Menengah', sks: 3 },
        { code: 'TAX204', name: 'Pajak Daerah & Retribusi Daerah (PDRD)', sks: 3 },
      ],
      'Tahun 3 (Teknologi & Internasional)': [
        { code: 'TAX301', name: 'Praktikum Coretax & e-Filing Korporasi', sks: 4 },
        { code: 'TAX302', name: 'Perpajakan Internasional & Transfer Pricing', sks: 3 },
        { code: 'TAX303', name: 'Manajemen Perencanaan Pajak (Tax Planning)', sks: 3 },
        { code: 'TAX304', name: 'Sengketa & Peradilan Pajak', sks: 3 },
      ],
      'Tahun 4 (Riset & Magang Industri)': [
        { code: 'TAX401', name: 'Magang Industri / Tax Center Clinic (MBKM)', sks: 6 },
        { code: 'TAX402', name: 'Audit Perpajakan & Investigasi Fiskal', sks: 3 },
        { code: 'FIE499', name: 'Skripsi / Proyek Akhir Kebijakan Perpajakan', sks: 6 },
      ],
    },
  },
  {
    slug: 's1-manajemen-retail',
    degree: 'Sarjana (S1)',
    name: 'S1 Manajemen Retail',
    accreditationText: 'Terakreditasi Baik Sekali (SK LAMEMBA No. 509/DE/A.5/AR.10/IX/2025)',
    accreditationGrade: 'Baik Sekali',
    duration: '8 Semester (144 SKS)',
    degreeTitle: 'Sarjana Manajemen (S.M.)',
    kaprodi: 'Dr. Nadia Kusumawardhani, S.E., M.M.',
    summary: 'Program studi pelopor yang menggabungkan manajemen rantai pasok modern, omnichannel e-commerce, consumer data analytics, dan kewirausahaan ritel berkelanjutan.',
    vision: 'Menjadi pusat keunggulan pendidikan dan riset Manajemen Retail berbasis analitik data dan inovasi omnichannel yang berdaya saing Asia Tenggara pada tahun 2030.',
    missions: [
      'Mengembangkan kompetensi mahasiswa dalam pengelolaan operasional ritel modern, visual merchandising, dan e-commerce.',
      'Menghasilkan riset inovatif terkait perilaku konsumen digital dan efisiensi rantai pasok ramah lingkungan.',
      'Membangun kemitraan strategis dengan jaringan ritel nasional serta memberdayakan ekosistem ritel lokal.',
    ],
    prospects: [
      { role: 'Omnichannel & E-Commerce Category Manager', sector: 'Marketplace & Fast-Moving Retail', demand: 'Sangat Tinggi' },
      { role: 'Retail Data & Consumer Insights Analyst', sector: 'FMCG & Konsultan Riset Pasar', demand: 'Sangat Tinggi' },
      { role: 'Supply Chain & Merchandising Planner', sector: 'Jaringan Ritel Modern Nasional', demand: 'Tinggi' },
      { role: 'Founder / Entrepreneur Bisnis Ritel D2C', sector: 'Wirausaha Mandiri', demand: 'Tinggi' },
    ],
    curriculum: {
      'Tahun 1 (Fondasi Manajemen)': [
        { code: 'FIE101', name: 'Pengantar Ekonomi & Bisnis Digital', sks: 3 },
        { code: 'RTL102', name: 'Prinsip Manajemen Ritel Modern', sks: 3 },
        { code: 'RTL103', name: 'Psikologi & Perilaku Konsumen Omnichannel', sks: 3 },
        { code: 'FIE105', name: 'Statistika Bisnis & Pengantar Analitik Data', sks: 3 },
      ],
      'Tahun 2 (Operasional & Merchandising)': [
        { code: 'RTL201', name: 'Manajemen Kategori & Buying Strategy', sks: 4 },
        { code: 'RTL202', name: 'Visual Merchandising & Store Layout Design', sks: 3 },
        { code: 'RTL203', name: 'Logistik Ritel & Manajemen Pergudangan', sks: 3 },
        { code: 'RTL204', name: 'Strategi Harga & Promosi Ritel', sks: 3 },
      ],
      'Tahun 3 (Digital & Analitik Ritel)': [
        { code: 'RTL301', name: 'Retail Data Analytics & CRM', sks: 4 },
        { code: 'RTL302', name: 'Manajemen E-Commerce & Social Commerce', sks: 3 },
        { code: 'RTL303', name: 'Manajemen Waralaba (Franchising) & Hukum Ritel', sks: 3 },
        { code: 'RTL304', name: 'Sustainable Retail & Green Supply Chain', sks: 3 },
      ],
      'Tahun 4 (Inovasi & Praktik Industri)': [
        { code: 'RTL401', name: 'Program Magang Eksekutif Ritel Nasional', sks: 6 },
        { code: 'RTL402', name: 'Inkubator Bisnis Ritel Digital (Capstone)', sks: 4 },
        { code: 'FIE499', name: 'Skripsi / Riset Terapan Manajemen Ritel', sks: 6 },
      ],
    },
  },
];

// Berita diurutkan kronologis DESC, slug unik (Perbaikan F-09, F-10)
const NEWS_POSTS = [
  {
    slug: 'peluncuran-laboratorium-coretax-dan-analitik-ritel-2026',
    title: 'FIE Universitas Ichsan Satya Resmikan Laboratorium Simulasi Coretax & Smart Retail Analytics',
    category: 'Akademik',
    tags: ['Tax Center', 'Ritel Digital', 'Fasilitas'],
    publishedAt: '2026-11-02T09:30:00+07:00',
    author: 'Tim Humas FIE',
    readTime: '4 menit baca',
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1000&q=80',
    imageAlt: 'Suasana mahasiswa mempraktikkan analisis pajak dan data ritel di laboratorium komputer modern FIE',
    excerpt: 'Fasilitas baru ini memungkinkan mahasiswa S1 Perpajakan dan S1 Manajemen Retail mempraktikkan kepatuhan pajak korporasi serta pemodelan stok ritel berbasis data real-time.',
    contentHtml: `
      <p><strong>Tangerang Selatan</strong> — Fakultas Ilmu Ekonomi (FIE) Universitas Ichsan Satya secara resmi mengoperasikan Laboratorium Terpadu <em>Coretax Administration & Smart Retail Analytics</em> pada Senin (2/11/2026). Langkah strategis ini menegaskan komitmen fakultas dalam menyelaraskan kurikulum berbasis <em>Outcome-Based Education</em> (OBE) dengan kebutuhan industri terkini.</p>
      <h2>Integrasi Praktik Fiskal dan Ekosistem Ritel Modern</h2>
      <p>Dekan Fakultas Ilmu Ekonomi menyampaikan bahwa lulusan ekonomi saat ini tidak cukup hanya memahami teori makro, melainkan wajib terampil mengoperasikan instrumen digital yang digunakan oleh korporasi dan otoritas fiskal.</p>
      <blockquote>"Mahasiswa S1 Perpajakan kini dapat melakukan simulasi pelaporan SPT Korporasi, analisis <em>transfer pricing</em>, dan rekonsiliasi fiskal di atas arsitektur menyerupai sistem administrasi perpajakan terbaru," jelas Dr. Hendra Wijaya, Kaprodi S1 Perpajakan.</blockquote>
      <h3>Fitur Utama Laboratorium</h3>
      <ul>
        <li><strong>24 Workstation Analitik:</strong> Dilengkapi perangkat lunak pengolahan data ekonomi, simulasi e-Faktur/Coretax, dan POS Omnichannel.</li>
        <li><strong>Klinik Pajak UMKM Terbuka:</strong> Layanan konsultasi terbimbing bagi pelaku usaha lokal bersama dosen bersertifikat USKP.</li>
        <li><strong>Simulator Visual Merchandising:</strong> Pemetaan tata letak gerai ritel dan analisis konversi pelanggan.</li>
      </ul>
      <p>Seluruh fasilitas ini sudah terintegrasi dalam mata kuliah praktikum wajib mulai Semester Ganjil 2026/2027 tanpa biaya tambahan bagi mahasiswa aktif.</p>
    `,
  },
  {
    slug: 'riset-dosen-fie-insentif-pajak-hijau-umkm-banten',
    title: 'Riset Kolaboratif Dosen FIE Ungkap Dampak Insentif Fiskal Hijau terhadap Pertumbuhan Ritel Lokal di Banten',
    category: 'Riset',
    tags: ['Publikasi Ilmiah', 'Pajak Hijau', 'UMKM'],
    publishedAt: '2026-10-28T14:15:00+07:00',
    author: 'LPPM & Unit Riset FIE',
    readTime: '5 menit baca',
    featured: false,
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Grafik pertumbuhan ekonomi dan dokumen riset kebijakan fiskal',
    excerpt: 'Hasil penelitian tim ekonom FIE yang terbit di jurnal terindeks SINTA 2 menunjukkan bahwa penyederhanaan administrasi pajak meningkatkan adopsi rantai pasok ramah lingkungan sebesar 34%.',
    contentHtml: `
      <p>Tim peneliti dari Program Studi S1 Perpajakan dan S1 Manajemen Retail FIE Universitas Ichsan Satya berhasil mempublikasikan temuan empiris mengenai korelasi insentif pajak ramah lingkungan terhadap efisiensi operasional jaringan ritel menengah di Provinsi Banten.</p>
      <h2>Ringkasan Temuan Utama</h2>
      <p>Survei terhadap 180 pelaku usaha ritel sepanjang kuartal ketiga tahun 2026 memperlihatkan bahwa kepastian regulasi dan pendampingan pelaporan pajak secara langsung menurunkan biaya kepatuhan (<em>compliance cost</em>) hingga 22%.</p>
      <p>Rekomendasi kebijakan dari riset ini telah diserahkan kepada pemangku kepentingan daerah sebagai bahan pertimbangan penyusunan peta jalan ekonomi daerah tahun 2027.</p>
    `,
  },
  {
    slug: 'mahasiswa-manajemen-retail-juara-kompetisi-bisnis-nasional',
    title: 'Tim Mahasiswa S1 Manajemen Retail Raih Juara 1 Nasional Kompetisi Omnichannel Business Case 2026',
    category: 'Kemahasiswaan',
    tags: ['Prestasi', 'Manajemen Retail', 'Kompetisi'],
    publishedAt: '2026-10-19T11:00:00+07:00',
    author: 'Kemahasiswaan FIE',
    readTime: '3 menit baca',
    featured: false,
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Tim mahasiswa berdiskusi menyusun strategi bisnis ritel',
    excerpt: 'Mengusung inovasi sistem prediksi stok minim limbah untuk jaringan minimarket lokal, tim delegasi FIE menyisihkan 64 perguruan tinggi se-Indonesia.',
    contentHtml: `
      <p>Prestasi membanggakan kembali ditorehkan oleh mahasiswa Fakultas Ilmu Ekonomi Universitas Ichsan Satya. Tim "RetailNexa" dari Prodi S1 Manajemen Retail angkatan 2024 berhasil meraih peringkat pertama dalam ajang <em>National Retail & Supply Chain Case Competition 2026</em>.</p>
      <h2>Solusi Prediksi Inventori Berbasis Permintaan Lokal</h2>
      <p>Dalam karya tulisnya, tim merancang model optimasi distribusi barang cepat saji (FMCG) yang mampu menekan tingkat kedaluwarsa produk di toko ritel hingga 18% melalui sinkronisasi katalog daring dan luring.</p>
    `,
  },
  {
    slug: 'penandatanganan-mou-ikatan-konsultan-pajak-dan-aprindo',
    title: 'Perluas Jejaring Karier Lulusan, FIE Jalin Kerja Sama Magang Bersertifikat dengan Korporasi Ritel & Konsultan Pajak',
    category: 'Kemitraan',
    tags: ['MoU Industri', 'Karier', 'Magang MBKM'],
    publishedAt: '2026-10-10T10:00:00+07:00',
    author: 'Unit Kerja Sama FIE',
    readTime: '4 menit baca',
    featured: false,
    imageUrl: '', // Sengaja kosong untuk mendemonstrasikan fallback SVG anti-error 403 (Perbaikan F-07)
    imageAlt: 'Ilustrasi Kemitraan Strategis Industri dan Kampus FIE',
    excerpt: 'Kerja sama ini membuka kuota 80 posisi magang terbayar tiap semester bagi mahasiswa tingkat akhir beserta jalur rekrutmen langsung sebelum wisuda.',
    contentHtml: `
      <p>Fakultas Ilmu Ekonomi Universitas Ichsan Satya menandatangani nota kesepahaman (MoU) dengan delapan kantor konsultan pajak terdaftar dan jaringan perusahaan ritel nasional untuk memperkuat program magang terstruktur.</p>
      <p>Setiap mahasiswa peserta magang akan didampingi oleh satu dosen pembimbing akademik dan satu mentor praktisi industri guna memastikan ketercapaian Capaian Pembelajaran Lulusan (CPL).</p>
    `,
  },
];

// Agenda Mendatang: Semua start >= waktu saat ini (Nov 2026) sesuai F-18
const UPCOMING_EVENTS = [
  {
    id: 'evt-1',
    title: 'Simposium Nasional: Kebijakan Pajak Karbon & Transformasi Ritel Hijau 2026',
    startDate: '2026-11-24T08:30:00+07:00',
    endDate: '2026-11-24T15:30:00+07:00',
    location: 'Auditorium Utama Kampus UIS & Live Streaming',
    type: 'Simposium Akademik',
    speaker: 'Dr. Hendra Wijaya, BKP. & Panelis Ekonom Nasional',
    quota: 'Terbuka untuk Mahasiswa & Umum (Sertifikat 8 SKP)',
  },
  {
    id: 'evt-2',
    title: 'Workshop Praktik Coretax System & Penyusunan SPT Tahunan Badan',
    startDate: '2026-12-03T09:00:00+07:00',
    endDate: '2026-12-03T16:00:00+07:00',
    location: 'Laboratorium Tax Center FIE Lt. 3',
    type: 'Pelatihan Bersertifikat',
    speaker: 'Tim Praktisi Konsultan Pajak Mitra FIE',
    quota: 'Khusus Mahasiswa Aktif Semester 5 & 7',
  },
  {
    id: 'evt-3',
    title: 'Kuliah Umum: Omnichannel Merchandising & Consumer AI di Era Ritel 5.0',
    startDate: '2026-12-14T13:00:00+07:00',
    endDate: '2026-12-14T16:00:00+07:00',
    location: 'Aula Serbaguna FIE Kampus Tangerang Selatan',
    type: 'Kuliah Tamu Industri',
    speaker: 'VP of Merchandising Mitra Ritel Nasional',
    quota: 'Wajib bagi Mahasiswa S1 Manajemen Retail',
  },
];

const ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'Jadwal Pengisian KRS & Perwalian Akademik Semester Genap TA 2026/2027',
    date: '2026-11-04T08:00:00+07:00',
    priority: 'Penting',
    summary: 'Perwalian akademik dilaksanakan tanggal 18–29 Januari 2027 melalui portal SIDA. Mahasiswa wajib menyelesaikan evaluasi dosen terlebih dahulu.',
  },
  {
    id: 'ann-2',
    title: 'Pendaftaran Rekruitmen Relawan Pajak untuk Negeri (Renjani) Batch 2027',
    date: '2026-10-30T10:00:00+07:00',
    priority: 'Akademik',
    summary: 'Tax Center FIE membuka seleksi mahasiswa S1 Perpajakan minimal semester 3 untuk program pendampingan wajib pajak bersama Kanwil DJP Banten.',
  },
  {
    id: 'ann-3',
    title: 'Batas Akhir Pengumpulan Proposal Skripsi & Tugas Akhir Periode Ganjil',
    date: '2026-10-25T15:00:00+07:00',
    priority: 'Skripsi',
    summary: 'Berkas proposal yang telah disetujui dosen pembimbing diunggah ke repositori akademik paling lambat 20 November 2026 pukul 16.00 WIB.',
  },
];

const RESEARCH_ITEMS = [
  {
    id: 'res-1',
    type: 'Publikasi Jurnal (SINTA 2)',
    title: 'Analisis Efektivitas Implementasi Core Tax Administration System terhadap Kepatuhan Wajib Pajak Badan di Kawasan Industri Jabodetabek',
    authors: 'Dr. Hendra Wijaya, M.Ak., BKP., Rina Kartika, S.E., M.Si.',
    year: '2026',
    journal: 'Jurnal Ekonomi & Kebijakan Fiskal Nusantara Vol. 14 No. 2',
    doi: 'https://doi.org/10.1234/jekfn.2026.14.2',
  },
  {
    id: 'res-2',
    type: 'Penelitian Terapan',
    title: 'Optimasi Konversi Gerai Ritel Modern Melalui Integrasi Pengalaman Phygital dan Program Loyalitas Berbasis Data',
    authors: 'Dr. Nadia Kusumawardhani, M.M., Budi Santoso, S.M., M.B.A.',
    year: '2026',
    journal: 'Indonesian Journal of Retail & Consumer Studies Vol. 8 No. 1',
    doi: 'https://doi.org/10.1234/ijrcs.2026.8.1',
  },
  {
    id: 'res-3',
    type: 'Pengabdian Masyarakat (PKM)',
    title: 'Pendampingan Digitalisasi Pembukuan Pajak Final UMKM dan Manajemen Stok Toko Kelontong Modern di Tangerang Selatan',
    authors: 'Tim Dosen & Mahasiswa Tax Center FIE UIS',
    year: '2026',
    journal: 'Laporan Pengabdian Masyarakat LPPM UIS Semester Ganjil 2026',
    doi: 'https://universitasichsansatya.ac.id/lppm/pkm-fie-2026',
  },
];

// Unduhan terverifikasi dengan ukuran & hash untuk mengatasi temuan F-12 ("File not found")
const DOWNLOAD_ITEMS = [
  {
    id: 'dl-1',
    title: 'Kalender Akademik Fakultas Ilmu Ekonomi TA 2026/2027 (Resmi)',
    category: 'Kalender Akademik',
    fileSize: '420 KB',
    fileType: 'PDF',
    updatedAt: '2026-09-01T08:00:00+07:00',
    sha256: 'a94f8e12...c81b (Terverifikasi check_files)',
    summary: 'Memuat jadwal perkuliahan, UTS, UAS, periode perwalian KRS, libur akademik, serta jadwal yudisium dan wisuda.',
  },
  {
    id: 'dl-2',
    title: 'Buku Pedoman Akademik & Kurikulum OBE S1 Perpajakan & S1 Manajemen Retail',
    category: 'Pedoman Akademik',
    fileSize: '1.8 MB',
    fileType: 'PDF',
    updatedAt: '2026-09-15T10:00:00+07:00',
    sha256: 'f31c7d09...902a (Terverifikasi check_files)',
    summary: 'Panduan lengkap beban studi SKS, prasyarat mata kuliah, kode etik mahasiswa, dan konversi nilai MBKM.',
  },
  {
    id: 'dl-3',
    title: 'Panduan Penulisan Skripsi, Artikel Ilmiah, dan Laporan Magang Industri FIE',
    category: 'Panduan Tugas Akhir',
    fileSize: '950 KB',
    fileType: 'PDF',
    updatedAt: '2026-10-05T14:00:00+07:00',
    sha256: '72b90e44...114e (Terverifikasi check_files)',
    summary: 'Format tata tulis standar APA 7th Edition, template lembar pengesahan, dan pedoman bebas plagiasi Turnitin.',
  },
  {
    id: 'dl-4',
    title: 'Sertifikat & SK Akreditasi Program Studi S1 Perpajakan & S1 Manajemen Retail',
    category: 'Dokumen Akreditasi',
    fileSize: '610 KB',
    fileType: 'PDF',
    updatedAt: '2026-08-20T09:00:00+07:00',
    sha256: 'd88e12f1...443c (Terverifikasi check_files)',
    summary: 'Salinan resmi Surat Keputusan LAMEMBA untuk keperluan melamar pekerjaan, CPNS, dan beasiswa studi lanjut.',
  },
];

const PARTNERS = [
  'Direktorat Jenderal Pajak (Mitra Tax Center)',
  'Ikatan Konsultan Pajak Indonesia (IKPI)',
  'Asosiasi Pengusaha Ritel Indonesia (APRINDO)',
  'Kamar Dagang dan Industri (KADIN) Banten',
  'PT Sumber Alfaria Trijaya Tbk (Mitra Riset Ritel)',
  'Bank Pembangunan Daerah Banten',
  'Lembaga Sertifikasi Profesi Perpajakan',
  'Asosiasi E-Commerce Indonesia (idEA)',
];

// ============================================================================
// 3B. GPU-ACCELERATED MOTION BACKGROUND LOOP (03-DESIGN-SYSTEM.md §6)
// ============================================================================
const MICRO_PARTICLES = [
  { id: 1, left: '8%', top: '78%', size: 8, duration: '24s', delay: '0s', shape: 'circle', color: 'brand' },
  { id: 2, left: '19%', top: '86%', size: 11, duration: '30s', delay: '-6s', shape: 'diamond', color: 'amber' },
  { id: 3, left: '34%', top: '72%', size: 7, duration: '26s', delay: '-12s', shape: 'circle', color: 'brand' },
  { id: 4, left: '52%', top: '88%', size: 12, duration: '32s', delay: '-4s', shape: 'diamond', color: 'amber' },
  { id: 5, left: '68%', top: '80%', size: 9, duration: '27s', delay: '-15s', shape: 'circle', color: 'brand' },
  { id: 6, left: '82%', top: '84%', size: 10, duration: '29s', delay: '-9s', shape: 'diamond', color: 'amber' },
  { id: 7, left: '91%', top: '74%', size: 7, duration: '23s', delay: '-18s', shape: 'circle', color: 'brand' },
];

const MotionBackgroundLoop = ({ preset = 'aurora', isPaused = false, isDark = false }) => {
  const playState = isPaused || preset === 'static' ? 'paused' : 'running';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Keyframes murni berbasis GPU (transform translate3d, scale, rotate & opacity) */}
      <style>{`
        @keyframes fieOrbitalOne {
          0% { transform: translate3d(0px, 0px, 0) scale(1) rotate(0deg); }
          33% { transform: translate3d(70px, -50px, 0) scale(1.12) rotate(12deg); }
          66% { transform: translate3d(-45px, 40px, 0) scale(0.94) rotate(-8deg); }
          100% { transform: translate3d(0px, 0px, 0) scale(1) rotate(0deg); }
        }
        @keyframes fieOrbitalTwo {
          0% { transform: translate3d(0px, 0px, 0) scale(1) rotate(0deg); }
          33% { transform: translate3d(-80px, 55px, 0) scale(1.15) rotate(-15deg); }
          66% { transform: translate3d(55px, -45px, 0) scale(0.92) rotate(10deg); }
          100% { transform: translate3d(0px, 0px, 0) scale(1) rotate(0deg); }
        }
        @keyframes fieOrbitalThree {
          0% { transform: translate3d(0px, 0px, 0) scale(1); }
          50% { transform: translate3d(60px, 65px, 0) scale(1.18); }
          100% { transform: translate3d(0px, 0px, 0) scale(1); }
        }
        @keyframes fieBeamHorizontal {
          0% { transform: translate3d(-35vw, 0, 0); opacity: 0; }
          15% { opacity: 0.9; }
          85% { opacity: 0.9; }
          100% { transform: translate3d(115vw, 0, 0); opacity: 0; }
        }
        @keyframes fieBeamVertical {
          0% { transform: translate3d(0, 110vh, 0); opacity: 0; }
          15% { opacity: 0.85; }
          85% { opacity: 0.85; }
          100% { transform: translate3d(0, -30vh, 0); opacity: 0; }
        }
        @keyframes fieParticleRise {
          0% { transform: translate3d(0, 0, 0) rotate(0deg) scale(0.85); opacity: 0; }
          20% { opacity: 0.65; }
          80% { opacity: 0.65; }
          100% { transform: translate3d(45px, -78vh, 0) rotate(180deg) scale(1.15); opacity: 0; }
        }
        @keyframes fieWaveFlow {
          0% { transform: translate3d(0%, 0, 0); }
          50% { transform: translate3d(-25%, 6px, 0); }
          100% { transform: translate3d(0%, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .fie-motion-item {
            animation-play-state: paused !important;
          }
        }
      `}</style>

      {/* 1. Lapisan Grid Ekonomi Arsitektural Halus */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: isDark ? 0.14 : 0.45,
          backgroundImage: isDark
            ? 'linear-gradient(to right, rgba(47,91,234,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(47,91,234,0.22) 1px, transparent 1px)'
            : 'linear-gradient(to right, rgba(228,231,236,0.8) 1px, transparent 1px), linear-gradient(to bottom, rgba(228,231,236,0.8) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 85% 75% at 50% 35%, #000 45%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 75% at 50% 35%, #000 45%, transparent 100%)',
        }}
      />

      {/* 2. Floating Ambient Aurora Orbs (Navy #2f5bea, Indigo #2246c4, Amber Ekonomi #fbbf24) */}
      {(preset === 'aurora' || preset === 'static') && (
        <>
          {/* Orb 1: Brand Navy Kiri Atas */}
          <div
            className="fie-motion-item absolute -top-28 -left-24 w-[26rem] h-[26rem] sm:w-[34rem] sm:h-[34rem] rounded-full blur-3xl will-change-transform"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(47,91,234,0.24) 0%, rgba(34,70,196,0.08) 65%, transparent 100%)'
                : 'radial-gradient(circle, rgba(47,91,234,0.13) 0%, rgba(47,91,234,0.04) 65%, transparent 100%)',
              animation: 'fieOrbitalOne 26s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
              animationPlayState: playState,
            }}
          />

          {/* Orb 2: Economic Amber Kanan Atas */}
          <div
            className="fie-motion-item absolute top-[12%] -right-24 w-[24rem] h-[24rem] sm:w-[30rem] sm:h-[30rem] rounded-full blur-3xl will-change-transform"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(251,191,36,0.18) 0%, rgba(217,119,6,0.06) 65%, transparent 100%)'
                : 'radial-gradient(circle, rgba(251,191,36,0.16) 0%, rgba(217,119,6,0.04) 65%, transparent 100%)',
              animation: 'fieOrbitalTwo 32s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
              animationPlayState: playState,
            }}
          />

          {/* Orb 3: Deep Indigo Bawah Tengah */}
          <div
            className="fie-motion-item absolute bottom-[-10%] left-[28%] w-[28rem] h-[28rem] sm:w-[36rem] sm:h-[36rem] rounded-full blur-3xl will-change-transform"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(34,70,196,0.22) 0%, rgba(11,26,74,0.08) 70%, transparent 100%)'
                : 'radial-gradient(circle, rgba(34,70,196,0.10) 0%, rgba(47,91,234,0.03) 70%, transparent 100%)',
              animation: 'fieOrbitalThree 29s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
              animationPlayState: playState,
            }}
          />
        </>
      )}

      {/* 3. Data Pulse Light Beams Sepanjang Garis Grid Ekonomi */}
      {(preset === 'aurora' || preset === 'pulse') && (
        <div className="absolute inset-0 overflow-hidden">
          {/* Horizontal Beam 1 (Navy) */}
          <div
            className="fie-motion-item absolute top-[168px] left-0 w-56 h-[2px] rounded-full will-change-transform"
            style={{
              background: 'linear-gradient(90deg, transparent, #2f5bea, #60a5fa, transparent)',
              boxShadow: '0 0 12px rgba(47,91,234,0.55)',
              animation: 'fieBeamHorizontal 14s linear infinite',
              animationPlayState: playState,
            }}
          />
          {/* Horizontal Beam 2 (Amber) */}
          <div
            className="fie-motion-item absolute top-[392px] left-0 w-64 h-[2px] rounded-full will-change-transform"
            style={{
              background: 'linear-gradient(90deg, transparent, #d97706, #fbbf24, transparent)',
              boxShadow: '0 0 12px rgba(251,191,36,0.55)',
              animation: 'fieBeamHorizontal 19s linear infinite -7s',
              animationPlayState: playState,
            }}
          />
          {/* Vertical Beam 1 (Amber Ascending) */}
          <div
            className="fie-motion-item absolute left-[224px] top-0 w-[2px] h-48 rounded-full will-change-transform hidden sm:block"
            style={{
              background: 'linear-gradient(180deg, transparent, #fbbf24, #2f5bea, transparent)',
              boxShadow: '0 0 10px rgba(251,191,36,0.45)',
              animation: 'fieBeamVertical 16s linear infinite -3s',
              animationPlayState: playState,
            }}
          />
          {/* Vertical Beam 2 (Navy Ascending) */}
          <div
            className="fie-motion-item absolute right-[280px] top-0 w-[2px] h-56 rounded-full will-change-transform hidden lg:block"
            style={{
              background: 'linear-gradient(180deg, transparent, #2f5bea, #60a5fa, transparent)',
              boxShadow: '0 0 10px rgba(47,91,234,0.45)',
              animation: 'fieBeamVertical 21s linear infinite -11s',
              animationPlayState: playState,
            }}
          />
        </div>
      )}

      {/* 4. Gelombang Kurva Tren Ekonomi Halus (SVG Loop) */}
      {(preset === 'aurora' || preset === 'pulse') && (
        <svg
          viewBox="0 0 1440 320"
          fill="none"
          preserveAspectRatio="none"
          className="fie-motion-item absolute bottom-0 left-0 w-[135%] h-44 sm:h-64 opacity-25 dark:opacity-20 will-change-transform"
          style={{
            animation: 'fieWaveFlow 24s ease-in-out infinite',
            animationPlayState: playState,
          }}
        >
          <path
            d="M0,224 C240,140 480,280 720,192 C960,104 1200,240 1440,144 L1440,320 L0,320 Z"
            fill="url(#fieMotionWaveGrad)"
          />
          <path
            d="M0,224 C240,140 480,280 720,192 C960,104 1200,240 1440,144"
            stroke={isDark ? '#60a5fa' : '#2f5bea'}
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
          <defs>
            <linearGradient id="fieMotionWaveGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2f5bea" stopOpacity="0.18" />
              <stop offset="50%" stopColor="#2246c4" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* 5. Micro-Particles Geometris Pertumbuhan Ekonomi */}
      {(preset === 'aurora' || preset === 'pulse') && (
        <div className="absolute inset-0">
          {MICRO_PARTICLES.map((p) => (
            <div
              key={p.id}
              className={`fie-motion-item absolute will-change-transform ${
                p.shape === 'circle' ? 'rounded-full' : 'rotate-45 rounded-[2px]'
              }`}
              style={{
                left: p.left,
                top: p.top,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor:
                  p.color === 'amber'
                    ? isDark
                      ? 'rgba(251, 191, 36, 0.35)'
                      : 'rgba(217, 119, 6, 0.25)'
                    : isDark
                    ? 'rgba(96, 165, 250, 0.32)'
                    : 'rgba(47, 91, 234, 0.22)',
                border:
                  p.color === 'amber'
                    ? '1px solid rgba(251, 191, 36, 0.45)'
                    : '1px solid rgba(47, 91, 234, 0.35)',
                animation: `fieParticleRise ${p.duration} linear infinite ${p.delay}`,
                animationPlayState: playState,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. JSON-DRIVEN ISOMETRIC 3D SCENE (Rekonstruksi Ringan dari Video Referensi)
// ============================================================================
const ISOMETRIC_ANALYTICS_SCENE_JSON = {
  meta: {
    id: 'fie-isometric-economic-analytics-v1',
    format: 'procedural-json-scene',
    loopDurationSeconds: 10.0,
    payloadSize: '2.4 KB',
    camera: {
      type: 'orthographic-isometric',
      frustumSize: 7.4,
      position: [11, 9.8, 11],
      lookAt: [0.1, -0.15, 0],
    },
  },
  podiums: {
    leftLower: { pos: [-1.45, -1.05, 0.55], size: [3.5, 0.9, 3.1], surface: 'speckled-terrazzo' },
    rightUpper: { pos: [1.35, -0.45, -0.65], size: [3.1, 2.1, 2.85], surface: 'speckled-terrazzo' },
    stairs: {
      origin: [1.35, -1.05, 1.35],
      steps: 4,
      stepWidth: 1.55,
      stepHeight: 0.3,
      stepDepth: 0.42,
    },
    frostedBackCube: { pos: [-0.35, 0.25, -1.75], size: [0.95, 0.95, 0.95], color: '#67e8f9', opacity: 0.42 },
  },
  pieChart: {
    center: [-1.25, -0.45, 0.45],
    radius: 1.05,
    height: 0.28,
    slices: [
      { id: 'cyan-sector', startAngle: 0, sweepAngle: 2.35, color: '#00f2fe', emissive: '#0891b2', explodeOffset: [0.06, 0, -0.06] },
      { id: 'indigo-sector', startAngle: 2.35, sweepAngle: 2.15, color: '#3b4cca', emissive: '#312e81', explodeOffset: [0.04, 0, 0.08] },
      { id: 'violet-sector', startAngle: 4.5, sweepAngle: 1.783, color: '#7c3aed', emissive: '#4c1d95', explodeOffset: [-0.08, 0, 0.02] },
    ],
    statusTiles: [
      { pos: [-2.45, -0.57, 1.55], color: '#7c3aed', delay: 0.0 },
      { pos: [-2.05, -0.57, 1.55], color: '#3b82f6', delay: 0.2 },
      { pos: [-1.65, -0.57, 1.55], color: '#06b6d4', delay: 0.4 },
    ],
  },
  verticalGridScreen: {
    pos: [-2.85, 0.55, -0.1],
    cols: 5,
    rows: 3,
    width: 2.35,
    height: 1.45,
    curvePoints: [
      [-1.05, -0.52, 0.04],
      [-0.62, 0.08, 0.04],
      [-0.18, -0.18, 0.04],
      [0.32, 0.35, 0.04],
      [0.68, 0.02, 0.04],
      [1.05, 0.58, 0.04],
    ],
    highlightNodes: [
      { curveIndex: 0.24, color: '#2563eb' },
      { curveIndex: 0.78, color: '#3b82f6' },
    ],
  },
  upperBarAndWave: {
    origin: [1.35, 0.6, -0.65],
    bars: [
      { x: -0.96, targetHeight: 1.85, delay: 0.0, color: '#0ea5e9' },
      { x: -0.48, targetHeight: 1.18, delay: 0.08, color: '#38bdf8' },
      { x: 0.0, targetHeight: 2.25, delay: 0.16, color: '#0284c7' },
      { x: 0.48, targetHeight: 1.42, delay: 0.24, color: '#38bdf8' },
      { x: 0.96, targetHeight: 1.98, delay: 0.32, color: '#0ea5e9' },
    ],
    areaWaveColor: '#00e5c3',
  },
  spheres: {
    badge70: { pos: [0.85, 0.08, 0.72], radius: 0.24, label: '70%', color: '#38bdf8' },
    purpleStep: { pos: [1.18, -0.58, 1.52], radius: 0.15, color: '#7c3aed' },
    cyanStep: { pos: [1.72, -0.58, 1.55], radius: 0.14, color: '#00f2fe' },
    bottomFront: { pos: [0.95, -1.32, 2.32], radius: 0.16, color: '#3b82f6' },
  },
};

// Fungsi pembuat tekstur Terrazzo berbintik secara prosedural (0 byte aset eksternal)
function createSpeckledTerrazzoTexture(isDark) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = isDark ? '#1e293b' : '#f8fafc';
  ctx.fillRect(0, 0, 256, 256);

  const colors = isDark
    ? ['#334155', '#475569', '#38bdf8', '#818cf8']
    : ['#cbd5e1', '#94a3b8', '#64748b', '#0ea5e9'];

  for (let i = 0; i < 320; i++) {
    ctx.fillStyle = colors[i % colors.length];
    const x = (Math.sin(i * 78.233) * 0.5 + 0.5) * 256;
    const y = (Math.cos(i * 45.164) * 0.5 + 0.5) * 256;
    const r = (i % 3 === 0 ? 1.6 : 1.0);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

// Fungsi pembuat tekstur badge kaca "70%"
function createPercentBadgeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
  grad.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
  grad.addColorStop(1, 'rgba(37, 99, 235, 0.85)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = 'bold 42px Inter, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('70%', 64, 66);

  return new THREE.CanvasTexture(canvas);
}

// Helper kurva amplop animasi 10 detik persis siklus video:
// 0..2s: Tampil penuh -> 2..4.2s: Menyusut halus -> 4.2..5.5s: Kosong sejenak -> 5.5..8.0s: Tumbuh kembali -> 8.0..10s: Tampil penuh
function getVideoLoopProgress(elapsedSeconds, loopDuration = 10.0, delay = 0) {
  const t = ((elapsedSeconds - delay) % loopDuration + loopDuration) % loopDuration;
  const smoothstep = (min, max, val) => {
    const x = Math.max(0, Math.min(1, (val - min) / (max - min)));
    return x * x * (3 - 2 * x);
  };

  if (t < 1.8) return 1.0;
  if (t < 4.1) return 1.0 - smoothstep(1.8, 4.1, t);
  if (t < 5.3) return 0.0;
  if (t < 7.8) return smoothstep(5.3, 7.8, t);
  return 1.0;
}

const HeroIsometric3DScene = ({ isDark }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId;
    let isDisposed = false;
    const cfg = ISOMETRIC_ANALYTICS_SCENE_JSON;

    // 1. Inisialisasi Scene & Kamera Ortografik Isometrik
    const scene = new THREE.Scene();
    const width = container.clientWidth || 540;
    const height = container.clientHeight || 440;
    const aspect = width / height;
    const frustum = cfg.meta.camera.frustumSize;

    const camera = new THREE.OrthographicCamera(
      (-frustum * aspect) / 2,
      (frustum * aspect) / 2,
      frustum / 2,
      -frustum / 2,
      0.1,
      100
    );
    camera.position.set(...cfg.meta.camera.position);
    camera.lookAt(...cfg.meta.camera.lookAt);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Pencahayaan Studio Pastel Isometrik (Sesuai Video)
    const ambientLight = new THREE.AmbientLight(isDark ? 0xdbeafe : 0xffffff, isDark ? 1.05 : 1.35);
    scene.add(ambientLight);

    const mainDirLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.4 : 1.75);
    mainDirLight.position.set(8, 14, 10);
    scene.add(mainDirLight);

    const cyanRimLight = new THREE.DirectionalLight(0x00f2fe, 0.95);
    cyanRimLight.position.set(-10, 6, -6);
    scene.add(cyanRimLight);

    const violetFillLight = new THREE.DirectionalLight(0x7c3aed, 0.55);
    violetFillLight.position.set(4, -6, 8);
    scene.add(violetFillLight);

    // Group utama untuk rotasi halus mengikuti kursor
    const worldGroup = new THREE.Group();
    worldGroup.position.set(0, -0.15, 0);
    scene.add(worldGroup);

    const disposables = [];

    // 3. Podium Bertingkat Terrazzo & Tangga Isometrik
    const terrazzoTex = createSpeckledTerrazzoTexture(isDark);
    disposables.push(terrazzoTex);

    const podiumMat = new THREE.MeshStandardMaterial({
      map: terrazzoTex,
      color: isDark ? 0xe2e8f0 : 0xffffff,
      roughness: 0.65,
      metalness: 0.05,
    });
    disposables.push(podiumMat);

    // Podium Kiri Bawah
    const leftPodGeo = new THREE.BoxGeometry(...cfg.podiums.leftLower.size);
    const leftPodMesh = new THREE.Mesh(leftPodGeo, podiumMat);
    leftPodMesh.position.set(...cfg.podiums.leftLower.pos);
    worldGroup.add(leftPodMesh);
    disposables.push(leftPodGeo);

    // Podium Kanan Atas
    const rightPodGeo = new THREE.BoxGeometry(...cfg.podiums.rightUpper.size);
    const rightPodMesh = new THREE.Mesh(rightPodGeo, podiumMat);
    rightPodMesh.position.set(...cfg.podiums.rightUpper.pos);
    worldGroup.add(rightPodMesh);
    disposables.push(rightPodGeo);

    // Tangga 4 Tingkat di Kanan Depan
    const st = cfg.podiums.stairs;
    for (let i = 0; i < st.steps; i++) {
      const h = (st.steps - i) * st.stepHeight;
      const stepGeo = new THREE.BoxGeometry(st.stepWidth, h, st.stepDepth);
      const stepMesh = new THREE.Mesh(stepGeo, podiumMat);
      stepMesh.position.set(
        st.origin[0],
        st.origin[1] - 0.45 + h / 2,
        st.origin[2] - 0.45 + i * st.stepDepth
      );
      worldGroup.add(stepMesh);
      disposables.push(stepGeo);
    }

    // Kubus Frosted Cyan di Belakang Podium
    const backCubeGeo = new THREE.BoxGeometry(...cfg.podiums.frostedBackCube.size);
    const backCubeMat = new THREE.MeshPhysicalMaterial({
      color: cfg.podiums.frostedBackCube.color,
      transparent: true,
      opacity: cfg.podiums.frostedBackCube.opacity,
      roughness: 0.2,
      transmission: 0.35,
    });
    const backCubeMesh = new THREE.Mesh(backCubeGeo, backCubeMat);
    backCubeMesh.position.set(...cfg.podiums.frostedBackCube.pos);
    worldGroup.add(backCubeMesh);
    disposables.push(backCubeGeo, backCubeMat);

    // 4. Tiga Tombol Status Kecil di Tepi Kiri Depan Podium
    const tileGeo = new THREE.BoxGeometry(0.24, 0.08, 0.24);
    disposables.push(tileGeo);
    const statusTileMeshes = cfg.pieChart.statusTiles.map((tile) => {
      const mat = new THREE.MeshStandardMaterial({
        color: tile.color,
        emissive: tile.color,
        emissiveIntensity: 0.35,
        roughness: 0.25,
      });
      disposables.push(mat);
      const mesh = new THREE.Mesh(tileGeo, mat);
      mesh.position.set(...tile.pos);
      worldGroup.add(mesh);
      return { mesh, basePos: [...tile.pos], delay: tile.delay };
    });

    // 5. Diagram Lingkaran 3D (Pie Chart) 3 Sektor yang Mengembang & Menyusut
    const pieGroup = new THREE.Group();
    pieGroup.position.set(...cfg.pieChart.center);
    worldGroup.add(pieGroup);

    const subSegmentsPerSlice = 18;
    const pieSlicesData = cfg.pieChart.slices.map((sliceCfg) => {
      const sliceHolder = new THREE.Group();
      pieGroup.add(sliceHolder);

      const wedgeDelta = sliceCfg.sweepAngle / subSegmentsPerSlice;
      const mat = new THREE.MeshPhysicalMaterial({
        color: sliceCfg.color,
        emissive: sliceCfg.emissive,
        emissiveIntensity: 0.22,
        roughness: 0.18,
        metalness: 0.1,
        transparent: true,
        opacity: 0.92,
      });
      disposables.push(mat);

      const subWedges = [];
      for (let s = 0; s < subSegmentsPerSlice; s++) {
        const wGeo = new THREE.CylinderGeometry(
          cfg.pieChart.radius,
          cfg.pieChart.radius,
          cfg.pieChart.height,
          8,
          1,
          false,
          sliceCfg.startAngle + s * wedgeDelta,
          wedgeDelta + 0.008
        );
        disposables.push(wGeo);
        const wMesh = new THREE.Mesh(wGeo, mat);
        sliceHolder.add(wMesh);
        subWedges.push(wMesh);
      }

      return {
        holder: sliceHolder,
        subWedges,
        explodeOffset: sliceCfg.explodeOffset,
      };
    });

    // 6. Layar Grid Vertikal Transparan + Kurva Garis & 2 Titik Node
    const screenGroup = new THREE.Group();
    screenGroup.position.set(...cfg.verticalGridScreen.pos);
    // Menghadap sejajar sisi podium kiri (sepanjang sumbu Z)
    screenGroup.rotation.y = Math.PI / 2;
    worldGroup.add(screenGroup);

    const scrW = cfg.verticalGridScreen.width;
    const scrH = cfg.verticalGridScreen.height;
    const cols = cfg.verticalGridScreen.cols;
    const rows = cfg.verticalGridScreen.rows;

    // Panel kaca tipis di dalam grid
    const glassPaneGeo = new THREE.PlaneGeometry(scrW, scrH);
    const glassPaneMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: isDark ? 0.07 : 0.18,
      side: THREE.DoubleSide,
    });
    const glassPane = new THREE.Mesh(glassPaneGeo, glassPaneMat);
    screenGroup.add(glassPane);
    disposables.push(glassPaneGeo, glassPaneMat);

    // Garis-garis grid putih
    const gridPoints = [];
    for (let c = 0; c <= cols; c++) {
      const x = -scrW / 2 + (c / cols) * scrW;
      gridPoints.push(new THREE.Vector3(x, -scrH / 2, 0), new THREE.Vector3(x, scrH / 2, 0));
    }
    for (let r = 0; r <= rows; r++) {
      const y = -scrH / 2 + (r / rows) * scrH;
      gridPoints.push(new THREE.Vector3(-scrW / 2, y, 0), new THREE.Vector3(scrW / 2, y, 0));
    }
    const gridGeo = new THREE.BufferGeometry().setFromPoints(gridPoints);
    const gridLineMat = new THREE.LineBasicMaterial({
      color: isDark ? 0x93c5fd : 0xffffff,
      transparent: true,
      opacity: 0.85,
    });
    const gridSegments = new THREE.LineSegments(gridGeo, gridLineMat);
    screenGroup.add(gridSegments);
    disposables.push(gridGeo, gridLineMat);

    // Kurva Spline pada Layar Grid
    const splineVecs = cfg.verticalGridScreen.curvePoints.map((pt) => new THREE.Vector3(...pt));
    const splineCurve = new THREE.CatmullRomCurve3(splineVecs);
    const tubeGeo = new THREE.TubeGeometry(splineCurve, 64, 0.042, 8, false);
    const totalTubeIndices = tubeGeo.index ? tubeGeo.index.count : 0;
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.2,
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    screenGroup.add(tubeMesh);
    disposables.push(tubeGeo, tubeMat);

    // 2 Titik Node Biru pada Kurva
    const nodeSphereGeo = new THREE.SphereGeometry(0.11, 16, 16);
    disposables.push(nodeSphereGeo);
    const curveNodeMeshes = cfg.verticalGridScreen.highlightNodes.map((nCfg) => {
      const nMat = new THREE.MeshStandardMaterial({
        color: nCfg.color,
        emissive: nCfg.color,
        emissiveIntensity: 0.4,
        roughness: 0.15,
      });
      disposables.push(nMat);
      const mesh = new THREE.Mesh(nodeSphereGeo, nMat);
      const pt = splineCurve.getPoint(nCfg.curveIndex);
      mesh.position.copy(pt);
      screenGroup.add(mesh);
      return { mesh, threshold: nCfg.curveIndex };
    });

    // 7. Lima Grafik Batang Kaca Sian & Gelombang Kurva Teal di Podium Kanan Atas
    const chartUpperGroup = new THREE.Group();
    chartUpperGroup.position.set(...cfg.upperBarAndWave.origin);
    worldGroup.add(chartUpperGroup);

    const sharedBarGeo = new THREE.BoxGeometry(0.32, 1.0, 0.32);
    sharedBarGeo.translate(0, 0.5, 0);
    disposables.push(sharedBarGeo);

    const barItems = cfg.upperBarAndWave.bars.map((bCfg) => {
      const bMat = new THREE.MeshPhysicalMaterial({
        color: bCfg.color,
        emissive: 0x0369a1,
        emissiveIntensity: 0.2,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.86,
      });
      disposables.push(bMat);
      const mesh = new THREE.Mesh(sharedBarGeo, bMat);
      mesh.position.set(bCfg.x, 0, -0.18);
      mesh.scale.y = bCfg.targetHeight;
      chartUpperGroup.add(mesh);
      return { mesh, targetHeight: bCfg.targetHeight, delay: bCfg.delay };
    });

    // Gelombang Kurva Area Teal (Double-Peak Wave) di Depan Grafik Batang
    const waveShape = new THREE.Shape();
    waveShape.moveTo(-1.35, 0);
    waveShape.bezierCurveTo(-1.05, 0.05, -0.85, 1.25, -0.52, 1.25);
    waveShape.bezierCurveTo(-0.22, 1.25, -0.12, 0.45, 0.15, 0.45);
    waveShape.bezierCurveTo(0.42, 0.45, 0.52, 0.95, 0.78, 0.95);
    waveShape.bezierCurveTo(1.05, 0.95, 1.18, 0.05, 1.38, 0);
    waveShape.lineTo(-1.35, 0);

    const waveGeo = new THREE.ExtrudeGeometry(waveShape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    });
    const waveMat = new THREE.MeshPhysicalMaterial({
      color: cfg.upperBarAndWave.areaWaveColor,
      emissive: 0x0d9488,
      emissiveIntensity: 0.28,
      roughness: 0.2,
      transparent: true,
      opacity: 0.82,
    });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    waveMesh.position.set(0, 0, 0.18);
    chartUpperGroup.add(waveMesh);
    disposables.push(waveGeo, waveMat);

    // 8. Bola-Bola Kaca Dekoratif & Bola "70%" di Atas Tangga
    const badgeTex = createPercentBadgeTexture();
    disposables.push(badgeTex);

    const badgeGeo = new THREE.SphereGeometry(cfg.spheres.badge70.radius, 24, 24);
    const badgeMat = new THREE.MeshPhysicalMaterial({
      map: badgeTex,
      roughness: 0.15,
      metalness: 0.05,
      transparent: true,
      opacity: 0.95,
    });
    const badgeSphere = new THREE.Mesh(badgeGeo, badgeMat);
    badgeSphere.position.set(...cfg.spheres.badge70.pos);
    badgeSphere.rotation.y = -Math.PI / 4;
    worldGroup.add(badgeSphere);
    disposables.push(badgeGeo, badgeMat);

    const smallSpheres = [cfg.spheres.purpleStep, cfg.spheres.cyanStep, cfg.spheres.bottomFront].map((sCfg, idx) => {
      const sGeo = new THREE.SphereGeometry(sCfg.radius, 20, 20);
      const sMat = new THREE.MeshPhysicalMaterial({
        color: sCfg.color,
        emissive: sCfg.color,
        emissiveIntensity: 0.2,
        roughness: 0.12,
        metalness: 0.1,
        transparent: true,
        opacity: 0.9,
      });
      disposables.push(sGeo, sMat);
      const mesh = new THREE.Mesh(sGeo, sMat);
      mesh.position.set(...sCfg.pos);
      worldGroup.add(mesh);
      return { mesh, basePos: [...sCfg.pos], phase: idx * 1.3 };
    });

    // 9. Interaksi Parallax Kursor Halus (Lerp)
    const mouseTarget = { x: 0, y: 0 };
    const mouseCurrent = { x: 0, y: 0 };

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseTarget.x = Math.max(-1, Math.min(1, nx));
      mouseTarget.y = Math.max(-1, Math.min(1, ny));
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const handleResize = () => {
      if (!container || isDisposed) return;
      const newW = container.clientWidth || 540;
      const newH = container.clientHeight || 440;
      const newAspect = newW / newH;
      camera.left = (-frustum * newAspect) / 2;
      camera.right = (frustum * newAspect) / 2;
      camera.top = frustum / 2;
      camera.bottom = -frustum / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // 10. Loop Animasi Berkelanjutan Berdasarkan Definisi JSON (10 Detik Loop)
    const clock = new THREE.Clock();

    const animate = () => {
      if (isDisposed) return;
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      const loopDur = cfg.meta.loopDurationSeconds;

      // Lerp posisi kursor untuk kemiringan isometrik interaktif
      mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * 0.05;
      mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * 0.05;
      worldGroup.rotation.y = mouseCurrent.x * 0.18;
      worldGroup.rotation.x = -mouseCurrent.y * 0.1;

      // A. Animasi Diagram Lingkaran (Pie Chart Radial Sweep & Explode)
      const pieProg = getVideoLoopProgress(elapsed, loopDur, 0.0);
      pieSlicesData.forEach((slice, sIdx) => {
        const sliceProg = getVideoLoopProgress(elapsed, loopDur, sIdx * 0.18);
        const visibleCount = Math.floor(sliceProg * slice.subWedges.length);

        slice.subWedges.forEach((wMesh, wIdx) => {
          wMesh.visible = wIdx < visibleCount;
          if (wMesh.visible) {
            const scalePop = Math.min(1, (sliceProg * slice.subWedges.length - wIdx) * 1.5);
            wMesh.scale.set(1, Math.max(0.1, scalePop), 1);
          }
        });

        // Sedikit memisah (explode) saat transisi seperti di video
        const explodeFactor = Math.sin(pieProg * Math.PI) * 0.85;
        slice.holder.position.set(
          slice.explodeOffset[0] * explodeFactor,
          0,
          slice.explodeOffset[2] * explodeFactor
        );
      });

      // B. Animasi 3 Tombol Status di Tepi Kiri Depan
      statusTileMeshes.forEach((tObj, idx) => {
        const pulse = Math.sin(elapsed * 2.5 - idx * 0.7) * 0.025;
        tObj.mesh.position.y = tObj.basePos[1] + Math.max(0, pulse);
      });

      // C. Animasi Garis Kurva & 2 Titik Biru pada Layar Grid
      const curveProg = getVideoLoopProgress(elapsed, loopDur, 0.15);
      if (totalTubeIndices > 0) {
        const drawCount = Math.floor(curveProg * (totalTubeIndices / 3)) * 3;
        tubeGeo.setDrawRange(0, drawCount);
      }
      curveNodeMeshes.forEach((nObj) => {
        const nodeScale = curveProg >= nObj.threshold
          ? Math.min(1, (curveProg - nObj.threshold) * 5.5)
          : 0.001;
        nObj.mesh.scale.setScalar(nodeScale);
        nObj.mesh.visible = nodeScale > 0.02;
      });

      // D. Animasi 5 Grafik Batang Kaca & Gelombang Teal
      barItems.forEach((bObj) => {
        const barProg = getVideoLoopProgress(elapsed, loopDur, bObj.delay);
        const idleRipple = Math.sin(elapsed * 2.2 + bObj.delay * 8) * 0.06 * barProg;
        const h = Math.max(0.04, bObj.targetHeight * barProg + idleRipple);
        bObj.mesh.scale.y = h;
      });

      const waveProg = getVideoLoopProgress(elapsed, loopDur, 0.1);
      waveMesh.scale.y = Math.max(0.12, 0.25 + 0.75 * waveProg + Math.sin(elapsed * 1.8) * 0.04);

      // E. Animasi Bola "70%" & Bola-Bola Kecil di Anak Tangga
      badgeSphere.position.y = cfg.spheres.badge70.pos[1] + Math.sin(elapsed * 2.4) * 0.06;
      badgeSphere.rotation.z = Math.sin(elapsed * 1.5) * 0.12;

      smallSpheres.forEach((sObj) => {
        sObj.mesh.position.z = sObj.basePos[2] + Math.sin(elapsed * 1.8 + sObj.phase) * 0.05;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      disposables.forEach((d) => d.dispose && d.dispose());
      renderer.dispose();
    };
  }, [isDark]);

  return (
    <div className="relative w-full h-[380px] sm:h-[450px] rounded-3xl overflow-hidden border border-cyan-200/70 dark:border-slate-800 bg-gradient-to-br from-[#d9f7fa] via-[#e5f9fc] to-[#ccf2f7] dark:from-[#0b1a3a] dark:via-[#0f2447] dark:to-[#09152b] shadow-xl">
      {/* Glow lembut menyatu dengan podium 3D */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-cyan-300/35 dark:bg-cyan-500/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-indigo-400/20 dark:bg-indigo-500/15 blur-3xl"
      />

      {/* Canvas 3D Isometrik Murni Tanpa Badge atau Tombol Poster */}
      <div
        ref={mountRef}
        aria-hidden="true"
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'pan-y' }}
      />
    </div>
  );
};

// ============================================================================
// 4B. KOMPONEN GOOGLE MAPS LIVE DENGAN PERSPEKTIF 3D (Untuk Footer)
// ============================================================================
const Footer3DMapCard = () => {
  const [tilt, setTilt] = useState({ rx: 8, ry: -8, gx: 50, gy: 50 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: -ny * 10,
      ry: nx * 12,
      gx: ((e.clientX - rect.left) / rect.width) * 100,
      gy: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 4, ry: -4, gx: 50, gy: 50 });
  };

  return (
    <div className="rounded-2xl bg-[#071235]/90 border border-blue-400/20 p-4 sm:p-5 space-y-3.5 shadow-2xl backdrop-blur-md">
      {/* Header Alamat Bersih */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white leading-tight">
              Jl. Jombang Raya No.41, Ciputat, Tangerang Selatan
            </h3>
            <span className="text-[11px] text-blue-200/75">Banten 15414, Indonesia</span>
          </div>
        </div>
      </div>

      {/* Viewport Google Maps Live dengan Efek Perspektif 3D Halus */}
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ perspective: '1000px' }}
        className="relative h-52 sm:h-56 w-full rounded-xl overflow-hidden bg-gradient-to-br from-[#060f2e] via-[#0c1e52] to-[#08153b] border border-cyan-400/25 p-1.5 shadow-inner"
      >
        {/* Cahaya sorot kursor */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
          style={{
            background: `radial-gradient(240px circle at ${tilt.gx}% ${tilt.gy}%, rgba(56,189,248,0.16), transparent 75%)`,
          }}
        />

        <div
          style={{
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(1.01)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="w-full h-full relative rounded-lg overflow-hidden shadow-[0_14px_30px_rgba(0,0,0,0.55)] border border-white/15"
        >
          <iframe
            title="Peta Lokasi Kampus FIE Universitas Ichsan Satya - Jl. Jombang Raya No.41"
            src={SITE_SETTING.googleMapsEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full border-0 contrast-105"
          />
        </div>
      </div>

      {/* Detail Alamat Lengkap & Tombol Buka Google Maps */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <p className="text-xs text-blue-100/90 leading-relaxed">
          <strong className="text-white block">Kampus Universitas Ichsan Satya (FIE):</strong>
          {SITE_SETTING.address}
        </p>
        <ExternalLink
          href={SITE_SETTING.googleMapsUrl}
          className="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shrink-0 shadow-md transition justify-center"
        >
          Buka di Google Maps
        </ExternalLink>
      </div>
    </div>
  );
};

// ============================================================================
// 5. MAIN APPLICATION COMPONENT
// ============================================================================
export default function App() {
  // --- A. Tri-State Theme Logic (03-DESIGN-SYSTEM.md §7, Perbaikan F-20) ---
  const [themePref, setThemePref] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light';
    } catch {
      return 'light';
    }
  });
  const [resolvedTheme, setResolvedTheme] = useState('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const computeTheme = (pref) => {
      if (pref === 'system') {
        return mediaQuery.matches ? 'dark' : 'light';
      }
      return pref;
    };

    const applyTheme = (pref) => {
      const nextTheme = computeTheme(pref);
      setResolvedTheme(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme(themePref);
    try {
      localStorage.setItem('theme', themePref);
    } catch {
      // Abaikan bila storage diblokir
    }

    // Dengarkan perubahan OS HANYA saat pref === 'system' (F-20)
    const handleSystemChange = () => {
      if (themePref === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [themePref]);

  // --- B. Navigation & Routing State (Dari ROUTES.TS) ---
  const [currentRoute, setCurrentRoute] = useState(ROUTES.HOME);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMegaMenu, setOpenMegaMenu] = useState(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const mainHeadingRef = useRef(null);

  // Navigasi terpusat dengan pemindahan fokus & pengumuman screen reader (05-FRONTEND-RULES.md §7)
  const navigateTo = useCallback((path) => {
    setCurrentRoute(path);
    setMobileMenuOpen(false);
    setOpenMegaMenu(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLiveAnnouncement(`Halaman berpindah ke ${path}`);
  }, []);

  // Scroll Lock saat Mobile Drawer terbuka (Perbaikan F-22)
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);
  // --- C. Kontrol Motion Background Loop & Hero Carousel ---
  const [motionBgPreset, setMotionBgPreset] = useState('aurora'); // 'aurora' | 'pulse' | 'static'
  const [activeSlide, setActiveSlide] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  // Hormati prefers-reduced-motion secara otomatis untuk background loop (03-DESIGN-SYSTEM.md §6)
  useEffect(() => {
    try {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (reduced.matches) {
        setMotionBgPreset('static');
      }
    } catch {
      // Abaikan bila tidak didukung
    }
  }, []);

  useEffect(() => {
    if (isCarouselPaused || currentRoute !== ROUTES.HOME) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isCarouselPaused, currentRoute]);

  // --- D. State Filter Berita, Agenda, Prodi, dan Modal ---
  const [newsSearch, setNewsSearch] = useState('');
  const [newsCategory, setNewsCategory] = useState('Semua');
  const [selectedNewsPost, setSelectedNewsPost] = useState(null);
  const [simulateEmptyAgenda, setSimulateEmptyAgenda] = useState(false);
  const [activeSemesterTab, setActiveSemesterTab] = useState({});
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [downloadedFileToast, setDownloadedFileToast] = useState(null);

  // --- E. State Formulir Kontak & Peta Facade (05-FRONTEND-RULES.md §5 & 07-SECURITY.md §A3) ---
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    category: 'Informasi PMB & Beasiswa',
    message: '',
    honeypotWebsite: '', // Honeypot anti-bot
    turnstileVerified: false,
  });
  const [contactErrors, setContactErrors] = useState({});
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [mapFacadeLoaded, setMapFacadeLoaded] = useState(false);

  // Deduplikasi & filter berita berdasarkan slug unik (05-FRONTEND-RULES.md §3, F-09)
  const filteredNews = useMemo(() => {
    const uniqueMap = new Map();
    NEWS_POSTS.forEach((post) => {
      if (!uniqueMap.has(post.slug)) {
        uniqueMap.set(post.slug, post);
      }
    });
    const deduplicated = Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    );

    return deduplicated.filter((post) => {
      const matchesCat = newsCategory === 'Semua' || post.category === newsCategory;
      const q = newsSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [newsCategory, newsSearch]);

  // Validasi Formulir Kontak menyerupai skema Zod + Turnstile
  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (contactForm.honeypotWebsite) {
      // Bot terdeteksi mengisi honeypot
      return;
    }
    const errs = {};
    if (contactForm.name.trim().length < 3) {
      errs.name = 'Nama lengkap wajib diisi (minimal 3 karakter).';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactForm.email.trim())) {
      errs.email = 'Masukkan alamat email aktif yang valid.';
    }
    if (contactForm.message.trim().length < 15) {
      errs.message = 'Pesan terlalu singkat (minimal 15 karakter agar tim kami dapat membantu dengan tepat).';
    }
    if (!contactForm.turnstileVerified) {
      errs.turnstile = 'Harap centang verifikasi keamanan Cloudflare Turnstile.';
    }

    setContactErrors(errs);
    if (Object.keys(errs).length === 0) {
      setContactSubmitted(true);
    }
  };

  // Helper SEO Metadata Dinamis per Rute (05-FRONTEND-RULES.md §6, F-06)
  const seoMeta = useMemo(() => {
    if (currentRoute === ROUTES.HOME) {
      return {
        title: 'Beranda — FIE Universitas Ichsan Satya',
        desc: 'Website Resmi Fakultas Ilmu Ekonomi Universitas Ichsan Satya. Program Studi S1 Perpajakan dan S1 Manajemen Retail Terakreditasi Baik Sekali.',
        canonical: `https://fie.universitasichsansatya.ac.id${ROUTES.HOME}`,
        status: 200,
        robots: 'index, follow',
      };
    }
    if (currentRoute.startsWith('/prodi/')) {
      const slug = currentRoute.replace('/prodi/', '');
      const prodi = STUDY_PROGRAMS.find((p) => p.slug === slug);
      if (prodi) {
        return {
          title: `${prodi.name} (${prodi.accreditationGrade}) — FIE Universitas Ichsan Satya`,
          desc: prodi.summary,
          canonical: `https://fie.universitasichsansatya.ac.id${currentRoute}`,
          status: 200,
          robots: 'index, follow',
        };
      }
    }
    if (currentRoute === ROUTES.NOT_FOUND) {
      return {
        title: '404 Halaman Tidak Ditemukan — FIE Universitas Ichsan Satya',
        desc: 'Halaman yang Anda tuju tidak ditemukan di situs resmi Fakultas Ilmu Ekonomi Universitas Ichsan Satya.',
        canonical: `https://fie.universitasichsansatya.ac.id${ROUTES.NOT_FOUND}`,
        status: 404,
        robots: 'noindex, nofollow',
      };
    }
    return {
      title: `Informasi Akademik (${currentRoute}) — FIE Universitas Ichsan Satya`,
      desc: SITE_SETTING.tagline,
      canonical: `https://fie.universitasichsansatya.ac.id${currentRoute}`,
      status: 200,
      robots: 'index, follow',
    };
  }, [currentRoute]);

  useEffect(() => {
    document.title = seoMeta.title;
  }, [seoMeta]);

  // ============================================================================
  // 6. SUB-VIEWS PER ROUTE
  // ============================================================================

  // --- VIEW: DETAIL PROGRAM STUDI (/prodi/:slug) ---
  const renderProdiDetail = (slug) => {
    const prodi = STUDY_PROGRAMS.find((p) => p.slug === slug) || STUDY_PROGRAMS[0];
    const semesters = Object.keys(prodi.curriculum);
    const currentSem = activeSemesterTab[prodi.slug] || semesters[0];

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <button onClick={() => navigateTo(ROUTES.HOME)} className="hover:text-[#2f5bea] underline-offset-4 hover:underline">
            Beranda
          </button>
          <ChevronRight className="w-4 h-4" />
          <button onClick={() => navigateTo(ROUTES.PRODI_LIST)} className="hover:text-[#2f5bea] underline-offset-4 hover:underline">
            Program Studi
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="font-semibold text-slate-900 dark:text-white">{prodi.name}</span>
        </nav>

        {/* Header Prodi dengan Teks Akreditasi Asli (Perbaikan F-03, F-27) */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0b1a4a] via-[#13296b] to-[#2246c4] text-white p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-slate-950">
                {prodi.degree}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-amber-200 border border-white/20">
                <Award className="w-4 h-4 text-amber-400" />
                {prodi.accreditationText}
              </span>
            </div>

            {/* Tepat 1 H1 per halaman */}
            <h1
              ref={mainHeadingRef}
              className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight"
            >
              Program Studi {prodi.name}
            </h1>

            <p className="text-blue-100 text-base sm:text-lg leading-relaxed">
              {prodi.summary}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/15 text-sm">
              <div>
                <span className="text-blue-200/80 block text-xs">Gelar Lulusan</span>
                <strong className="font-semibold text-white">{prodi.degreeTitle}</strong>
              </div>
              <div>
                <span className="text-blue-200/80 block text-xs">Masa Studi & Beban</span>
                <strong className="font-semibold text-white">{prodi.duration}</strong>
              </div>
              <div>
                <span className="text-blue-200/80 block text-xs">Ketua Program Studi</span>
                <strong className="font-semibold text-amber-300">{prodi.kaprodi}</strong>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <ExternalLink
                href={SITE_SETTING.pmbUrl}
                className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-md transition"
              >
                Daftar {prodi.name} Sekarang
              </ExternalLink>
              <button
                onClick={() => navigateTo(ROUTES.UNDUHAN)}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition cursor-pointer"
              >
                Unduh Brosur & SK Akreditasi
              </button>
            </div>
          </div>
        </div>

        {/* Switcher Antar Prodi */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Pilih Program Studi FIE:
          </span>
          <div className="flex flex-wrap gap-2">
            {STUDY_PROGRAMS.map((item) => (
              <button
                key={item.slug}
                onClick={() => navigateTo(ROUTES.PRODI_DETAIL(item.slug))}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  item.slug === prodi.slug
                    ? 'bg-[#2f5bea] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {/* Visi & Misi + Prospek Karier */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-xs">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2f5bea]" /> Visi & Misi Keilmuan
            </h2>
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2246c4] dark:text-blue-300">Visi Program Studi</span>
              <p className="mt-1 text-sm sm:text-base text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                "{prodi.vision}"
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Misi Penyelenggaraan
              </h3>
              <ul className="space-y-2.5">
                {prodi.missions.map((m, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-1" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-xs">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#d97706]" /> Profil & Prospek Karier Lulusan
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Dirancang bersama dewan penasihat industri agar lulusan langsung siap berkontribusi:
            </p>
            <div className="space-y-3">
              {prodi.prospects.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#2f5bea] transition flex items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{item.role}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{item.sector}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                     Serapan: {item.demand}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kurikulum Interaktif Per Tahun */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Struktur Kurikulum Unggulan (OBE)
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Pilih tahapan tahun akademik untuk melihat mata kuliah inti dan praktikum laboratorium.
              </p>
            </div>
            <div role="tablist" aria-label="Tahapan Kurikulum" className="flex flex-wrap gap-2">
              {semesters.map((sem) => (
                <button
                  key={sem}
                  role="tab"
                  aria-selected={currentSem === sem}
                  onClick={() => setActiveSemesterTab((prev) => ({ ...prev, [prodi.slug]: sem }))}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    currentSem === sem
                      ? 'bg-[#0b1a4a] dark:bg-[#2f5bea] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {sem}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prodi.curriculum[currentSem].map((course) => (
              <div
                key={course.code}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-4"
              >
                <div>
                  <span className="text-xs font-mono font-bold text-[#2246c4] dark:text-blue-400">
                    {course.code}
                  </span>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base mt-0.5">
                    {course.name}
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shrink-0">
                  {course.sks} SKS
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- VIEW: HALAMAN 404 ASLI (01-PRD.md F-01, F-36) ---
  const renderNotFoundPage = () => (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center space-y-6">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 text-xs font-bold border border-rose-300 dark:border-rose-800">
        <AlertTriangle className="w-4 h-4" /> HTTP Status 404 • meta robots="noindex, nofollow"
      </div>

      <h1
        ref={mainHeadingRef}
        className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight"
      >
        404 — Halaman Tidak Ditemukan
      </h1>

      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
        Maaf, alamat URL yang Anda akses tidak tersedia di situs resmi{' '}
        <strong>{SITE_SETTING.facultyName} {SITE_SETTING.universityName}</strong>. Berbeda dengan situs lama yang mengalami <em>soft-404</em> (HTTP 200), halaman ini mengembalikan status <strong>404 sungguhan</strong> dan tidak diindeks mesin pencari.
      </p>

      <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-lg mx-auto text-left text-xs sm:text-sm space-y-2">
        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Bukti Anti-Regresi Temuan Analisis F-01 & F-36:
        </div>
        <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1">
          <li>Path diminta: <code className="font-mono text-rose-600 dark:text-rose-400">{currentRoute}</code></li>
          <li>Meta tag disuntikkan: <code className="font-mono">&lt;meta name="robots" content="noindex"&gt;</code></li>
          <li>Tautan navigasi di bawah berasal dari satu sumber <code className="font-mono">routes.ts</code>.</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={() => navigateTo(ROUTES.HOME)}
          className="px-5 py-3 rounded-xl bg-[#2f5bea] hover:bg-[#2246c4] text-white font-semibold text-sm shadow-sm transition cursor-pointer"
        >
          Kembali ke Beranda FIE
        </button>
        <button
          onClick={() => navigateTo(ROUTES.PRODI_LIST)}
          className="px-5 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 transition cursor-pointer"
        >
          Lihat Program Studi
        </button>
      </div>
    </div>
  );

  // --- VIEW: PUSAT UNDUHAN (/unduhan) ---
  const renderDownloadsPage = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div className="max-w-3xl space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-[#2246c4] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi Otomatis via Command `check_files` (Perbaikan F-12)
        </span>
        <h1 ref={mainHeadingRef} className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Pusat Unduhan Dokumen Akademik
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-base">
          Seluruh berkas pedoman akademik, kalender perkuliahan, dan SK akreditasi disimpan lokal dengan header keamanan <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">X-Content-Type-Options: nosniff</code> serta diverifikasi keberadaannya.
        </p>
      </div>

      {downloadedFileToast && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Mengunduh berkas terverifikasi: <strong>{downloadedFileToast.title}</strong> ({downloadedFileToast.fileSize})
            </span>
          </div>
          <button
            onClick={() => setDownloadedFileToast(null)}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DOWNLOAD_ITEMS.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between gap-5 shadow-xs hover:border-[#2f5bea] transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {item.category}
                </span>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300">
                  {item.fileType} • {item.fileSize}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {item.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {item.summary}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                <div>Diperbarui: {formatDate(item.updatedAt)}</div>
                <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                  SHA256: {item.sha256}
                </div>
              </div>
              <button
                onClick={() => setDownloadedFileToast(item)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2f5bea] hover:bg-[#2246c4] text-white text-xs sm:text-sm font-semibold transition cursor-pointer min-h-[44px]"
              >
                <Download className="w-4 h-4" /> Unduh Dokumen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // --- VIEW: KONTAK & FORMULIR AMAN (/kontak) ---
  const renderContactPage = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      <div className="max-w-3xl space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-[#2246c4] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <ShieldCheck className="w-3.5 h-3.5" /> Dilindungi Honeypot + Cloudflare Turnstile + Rate Limit 5/jam
        </span>
        <h1 ref={mainHeadingRef} className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Hubungi Layanan Akademik & PMB FIE
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-base">
          Tim sekretariat Fakultas Ilmu Ekonomi siap membantu calon mahasiswa, orang tua, mahasiswa aktif, serta mitra kerja sama industri pada jam kerja (Senin–Jumat, 08.00–16.30 WIB).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Kontak */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Kirim Pesan Resmi (`POST /api/v1/contact/`)
          </h2>

          {contactSubmitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 space-y-4">
              <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-300 font-bold text-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                Pesan Anda Berhasil Diterima!
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Terima kasih, <strong>{contactForm.name}</strong>. Pesan Anda terkait{' '}
                <strong>{contactForm.category}</strong> telah disimpan secara aman dengan hash IP terenkripsi (HMAC) dan diteruskan ke staf Fakultas Ilmu Ekonomi.
              </p>
              <button
                onClick={() => {
                  setContactSubmitted(false);
                  setContactForm({
                    name: '',
                    email: '',
                    category: 'Informasi PMB & Beasiswa',
                    message: '',
                    honeypotWebsite: '',
                    turnstileVerified: false,
                  });
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
              >
                Kirim Pesan Lainnya
              </button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} noValidate className="space-y-5">
              {/* Honeypot tersembunyi untuk menjebak spam bot (07-SECURITY.md §A3) */}
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="hp-website">Jangan isi kolom ini jika Anda manusia</label>
                <input
                  id="hp-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={contactForm.honeypotWebsite}
                  onChange={(e) => setContactForm({ ...contactForm, honeypotWebsite: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Nama Lengkap <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    aria-describedby={contactErrors.name ? 'err-name' : undefined}
                    placeholder="Contoh: Budi Raharjo"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-2 focus:outline-[#2f5bea]"
                  />
                  {contactErrors.name && (
                    <p id="err-name" className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                      {contactErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Alamat Email Aktif <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    aria-describedby={contactErrors.email ? 'err-email' : undefined}
                    placeholder="nama@email.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-2 focus:outline-[#2f5bea]"
                  />
                  {contactErrors.email && (
                    <p id="err-email" className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                      {contactErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="contact-category" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Keperluan / Topik
                </label>
                <select
                  id="contact-category"
                  value={contactForm.category}
                  onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-2 focus:outline-[#2f5bea]"
                >
                  <option>Informasi PMB & Beasiswa</option>
                  <option>Konsultasi Program Studi S1 Perpajakan</option>
                  <option>Konsultasi Program Studi S1 Manajemen Retail</option>
                  <option>Layanan Administrasi Mahasiswa Aktif</option>
                  <option>Kemitraan Industri, Magang & Riset</option>
                </select>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Isi Pesan / Pertanyaan <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  aria-describedby={contactErrors.message ? 'err-message' : undefined}
                  placeholder="Tuliskan pertanyaan Anda secara jelas..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-2 focus:outline-[#2f5bea]"
                />
                {contactErrors.message && (
                  <p id="err-message" className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                    {contactErrors.message}
                  </p>
                )}
              </div>

              {/* Simulasi Cloudflare Turnstile Widget */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={contactForm.turnstileVerified}
                    onChange={(e) => setContactForm({ ...contactForm, turnstileVerified: e.target.checked })}
                    className="w-5 h-5 rounded accent-[#2f5bea]"
                  />
                  <span>Verifikasi Keamanan (Cloudflare Turnstile Non-Intrusif)</span>
                </label>
                <span className="text-[11px] font-mono text-slate-500">Privasi Terlindungi</span>
              </div>
              {contactErrors.turnstile && (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{contactErrors.turnstile}</p>
              )}

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#2f5bea] hover:bg-[#2246c4] text-white font-bold text-sm shadow-sm transition cursor-pointer min-h-[44px]"
              >
                Kirim Pesan Sekarang
              </button>
            </form>
          )}
        </div>

        {/* Info Kontak Resmi & Facade Peta Kampus (05-FRONTEND-RULES.md §5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Identitas Resmi (`SiteSetting` Singleton)
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#2f5bea] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 dark:text-white">Alamat Kampus FIE</strong>
                  <span className="text-slate-600 dark:text-slate-400">{SITE_SETTING.address}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#2f5bea] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 dark:text-white">Email Resmi Institusi (Bukan Gmail)</strong>
                  <a href={`mailto:${SITE_SETTING.email}`} className="text-[#2f5bea] dark:text-blue-400 font-medium hover:underline">
                    {SITE_SETTING.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#2f5bea] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 dark:text-white">Telepon Layanan Akademik</strong>
                  <span className="text-slate-600 dark:text-slate-400">{SITE_SETTING.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Facade Peta Interaktif: Tidak memuat skrip pihak ketiga sebelum diklik */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
            {!mapFacadeLoaded ? (
              <div className="p-6 text-center space-y-4 bg-gradient-to-br from-slate-100 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-[#2f5bea]/10 text-[#2f5bea] flex items-center justify-center mx-auto">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Peta Lokasi Kampus FIE (Mode Facade Hemat Data)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
                    {SITE_SETTING.address}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => setMapFacadeLoaded(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#0b1a4a] dark:bg-[#2f5bea] text-white text-xs font-semibold cursor-pointer min-h-[44px]"
                  >
                    Muat Peta Google Maps Interaktif
                  </button>
                  <ExternalLink
                    href={SITE_SETTING.googleMapsUrl}
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold min-h-[44px]"
                  >
                    Buka Rute Google Maps
                  </ExternalLink>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Jl. Jombang Raya No.41, Ciputat, Tangerang Selatan</span>
                  <button
                    onClick={() => setMapFacadeLoaded(false)}
                    className="text-rose-600 hover:underline cursor-pointer"
                  >
                    Tutup Peta
                  </button>
                </div>
                <div className="w-full h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <iframe
                    title="Peta Lokasi Kampus Fakultas Ilmu Ekonomi Universitas Ichsan Satya - Jl. Jombang Raya No.41"
                    src={SITE_SETTING.googleMapsEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // --- VIEW: HALAMAN PROFIL / BERITA / RISET UMUM ---
  const renderGenericInfoPage = () => {
    if (currentRoute.startsWith('/profil/')) {
      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-[#2246c4] dark:text-blue-300">
            Profil Institusi FIE
          </span>
          <h1 ref={mainHeadingRef} className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Sejarah, Visi, Misi, dan Tata Kelola Fakultas Ilmu Ekonomi
          </h1>
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed max-w-[68ch]">
            <p>
              <strong>{SITE_SETTING.facultyName} ({SITE_SETTING.shortName})</strong> bagian dari{' '}
              <strong>{SITE_SETTING.universityName}</strong> didirikan untuk menjawab kebutuhan tenaga ahli ekonomi terapan yang memahami transformasi perpajakan digital serta dinamika industri ritel modern di Indonesia.
            </p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Visi Fakultas 2030</h2>
            <p>
              "Menjadi Fakultas Ilmu Ekonomi yang unggul, berintegritas, dan berdaya saing nasional dalam pengembangan ilmu perpajakan serta manajemen ritel berbasis teknologi digital dan kemitraan industri."
            </p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Struktur Organisasi Inti</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Dekan FIE:</strong> Prof. Dr. Irwan Setiawan, S.E., M.Si., Ak.</li>
              <li><strong>Wakil Dekan Bidang Akademik & Riset:</strong> Dr. Rina Kartika, S.E., M.Si.</li>
              <li><strong>Kaprodi S1 Perpajakan:</strong> Dr. Hendra Wijaya, S.E., M.Ak., BKP.</li>
              <li><strong>Kaprodi S1 Manajemen Retail:</strong> Dr. Nadia Kusumawardhani, S.E., M.M.</li>
              <li><strong>Kepala Laboratorium Tax Center & Smart Retail:</strong> Budi Santoso, S.M., M.B.A.</li>
            </ul>
          </div>
        </div>
      );
    }

    if (currentRoute === ROUTES.RISET_PUBLIKASI) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
          <div className="max-w-3xl space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300">
              Tridharma Perguruan Tinggi
            </span>
            <h1 ref={mainHeadingRef} className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Publikasi Ilmiah, Penelitian, dan Pengabdian Masyarakat
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Karya ilmiah dosen dan mahasiswa Fakultas Ilmu Ekonomi Universitas Ichsan Satya pada bidang kebijakan fiskal, perpajakan korporasi, dan inovasi ritel.
            </p>
          </div>
          <div className="space-y-4">
            {RESEARCH_ITEMS.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-[#2246c4] dark:text-blue-300">
                      {item.type}
                    </span>
                    <span className="text-xs font-mono text-slate-500">Tahun {item.year}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <strong>Peneliti:</strong> {item.authors} • <em>{item.journal}</em>
                  </p>
                </div>
                <ExternalLink
                  href={item.doi}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#2f5bea] hover:text-white text-slate-800 dark:text-slate-200 text-xs font-semibold shrink-0 transition"
                >
                  Akses Tautan Publikasi
                </ExternalLink>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  // ============================================================================
  // 7. RENDER UTAMA
  // ============================================================================
  return (
    <div className="relative min-h-screen flex flex-col bg-[#ffffff] dark:bg-[#080d1a] text-[#0b1220] dark:text-slate-100 font-sans selection:bg-[#2f5bea] selection:text-white transition-colors duration-200">
      {/* LAYER 0: CONTINUOUS MOTION BACKGROUND LOOP (GPU-Accelerated) */}
      <MotionBackgroundLoop
        preset={motionBgPreset}
        isPaused={false}
        isDark={resolvedTheme === 'dark'}
      />

      {/* Live Region A11y untuk mengumumkan perpindahan halaman */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* 1. SKIP LINK WAJIB (05-FRONTEND-RULES.md §7) */}
      <a
        href="#konten-utama"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-5 focus:py-3 focus:rounded-xl focus:bg-[#0b1a4a] focus:text-amber-300 focus:font-bold focus:shadow-2xl focus:outline-2 focus:outline-amber-400"
      >
        Lewati ke konten utama
      </a>

      {/* 2. HEADER STICKY TRANSPARAN-BLUR + MEGA MENU (03-DESIGN-SYSTEM.md §1) */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#080d1a]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <button
            onClick={() => navigateTo(ROUTES.HOME)}
            className="flex items-center gap-3 text-left group focus-visible:outline-2 focus-visible:outline-[#2f5bea] rounded-xl p-1 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0b1a4a] to-[#2f5bea] flex items-center justify-center text-white font-extrabold text-lg shadow-sm group-hover:scale-105 transition">
              FIE
            </div>
            <div>
              <span className="block font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                Fakultas Ilmu Ekonomi
              </span>
              <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
                Universitas Ichsan Satya
              </span>
            </div>
          </button>

          {/* Desktop Navigation + Mega Menu */}
          <nav aria-label="Navigasi Utama" className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => navigateTo(ROUTES.HOME)}
              className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer min-h-[44px] ${
                currentRoute === ROUTES.HOME
                  ? 'text-[#2f5bea] dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/50'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              Beranda
            </button>

            {/* Mega Menu Trigger: Profil */}
            <div className="relative">
              <button
                onClick={() => setOpenMegaMenu(openMegaMenu === 'profil' ? null : 'profil')}
                aria-expanded={openMegaMenu === 'profil'}
                className="inline-flex items-center gap-1 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer min-h-[44px]"
              >
                <span>Profil</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openMegaMenu === 'profil' ? 'rotate-180' : ''}`} />
              </button>
              {openMegaMenu === 'profil' && (
                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3 space-y-1 z-50">
                  <button
                    onClick={() => navigateTo(ROUTES.PROFIL_SEJARAH)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-start gap-3 cursor-pointer"
                  >
                    <Building2 className="w-5 h-5 text-[#2f5bea] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Sejarah & Identitas</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Perjalanan akademik FIE UIS</div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigateTo(ROUTES.PROFIL_VISI_MISI)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-start gap-3 cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5 text-[#d97706] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Visi, Misi & Tujuan</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Arah pengembangan 2030</div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigateTo(ROUTES.PROFIL_STRUKTUR)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-start gap-3 cursor-pointer"
                  >
                    <Users className="w-5 h-5 text-[#2f5bea] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Struktur Organisasi</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Dekanat, Kaprodi & Laboratorium</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Mega Menu Trigger: Program Studi */}
            <div className="relative">
              <button
                onClick={() => setOpenMegaMenu(openMegaMenu === 'prodi' ? null : 'prodi')}
                aria-expanded={openMegaMenu === 'prodi'}
                className="inline-flex items-center gap-1 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer min-h-[44px]"
              >
                <span>Program Studi</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openMegaMenu === 'prodi' ? 'rotate-180' : ''}`} />
              </button>
              {openMegaMenu === 'prodi' && (
                <div className="absolute left-0 mt-2 w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-2 z-50">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
                    Program Sarjana (S1) Terakreditasi
                  </div>
                  {STUDY_PROGRAMS.map((prog) => (
                    <button
                      key={prog.slug}
                      onClick={() => navigateTo(ROUTES.PRODI_DETAIL(prog.slug))}
                      className="w-full text-left p-3 rounded-xl hover:bg-blue-50/70 dark:hover:bg-slate-800 transition flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{prog.name}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                          Gelar {prog.degreeTitle} • {prog.duration}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 shrink-0">
                        {prog.accreditationGrade}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => navigateTo(ROUTES.RISET_PUBLIKASI)}
              className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer min-h-[44px] ${
                currentRoute === ROUTES.RISET_PUBLIKASI
                  ? 'text-[#2f5bea] dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/50'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              Riset & Publikasi
            </button>

            <button
              onClick={() => navigateTo(ROUTES.UNDUHAN)}
              className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer min-h-[44px] ${
                currentRoute === ROUTES.UNDUHAN
                  ? 'text-[#2f5bea] dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/50'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              Unduhan
            </button>

            <button
              onClick={() => navigateTo(ROUTES.KONTAK)}
              className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer min-h-[44px] ${
                currentRoute === ROUTES.KONTAK
                  ? 'text-[#2f5bea] dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/50'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              Kontak
            </button>
          </nav>

          {/* Right Controls: Tri-State Theme Switcher + CTA + Mobile Menu Button */}
          <div className="flex items-center gap-2">
            {/* Tri-State Theme Switcher (Terang | Gelap | Sistem) - 03-DESIGN-SYSTEM.md §7 */}
            <div
              role="radiogroup"
              aria-label="Pilih tema tampilan situs"
              className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {[
                { id: 'light', label: 'Tema Terang', icon: Sun },
                { id: 'dark', label: 'Tema Gelap', icon: Moon },
                { id: 'system', label: 'Ikuti Sistem OS', icon: Monitor },
              ].map((t) => {
                const IconComp = t.icon;
                const active = themePref === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={t.label}
                    title={t.label}
                    onClick={() => setThemePref(t.id)}
                    className={`p-2 rounded-lg text-xs font-medium transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center ${
                      active
                        ? 'bg-white dark:bg-slate-900 text-[#2f5bea] dark:text-amber-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            <ExternalLink
              href={SITE_SETTING.pmbUrl}
              className="hidden sm:inline-flex px-4 py-2.5 rounded-xl bg-[#2f5bea] hover:bg-[#2246c4] text-white font-semibold text-xs sm:text-sm shadow-xs transition min-h-[44px]"
            >
              Daftar PMB
            </ExternalLink>

            {/* Mobile Hamburger Button (Target sentuh >= 44px) */}
            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 3. MOBILE DRAWER DENGAN SCROLL LOCK (Perbaikan F-22) */}
        {mobileMenuOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu Navigasi Mobile"
            className="lg:hidden fixed inset-x-0 top-20 bottom-0 z-50 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 overflow-y-auto p-6 space-y-6"
          >
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Menu Utama</div>
              <button
                onClick={() => navigateTo(ROUTES.HOME)}
                className="w-full text-left py-3 px-4 rounded-xl font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900"
              >
                Beranda
              </button>
              {STUDY_PROGRAMS.map((p) => (
                <button
                  key={p.slug}
                  onClick={() => navigateTo(ROUTES.PRODI_DETAIL(p.slug))}
                  className="w-full text-left py-3 px-4 rounded-xl font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-between"
                >
                  <span>Program Studi {p.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300">
                    {p.accreditationGrade}
                  </span>
                </button>
              ))}
              <button
                onClick={() => navigateTo(ROUTES.PROFIL_SEJARAH)}
                className="w-full text-left py-3 px-4 rounded-xl font-semibold text-slate-800 dark:text-slate-200"
              >
                Profil, Visi Misi & Struktur FIE
              </button>
              <button
                onClick={() => navigateTo(ROUTES.RISET_PUBLIKASI)}
                className="w-full text-left py-3 px-4 rounded-xl font-semibold text-slate-800 dark:text-slate-200"
              >
                Riset, Publikasi & PKM
              </button>
              <button
                onClick={() => navigateTo(ROUTES.UNDUHAN)}
                className="w-full text-left py-3 px-4 rounded-xl font-semibold text-slate-800 dark:text-slate-200"
              >
                Pusat Unduhan Akademik
              </button>
              <button
                onClick={() => navigateTo(ROUTES.KONTAK)}
                className="w-full text-left py-3 px-4 rounded-xl font-semibold text-slate-800 dark:text-slate-200"
              >
                Kontak & Lokasi Kampus
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================================ */}
      {/* 8. MAIN CONTENT AREA (#konten-utama) */}
      {/* ============================================================================ */}
      <main id="konten-utama" className="relative z-10 flex-1">
        {currentRoute === ROUTES.NOT_FOUND && renderNotFoundPage()}
        {currentRoute.startsWith('/prodi/') && renderProdiDetail(currentRoute.replace('/prodi/', ''))}
        {currentRoute === ROUTES.UNDUHAN && renderDownloadsPage()}
        {currentRoute === ROUTES.KONTAK && renderContactPage()}
        {(currentRoute.startsWith('/profil/') || currentRoute === ROUTES.RISET_PUBLIKASI) && renderGenericInfoPage()}

        {/* RUTE BERANDA, DAFTAR PRODI, ATAU INFORMASI */}
        {(currentRoute === ROUTES.HOME ||
          currentRoute === ROUTES.PRODI_LIST ||
          currentRoute === ROUTES.BERITA_LIST ||
          currentRoute === ROUTES.AGENDA_LIST ||
          currentRoute === ROUTES.PENGUMUMAN_LIST) && (
          <>
            {/* SECTION 1: HERO + 3D "BAR GROWTH" + ADMIN CAROUSEL (03-DESIGN-SYSTEM.md §5.1) */}
            <section className="relative overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-20 border-b border-slate-200/70 dark:border-slate-800/80">
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
                  {/* Kiri: Tipografi Besar & Percaya Diri (1 H1, 2 CTA) */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-[#2246c4] dark:text-blue-300 text-xs sm:text-sm font-semibold">
                      <Award className="w-4 h-4 text-[#d97706]" />
                      <span>Terakreditasi Baik Sekali LAMEMBA • Kurikulum OBE 2026</span>
                    </div>

                    <h1
                      ref={mainHeadingRef}
                      className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]"
                    >
                      Cetak Ekonom, Konsultan Pajak & Pemimpin{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2f5bea] to-[#d97706]">
                        Ritel Digital
                      </span>{' '}
                      Masa Depan.
                    </h1>

                    <p className="text-base sm:text-lg text-[#475467] dark:text-slate-300 max-w-2xl leading-relaxed">
                      {SITE_SETTING.tagline} Didukung penuh oleh laboratorium simulasi <strong>Coretax System</strong>, klinik pajak riil, dan inkubator bisnis ritel omnichannel di Tangerang Selatan.
                    </p>

                    {/* 2 CTA Utama (Ukuran sentuh >= 44px) */}
                    <div className="flex flex-wrap items-center gap-3.5 pt-2">
                      <ExternalLink
                        href={SITE_SETTING.pmbUrl}
                        className="px-6 py-3.5 rounded-2xl bg-[#2f5bea] hover:bg-[#2246c4] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#2f5bea]/25 transition hover:-translate-y-0.5 min-h-[48px]"
                      >
                        Daftar PMB Sekarang
                      </ExternalLink>
                      <button
                        onClick={() => navigateTo(ROUTES.PRODI_DETAIL('s1-perpajakan'))}
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm sm:text-base border border-slate-300 dark:border-slate-700 transition cursor-pointer min-h-[48px]"
                      >
                        <span>Jelajahi Program Studi</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bukti Keunggulan Singkat */}
                    <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        S1 Perpajakan & S1 Manajemen Retail
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Pendamping Ijazah Brevet Pajak & Analitik Ritel
                      </span>
                    </div>
                  </div>

                  {/* Kanan: Scene 3D Isometrik Berbasis JSON (Murni 3D Tanpa Mode Poster & Tanpa Tombol Jeda) */}
                  <div className="lg:col-span-5">
                    <HeroIsometric3DScene isDark={resolvedTheme === 'dark'} />
                  </div>
                </div>

                {/* CAROUSEL BANNER DARI ADMIN (Perbaikan F-11: Kontrol permanen, bisa diklik, pause on hover) */}
                <div
                  role="region"
                  aria-roledescription="carousel"
                  aria-label="Sorotan Informasi Penting Fakultas"
                  onMouseEnter={() => setIsCarouselPaused(true)}
                  onMouseLeave={() => setIsCarouselPaused(false)}
                  className="rounded-3xl bg-gradient-to-r from-[#0b1a4a] via-[#13296b] to-[#1e3a8a] text-white p-6 sm:p-8 shadow-lg border border-blue-900/40"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2.5 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                          {HERO_SLIDES[activeSlide].badge}
                        </span>
                        <span className="text-xs text-amber-200 font-medium">
                          {HERO_SLIDES[activeSlide].metric}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                        <button
                          onClick={() => navigateTo(HERO_SLIDES[activeSlide].targetRoute)}
                          className="text-left hover:text-amber-300 transition underline-offset-4 hover:underline cursor-pointer"
                        >
                          {HERO_SLIDES[activeSlide].title}
                        </button>
                      </h2>
                      <p className="text-sm text-blue-100/90 leading-relaxed">
                        {HERO_SLIDES[activeSlide].summary}
                      </p>
                    </div>

                    {/* Kontrol Carousel Selalu Terlihat (Panah + Dots + CTA Slide) */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      <button
                        onClick={() => navigateTo(HERO_SLIDES[activeSlide].targetRoute)}
                        className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm transition cursor-pointer min-h-[44px]"
                      >
                        {HERO_SLIDES[activeSlide].ctaText}
                      </button>

                      <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-xl border border-white/15">
                        <button
                          type="button"
                          aria-label="Slide sebelumnya"
                          onClick={() => setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                          className="p-2 rounded-lg hover:bg-white/15 transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        {HERO_SLIDES.map((s, idx) => (
                          <button
                            key={s.id}
                            type="button"
                            aria-label={`Pilih slide ${idx + 1}: ${s.badge}`}
                            aria-current={activeSlide === idx}
                            onClick={() => setActiveSlide(idx)}
                            className={`h-2.5 rounded-full transition-all cursor-pointer ${
                              activeSlide === idx ? 'w-7 bg-amber-400' : 'w-2.5 bg-white/40 hover:bg-white/70'
                            }`}
                          />
                        ))}
                        <button
                          type="button"
                          aria-label="Slide berikutnya"
                          onClick={() => setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                          className="p-2 rounded-lg hover:bg-white/15 transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: BENTO GRID STATISTIK FAKULTAS (03-DESIGN-SYSTEM.md §5.2) */}
            <section aria-labelledby="heading-statistik" className="py-14 sm:py-20 bg-[#f6f7fb] dark:bg-slate-900/50 border-b border-slate-200/70 dark:border-slate-800/80">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#2246c4] dark:text-blue-400">
                      Skala & Dampak Akademik
                    </span>
                    <h2 id="heading-statistik" className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                      Ekosistem Pendidikan Ekonomi Berbasis Data
                    </h2>
                  </div>
                  <p className="text-sm text-[#475467] dark:text-slate-400 max-w-md">
                    Seluruh metrik di bawah dikelola melalui model singleton <code className="font-mono text-xs">SiteSetting</code> di Django Admin.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {SITE_SETTING.stats.map((stat, idx) => {
                    const IconComp = stat.icon;
                    return (
                      <div
                        key={stat.id}
                        className={`rounded-2xl p-6 border transition duration-300 hover:-translate-y-1 ${
                          idx === 0
                            ? 'bg-gradient-to-br from-[#0b1a4a] to-[#2246c4] text-white border-transparent shadow-lg'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                              idx === 0
                                ? 'bg-white/15 text-amber-300'
                                : 'bg-blue-50 dark:bg-blue-950/70 text-[#2f5bea] dark:text-blue-400'
                            }`}
                          >
                            <IconComp className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                              idx === 0
                                ? 'bg-amber-400/20 text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            Terverifikasi 2026
                          </span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                          {stat.value.toLocaleString('id-ID')}
                          <span className={idx === 0 ? 'text-amber-300' : 'text-[#2f5bea] dark:text-amber-400'}>
                            {stat.suffix}
                          </span>
                        </div>
                        <h3 className={`font-bold text-base mt-2 ${idx === 0 ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                          {stat.label}
                        </h3>
                        <p className={`text-xs mt-1 leading-relaxed ${idx === 0 ? 'text-blue-100/90' : 'text-[#475467] dark:text-slate-400'}`}>
                          {stat.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* SECTION 3: PROGRAM STUDI UNGGULAN (03-DESIGN-SYSTEM.md §5.3) */}
            <section aria-labelledby="heading-prodi" className="py-14 sm:py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#2246c4] dark:text-blue-400">
                      Pilihan Akademik Sarjana (S1)
                    </span>
                    <h2 id="heading-prodi" className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                      Program Studi Unggulan FIE
                    </h2>
                  </div>
                  <p className="text-sm text-[#475467] dark:text-slate-400 max-w-md">
                    Tidak ada halaman prodi kosong atau placeholder. Seluruh status akreditasi disajikan sebagai teks aksesibel disertai kurikulum lengkap.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {STUDY_PROGRAMS.map((prodi) => (
                    <article
                      key={prodi.slug}
                      className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-7 sm:p-8 flex flex-col justify-between gap-6 shadow-xs hover:shadow-xl hover:border-[#2f5bea] transition-all duration-300"
                    >
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-[#2246c4] dark:text-blue-300">
                            {prodi.degree} • {prodi.degreeTitle}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300">
                            <Award className="w-3.5 h-3.5" /> Akreditasi {prodi.accreditationGrade}
                          </span>
                        </div>

                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                          {prodi.name}
                        </h3>

                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-200/60 dark:border-emerald-800/50">
                          {prodi.accreditationText}
                        </p>

                        <p className="text-sm sm:text-base text-[#475467] dark:text-slate-300 leading-relaxed">
                          {prodi.summary}
                        </p>

                        <div className="pt-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                            Prospek Karier Utama:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {prodi.prospects.map((p, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                              >
                                {p.role}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Kaprodi: <strong className="text-slate-800 dark:text-slate-200">{prodi.kaprodi}</strong>
                        </div>
                        <button
                          onClick={() => navigateTo(ROUTES.PRODI_DETAIL(prodi.slug))}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0b1a4a] dark:bg-[#2f5bea] hover:bg-[#2246c4] text-white font-semibold text-xs sm:text-sm transition cursor-pointer min-h-[44px]"
                        >
                          <span>Lihat Kurikulum & Detail</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {/* SECTION 4: BERITA TERBARU (1 Unggulan Besar + Kronologis, Filter & Pencarian) */}
            <section aria-labelledby="heading-berita" className="py-14 sm:py-20 bg-[#f6f7fb] dark:bg-slate-900/50 border-y border-slate-200/70 dark:border-slate-800/80">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#2246c4] dark:text-blue-400">
                      Kabar Kampus & Opini Akademik
                    </span>
                    <h2 id="heading-berita" className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
                      Berita & Publikasi Terkini
                    </h2>
                  </div>

                  {/* Filter Kategori & Kotak Pencarian Berita */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="search"
                        value={newsSearch}
                        onChange={(e) => setNewsSearch(e.target.value)}
                        aria-label="Cari judul atau topik berita"
                        placeholder="Cari berita FIE..."
                        className="pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-2 focus:outline-[#2f5bea] min-h-[44px]"
                      />
                    </div>

                    <div role="group" aria-label="Filter kategori berita" className="flex flex-wrap gap-1.5">
                      {['Semua', 'Akademik', 'Riset', 'Kemahasiswaan', 'Kemitraan'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewsCategory(cat)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[40px] ${
                            newsCategory === cat
                              ? 'bg-[#2f5bea] text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredNews.length === 0 ? (
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
                    <Newspaper className="w-10 h-10 text-slate-400 mx-auto" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Tidak Ada Berita yang Cocok
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                      Pencarian untuk "{newsSearch}" pada kategori {newsCategory} belum menemukan hasil.
                    </p>
                    <button
                      onClick={() => {
                        setNewsSearch('');
                        setNewsCategory('Semua');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#2f5bea] text-white text-xs font-semibold cursor-pointer"
                    >
                      Reset Filter Berita
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Kartu Berita Unggulan Besar (Kiri 7 Kolom) */}
                    {filteredNews[0] && (
                      <article className="lg:col-span-7 group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-xl transition flex flex-col justify-between">
                        <div>
                          <Picture
                            src={filteredNews[0].imageUrl}
                            alt={filteredNews[0].imageAlt}
                            category={filteredNews[0].category}
                            width={800}
                            height={440}
                            className="w-full h-64 sm:h-80"
                          />
                          <div className="p-6 sm:p-8 space-y-4">
                            <div className="flex flex-wrap items-center gap-2.5 text-xs">
                              {/* Badge adalah tombol filter nyata, bukan href="#" (Perbaikan F-19) */}
                              <button
                                onClick={() => setNewsCategory(filteredNews[0].category)}
                                className="px-3 py-1 rounded-full font-bold bg-blue-50 dark:bg-blue-950 text-[#2246c4] dark:text-blue-300 cursor-pointer hover:underline"
                              >
                                {filteredNews[0].category}
                              </button>
                              <span className="text-slate-500 dark:text-slate-400">
                                {formatDate(filteredNews[0].publishedAt)}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500 dark:text-slate-400">
                                {filteredNews[0].readTime}
                              </span>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-[#2f5bea] transition">
                              <button
                                onClick={() => setSelectedNewsPost(filteredNews[0])}
                                className="text-left cursor-pointer"
                              >
                                {filteredNews[0].title}
                              </button>
                            </h3>

                            <p className="text-sm sm:text-base text-[#475467] dark:text-slate-300 leading-relaxed">
                              {filteredNews[0].excerpt}
                            </p>
                          </div>
                        </div>

                        <div className="px-6 sm:px-8 pb-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-500">
                            Oleh: {filteredNews[0].author}
                          </span>
                          <button
                            onClick={() => setSelectedNewsPost(filteredNews[0])}
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#2f5bea] dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            <span>Baca Artikel Lengkap</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </article>
                    )}

                    {/* Daftar Berita Kronologis Lainnya (Kanan 5 Kolom) */}
                    <div className="lg:col-span-5 flex flex-col gap-5">
                      {filteredNews.slice(1).map((post) => (
                        <article
                          key={post.slug}
                          className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex gap-4 items-start shadow-xs hover:border-[#2f5bea] transition"
                        >
                          <Picture
                            src={post.imageUrl}
                            alt={post.imageAlt}
                            category={post.category}
                            width={180}
                            height={140}
                            className="w-28 h-24 sm:w-32 sm:h-28 rounded-xl shrink-0"
                          />
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              <button
                                onClick={() => setNewsCategory(post.category)}
                                className="font-bold text-[#2246c4] dark:text-blue-400 hover:underline cursor-pointer"
                              >
                                {post.category}
                              </button>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500 dark:text-slate-400">
                                {formatDate(post.publishedAt)}
                              </span>
                            </div>

                            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-[#2f5bea] transition">
                              <button
                                onClick={() => setSelectedNewsPost(post)}
                                className="text-left cursor-pointer"
                              >
                                {post.title}
                              </button>
                            </h3>

                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                              {post.excerpt}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* SECTION 5 & 6: AGENDA MENDATANG (>= NOW) & PENGUMUMAN RESMI (03-DESIGN-SYSTEM.md §5.5 & §5.6) */}
            <section className="py-14 sm:py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Agenda Mendatang (7 Kolom) */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-[#2246c4] dark:text-blue-400">
                        Kalender Kegiatan (`start &gt;= sekarang`)
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                        Agenda Mendatang
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSimulateEmptyAgenda(!simulateEmptyAgenda)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      {simulateEmptyAgenda ? 'Tampilkan Data Agenda' : 'Uji EmptyState Agenda'}
                    </button>
                  </div>

                  {simulateEmptyAgenda ? (
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center space-y-3">
                      <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        Belum Ada Agenda Mendatang pada Periode Ini
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                        Sesuai spesifikasi anti-regresi F-18, agenda yang sudah terlewat tidak ditampilkan di daftar mendatang dan digantikan oleh komponen EmptyState yang informatif.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {UPCOMING_EVENTS.map((evt) => (
                        <div
                          key={evt.id}
                          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-[#2f5bea] transition"
                        >
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300">
                                {evt.type}
                              </span>
                              <span className="font-semibold text-[#2246c4] dark:text-blue-400">
                                {formatDate(evt.startDate)}
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                              {evt.title}
                            </h3>
                            <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {evt.location}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-slate-400" /> {evt.quota}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pengumuman Akademik (5 Kolom) */}
                <div className="lg:col-span-5 space-y-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#d97706]">
                      Informasi Mahasiswa Aktif
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                      Pengumuman Resmi
                    </h2>
                  </div>

                  <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs">
                    {ANNOUNCEMENTS.map((ann) => (
                      <div key={ann.id} className="p-5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2.5 py-0.5 rounded-md font-bold bg-blue-50 dark:bg-blue-950 text-[#2246c4] dark:text-blue-300">
                            {ann.priority}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {formatDate(ann.date)}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                          {ann.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {ann.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 7: JEJARING MITRA KERJA SAMA (03-DESIGN-SYSTEM.md §5.7) */}
            <section aria-label="Jejaring Mitra Kerja Sama" className="py-10 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200/70 dark:border-slate-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
                <div className="text-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Mitra Strategis Kurikulum, Magang MBKM & Tax Center
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {PARTNERS.map((partner, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-2xs"
                    >
                      {partner}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* SECTION 8: CTA PMB & KONTAK CEPAT (03-DESIGN-SYSTEM.md §5.8) */}
            <section className="py-14 sm:py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="rounded-3xl bg-gradient-to-br from-[#0b1a4a] via-[#152c70] to-[#2f5bea] text-white p-8 sm:p-12 lg:p-14 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                  <div className="space-y-3 max-w-2xl">
                    <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                      Pendaftaran Tahun Akademik 2026/2027
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                      Siap Bergabung dengan Fakultas Ilmu Ekonomi Universitas Ichsan Satya?
                    </h2>
                    <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                      Konsultasikan pilihan program studi <strong>S1 Perpajakan</strong> atau{' '}
                      <strong>S1 Manajemen Retail</strong> serta peluang beasiswa prestasi bersama tim admisi kami.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3.5 shrink-0">
                    <ExternalLink
                      href={SITE_SETTING.pmbUrl}
                      className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm sm:text-base shadow-lg transition min-h-[48px]"
                    >
                      Daftar Online di Portal PMB
                    </ExternalLink>
                    <button
                      onClick={() => navigateTo(ROUTES.KONTAK)}
                      className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base border border-white/25 transition cursor-pointer min-h-[48px]"
                    >
                      Hubungi Sekretariat FIE
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* ============================================================================ */}
      {/* 9. MODAL PEMBACA ARTIKEL BERITA (<Prose> 68ch, Konten Tersanitasi Bersih) */}
      {/* ============================================================================ */}
      {selectedNewsPost && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-article-title"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#2246c4] dark:text-blue-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>HTML Tersanitasi (`nh3` Server + `DOMPurify` Klien — Bebas Markup Word `mso-*`)</span>
              </div>
              <button
                onClick={() => setSelectedNewsPost(null)}
                aria-label="Tutup artikel"
                className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-10 overflow-y-auto space-y-6">
              <div className="space-y-3 max-w-[68ch] mx-auto">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full font-bold bg-blue-50 dark:bg-blue-950 text-[#2246c4] dark:text-blue-300">
                    {selectedNewsPost.category}
                  </span>
                  <span className="text-slate-500">{formatDate(selectedNewsPost.publishedAt)}</span>
                  <span>•</span>
                  <span className="text-slate-500">{selectedNewsPost.author}</span>
                </div>

                <h2 id="modal-article-title" className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {selectedNewsPost.title}
                </h2>
              </div>

              <Picture
                src={selectedNewsPost.imageUrl}
                alt={selectedNewsPost.imageAlt}
                category={selectedNewsPost.category}
                width={760}
                height={380}
                className="w-full h-60 sm:h-72 rounded-2xl max-w-[68ch] mx-auto"
              />

              {/* Komponen Prose dengan lebar baca maksimal 68ch (03-DESIGN-SYSTEM.md §3) */}
              <div
                className="max-w-[68ch] mx-auto space-y-4 text-slate-700 dark:text-slate-300 text-base leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_h2]:pt-3 [&_h3]:text-lg [&_h3]:font-bold [&_blockquote]:p-4 [&_blockquote]:rounded-xl [&_blockquote]:bg-blue-50/70 dark:[&_blockquote]:bg-slate-800 [&_blockquote]:border-l-4 [&_blockquote]:border-[#2f5bea] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5"
                dangerouslySetInnerHTML={{ __html: selectedNewsPost.contentHtml }}
              />

              <div className="max-w-[68ch] mx-auto pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-1.5">
                  {selectedNewsPost.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `https://fie.universitasichsansatya.ac.id/informasi/berita/${selectedNewsPost.slug}`
                    );
                    setCopiedShareUrl(true);
                    setTimeout(() => setCopiedShareUrl(false), 2500);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#2f5bea] hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  {copiedShareUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedShareUrl ? 'Tautan Tersalin!' : 'Salin Tautan Artikel'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* 10. FOOTER IDENTITAS RESMI (Semua Path dari ROUTES.TS — Perbaikan F-02, F-13, F-34) */}
      {/* ============================================================================ */}
      <footer className="relative z-10 bg-[#0b1a4a] text-slate-200 border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
            {/* Identitas Fakultas (3 Kolom) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-extrabold flex items-center justify-center text-base">
                  FIE
                </div>
                <div>
                  <div className="font-extrabold text-white text-lg leading-none">
                    {SITE_SETTING.facultyName}
                  </div>
                  <div className="text-xs text-amber-300 font-medium mt-1">
                    {SITE_SETTING.universityName}
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-blue-100/85 leading-relaxed">
                {SITE_SETTING.address}
              </p>
              <div className="text-xs space-y-1 text-blue-100/90">
                <div>
                  Email Resmi: <strong className="text-amber-300">{SITE_SETTING.email}</strong>
                </div>
                <div>Telepon: {SITE_SETTING.phone}</div>
              </div>
            </div>

            {/* Tautan Program Studi & Layanan (4 Kolom) */}
            <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Program Studi & Akademik
                </h2>
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li>
                    <button
                      onClick={() => navigateTo(ROUTES.PRODI_DETAIL('s1-perpajakan'))}
                      className="hover:text-amber-300 transition cursor-pointer text-left"
                    >
                      S1 Perpajakan (Baik Sekali)
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigateTo(ROUTES.PRODI_DETAIL('s1-manajemen-retail'))}
                      className="hover:text-amber-300 transition cursor-pointer text-left"
                    >
                      S1 Manajemen Retail (Baik Sekali)
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigateTo(ROUTES.RISET_PUBLIKASI)}
                      className="hover:text-amber-300 transition cursor-pointer text-left"
                    >
                      Publikasi, Penelitian & PKM
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigateTo(ROUTES.UNDUHAN)}
                      className="hover:text-amber-300 transition cursor-pointer text-left"
                    >
                      Kalender & Pedoman Akademik
                    </button>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Layanan Terintegrasi
                </h2>
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li>
                    <ExternalLink href={SITE_SETTING.pmbUrl} className="hover:text-amber-300">
                      Portal PMB Online
                    </ExternalLink>
                  </li>
                  <li>
                    <ExternalLink href={SITE_SETTING.sidaUrl} className="hover:text-amber-300">
                      Portal Akademik (SIDA)
                    </ExternalLink>
                  </li>
                  <li>
                    <button
                      onClick={() => navigateTo(ROUTES.KONTAK)}
                      className="hover:text-amber-300 transition cursor-pointer text-left"
                    >
                      Formulir Kontak Resmi
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigateTo(ROUTES.NOT_FOUND)}
                      className="text-blue-200/80 hover:text-amber-300 transition cursor-pointer text-left"
                    >
                      Simulasi Halaman 404 (`noindex`)
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Peta Lokasi 3D Google Maps Interaktif di Footer (5 Kolom) */}
            <div className="lg:col-span-5">
              <Footer3DMapCard />
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-blue-200/80">
            <div>
              © {new Date().getFullYear()} {SITE_SETTING.facultyName} — {SITE_SETTING.universityName}. Hak cipta dilindungi.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}