from django.contrib import admin

from apps.core.admin import ImagePreviewAdmin
from apps.events.models import Event


@admin.register(Event)
class EventAdmin(ImagePreviewAdmin):
    list_display = ("title", "status", "start_at", "end_at", "location")
    list_filter = ("status", "start_at")
    search_fields = ("title", "description", "location")
    date_hierarchy = "start_at"
    prepopulated_fields = {"slug": ("title",)}
    actions = ("publish_selected", "draft_selected", "archive_selected")
