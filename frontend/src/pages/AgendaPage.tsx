import { useEventsList } from "@/api/hooks";
import { ListEmpty, ListError, LoadingBlock } from "@/components/ListFeedback";
import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { Container, Pagination } from "@/components/ui";
import { routes } from "@/app/routes";
import { formatDateTime, formatDateParts } from "@/lib/formatDate";
import { agendaCard } from "@/lib/content";
import { site } from "@/lib/site";
import { useSearchParams } from "react-router-dom";

const PAGE_SIZE = 12;

const WHEN_OPTIONS = [
  { value: "upcoming", label: "Mendatang" },
  { value: "past", label: "Lampau" },
  { value: "all", label: "Semua" },
] as const;

type When = (typeof WHEN_OPTIONS)[number]["value"];

function tabClass(active: boolean): string {
  return `inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
    active
      ? "bg-brand-600 text-white"
      : "bg-surface-2 text-ink hover:bg-surface hover:text-brand-600"
  }`;
}

export function AgendaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const whenParam = searchParams.get("when");
  const when: When =
    whenParam === "past" || whenParam === "all" ? whenParam : "upcoming";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const { data, isPending, isError, refetch } = useEventsList(when, page);
  const items = (data?.results ?? []).map(agendaCard);
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  function updateSearchParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams);
    mutate(params);
    setSearchParams(params);
  }

  return (
    <PageShell
      title={`Agenda | ${site.facultyName}`}
      description="Agenda akademik dan kegiatan Fakultas Ilmu Ekonomi."
      path={routes.agenda}
    >
      <PageHeader
        title="Agenda fakultas"
        description="Kegiatan akademik, sosialisasi, dan kegiatan fakultas."
      />
      <Container className="pb-20 lg:pb-24">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter agenda"
        >
          {WHEN_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={when === option.value}
              onClick={() =>
                updateSearchParams((params) => {
                  if (option.value === "upcoming") {
                    params.delete("when");
                  } else {
                    params.set("when", option.value);
                  }
                  params.delete("page");
                })
              }
              className={tabClass(when === option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {isPending ? (
          <LoadingBlock label="Memuat agenda" rows={4} className="h-24" />
        ) : isError ? (
          <ListError onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <ListEmpty
            title={
              when === "past"
                ? "Belum ada agenda lampau"
                : "Belum ada agenda mendatang"
            }
            description="Agenda akan tampil di sini setelah diterbitkan."
          />
        ) : (
          <>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {items.map((item) => {
                const { day, month } = formatDateParts(item.startAt);
                return (
                  <li
                    key={item.slug}
                    className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:gap-6"
                  >
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <span className="font-display text-2xl font-bold leading-none">
                        {day}
                      </span>
                      <span className="mt-0.5 text-[0.65rem] font-semibold uppercase">
                        {month}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <time
                        dateTime={item.startAt}
                        className="text-sm font-semibold text-brand-600"
                      >
                        {formatDateTime(item.startAt)}
                      </time>
                      <h2 className="mt-1 font-display text-lg font-bold text-ink">
                        {item.title}
                      </h2>
                    </div>
                    <p className="shrink-0 text-sm text-muted sm:ml-auto">
                      {item.location}
                    </p>
                  </li>
                );
              })}
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
