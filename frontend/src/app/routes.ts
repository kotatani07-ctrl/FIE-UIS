export const routes = {
  home: "/",
  programs: "/prodi",
  news: "/informasi/berita",
  agenda: "/informasi/agenda",
  announcements: "/informasi/pengumuman",
  contact: "/kontak",
} as const;

/**
 * Satu-satunya anchor dalam halaman: tautan lewati ke konten utama.
 * Navigasi antarhalaman memakai `routes`.
 */
export const sectionLinks = {
  main: "#konten-utama",
} as const;

export function isSafeInternalHref(href: string): boolean {
  if (/[\u0000-\u001f\u007f\\]/.test(href)) {
    return false;
  }
  return (
    (href.startsWith("#") && href.length > 1) ||
    (href.startsWith("/") && !href.startsWith("//"))
  );
}
