from django.contrib import admin

from apps.academics.models import StudyProgram
from apps.core.admin import ImagePreviewAdmin


@admin.register(StudyProgram)
class StudyProgramAdmin(ImagePreviewAdmin):
    list_display = ("name", "degree", "status", "order", "updated_at")
    list_filter = ("degree", "status")
    search_fields = ("name", "summary", "slug")
    date_hierarchy = "updated_at"
    prepopulated_fields = {"slug": ("name",)}
    actions = ("publish_selected", "draft_selected", "archive_selected")
    readonly_fields = ("created_at", "updated_at", "image_preview")
