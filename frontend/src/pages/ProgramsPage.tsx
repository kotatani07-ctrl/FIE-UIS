import { usePrograms } from "@/api/hooks";
import { ListEmpty, ListError, LoadingBlock } from "@/components/ListFeedback";
import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { ProgramList } from "@/components/ProgramList";
import { Container } from "@/components/ui";
import { routes } from "@/app/routes";
import { programCard } from "@/lib/content";
import { site } from "@/lib/site";

export function ProgramsPage() {
  const { data, isPending, isError, refetch } = usePrograms();
  const programs = (data?.results ?? []).map(programCard);

  return (
    <PageShell
      title={`Program Studi | ${site.facultyName}`}
      description="Program studi sarjana Fakultas Ilmu Ekonomi beserta jenjang dan ringkasannya."
      path={routes.programs}
    >
      <PageHeader
        title="Program studi sarjana"
        description="Pilih jalur yang paling sesuai dengan minat dan rencana karier Anda."
      />
      <Container className="pb-20 lg:pb-24">
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
          <ProgramList items={programs} />
        )}
      </Container>
    </PageShell>
  );
}
