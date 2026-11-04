import { Reveal } from "@/components/Reveal";
import { Container, LinkButton } from "@/components/ui";
import { site } from "@/lib/site";

const heroBars = [
  { x: 16, height: 52 },
  { x: 76, height: 86 },
  { x: 136, height: 64 },
  { x: 196, height: 108 },
  { x: 256, height: 74 },
];

export function Hero() {
  return (
    <section
      id="beranda"
      aria-labelledby="hero-title"
      className="relative overflow-hidden border-b border-line"
    >
      <div className="grid-lines absolute inset-0 -z-10" aria-hidden="true" />
      <div className="hero-glow absolute inset-0 -z-10" aria-hidden="true" />

      <Container className="grid items-center gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
            {site.universityName}
          </p>
          <h1
            id="hero-title"
            className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl"
          >
            {site.facultyName}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            {site.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="#kontak">Daftar Sekarang</LinkButton>
            <LinkButton href="#program-studi" variant="secondary">
              Lihat Program Studi
            </LinkButton>
          </div>

          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                Program Studi
              </dt>
              <dd className="font-display text-2xl font-bold text-ink">
                2 Jenjang S1
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                Layanan
              </dt>
              <dd className="font-display text-2xl font-bold text-ink">
                Berita &amp; Agenda
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={120} className="relative">
          <div className="rounded-card border border-line bg-surface p-7 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-bold text-ink">
                Ringkasan Fakultas
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                Data contoh
              </span>
            </div>

            <svg
              aria-hidden="true"
              viewBox="0 0 320 140"
              className="mt-6 w-full"
            >
              <defs>
                <linearGradient id="heroBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2f5bea" />
                  <stop offset="100%" stopColor="#93a9ff" />
                </linearGradient>
              </defs>
              {heroBars.map((bar) => (
                <rect
                  key={bar.x}
                  x={bar.x}
                  y={130 - bar.height}
                  width="34"
                  height={bar.height}
                  rx="8"
                  fill="url(#heroBar)"
                />
              ))}
            </svg>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-6">
              <div>
                <p className="text-xs text-muted">Program Studi</p>
                <p className="font-display text-xl font-bold text-ink">2</p>
              </div>
              <div>
                <p className="text-xs text-muted">Mitra Kerja Sama</p>
                <p className="font-display text-xl font-bold text-ink">18</p>
              </div>
            </div>
          </div>

          <div className="float-slow absolute -right-3 -top-5 hidden rounded-2xl border border-line bg-surface px-5 py-3 shadow-lg sm:block">
            <p className="text-xs text-muted">Agenda Terdekat</p>
            <p className="font-display text-sm font-bold text-ink">
              Sosialisasi Kurikulum
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
