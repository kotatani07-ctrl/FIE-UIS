const TIME_ZONE = "Asia/Jakarta";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const dayFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  timeZone: TIME_ZONE,
});

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "short",
  timeZone: TIME_ZONE,
});

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return dateFormatter.format(date);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return dateTimeFormatter.format(date);
}

export function formatDateParts(iso: string): { day: string; month: string } {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { day: "", month: "" };
  }
  return { day: dayFormatter.format(date), month: monthFormatter.format(date) };
}
