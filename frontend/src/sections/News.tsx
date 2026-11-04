import { Reveal } from "@/components/Reveal";
import { Badge, Card, Container, SectionHeading } from "@/components/ui";
import { formatDate } from "@/lib/formatDate";
import { news } from "@/lib/site";

export function News() {
  const [featured, ...rest] = news;

  return (
    <section
      id="berita"
      aria-labelledby="berita-title"
      className="py-20 lg:py-28"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="berita-title"
            eyebrow="Berita"
            title="Kabar terbaru fakultas"
            description="Berita terbaru, kronologis, dan tanpa duplikat."
          />
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {featured ? (
            <Reveal>
              <Card className="flex h-full flex-col overflow-hidden p-0">
                <div
                  aria-hidden="true"
                  className="h-48 w-full bg-gradient-to-br from-brand-500 via-brand-600 to-brand-900"
                />
                <div className="flex flex-1 flex-col p-7">
                  <div className="flex items-center gap-3">
                    <Badge>{featured.category}</Badge>
                    <time
                      dateTime={featured.publishedAt}
                      className="text-xs font-medium text-muted"
                    >
                      {formatDate(featured.publishedAt)}
                    </time>
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-bold leading-snug text-ink">
                    {featured.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                    {featured.excerpt}
                  </p>
                  <span className="mt-6 text-sm font-semibold text-brand-600">
                    Baca selengkapnya
                  </span>
                </div>
              </Card>
            </Reveal>
          ) : null}

          <div className="flex flex-col gap-5">
            {rest.map((item, index) => (
              <Reveal key={item.slug} delay={index * 90} className="flex-1">
                <Card className="flex h-full flex-col">
                  <div className="flex items-center gap-3">
                    <Badge>{item.category}</Badge>
                    <time
                      dateTime={item.publishedAt}
                      className="text-xs font-medium text-muted"
                    >
                      {formatDate(item.publishedAt)}
                    </time>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold leading-snug text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {item.excerpt}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
