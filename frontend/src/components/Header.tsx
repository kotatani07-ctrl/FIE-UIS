import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { routes } from "@/app/routes";
import { navigation, site } from "@/lib/site";
import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";
import { Container, LinkButton } from "./ui";

const FOCUSABLE = "a[href], button:not([disabled])";

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `group relative inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-2.5 text-sm font-semibold transition-[color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-surface-2 focus-visible:bg-surface-2 ${
    isActive ? "text-brand-700" : "text-muted hover:text-ink"
  }`;

export function Header() {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) {
        triggerRef.current?.focus();
      }
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;

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
    <header className="sticky top-0 z-50 border-b border-line/70 bg-surface/90 backdrop-blur">
      <Container className="flex items-center justify-between gap-4 py-3">
        <Link
          to={routes.home}
          className="flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
        >
          <BrandLogo className="h-12 w-14 shrink-0 rounded-lg bg-white p-1" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-base font-bold text-ink">
              {site.facultyName}
            </span>
            <span className="text-xs text-muted">{site.universityName}</span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === routes.home}
                  className={navItemClass}
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-x-2.5 bottom-1.5 h-0.5 origin-left rounded-full bg-accent-400 transition-transform duration-200 ${
                          isActive
                            ? "scale-x-100"
                            : "scale-x-0 group-hover:scale-x-100 group-focus:scale-x-100 group-focus-visible:scale-x-100"
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden xl:block">
            <LinkButton to={routes.contact}>Informasi Pendaftaran</LinkButton>
          </div>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label="Buka menu navigasi"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-line bg-surface text-ink transition-colors hover:border-brand-500 lg:hidden"
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

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-brand-900/50"
            aria-label="Tutup menu navigasi"
            onClick={() => setOpen(false)}
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
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-line text-ink"
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
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-4 py-3 text-base font-semibold text-ink transition-colors hover:bg-surface-2"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <Link
              to={routes.contact}
              onClick={() => setOpen(false)}
              className="mt-auto inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Informasi Pendaftaran
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
