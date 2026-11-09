import { z } from "zod";

export const imageSchema = z
  .object({
    src: z.string().min(1),
    srcset: z.string(),
    avif_srcset: z.string(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    alt: z.string(),
    blur: z.string(),
  })
  .nullable();

export const seoMetadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  og_image: imageSchema,
});

export const siteSettingsSchema = z.object({
  faculty_name: z.string(),
  university_name: z.string(),
  tagline: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  maps_embed_url: z.string(),
  social_instagram: z.string(),
  social_facebook: z.string(),
  social_youtube: z.string(),
  social_linkedin: z.string(),
  stats_programs: z.number().int().nonnegative(),
  stats_lecturers: z.number().int().nonnegative(),
  stats_students: z.number().int().nonnegative(),
  stats_partners: z.number().int().nonnegative(),
  pmb_url: z.string(),
  default_og_image: imageSchema,
});

export const heroSlideSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  image: imageSchema,
  link_url: z.string(),
  link_page: z.string(),
  link_label: z.string(),
});

export const categorySchema = z.object({
  name: z.string(),
  slug: z.string(),
  count: z.number().int().nonnegative(),
});

export const tagSchema = categorySchema;

export const newsItemSchema = z.object({
  slug: z.string(),
  kind: z.string(),
  title: z.string(),
  excerpt: z.string(),
  cover: imageSchema,
  categories: z.array(z.object({ name: z.string(), slug: z.string() })),
  tags: z.array(z.object({ name: z.string(), slug: z.string() })),
  published_at: z.string().datetime({ offset: true }),
  author_name: z.string(),
});

export const newsDetailSchema = newsItemSchema.extend({
  body_html: z.string(),
  meta: seoMetadataSchema,
  related: z.array(newsItemSchema).max(3),
});

export const programSchema = z.object({
  slug: z.string(),
  name: z.string(),
  degree: z.string(),
  summary: z.string(),
  cover: imageSchema,
  meta: seoMetadataSchema,
});

export const eventSchema = z.object({
  slug: z.string(),
  title: z.string(),
  start_at: z.string().datetime({ offset: true }),
  end_at: z.string().datetime({ offset: true }).nullable(),
  location: z.string(),
  cover: imageSchema,
  registration_url: z.string(),
});

export const announcementSchema = z.object({
  slug: z.string(),
  title: z.string(),
  is_pinned: z.boolean(),
  published_at: z.string().datetime({ offset: true }),
  expires_at: z.string().datetime({ offset: true }).nullable(),
});

export const apiErrorSchema = z.object({
  detail: z.string(),
  code: z.string(),
  errors: z.record(z.string(), z.array(z.string())),
});

export function paginatedSchema<TSchema extends z.ZodType>(
  itemSchema: TSchema,
) {
  return z.object({
    count: z.number().int().nonnegative(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(itemSchema),
  });
}

export type ApiImage = z.infer<typeof imageSchema>;
export type SeoMetadata = z.infer<typeof seoMetadataSchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type HeroSlide = z.infer<typeof heroSlideSchema>;
export type NewsItem = z.infer<typeof newsItemSchema>;
export type NewsDetail = z.infer<typeof newsDetailSchema>;
export type Program = z.infer<typeof programSchema>;
export type EventItem = z.infer<typeof eventSchema>;
export type Announcement = z.infer<typeof announcementSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;
export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
