import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "./Icon";

interface NavLink {
  label: string;
  href: string;
  group: string;
}

function collectLinks(): NavLink[] {
  const nav = document.getElementById("nav-sidebar");
  if (!nav) return [];

  const found = new Map<string, NavLink>();
  nav.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href === "#" || href.startsWith("javascript:")) return;
    const label = (link.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!label || found.has(href)) return;
    const group = link.closest("[data-nav-group]")?.querySelector(".fie-nav-group-label")?.textContent?.trim() ?? "Navigasi";
    found.set(href, { label, href, group });
  });
  return Array.from(found.values());
}

export function AdminEnhancer() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [links, setLinks] = useState<NavLink[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const openSearch = useCallback(() => {
    setLinks(collectLinks());
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    const trigger = document.getElementById("fie-menu-trigger");
    const overlay = document.getElementById("fie-nav-overlay");
    const sidebar = document.getElementById("nav-sidebar");

    const setNavOpen = (next: boolean) => {
      document.body.classList.toggle("fie-nav-open", next);
      trigger?.setAttribute("aria-expanded", String(next));
      overlay?.classList.toggle("is-visible", next);
      overlay?.setAttribute("aria-hidden", String(!next));
    };

    const onTrigger = () =>
      setNavOpen(!document.body.classList.contains("fie-nav-open"));
    const onOverlay = () => setNavOpen(false);
    const onSidebarClick = (event: MouseEvent) => {
      if ((event.target as Element).closest("a")) setNavOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 1024) setNavOpen(false);
    };

    trigger?.addEventListener("click", onTrigger);
    overlay?.addEventListener("click", onOverlay);
    sidebar?.addEventListener("click", onSidebarClick);
    window.addEventListener("resize", onResize);

    const filter = document.getElementById("nav-filter") as HTMLInputElement | null;
    const onFilter = () => {
      const queryValue = (filter?.value ?? "").trim().toLowerCase();
      document.querySelectorAll<HTMLElement>("[data-nav-group]").forEach((group) => {
        let visible = 0;
        group.querySelectorAll<HTMLAnchorElement>(".fie-nav-link").forEach((link) => {
          const matches = !queryValue || (link.textContent ?? "").toLowerCase().includes(queryValue);
          const row = link.closest("li") ?? link;
          row.style.display = matches ? "" : "none";
          if (matches) visible += 1;
        });
        group.style.display = visible ? "" : "none";
      });
      filter?.classList.remove("no-results");
    };
    filter?.addEventListener("input", onFilter);

    const labelTables = () => {
      document.querySelectorAll<HTMLTableElement>("#changelist table").forEach((table) => {
        const headerCells = Array.from(table.querySelectorAll("thead th"));
        const labels = headerCells.map((cell, index) => {
          const text = (cell.textContent ?? "").replace(/\s+/g, " ").trim();
          return text || (index === 0 ? "Pilih" : "");
        });
        table.querySelectorAll("tbody tr").forEach((row) => {
          Array.from(row.children).forEach((cell, index) => {
            if (!(cell instanceof HTMLElement) || cell.dataset.label) return;
            const label = labels[index];
            if (label) cell.dataset.label = label;
          });
        });
      });
    };
    labelTables();

    return () => {
      trigger?.removeEventListener("click", onTrigger);
      overlay?.removeEventListener("click", onOverlay);
      sidebar?.removeEventListener("click", onSidebarClick);
      window.removeEventListener("resize", onResize);
      filter?.removeEventListener("input", onFilter);
    };
  }, []);

  useEffect(() => {
    const trigger = document.getElementById("fie-command-trigger");
    const onTrigger = () => openSearch();
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) {
          close();
        } else {
          openSearch();
        }
      }
      if (event.key === "Escape") close();
    };
    trigger?.addEventListener("click", onTrigger);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      trigger?.removeEventListener("click", onTrigger);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, openSearch, close]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    document.body.classList.toggle("fie-command-open", open);
    return () => document.body.classList.remove("fie-command-open");
  }, [open]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return links.slice(0, 14);
    return links
      .filter((link) => `${link.label} ${link.group}`.toLowerCase().includes(needle))
      .slice(0, 14);
  }, [links, query]);

  if (!open) return null;

  return (
    <div
      className="fie-command-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="fie-command-dialog" role="dialog" aria-modal="true" aria-labelledby="fie-command-title">
        <h2 id="fie-command-title" className="visually-hidden">Cari menu admin</h2>
        <div className="fie-command-input-row">
          <Icon name="search" className="h-5 w-5 shrink-0 text-muted" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari menu, model, atau aksi..."
            aria-label="Cari menu admin"
            autoComplete="off"
          />
          <kbd className="fie-kbd">Esc</kbd>
        </div>

        <div className="fie-command-results">
          {filtered.length ? (
            filtered.map((link) => (
              <a key={link.href} href={link.href} className="fie-command-item" onClick={close}>
                <span className="fie-command-item-icon"><Icon name="arrow" className="h-3.5 w-3.5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{link.label}</span>
                  <span className="block truncate text-[11px] text-muted">{link.group}</span>
                </span>
                <span className="fie-command-enter">Buka</span>
              </a>
            ))
          ) : (
            <p className="fie-command-empty">Tidak ada menu yang cocok dengan “{query}”.</p>
          )}
        </div>

        <div className="fie-command-foot">
          <span><kbd className="fie-kbd">Ctrl K</kbd> membuka pencarian</span>
          <span><kbd className="fie-kbd">Esc</kbd> menutup</span>
        </div>
      </div>
    </div>
  );
}
