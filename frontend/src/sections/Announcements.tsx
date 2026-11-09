import { useAnnouncements } from "@/api/hooks";
import { ListEmpty, ListError, LoadingBlock } from "@/components/ListFeedback";
import { Picture } from "@/components/Picture";
import { Reveal } from "@/components/Reveal";
import { Badge, Container, SectionHeading } from "@/components/ui";
import { Link } from "react-router-dom";
import { routes } from "@/app/routes";
import { formatDate, formatDateParts } from "@/lib/formatDate";
import { announcementCard } from "@/lib/content";
import announcementVisual from "../../asset/announcement-visual.jpg";

export function Announcements() {
  const { data, isPending, isError, refetch } = useAnnouncements(4);
  const items = (data?.results ?? []).map(announcementCard);

  return (
    <section
      id="pengumuman"
      aria-labelledby="pengumuman-title"
      className="border-b border-line py-20 lg:py-24"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="pengumuman-title"
            title="Pengumuman resmi"
            description="Informasi resmi untuk mahasiswa dan dosen."
          />
        </Reveal>

        <Reveal delay={100}>
          {isPending ? (
            <LoadingBlock label="Memuat pengumuman" rows={3} />
          ) : isError ? (
            <ListError onRetry={() => refetch()} />
          ) : items.length === 0 ? (
            <ListEmpty
              title="Belum ada pengumuman"
              description="Pengumuman akan tampil di sini setelah diterbitkan."
            />
          ) : (
            <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-start">
              <div>
                <ul className="divide-y divide-line border-y border-line">
                  {items.map((item, index) => {
                    const { day, month } = formatDateParts(item.publishedAt);
                    return (
                      <li key={item.id} className="flex gap-4 py-5">
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                          <span className="font-display text-xl font-bold leading-none">
                            {day}
                          </span>
                          <span className="mt-0.5 text-[0.65rem] font-semibold uppercase">
                            {month}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-base font-semibold text-ink">
                              {item.title}
                            </h3>
                            {item.pinned ? (
                              <Badge>Disematkan</Badge>
                            ) : index === 0 ? (
                              <Badge>Terbaru</Badge>
                            ) : null}
                          </div>
                          <time
                            dateTime={item.publishedAt}
                            className="mt-1 block text-sm text-muted"
                          >
                            {formatDate(item.publishedAt)}
                          </time>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  to={routes.announcements}
                  className="mt-6 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Lihat semua pengumuman
                </Link>
              </div>

              <div className="overflow-hidden rounded-card border border-line bg-surface">
                <Picture
                  src={announcementVisual}
                  alt="Ilustrasi 3D tangga dan bola persentase ekonomi"
                  width={400}
                  height={300}
                  sizes="(min-width: 1024px) 32vw, 100vw"
                  className="aspect-[4/3] w-full"
                  imageClassName="h-full w-full object-cover"
                />
                <div className="p-5">
                  <p className="text-sm leading-relaxed text-muted">
                    Informasi resmi fakultas untuk mahasiswa dan dosen.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
