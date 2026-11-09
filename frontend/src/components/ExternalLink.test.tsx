import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExternalLink } from "./ExternalLink";

describe("ExternalLink", () => {
  it("adds protective attributes to web links", () => {
    render(
      <ExternalLink href="https://example.test/">Situs resmi</ExternalLink>,
    );
    const link = screen.getByRole("link", { name: /Situs resmi/ });

    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not render a link with an unsafe protocol", () => {
    const { queryByRole } = render(
      <ExternalLink href="javascript:alert(1)">Tautan</ExternalLink>,
    );

    expect(queryByRole("link")).toBeNull();
  });
});
