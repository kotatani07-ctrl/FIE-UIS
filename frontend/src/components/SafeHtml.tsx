import DOMPurify from "dompurify";
import { useMemo } from "react";

const ALLOWED_TAGS = [
  "a",
  "blockquote",
  "br",
  "code",
  "em",
  "figcaption",
  "figure",
  "h2",
  "h3",
  "h4",
  "hr",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
];
const ALLOWED_ATTR = [
  "alt",
  "colspan",
  "height",
  "href",
  "rowspan",
  "scope",
  "src",
  "title",
  "width",
];
const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto|tel):|\/(?!\/)|#|\.{1,2}\/)/i;

function sanitizeRichHtml(html: string): string {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_ATTR,
    ALLOWED_TAGS,
    ALLOWED_URI_REGEXP,
    FORBID_ATTR: ["style"],
    FORBID_TAGS: ["iframe", "script", "style", "svg"],
  });
  const parsed = new DOMParser().parseFromString(clean, "text/html");

  for (const link of parsed.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href");
    if (!href) {
      continue;
    }
    const url = new URL(href, window.location.origin);
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin !== window.location.origin
    ) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }
  }

  for (const image of parsed.querySelectorAll("img")) {
    image.setAttribute("loading", "lazy");
    image.setAttribute("decoding", "async");
    if (!image.hasAttribute("alt")) {
      image.setAttribute("alt", "");
    }
  }

  const container = document.createElement("div");
  container.append(...Array.from(parsed.body.childNodes));
  return container.innerHTML;
}

export function SafeHtml({ html }: { html: string }) {
  const sanitizedHtml = useMemo(() => sanitizeRichHtml(html), [html]);
  return (
    <div
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      className="safe-html"
    />
  );
}
