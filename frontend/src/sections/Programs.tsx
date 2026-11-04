import { Reveal } from "@/components/Reveal";
import {
  Badge,
  Card,
  Container,
  LinkButton,
  SectionHeading,
} from "@/components/ui";
import { programs } from "@/lib/site";

export function Programs() {
  return (
    <section
      id="program-studi"
      aria-labelledby="prodi-title"
      className="border-y border-line bg-surface-2 py-20 lg:py-28"
    >
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <SectionHeading
              id="prodi-title"
              eyebrow="Program Studi"
              title="Pilihan jenjang sarjana"
              description="Program studi fakultas beserta jenjang dan ringkasannya."
            />
          </Reveal>
          <Reveal delay={100}>
            <LinkButton href="#kontak" variant="secondary">
              Konsultasi Pilihan Prodi
            </LinkButton>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {programs.map((program, index) => (
            <Reveal key={program.slug} delay={index * 100}>
              <Card className="flex h-full flex-col">
                <Badge>{program.degree}</Badge>
                <h3 className="mt-4 font-display text-2xl font-bold text-ink">
                  {program.name}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                  {program.summary}
                </p>
                <a
                  href="#kontak"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Informasi pendaftaran
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" />
                  </svg>
                </a>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
