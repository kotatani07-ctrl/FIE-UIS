import { ExternalLink } from "./ExternalLink";

const FALLBACK_EMBED_URL =
  "https://www.google.com/maps?q=-6.2912708,106.7051347&z=17&output=embed";
const FALLBACK_LINK_URL = "https://maps.app.goo.gl/zjs2qfABjZ4A2qpB8";

export function LocationMap({ embedUrl }: { embedUrl?: string }) {
  const src = embedUrl?.includes("output=embed")
    ? embedUrl
    : FALLBACK_EMBED_URL;
  const linkHref = embedUrl || FALLBACK_LINK_URL;

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <iframe
          title="Peta lokasi Universitas Ichsan Satya"
          src={src}
          width={400}
          height={300}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="aspect-[4/3] w-full border-0"
        />
      </div>
      <ExternalLink
        href={linkHref}
        className="mt-3 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700"
      >
        Buka di Google Maps
      </ExternalLink>
    </div>
  );
}
