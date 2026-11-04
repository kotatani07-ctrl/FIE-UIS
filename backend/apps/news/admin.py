from django.contrib import admin

from apps.core.admin import ImagePreviewAdmin
from apps.news.models import Announcement, NewsCategory, NewsPost, Tag


@admin.register(NewsCategory)
class NewsCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(NewsPost)
class NewsPostAdmin(ImagePreviewAdmin):
    list_display = ("title", "kind", "status", "author_name", "published_at")
    list_filter = ("kind", "status", "categories", "tags")
    search_fields = ("title", "excerpt", "body", "author_name")
    date_hierarchy = "published_at"
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("categories", "tags")
    actions = ("publish_selected", "draft_selected", "archive_selected")
    readonly_fields = ("created_at", "updated_at", "image_preview")


@admin.register(Announcement)
class AnnouncementAdmin(ImagePreviewAdmin):
    list_display = ("title", "status", "is_pinned", "published_at", "expires_at")
    list_filter = ("status", "is_pinned")
    search_fields = ("title", "body")
    date_hierarchy = "published_at"
    prepopulated_fields = {"slug": ("title",)}
    actions = ("publish_selected", "draft_selected", "archive_selected")
