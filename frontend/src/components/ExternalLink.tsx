import type { AnchorHTMLAttributes, ReactNode } from "react";

type ExternalLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "target" | "rel"
> & {
  href: string;
  children: ReactNode;
};

function resolveExternalHref(href: string): URL | null {
  try {
    const url = new URL(href);
    if (
      url.username ||
      url.password ||
      !["http:", "https:", "mailto:", "tel:"].includes(url.protocol)
    ) {
      return null;
    }
    return url;
  } catch (error) {
    if (error instanceof TypeError) {
      return null;
    }
    throw error;
  }
}

export function ExternalLink({ href, children, ...rest }: ExternalLinkProps) {
  const url = resolveExternalHref(href);
  if (!url) {
    return null;
  }

  const opensNewTab = url.protocol === "http:" || url.protocol === "https:";
  return (
    <a
      href={url.href}
      {...(opensNewTab ? { target: "_blank" } : {})}
      rel="noopener noreferrer"
      {...rest}
    >
      {children}
      {opensNewTab ? <span className="sr-only">(membuka tab baru)</span> : null}
    </a>
  );
}
