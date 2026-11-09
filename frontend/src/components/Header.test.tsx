import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Header } from "./Header";
import { routes } from "@/app/routes";

function renderHeader() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Header />
    </MemoryRouter>,
  );
}

describe("Header navigation", () => {
  it("traps focus, locks page scrolling, and restores focus when the drawer closes", () => {
    renderHeader();
    const trigger = screen.getByRole("button", { name: "Buka menu navigasi" });

    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Menu" });
    const focusable = dialog.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled])",
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    expect(document.body.style.overflow).toBe("hidden");
    last?.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(first);
    first?.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("navigates to real routes instead of page anchors", () => {
    renderHeader();

    const expected = [
      { label: "Beranda", to: routes.home },
      { label: "Program Studi", to: routes.programs },
      { label: "Berita", to: routes.news },
      { label: "Agenda", to: routes.agenda },
      { label: "Pengumuman", to: routes.announcements },
      { label: "Kontak", to: routes.contact },
    ];
    const nav = screen.getByRole("navigation", { name: "Navigasi utama" });
    for (const item of expected) {
      const link = within(nav).getByRole("link", { name: item.label });
      expect(link.getAttribute("href")).toBe(item.to);
    }
  });
});
