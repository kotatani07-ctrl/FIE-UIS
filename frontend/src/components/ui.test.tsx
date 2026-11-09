import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Dialog, Input, Pagination, SearchBox, Tabs } from "./ui";

describe("shared UI primitives", () => {
  it("connects field errors to their form control", () => {
    render(
      <Input
        id="email"
        label="Alamat email"
        type="email"
        error="Masukkan email yang valid."
      />,
    );
    const input = screen.getByRole("textbox", { name: "Alamat email" });

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "email-error");
    expect(screen.getByText("Masukkan email yang valid.")).toHaveAttribute(
      "id",
      "email-error",
    );
  });

  it("trims a search query before submitting", () => {
    const onSearch = vi.fn();
    render(<SearchBox onSearch={onSearch} />);
    const input = screen.getByRole("searchbox", { name: "Cari informasi" });

    fireEvent.change(input, { target: { value: "  pajak  " } });
    fireEvent.submit(screen.getByRole("search"));

    expect(onSearch).toHaveBeenCalledWith("pajak");
  });

  it("supports arrow-key navigation between tabs", () => {
    render(
      <Tabs
        items={[
          { label: "Berita", content: <p>Konten berita</p> },
          { label: "Agenda", content: <p>Konten agenda</p> },
        ]}
      />,
    );
    const newsTab = screen.getByRole("tab", { name: "Berita" });
    const eventTab = screen.getByRole("tab", { name: "Agenda" });

    newsTab.focus();
    fireEvent.keyDown(newsTab, { key: "ArrowRight" });

    expect(eventTab).toHaveFocus();
    expect(eventTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Konten agenda")).toBeVisible();
    expect(screen.getByText("Konten berita")).not.toBeVisible();
  });

  it("locks scrolling and returns focus when a dialog closes", () => {
    function DialogHarness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Buka dialog
          </button>
          <Dialog
            open={open}
            title="Detail informasi"
            onClose={() => setOpen(false)}
          >
            <p>Isi dialog.</p>
          </Dialog>
        </>
      );
    }

    render(<DialogHarness />);
    const trigger = screen.getByRole("button", { name: "Buka dialog" });
    trigger.focus();
    fireEvent.click(trigger);

    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
    expect(trigger).toHaveFocus();
  });

  it("disables pagination controls at the edges", () => {
    render(
      <Pagination currentPage={1} totalPages={3} onPageChange={vi.fn()} />,
    );

    expect(
      screen.getByRole("button", { name: "Halaman sebelumnya" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Halaman berikutnya" }),
    ).toBeEnabled();
  });
});
