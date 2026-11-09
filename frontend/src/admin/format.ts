const relativeFormatter = new Intl.RelativeTimeFormat("id", { numeric: "auto" });

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(value: string | null): string {
  if (!value) return "Belum tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belum tersedia";
  return `${dateFormatter.format(date)} · ${timeFormatter.format(date)}`;
}

export function formatRelative(value: string | null): string {
  if (!value) return "Belum ada aktivitas";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belum ada aktivitas";

  const diff = date.getTime() - Date.now();
  const minutes = Math.round(diff / 60_000);
  if (Math.abs(minutes) < 60) return relativeFormatter.format(minutes, "minute");

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeFormatter.format(hours, "hour");

  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return relativeFormatter.format(days, "day");

  return dateFormatter.format(date);
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export function firstName(value: string): string {
  return value.trim().split(/\s+/)[0] || value;
}
