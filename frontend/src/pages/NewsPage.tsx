import { useNewsCategories, useNewsList } from "@/api/hooks";
import { ListEmpty, ListError, LoadingBlock } from "@/components/ListFeedback";
import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { Picture } from "@/components/Picture";
import { Badge, Container, Pagination } from "@/components/ui";
import { routes } from "@/app/routes";
import { formatDate } from "@/lib/formatDate";
import { newsCard, type NewsCard } from "@/lib/content";
import { site } from "@/lib/site";
import { useSearchParams } from "react-router-dom";

const PAGE_SIZE = 12;

function chipClass(active: boolean): string {
  return `inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
    active
      ? "bg-brand-600 text-white"
      : "bg-surface-2 text-ink hover:bg-surface hover:text-brand-600"
  }`;
}

function NewsCardItem({ item }: { item: NewsCard }) {
  return (
    <li className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface">
      <Picture
        src={item.image}
        alt={item.imageAlt}
        width={800}
        height={450}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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
        <h2 className="mt-3 font-display text-lg font-bold leading-snug text-ink">
          {item.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {item.excerpt}
        </p>
      </div>
    </li>
  );
}

export function NewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const category = searchParams.get("kategori") ?? "";
  const { data, isPending, isError, refetch } = useNewsList(
    page,
    category || undefined,
  );
  const categories = useNewsCategories();
  const items = (data?.results ?? []).map(newsCard);
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  function updateSearchParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams);
    mutate(params);
    setSearchParams(params);
  }

  return (
    <PageShell
      title={`Berita dan Artikel | ${site.facultyName}`}
      description="Berita, artikel, dan informasi terbaru dari Fakultas Ilmu Ekonomi."
      path={routes.news}
    >
      <PageHeader
        title="Berita dan artikel"
        description="Kabar akademik, kegiatan, dan informasi resmi terbaru dari fakultas."
      />
      <Container className="pb-20 lg:pb-24">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter kategori berita"
        >
          <button
            type="button"
            aria-pressed={!category}
            onClick={() =>
              updateSearchParams((params) => {
                params.delete("kategori");
                params.delete("page");
              })
            }
            className={chipClass(!category)}
          >
            Semua
          </button>
          {(categories.data ?? []).map((item) => (
            <button
              key={item.slug}
              type="button"
              aria-pressed={category === item.slug}
              onClick={() =>
                updateSearchParams((params) => {
                  params.set("kategori", item.slug);
                  params.delete("page");
                })
              }
              className={chipClass(category === item.slug)}
            >
              {item.name}
            </button>
          ))}
        </div>

        {isPending ? (
          <LoadingBlock label="Memuat berita" rows={3} className="h-64" />
        ) : isError ? (
          <ListError onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <ListEmpty
            title="Belum ada berita"
            description="Berita akan tampil di sini setelah diterbitkan."
          />
        ) : (
          <>
            <ul className="mt-8 grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <NewsCardItem key={item.slug} item={item} />
              ))}
            </ul>
            <div className="mt-10">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(next) =>
                  updateSearchParams((params) => {
                    if (next <= 1) {
                      params.delete("page");
                    } else {
                      params.set("page", String(next));
                    }
                  })
                }
              />
            </div>
          </>
        )}
      </Container>
    </PageShell>
  );
}
