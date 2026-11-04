from django.contrib import admin

from apps.content.models import HeroSlide, Partner, StaticPage
from apps.core.admin import ImagePreviewAdmin


@admin.register(HeroSlide)
class HeroSlideAdmin(ImagePreviewAdmin):
    list_display = ("title", "is_active", "order", "starts_at", "ends_at")
    list_filter = ("is_active",)
    search_fields = ("title", "subtitle")
    readonly_fields = ("created_at", "updated_at", "image_preview")


@admin.register(StaticPage)
class StaticPageAdmin(ImagePreviewAdmin):
    list_display = ("title", "key", "status", "published_at", "updated_at")
    list_filter = ("status", "key")
    search_fields = ("title", "body")
    date_hierarchy = "updated_at"
    actions = ("publish_selected", "draft_selected", "archive_selected")
    readonly_fields = ("created_at", "updated_at", "image_preview")


@admin.register(Partner)
class PartnerAdmin(ImagePreviewAdmin):
    list_display = ("name", "is_active", "order")
    list_filter = ("is_active",)
    search_fields = ("name",)
    readonly_fields = ("created_at", "updated_at", "image_preview")
