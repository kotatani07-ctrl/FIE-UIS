import { usePrograms } from "@/api/hooks";
import { ListEmpty, ListError, LoadingBlock } from "@/components/ListFeedback";
import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { ProgramList } from "@/components/ProgramList";
import { Container, Pagination } from "@/components/ui";
import { routes } from "@/app/routes";
import { programCard } from "@/lib/content";
import { site } from "@/lib/site";
import { useSearchParams } from "react-router-dom";

const PAGE_SIZE = 50;

export function ProgramsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const { data, isPending, isError, refetch } = usePrograms(page, PAGE_SIZE);
  const programs = (data?.results ?? []).map(programCard);
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

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
          <>
            <ProgramList items={programs} />
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
