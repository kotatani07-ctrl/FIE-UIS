import { useSiteSettings } from "@/api/hooks";
import { HeroVisual } from "@/components/HeroVisual";
import { Reveal } from "@/components/Reveal";
import { Container, LinkButton } from "@/components/ui";
import { routes } from "@/app/routes";
import { site } from "@/lib/site";

const FALLBACK_LEAD =
  "Menumbuhkan pemahaman ekonomi, keuangan, dan bisnis untuk karier yang nyata.";

export function Hero() {
  const { data } = useSiteSettings();
  const lead = data?.tagline.trim() || FALLBACK_LEAD;

  return (
    <section
      id="beranda"
      aria-labelledby="hero-title"
      className="relative overflow-hidden border-b border-line bg-gradient-to-b from-sand-50/80 via-surface to-surface"
    >
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
        <Reveal>
          <p className="text-sm font-semibold text-brand-600">
            Selamat datang di
          </p>
          <h1
            id="hero-title"
            className="mt-2 font-display text-4xl font-bold leading-[1.08] tracking-[-0.015em] text-ink sm:text-5xl lg:text-6xl"
          >
            {site.facultyName}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            {lead}
          </p>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
            {site.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton to={routes.programs}>Lihat Program Studi</LinkButton>
            <LinkButton to={routes.announcements} variant="secondary">
              Baca Pengumuman
            </LinkButton>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <HeroVisual />
        </Reveal>
      </Container>
    </section>
  );
}
