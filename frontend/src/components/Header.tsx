import { useEffect, useRef, useState } from "react";
import { navigation, site } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";
import { Container, LinkButton } from "./ui";

const FOCUSABLE = "a[href], button:not([disabled])";

function Logo() {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 font-display text-sm font-bold text-white">
      FIE
    </span>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const node = drawerRef.current;
      if (!node) {
        return;
      }
      const focusable = node.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const target = drawerRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus();
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-brand-900 py-2 text-center text-xs text-white/90">
        Pratinjau pengembangan — sebagian konten masih berupa data contoh.
      </div>

      <div className="border-b border-line/70 bg-surface/80 backdrop-blur">
        <Container className="flex items-center justify-between gap-4 py-3">
          <a href="#beranda" className="flex items-center gap-3">
            <Logo />
            <span className="flex flex-col leading-tight">
              <span className="font-display text-base font-bold text-ink">
                {site.facultyName}
              </span>
              <span className="text-xs text-muted">{site.universityName}</span>
            </span>
          </a>

          <nav aria-label="Navigasi utama" className="hidden lg:block">
            <ul className="flex items-center gap-0.5">
              {navigation.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-2.5 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LinkButton href="#kontak" className="max-sm:hidden">
              Daftar Sekarang
            </LinkButton>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label="Buka menu navigasi"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-surface text-ink lg:hidden"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </Container>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-brand-900/50"
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            id="menu-mobile"
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-mobile-title"
            className="absolute right-0 top-0 flex h-full w-[min(20rem,88%)] flex-col overflow-y-auto bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2
                id="menu-mobile-title"
                className="font-display text-lg font-bold text-ink"
              >
                Menu
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu navigasi"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line text-ink"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav aria-label="Navigasi mobile" className="mt-6">
              <ul className="flex flex-col gap-1">
                {navigation.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-4 py-3 text-base font-semibold text-ink transition-colors hover:bg-surface-2"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <a
              href="#kontak"
              onClick={() => setOpen(false)}
              className="mt-auto inline-flex min-h-11 items-center justify-center rounded-full bg-brand-600 px-5 text-sm font-semibold text-white"
            >
              Daftar Sekarang
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
