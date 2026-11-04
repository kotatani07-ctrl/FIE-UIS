from django.contrib import admin

from apps.core.admin import ImagePreviewAdmin
from apps.research.models import ResearchItem


@admin.register(ResearchItem)
class ResearchItemAdmin(ImagePreviewAdmin):
    list_display = ("title", "kind", "year", "status", "published_at")
    list_filter = ("kind", "year", "status")
    search_fields = ("title", "authors", "abstract")
    date_hierarchy = "published_at"
    prepopulated_fields = {"slug": ("title",)}
    actions = ("publish_selected", "draft_selected", "archive_selected")
