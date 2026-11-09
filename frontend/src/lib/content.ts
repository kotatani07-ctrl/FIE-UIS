import type {
  Announcement,
  EventItem,
  NewsItem as ApiNewsItem,
  Program as ApiProgram,
} from "@/api/types";

const DEGREE_LABELS: Record<string, string> = {
  D3: "Diploma 3 (D3)",
  S1: "Sarjana (S1)",
  S2: "Magister (S2)",
};

export type ProgramCard = {
  slug: string;
  name: string;
  degree: string;
  summary: string;
};

export function programCard(program: ApiProgram): ProgramCard {
  return {
    slug: program.slug,
    name: program.name,
    degree: DEGREE_LABELS[program.degree] ?? program.degree,
    summary: program.summary,
  };
}

export type NewsCard = {
  slug: string;
  title: string;
  category: string;
  publishedAt: string;
  excerpt: string;
  image: string | null;
  imageAlt: string;
};

export function newsCard(item: ApiNewsItem): NewsCard {
  return {
    slug: item.slug,
    title: item.title,
    category: item.categories[0]?.name ?? item.kind,
    publishedAt: item.published_at,
    excerpt: item.excerpt,
    image: item.cover?.src ?? null,
    imageAlt: item.cover?.alt || item.title,
  };
}

export type AgendaCard = {
  slug: string;
  title: string;
  startAt: string;
  location: string;
};

export function agendaCard(item: EventItem): AgendaCard {
  return {
    slug: item.slug,
    title: item.title,
    startAt: item.start_at,
    location: item.location,
  };
}

export type AnnouncementCard = {
  id: string;
  title: string;
  publishedAt: string;
  pinned: boolean;
};

export function announcementCard(item: Announcement): AnnouncementCard {
  return {
    id: item.slug,
    title: item.title,
    publishedAt: item.published_at,
    pinned: item.is_pinned,
  };
}
