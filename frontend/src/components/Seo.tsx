type SeoProps = {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
};

function canonicalUrl(path: string): string | undefined {
  const siteUrl = import.meta.env.VITE_SITE_URL ?? window.location.origin;
  const parsedSiteUrl = new URL(siteUrl, window.location.origin);
  if (!["http:", "https:"].includes(parsedSiteUrl.protocol)) {
    return undefined;
  }
  const siteOrigin = parsedSiteUrl.origin;
  const canonical = new URL(path, `${siteOrigin}/`);
  return canonical.origin === siteOrigin ? canonical.href : undefined;
}

export function Seo({ title, description, path, noindex = false }: SeoProps) {
  const canonical = canonicalUrl(path ?? window.location.pathname);

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow"}
      />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="twitter:card" content="summary" />
      {canonical ? <link rel="canonical" href={canonical} /> : null}
    </>
  );
}
