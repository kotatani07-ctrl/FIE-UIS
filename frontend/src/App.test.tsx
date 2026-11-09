import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App foundation", () => {
  it("renders the official faculty name as the page heading", () => {
    window.history.pushState({}, "", "/");
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Fakultas Ilmu Ekonomi" }),
    ).toBeInTheDocument();
  });

  it("shows a noindex not-found page for unknown client routes", () => {
    window.history.pushState({}, "", "/halaman-tidak-ada");
    render(<App />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Halaman tidak ditemukan",
      }),
    ).toBeVisible();
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
  });

  it("renders the program studi page for /prodi", () => {
    window.history.pushState({}, "", "/prodi");
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Program studi sarjana" }),
    ).toBeInTheDocument();
  });

  it("renders the berita page for /informasi/berita", () => {
    window.history.pushState({}, "", "/informasi/berita");
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Berita dan artikel" }),
    ).toBeInTheDocument();
  });
});
