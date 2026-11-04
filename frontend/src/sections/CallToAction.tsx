import { Reveal } from "@/components/Reveal";
import { Container } from "@/components/ui";
import { site } from "@/lib/site";

export function CallToAction() {
  return (
    <section
      id="kontak"
      aria-labelledby="kontak-title"
      className="py-20 lg:py-28"
    >
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-card border border-brand-700 bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 p-10 lg:p-16">
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent-400/25 blur-2xl"
            />

            <div className="relative max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-300">
                Penerimaan Mahasiswa Baru
              </p>
              <h2
                id="kontak-title"
                className="mt-4 font-display text-3xl font-bold leading-tight text-white sm:text-4xl"
              >
                Mulai langkah Anda bersama {site.facultyName}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/80">
                Hubungi tim penerimaan mahasiswa baru untuk informasi program
                studi, jadwal, dan alur pendaftaran.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#program-studi"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-50"
                >
                  Lihat Program Studi
                </a>
                <a
                  href="#pengumuman"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/40 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Baca Pengumuman
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
