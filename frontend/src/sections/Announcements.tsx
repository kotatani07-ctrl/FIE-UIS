import { Reveal } from "@/components/Reveal";
import { Container, SectionHeading } from "@/components/ui";
import { formatDate } from "@/lib/formatDate";
import { announcements } from "@/lib/site";

export function Announcements() {
  return (
    <section
      id="pengumuman"
      aria-labelledby="pengumuman-title"
      className="py-20 lg:py-28"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="pengumuman-title"
            eyebrow="Pengumuman"
            title="Informasi resmi"
            description="Daftar pengumuman terbaru dengan tanggal terbit."
          />
        </Reveal>

        <ul className="mt-12 divide-y divide-line rounded-card border border-line bg-surface">
          {announcements.map((item, index) => (
            <li key={item.id}>
              <Reveal
                delay={index * 70}
                className="flex flex-col gap-1 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <h3 className="font-display text-base font-semibold text-ink">
                  {item.title}
                </h3>
                <time
                  dateTime={item.publishedAt}
                  className="shrink-0 text-sm text-muted"
                >
                  {formatDate(item.publishedAt)}
                </time>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
