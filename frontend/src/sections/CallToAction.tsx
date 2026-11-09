import { useSiteSettings } from "@/api/hooks";
import { ExternalLink } from "@/components/ExternalLink";
import { Reveal } from "@/components/Reveal";
import { Container, ErrorState, Skeleton } from "@/components/ui";
import { Link } from "react-router-dom";
import { routes } from "@/app/routes";

const SOCIALS = [
  { key: "social_instagram", label: "Instagram" },
  { key: "social_facebook", label: "Facebook" },
  { key: "social_youtube", label: "YouTube" },
  { key: "social_linkedin", label: "LinkedIn" },
] as const;

export function CallToAction() {
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
    <section
      id="kontak"
      aria-labelledby="kontak-title"
      className="py-20 lg:py-24"
    >
      <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <div>
            <h2
              id="kontak-title"
              className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl"
            >
              Informasi dan kontak
            </h2>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-muted">
              Informasi resmi penerimaan mahasiswa baru dan layanan akademik
              fakultas. Untuk pertanyaan, gunakan kanal resmi berikut.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              <Link
                to={routes.programs}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Program Studi
              </Link>
              <Link
                to={routes.announcements}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Pengumuman
              </Link>
              {data?.pmb_url ? (
                <ExternalLink
                  href={data.pmb_url}
                  className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Pendaftaran PMB
                </ExternalLink>
              ) : null}
            </div>
            {socials.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
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
          </div>
        </Reveal>

        <Reveal delay={100}>
          {isPending ? (
            <div
              role="status"
              aria-live="polite"
              className="border-y border-line py-4"
            >
              <span className="sr-only">Memuat informasi kontak</span>
              <div aria-hidden="true" className="flex flex-col gap-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
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
          )}
        </Reveal>
      </Container>
    </section>
  );
}
