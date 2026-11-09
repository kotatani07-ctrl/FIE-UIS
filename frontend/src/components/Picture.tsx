import { useState } from "react";

type PictureProps = {
  src?: string | null;
  srcSet?: string;
  avifSrcSet?: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  fallbackLabel?: string;
  fit?: "cover" | "contain";
};

function isSafeMediaUrl(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }
  try {
    const url = new URL(value);
    return (
      url.origin === window.location.origin &&
      !url.username &&
      !url.password &&
      (url.protocol === "http:" || url.protocol === "https:")
    );
  } catch (error) {
    if (error instanceof TypeError) {
      return false;
    }
    throw error;
  }
}

function safeSrcSet(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const candidates = value.split(",").map((candidate) => {
    const [url, descriptor, ...rest] = candidate.trim().split(/\s+/);
    const validDescriptor = /^\d+w$|^\d+(?:\.\d+)?x$/.test(descriptor ?? "");
    if (!url || rest.length > 0 || !validDescriptor || !isSafeMediaUrl(url)) {
      return undefined;
    }
    return `${url} ${descriptor}`;
  });
  if (candidates.some((candidate) => candidate === undefined)) {
    return undefined;
  }
  return candidates
    .filter((candidate): candidate is string => Boolean(candidate))
    .join(", ");
}

export function Picture({
  src,
  srcSet,
  avifSrcSet,
  alt,
  width,
  height,
  sizes,
  priority = false,
  className = "",
  imageClassName = "",
  fallbackLabel,
  fit = "cover",
}: PictureProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const safeSource = src && isSafeMediaUrl(src) ? src : undefined;
  const safeSrcSetValue = safeSrcSet(srcSet);
  const safeAvifSrcSet = safeSrcSet(avifSrcSet);

  if (!safeSource || failedSrc === safeSource) {
    return (
      <div
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`flex items-center justify-center overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white ${className}`}
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {fallbackLabel ? (
          <span className="px-3 text-center text-xs font-semibold tracking-wide">
            {fallbackLabel}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <picture className={`block overflow-hidden ${className}`}>
      {safeAvifSrcSet ? (
        <source type="image/avif" srcSet={safeAvifSrcSet} sizes={sizes} />
      ) : null}
      {safeSrcSetValue ? (
        <source srcSet={safeSrcSetValue} sizes={sizes} />
      ) : null}
      <img
        src={safeSource}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        onError={() => setFailedSrc(safeSource ?? null)}
        className={`h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"} ${imageClassName}`}
      />
    </picture>
  );
}
