/**
 * Sumber data sementara untuk pratinjau pengembangan.
 *
 * Sesuai `docs/01-PRD.md` §8, konten institusi (visi-misi, sejarah, kontak,
 * angka statistik, daftar berita/agenda) WAJIB berasal dari Django Admin dan
 * tidak boleh direkayasa. Berkas ini hanya menampung UI statis + contoh bentuk
 * data ("data contoh") agar desain dapat ditinjau sebelum API Fase 2 tersedia,
 * lalu diganti oleh hasil `api/client.ts` pada Fase 4.
 */

export type NavItem = {
  label: string;
  href: string;
};

export const site = {
  universityName: "Universitas Ichsan Satya",
  facultyName: "Fakultas Ilmu Ekonomi",
  facultyAbbr: "FIE",
  description:
    "Pusat informasi akademik, program studi, berita, dan agenda Fakultas Ilmu Ekonomi, Universitas Ichsan Satya.",
} as const;

export const navigation: NavItem[] = [
  { label: "Beranda", href: "#beranda" },
  { label: "Statistik", href: "#statistik" },
  { label: "Program Studi", href: "#program-studi" },
  { label: "Berita", href: "#berita" },
  { label: "Agenda", href: "#agenda" },
  { label: "Pengumuman", href: "#pengumuman" },
  { label: "Kontak", href: "#kontak" },
];

export type Program = {
  slug: string;
  name: string;
  degree: string;
  summary: string;
};

export const programs: Program[] = [
  {
    slug: "s1-perpajakan",
    name: "Perpajakan",
    degree: "Sarjana (S1)",
    summary:
      "Jenjang sarjana dengan fokus bidang perpajakan dan administrasi keuangan.",
  },
  {
    slug: "s1-manajemen-retail",
    name: "Manajemen Retail",
    degree: "Sarjana (S1)",
    summary:
      "Jenjang sarjana dengan fokus bidang manajemen ritel dan bisnis modern.",
  },
];

export type Stat = {
  label: string;
  value: string;
};

export const stats: Stat[] = [
  { label: "Program Studi", value: "2" },
  { label: "Dosen", value: "24" },
  { label: "Mahasiswa Aktif", value: "640" },
  { label: "Mitra Kerja Sama", value: "18" },
];

export type NewsItem = {
  slug: string;
  title: string;
  category: string;
  publishedAt: string;
  excerpt: string;
};

export const news: NewsItem[] = [
  {
    slug: "pendaftaran-mahasiswa-baru-gelombang-i",
    title: "Pendaftaran Mahasiswa Baru Gelombang I Resmi Dibuka",
    category: "PMB",
    publishedAt: "2026-10-28",
    excerpt:
      "Ringkasan jadwal, persyaratan, dan alur pendaftaran calon mahasiswa baru.",
  },
  {
    slug: "workshop-literasi-perpajakan",
    title: "Workshop Literasi Perpajakan untuk Mahasiswa Semester Awal",
    category: "Akademik",
    publishedAt: "2026-10-21",
    excerpt:
      "Kegiatan penguatan pemahaman dasar perpajakan bagi mahasiswa baru.",
  },
  {
    slug: "kuliah-umum-manajemen-retail-digital",
    title: "Kuliah Umum: Tren Manajemen Retail di Era Digital",
    category: "Akademik",
    publishedAt: "2026-10-14",
    excerpt:
      "Diskusi perkembangan ritel digital bersama praktisi dan dosen pengampu.",
  },
];

export type AgendaItem = {
  slug: string;
  title: string;
  startAt: string;
  location: string;
};

export const agenda: AgendaItem[] = [
  {
    slug: "sosialisasi-kurikulum",
    title: "Sosialisasi Kurikulum Semester Ganjil",
    startAt: "2026-11-12T09:00:00+07:00",
    location: "Aula Fakultas",
  },
  {
    slug: "seminar-nasional-ekonomi-digital",
    title: "Seminar Nasional Ekonomi Digital",
    startAt: "2026-11-20T08:30:00+07:00",
    location: "Auditorium Universitas",
  },
  {
    slug: "open-house-program-studi",
    title: "Open House Program Studi",
    startAt: "2026-12-03T09:00:00+07:00",
    location: "Gedung FIE",
  },
];

export type Announcement = {
  id: string;
  title: string;
  publishedAt: string;
};

export const announcements: Announcement[] = [
  {
    id: "jadwal-uts-ganjil",
    title: "Jadwal Ujian Tengah Semester Ganjil 2026/2027",
    publishedAt: "2026-10-30",
  },
  {
    id: "batas-krs",
    title: "Batas Akhir Pengisian Kartu Rencana Studi",
    publishedAt: "2026-10-25",
  },
  {
    id: "pemeliharaan-sistem-informasi",
    title: "Pemeliharaan Terjadwal Sistem Informasi Akademik",
    publishedAt: "2026-10-18",
  },
];

export const partners: string[] = [
  "Instansi Pemerintah",
  "Perbankan",
  "Perusahaan Retail",
  "Konsultan Pajak",
  "Asosiasi Profesi",
  "Industri Manufaktur",
];
