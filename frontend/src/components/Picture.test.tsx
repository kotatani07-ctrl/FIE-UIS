import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Picture } from "./Picture";

describe("Picture", () => {
  it("shows an accessible fallback when the image source is missing", () => {
    render(
      <Picture
        alt="Logo universitas"
        width={475}
        height={408}
        sizes="3.5rem"
        fallbackLabel="UIS"
      />,
    );

    expect(screen.getByRole("img", { name: "Logo universitas" })).toBeVisible();
    expect(screen.getByText("UIS")).toBeVisible();
  });

  it("rejects cross-origin image URLs and prioritizes the LCP image", () => {
    const { container } = render(
      <Picture
        src="https://images.example.test/foto.webp"
        alt="Foto fakultas"
        width={800}
        height={450}
        sizes="100vw"
        priority
      />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("img", { name: "Foto fakultas" })).toBeVisible();
  });

  it("sets responsive dimensions and lazy loading for non-priority images", () => {
    const { container } = render(
      <Picture
        src="/media/foto.webp"
        srcSet="/media/foto-480.webp 480w, /media/foto-960.webp 960w"
        avifSrcSet="/media/foto-480.avif 480w"
        alt="Kegiatan fakultas"
        width={960}
        height={540}
        sizes="(max-width: 48rem) 100vw, 50vw"
      />,
    );
    const image = container.querySelector("img");

    expect(image).toHaveAttribute("width", "960");
    expect(image).toHaveAttribute("height", "540");
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("sizes", "(max-width: 48rem) 100vw, 50vw");
    expect(container.querySelectorAll("source")).toHaveLength(2);
  });
});
