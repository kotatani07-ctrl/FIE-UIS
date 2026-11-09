import { useAnnouncements } from "@/api/hooks";
import { ListEmpty, ListError, LoadingBlock } from "@/components/ListFeedback";
import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { Badge, Container, Pagination } from "@/components/ui";
import { routes } from "@/app/routes";
import { formatDate, formatDateParts } from "@/lib/formatDate";
import { announcementCard } from "@/lib/content";
import { site } from "@/lib/site";
import { useSearchParams } from "react-router-dom";

const PAGE_SIZE = 12;

export function AnnouncementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const { data, isPending, isError, refetch } = useAnnouncements(PAGE_SIZE);
  const items = (data?.results ?? []).map(announcementCard);
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  return (
    <PageShell
      title={`Pengumuman | ${site.facultyName}`}
      description="Pengumuman resmi Fakultas Ilmu Ekonomi untuk mahasiswa dan dosen."
      path={routes.announcements}
    >
      <PageHeader
        title="Pengumuman resmi"
        description="Informasi resmi fakultas untuk mahasiswa dan dosen."
      />
      <Container className="pb-20 lg:pb-24">
        {isPending ? (
          <LoadingBlock label="Memuat pengumuman" rows={4} className="h-20" />
        ) : isError ? (
          <ListError onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <ListEmpty
            title="Belum ada pengumuman"
            description="Pengumuman akan tampil di sini setelah diterbitkan."
          />
        ) : (
          <>
            <ul className="divide-y divide-line border-y border-line">
              {items.map((item) => {
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
                      <h2 className="font-display text-base font-semibold text-ink">
                        {item.title}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {item.pinned ? <Badge>Disematkan</Badge> : null}
                        <time
                          dateTime={item.publishedAt}
                          className="text-sm text-muted"
                        >
                          {formatDate(item.publishedAt)}
                        </time>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-10">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(next) => {
                  const params = new URLSearchParams(searchParams);
                  if (next <= 1) {
                    params.delete("page");
                  } else {
                    params.set("page", String(next));
                  }
                  setSearchParams(params);
                }}
              />
            </div>
          </>
        )}
      </Container>
    </PageShell>
  );
}
