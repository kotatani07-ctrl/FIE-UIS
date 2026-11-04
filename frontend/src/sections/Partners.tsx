import { Container, SectionHeading } from "@/components/ui";
import { partners } from "@/lib/site";

export function Partners() {
  const track = [...partners, ...partners];

  return (
    <section
      id="mitra"
      aria-labelledby="mitra-title"
      className="border-y border-line bg-surface-2 py-20 lg:py-24"
    >
      <Container>
        <SectionHeading
          id="mitra-title"
          eyebrow="Mitra"
          title="Kerja sama dan jejaring"
          description="Kategori mitra kerja sama fakultas."
        />
      </Container>

      <div className="marquee mt-10" aria-hidden="true">
        <div className="marquee__track">
          {track.map((partner, index) => (
            <span
              key={`${partner}-${index}`}
              className="flex h-16 shrink-0 items-center rounded-2xl border border-line bg-surface px-8 font-display text-base font-semibold text-muted"
            >
              {partner}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
