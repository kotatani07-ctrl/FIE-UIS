import { useQuery } from "@tanstack/react-query";
import type { z } from "zod";
import { ApiError, apiRequest } from "./client";
import {
  announcementSchema,
  categorySchema,
  eventSchema,
  heroSlideSchema,
  newsItemSchema,
  paginatedSchema,
  programSchema,
  siteSettingsSchema,
} from "./types";

export function useApiQuery<TSchema extends z.ZodType>(
  queryKey: readonly unknown[],
  path: string,
  schema: TSchema,
) {
  return useQuery({
    queryKey: ["api", ...queryKey],
    queryFn: async ({ signal }) =>
      schema.parse(await apiRequest<unknown>(path, { signal })),
    staleTime: 60_000,
    retry: (failureCount, error) =>
      !(
        error instanceof ApiError &&
        error.status >= 400 &&
        error.status < 500
      ) && failureCount < 1,
  });
}

export const useSiteSettings = () =>
  useApiQuery(["site"], "site/", siteSettingsSchema);

export const useHeroSlides = () =>
  useApiQuery(["hero-slides"], "hero-slides/", heroSlideSchema.array());

export const useFeaturedNews = () =>
  useApiQuery(["news", "featured"], "news/featured/", newsItemSchema.array());

export const useNewsList = (page: number, category?: string) => {
  const params = new URLSearchParams({ page: String(page) });
  if (category) {
    params.set("kategori", category);
  }
  return useApiQuery(
    ["news", "list", page, category ?? ""],
    `news/?${params.toString()}`,
    paginatedSchema(newsItemSchema),
  );
};

export const useNewsCategories = () =>
  useApiQuery(["categories"], "categories/", categorySchema.array());

export const useUpcomingEvents = () =>
  useApiQuery(
    ["events", "upcoming"],
    "events/?when=upcoming",
    paginatedSchema(eventSchema),
  );

export const useEventsList = (
  when: "upcoming" | "past" | "all",
  page: number,
) => {
  const params = new URLSearchParams({ when, page: String(page) });
  return useApiQuery(
    ["events", "list", when, page],
    `events/?${params.toString()}`,
    paginatedSchema(eventSchema),
  );
};

export const useAnnouncements = (pageSize = 12) =>
  useApiQuery(
    ["announcements", pageSize],
    `announcements/?page_size=${pageSize}`,
    paginatedSchema(announcementSchema),
  );

export const usePrograms = () =>
  useApiQuery(
    ["programs"],
    "programs/?page_size=50",
    paginatedSchema(programSchema),
  );
