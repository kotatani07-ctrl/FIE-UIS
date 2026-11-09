export type StatTone = "brand" | "accent" | "emerald" | "amber";

export interface StatCard {
  key: string;
  label: string;
  value: number;
  detail: string;
  href: string;
  add_href?: string;
  icon: string;
  tone: StatTone;
}

export interface SecondaryStat {
  label: string;
  value: number;
  detail: string;
  href: string;
}

export interface TrendPoint {
  label: string;
  full: string;
  count: number;
}

export interface RecentNewsItem {
  id: number;
  title: string;
  kind: string;
  status: string;
  status_key: string;
  updated_at: string | null;
  published_at: string | null;
  url: string;
}

export interface RecentMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  created_at: string | null;
  is_read: boolean;
  url: string;
}

export interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: string;
}

export interface DashboardData {
  user: {
    display_name: string;
    username: string;
    initials: string;
    is_superuser: boolean;
    last_login: string | null;
  };
  site: {
    faculty_name: string;
    university_name: string;
    tagline: string;
  };
  cards: StatCard[];
  secondary: SecondaryStat[];
  trend: TrendPoint[];
  recent_news: RecentNewsItem[];
  recent_messages: RecentMessage[];
  quick_actions: QuickAction[];
  generated_at: string;
}
