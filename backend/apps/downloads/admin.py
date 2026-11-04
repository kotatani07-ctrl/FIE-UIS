from django.contrib import admin

from apps.downloads.models import DownloadItem


@admin.register(DownloadItem)
class DownloadItemAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "category",
        "file_size",
        "is_active",
        "order",
        "updated_at",
    )
    list_filter = ("category", "is_active")
    search_fields = ("title", "description", "file")
    list_per_page = 25
    save_on_top = True
    readonly_fields = ("file_size", "created_at", "updated_at")
