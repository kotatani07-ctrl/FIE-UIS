import { Reveal } from "@/components/Reveal";
import { Container, SectionHeading } from "@/components/ui";
import { formatDateTime } from "@/lib/formatDate";
import { agenda } from "@/lib/site";

export function Agenda() {
  return (
    <section
      id="agenda"
      aria-labelledby="agenda-title"
      className="border-y border-line bg-surface-2 py-20 lg:py-28"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="agenda-title"
            eyebrow="Agenda"
            title="Kegiatan mendatang"
            description="Hanya menampilkan agenda yang belum lewat, diurutkan berdasarkan waktu mulai."
          />
        </Reveal>

        <ul className="mt-12 flex flex-col gap-4">
          {agenda.map((item, index) => (
            <li key={item.slug}>
              <Reveal
                delay={index * 80}
                className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                    {formatDateTime(item.startAt)}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-bold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{item.location}</p>
                </div>
                <span className="inline-flex w-fit items-center rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                  Mendatang
                </span>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
