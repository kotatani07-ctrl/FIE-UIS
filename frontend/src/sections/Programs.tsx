import { usePrograms } from "@/api/hooks";
import { ListEmpty, ListError, LoadingBlock } from "@/components/ListFeedback";
import { ProgramList } from "@/components/ProgramList";
import { Reveal } from "@/components/Reveal";
import { Container, LinkButton, SectionHeading } from "@/components/ui";
import { routes } from "@/app/routes";
import { programCard } from "@/lib/content";

export function Programs() {
  const { data, isPending, isError, refetch } = usePrograms();
  const programs = (data?.results ?? []).map(programCard);

  return (
    <section
      id="program-studi"
      aria-labelledby="prodi-title"
      className="border-b border-line bg-surface-2 py-20 lg:py-24"
    >
      <Container>
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              id="prodi-title"
              title="Program studi sarjana"
              description="Pilih jalur yang paling sesuai dengan minat dan rencana karier Anda."
            />
            <LinkButton to={routes.programs} variant="secondary">
              Semua program studi
            </LinkButton>
          </div>
        </Reveal>

        <Reveal delay={100}>
          {isPending ? (
            <LoadingBlock
              label="Memuat program studi"
              rows={2}
              className="h-36"
            />
          ) : isError ? (
            <ListError onRetry={() => refetch()} />
          ) : programs.length === 0 ? (
            <ListEmpty
              title="Belum ada program studi"
              description="Program studi akan tampil di sini setelah diterbitkan."
            />
          ) : (
            <div className="mt-10">
              <ProgramList items={programs} />
            </div>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
