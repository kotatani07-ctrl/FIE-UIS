import { useFeaturedNews } from "@/api/hooks";
import { ListEmpty, ListError, LoadingBlock } from "@/components/ListFeedback";
import { Picture } from "@/components/Picture";
import { Reveal } from "@/components/Reveal";
import { Badge, Card, Container, SectionHeading } from "@/components/ui";
import { formatDate } from "@/lib/formatDate";
import { newsCard } from "@/lib/content";

export function News() {
  const { data, isPending, isError, refetch } = useFeaturedNews();
  const items = (data ?? []).map(newsCard);
  const [featured, ...rest] = items;

  return (
    <section
      id="berita"
      aria-labelledby="berita-title"
      className="border-b border-line py-20 lg:py-24"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="berita-title"
            title="Kabar terbaru fakultas"
            description="Kabar akademik dan kegiatan terbaru dari fakultas."
          />
        </Reveal>

        <Reveal delay={100}>
          {isPending ? (
            <LoadingBlock label="Memuat berita" rows={2} className="h-64" />
          ) : isError ? (
            <ListError onRetry={() => refetch()} />
          ) : items.length === 0 ? (
            <ListEmpty
              title="Belum ada berita"
              description="Berita akan tampil di sini setelah diterbitkan."
            />
          ) : (
            <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              {featured ? (
                <Card className="flex flex-col overflow-hidden p-0">
                  <Picture
                    src={featured.image}
                    alt={featured.imageAlt}
                    width={800}
                    height={450}
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="aspect-[16/9] w-full"
                    imageClassName="h-full w-full object-cover"
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
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      {featured.excerpt}
                    </p>
                  </div>
                </Card>
              ) : null}

              <div className="flex flex-col gap-5">
                {rest.slice(0, 2).map((item) => (
                  <Card
                    key={item.slug}
                    className="flex flex-col overflow-hidden p-0"
                  >
                    <Picture
                      src={item.image}
                      alt={item.imageAlt}
                      width={800}
                      height={450}
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      className="aspect-[16/9] w-full"
                      imageClassName="h-full w-full object-cover"
                    />
                    <div className="flex flex-1 flex-col p-6">
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
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
