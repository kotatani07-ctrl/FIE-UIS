import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App foundation", () => {
  it("renders the official faculty name as the page heading", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Fakultas Ilmu Ekonomi" }),
    ).toBeInTheDocument();
  });
});
