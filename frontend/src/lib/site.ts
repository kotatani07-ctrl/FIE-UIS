import { routes } from "@/app/routes";

/**
 * Identitas statis situs. Konten dinamis (berita, agenda, pengumuman, statistik,
 * kontak) diambil dari API CMS; lihat `src/api/hooks.ts`.
 */
export const site = {
  universityName: "Universitas Ichsan Satya",
  facultyName: "Fakultas Ilmu Ekonomi",
  facultyAbbr: "FIE",
  description:
    "Pusat informasi akademik, program studi, berita, dan agenda Fakultas Ilmu Ekonomi, Universitas Ichsan Satya.",
} as const;

export type NavItem = {
  label: string;
  to: string;
};

export const navigation: NavItem[] = [
  { label: "Beranda", to: routes.home },
  { label: "Program Studi", to: routes.programs },
  { label: "Berita", to: routes.news },
  { label: "Agenda", to: routes.agenda },
  { label: "Pengumuman", to: routes.announcements },
  { label: "Kontak", to: routes.contact },
];
