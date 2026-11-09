import { sectionLinks } from "@/app/routes";

export function SkipLink() {
  return (
    <a
      href={sectionLinks.main}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-600 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
    >
      Lewati ke konten utama
    </a>
  );
}
