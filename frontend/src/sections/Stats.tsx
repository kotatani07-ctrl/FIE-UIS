import { useSiteSettings } from "@/api/hooks";
import { Reveal } from "@/components/Reveal";
import { Container, SectionHeading } from "@/components/ui";

export function Stats() {
  const { data, isPending } = useSiteSettings();

  const stats = data
    ? [
        { label: "Program Studi", value: data.stats_programs },
        { label: "Dosen", value: data.stats_lecturers },
        { label: "Mahasiswa Aktif", value: data.stats_students },
        { label: "Mitra Kerja Sama", value: data.stats_partners },
      ].filter((stat) => stat.value > 0)
    : [];

  if (isPending || stats.length === 0) {
    return null;
  }

  return (
    <section
      id="statistik"
      aria-labelledby="statistik-title"
      className="border-b border-line py-16 lg:py-20"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="statistik-title"
            title="Fakultas dalam angka"
            description="Data resmi fakultas."
          />
        </Reveal>
        <Reveal delay={100}>
          <dl className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-card border border-line bg-surface-2 p-6"
              >
                <dt className="text-sm font-semibold text-muted">
                  {stat.label}
                </dt>
                <dd className="mt-2 font-display text-4xl font-bold tracking-tight text-brand-600">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Container>
    </section>
  );
}
