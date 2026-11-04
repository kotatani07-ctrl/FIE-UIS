import { Reveal } from "@/components/Reveal";
import { Container, SectionHeading } from "@/components/ui";
import { stats } from "@/lib/site";

export function Stats() {
  return (
    <section
      id="statistik"
      aria-labelledby="statistik-title"
      className="py-20 lg:py-28"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="statistik-title"
            eyebrow="Statistik"
            title="Fakultas dalam angka"
            description="Ringkasan data fakultas. Angka ditampilkan dari pengaturan situs (SiteSetting) pada implementasi berikutnya."
          />
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 80}>
              <div className="h-full rounded-card border border-line bg-surface-2 p-6">
                <p className="font-display text-4xl font-bold tracking-tight text-brand-600">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-semibold text-muted">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
