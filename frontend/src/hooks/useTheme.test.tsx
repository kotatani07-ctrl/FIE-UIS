import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "./useTheme";

describe("theme preference", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "light";
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
  });

  it.each([
    ["light", "light"],
    ["dark", "dark"],
    ["system", "dark"],
  ] as const)(
    "resolves the stored %s preference",
    async (preference, theme) => {
      localStorage.setItem("theme", preference);
      render(<ThemeToggle />);

      await waitFor(() => {
        expect(document.documentElement.dataset.theme).toBe(theme);
      });
    },
  );

  it("cycles only through the supported theme preferences", async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Sistem"),
    );
    await act(async () => button.click());
    expect(localStorage.getItem("theme")).toBe("light");
    await act(async () => button.click());
    expect(localStorage.getItem("theme")).toBe("dark");
    await act(async () => button.click());
    expect(localStorage.getItem("theme")).toBe("system");
  });

  it("keeps a selected theme when the operating system preference changes", () => {
    localStorage.setItem("theme", "light");
    const addChangeListener = vi.fn();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: addChangeListener,
        removeEventListener: vi.fn(),
      }),
    );
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setThemePref("light"));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(addChangeListener).not.toHaveBeenCalled();
  });
});
