import { useUpcomingEvents } from "@/api/hooks";
import { ListEmpty, ListError, LoadingBlock } from "@/components/ListFeedback";
import { Reveal } from "@/components/Reveal";
import { Container, SectionHeading } from "@/components/ui";
import { formatDateTime, formatDateParts } from "@/lib/formatDate";
import { agendaCard } from "@/lib/content";

export function Agenda() {
  const { data, isPending, isError, refetch } = useUpcomingEvents();
  const items = (data?.results ?? []).map(agendaCard);

  return (
    <section
      id="agenda"
      aria-labelledby="agenda-title"
      className="border-b border-line bg-surface-2 py-20 lg:py-24"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="agenda-title"
            title="Kegiatan mendatang"
            description="Kegiatan akademik dan sosialisasi yang akan datang."
          />
        </Reveal>

        <Reveal delay={100}>
          {isPending ? (
            <LoadingBlock label="Memuat agenda" rows={3} />
          ) : isError ? (
            <ListError onRetry={() => refetch()} />
          ) : items.length === 0 ? (
            <ListEmpty
              title="Belum ada agenda mendatang"
              description="Agenda akan tampil di sini setelah diterbitkan."
            />
          ) : (
            <ul className="mt-10 divide-y divide-line border-y border-line">
              {items.map((item) => {
                const { day, month } = formatDateParts(item.startAt);
                return (
                  <li
                    key={item.slug}
                    className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:gap-6"
                  >
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-surface text-brand-700 ring-1 ring-line">
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
                      <h3 className="mt-1 font-display text-lg font-bold text-ink">
                        {item.title}
                      </h3>
                    </div>
                    <p className="shrink-0 text-sm text-muted sm:ml-auto">
                      {item.location}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
