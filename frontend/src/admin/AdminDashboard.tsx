import { useCallback, useEffect, useMemo, useState } from "react";

import { Icon } from "./Icon";
import { firstName, formatDateTime, formatRelative, greeting } from "./format";
import type { DashboardData, RecentNewsItem, StatCard } from "./types";

type LoadState = "loading" | "ready" | "error";

function useDashboardData(url: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (signal?: AbortSignal, background = false) => {
      if (background) {
        setRefreshing(true);
      }
      try {
        const response = await fetch(url, {
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          signal,
        });
        if (!response.ok) {
          throw new Error(`Permintaan gagal (HTTP ${response.status}).`);
        }
        const payload = (await response.json()) as DashboardData;
        setData(payload);
        setError("");
        setState("ready");
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(
          caught instanceof Error ? caught.message : "Data dashboard tidak dapat dimuat.",
        );
        setState("error");
      } finally {
        setRefreshing(false);
      }
    },
    [url],
  );

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, [load]);

  return {
    data,
    state,
    error,
    refreshing,
    reload: () => void load(undefined, true),
  };
}

function StatusBadge({ item }: { item: RecentNewsItem }) {
  return (
    <span className={`fie-status fie-status-${item.status_key}`}>{item.status}</span>
  );
}

function StatCardView({ card }: { card: StatCard }) {
  return (
    <a href={card.href || "#"} className="fie-stat-card group">
      <div className="flex items-start justify-between gap-3">
        <span className={`fie-stat-icon fie-tone-${card.tone}`}>
          <Icon name={card.icon} />
        </span>
        <span className="fie-stat-arrow">
          <Icon name="arrow" className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-[2rem]">
        {card.value.toLocaleString("id-ID")}
      </p>
      <p className="mt-1 text-sm font-semibold text-ink">{card.label}</p>
      <p className="mt-2 text-xs text-muted">{card.detail}</p>
    </a>
  );
}

function TrendPanel({ data }: { data: DashboardData }) {
  const max = Math.max(...data.trend.map((point) => point.count), 1);
  const total = useMemo(
    () => data.trend.reduce((sum, point) => sum + point.count, 0),
    [data.trend],
  );

  return (
    <section className="fie-panel xl:col-span-2" aria-labelledby="fie-trend-title">
      <div className="fie-panel-head">
        <div>
          <p className="fie-panel-kicker">Ritme produksi konten</p>
          <h2 id="fie-trend-title" className="fie-panel-title">
            Aktivitas 6 bulan terakhir
          </h2>
        </div>
        <span className="fie-count-pill">{total} konten baru</span>
      </div>

      <div className="mt-6 flex h-48 items-end gap-2 sm:gap-4" role="img" aria-label={`Grafik konten baru enam bulan terakhir, total ${total}`}>
        {data.trend.map((point) => {
          const ratio = point.count / max;
          return (
            <div key={point.full} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[11px] font-semibold text-muted">{point.count}</span>
              <div className="flex h-full w-full items-end" title={`${point.full}: ${point.count} konten`}>
                <div
                  className="fie-bar w-full rounded-t-lg"
                  style={{ height: `${Math.max(ratio * 100, point.count ? 8 : 2)}%` }}
                />
              </div>
              <span className="text-[11px] font-medium text-muted">{point.label}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-muted">
        Menghitung berita, agenda, pengumuman, dan karya riset yang dibuat dalam enam bulan terakhir.
      </p>
    </section>
  );
}

function QuickActions({ data }: { data: DashboardData }) {
  return (
    <section className="fie-panel" aria-labelledby="fie-actions-title">
      <div className="fie-panel-head">
        <div>
          <p className="fie-panel-kicker">Pintasan</p>
          <h2 id="fie-actions-title" className="fie-panel-title">
            Aksi cepat
          </h2>
        </div>
        <span className="fie-panel-icon"><Icon name="plus" /></span>
      </div>
      <div className="-mx-2 mt-3 space-y-1">
        {data.quick_actions.map((action) => (
          <a key={action.label} href={action.href || "#"} className="fie-quick-action group">
            <span className="fie-quick-icon">
              <Icon name={action.icon} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">{action.label}</span>
              <span className="mt-0.5 block text-xs leading-5 text-muted">{action.description}</span>
            </span>
            <Icon name="arrow" className="ml-auto h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
          </a>
        ))}
      </div>
    </section>
  );
}

function RecentNews({ data }: { data: DashboardData }) {
  return (
    <section className="fie-panel xl:col-span-2" aria-labelledby="fie-news-title">
      <div className="fie-panel-head">
        <div>
          <p className="fie-panel-kicker">Terakhir diperbarui</p>
          <h2 id="fie-news-title" className="fie-panel-title">
            Berita & artikel
          </h2>
        </div>
        <a href={data.cards.find((card) => card.key === "news")?.href ?? "#"} className="fie-text-link">
          Lihat semua <Icon name="arrow" className="h-3.5 w-3.5" />
        </a>
      </div>

      {data.recent_news.length ? (
        <ul className="fie-list mt-4">
          {data.recent_news.map((item) => (
            <li key={item.id} className="fie-list-row group">
              <div className="flex min-w-0 items-start gap-3">
                <span className="fie-list-icon"><Icon name="news" className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <a href={item.url || "#"} className="block truncate text-sm font-semibold text-ink transition hover:text-brand-600">
                    {item.title}
                  </a>
                  <p className="mt-1 text-xs text-muted">
                    {item.kind} <span className="mx-1 text-line">·</span> Diperbarui {formatRelative(item.updated_at)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
                <StatusBadge item={item} />
                <a href={item.url || "#"} className="fie-row-action">
                  Edit <Icon name="arrow" className="h-3.5 w-3.5" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="fie-empty-state mt-4">
          <span className="fie-empty-icon"><Icon name="news" /></span>
          <p>Belum ada berita. Mulai dengan menulis konten pertama.</p>
          <a href={data.cards.find((card) => card.key === "news")?.add_href ?? "#"} className="fie-text-link">
            Tulis berita <Icon name="plus" className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </section>
  );
}

function MessagesPanel({ data }: { data: DashboardData }) {
  return (
    <section className="fie-panel" aria-labelledby="fie-messages-title">
      <div className="fie-panel-head">
        <div>
          <p className="fie-panel-kicker">Kotak masuk</p>
          <h2 id="fie-messages-title" className="fie-panel-title">
            Pesan terbaru
          </h2>
        </div>
        <a href={data.cards.find((card) => card.key === "messages")?.href ?? "#"} className="fie-text-link">
          Semua
        </a>
      </div>

      {data.recent_messages.length ? (
        <ul className="fie-list mt-4">
          {data.recent_messages.map((message) => (
            <li key={message.id} className="fie-message-row">
              <span className={`fie-message-dot ${message.is_read ? "" : "is-unread"}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <a href={message.url || "#"} className={`block truncate text-sm transition hover:text-brand-600 ${message.is_read ? "font-medium text-ink" : "font-semibold text-ink"}`}>
                  {message.subject}
                </a>
                <p className="mt-1 truncate text-xs text-muted">
                  {message.name} <span className="mx-1 text-line">·</span> {message.email}
                </p>
              </div>
              <time className="shrink-0 text-[11px] text-muted" dateTime={message.created_at ?? undefined}>
                {formatRelative(message.created_at)}
              </time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="fie-empty-state mt-4">Belum ada pesan masuk.</p>
      )}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="fie-dashboard" aria-busy="true" aria-label="Memuat dashboard">
      <div className="animate-pulse space-y-5">
        <div className="h-3 w-28 rounded-full bg-surface-3" />
        <div className="h-9 w-2/3 max-w-md rounded-xl bg-surface-3" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-44 rounded-2xl border border-line bg-surface p-5">
              <div className="h-10 w-10 rounded-xl bg-surface-3" />
              <div className="mt-5 h-8 w-20 rounded-lg bg-surface-3" />
              <div className="mt-3 h-3 w-32 rounded-full bg-surface-3" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="h-80 rounded-2xl border border-line bg-surface xl:col-span-2" />
          <div className="h-80 rounded-2xl border border-line bg-surface" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="fie-dashboard">
      <div className="fie-error-panel">
        <span className="fie-error-icon"><Icon name="alert" /></span>
        <p className="fie-panel-kicker">Koneksi terputus</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">Dashboard belum dapat dimuat</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted">{message}</p>
        <button type="button" className="fie-primary-button mt-6" onClick={onRetry}>
          <Icon name="refresh" className="h-4 w-4" /> Coba lagi
        </button>
      </div>
    </div>
  );
}

export function AdminDashboard({ dataUrl }: { dataUrl: string }) {
  const { data, state, error, refreshing, reload } = useDashboardData(dataUrl);

  if (state === "loading") return <DashboardSkeleton />;
  if (state === "error" || !data) return <ErrorState message={error || "Data tidak tersedia."} onRetry={reload} />;

  const newsAddHref = data.cards.find((card) => card.key === "news")?.add_href ?? "#";
  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="fie-dashboard">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="fie-dashboard-eyebrow">Dashboard fakultas</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] text-ink sm:text-4xl">
            {greeting()}, {firstName(data.user.display_name)}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {today} <span className="mx-1.5 text-line">·</span> Ringkasan konten, agenda, dan pesan masuk {data.site.faculty_name}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="fie-live-pill"><span className="fie-live-dot" /> Data langsung</span>
          <button type="button" className="fie-secondary-button" onClick={reload} disabled={refreshing}>
            <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Memuat..." : "Perbarui"}
          </button>
          <a href={newsAddHref} className="fie-primary-button">
            <Icon name="plus" className="h-4 w-4" /> Tulis berita
          </a>
        </div>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.cards.map((card) => <StatCardView key={card.key} card={card} />)}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {data.secondary.map((item) => (
          <a key={item.label} href={item.href || "#"} className="fie-mini-stat group">
            <span className="text-xs font-medium text-muted">{item.label}</span>
            <span className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-semibold tracking-tight text-ink">{item.value.toLocaleString("id-ID")}</span>
              <span className="truncate text-[11px] text-muted">{item.detail}</span>
            </span>
          </a>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <TrendPanel data={data} />
        <QuickActions data={data} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <RecentNews data={data} />
        <MessagesPanel data={data} />
      </div>

      <footer className="mt-6 flex flex-col gap-2 border-t border-line pt-4 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>Terakhir disinkronkan {formatDateTime(data.generated_at)}</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="fie-live-dot" /> Sistem admin FIE
        </span>
      </footer>
    </div>
  );
}
