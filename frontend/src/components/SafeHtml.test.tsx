import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SafeHtml } from "./SafeHtml";

describe("SafeHtml", () => {
  it("removes scripts, event handlers, unsafe URLs, and inline styles", () => {
    const { container } = render(
      <SafeHtml
        html={
          '<p style="color:red">Aman</p><script>alert(1)</script><img src="/media/foto.webp" onerror="alert(1)"><a href="javascript:alert(1)">tautan</a>'
        }
      />,
    );

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[style]")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(container.querySelector("img")).toHaveAttribute("loading", "lazy");
    expect(container.querySelector("img")).toHaveAttribute("decoding", "async");
  });

  it("opens external links with protective rel values", () => {
    const { container } = render(
      <SafeHtml html='<p><a href="https://example.test/berita">Baca</a></p>' />,
    );
    const link = container.querySelector("a");

    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
