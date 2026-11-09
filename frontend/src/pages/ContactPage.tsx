import { useSiteSettings } from "@/api/hooks";
import { LoadingBlock } from "@/components/ListFeedback";
import { LocationMap } from "@/components/LocationMap";
import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { Container, ErrorState } from "@/components/ui";
import { ExternalLink } from "@/components/ExternalLink";
import { routes } from "@/app/routes";
import { site } from "@/lib/site";

const SOCIALS = [
  { key: "social_instagram", label: "Instagram" },
  { key: "social_facebook", label: "Facebook" },
  { key: "social_youtube", label: "YouTube" },
  { key: "social_linkedin", label: "LinkedIn" },
] as const;

export function ContactPage() {
  const { data, isPending, isError, refetch } = useSiteSettings();

  const rows = [
    { label: "Alamat", value: data?.address },
    { label: "Telepon", value: data?.phone },
    { label: "Email", value: data?.email },
  ];

  const socials = data
    ? SOCIALS.filter((social) => data[social.key]).map((social) => ({
        label: social.label,
        href: data[social.key],
      }))
    : [];

  return (
    <PageShell
      title={`Kontak | ${site.facultyName}`}
      description="Kanal resmi Fakultas Ilmu Ekonomi untuk informasi akademik dan pendaftaran."
      path={routes.contact}
    >
      <PageHeader
        title="Kontak"
        description="Kanal resmi fakultas untuk informasi akademik dan pendaftaran mahasiswa baru."
      />
      <Container className="grid gap-10 pb-20 lg:grid-cols-2 lg:pb-24">
        <div>
          {isPending ? (
            <LoadingBlock label="Memuat kontak" rows={3} className="h-10" />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <>
              <dl className="divide-y divide-line border-y border-line">
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[6rem_1fr] gap-4 py-4"
                  >
                    <dt className="text-sm font-semibold text-muted">
                      {row.label}
                    </dt>
                    <dd className="break-words text-sm text-ink">
                      {row.value?.trim() || "Belum tersedia"}
                    </dd>
                  </div>
                ))}
              </dl>

              {data?.pmb_url ? (
                <ExternalLink
                  href={data.pmb_url}
                  className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Pendaftaran PMB
                </ExternalLink>
              ) : null}

              {socials.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                  {socials.map((social) => (
                    <ExternalLink
                      key={social.label}
                      href={social.href}
                      className="text-sm font-medium text-muted hover:text-brand-600"
                    >
                      {social.label}
                    </ExternalLink>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-ink">
            Lokasi
          </h2>
          <p className="mt-2 text-sm text-muted">
            {data?.university_name ?? site.universityName}
          </p>
          <div className="mt-4">
            <LocationMap embedUrl={data?.maps_embed_url || undefined} />
          </div>
        </div>
      </Container>
    </PageShell>
  );
}
