from django.contrib import admin
from django.core.exceptions import ValidationError
from django.utils.html import format_html
from simple_history.admin import SimpleHistoryAdmin

from apps.core.models import SiteSetting


class ImagePreviewAdmin(SimpleHistoryAdmin):
    list_per_page = 25
    save_on_top = True
    readonly_fields = ("created_at", "updated_at")

    @admin.display(description="Pratinjau gambar")
    def image_preview(self, obj):
        image = next(
            (
                getattr(obj, field_name)
                for field_name in (
                    "image",
                    "cover",
                    "logo",
                    "og_image",
                    "accreditation_certificate",
                    "head_photo",
                )
                if getattr(obj, field_name, None)
            ),
            None,
        )
        if not image:
            return "Belum ada gambar"
        return format_html(
            '<img src="{}" alt="" style="max-width: 240px; height: auto;">',
            image.url,
        )

    @admin.action(description="Terbitkan konten terpilih")
    def publish_selected(self, request, queryset):
        success_count = 0
        for item in queryset:
            try:
                item.status = item.Status.PUBLISHED
                from django.utils import timezone

                item.published_at = timezone.now()
                item.full_clean()
                item.save()
            except ValidationError as error:
                self.message_user(
                    request,
                    f"{item}: {error.messages[0]}",
                    level="error",
                )
            else:
                success_count += 1
        if success_count:
            self.message_user(request, f"{success_count} konten berhasil diterbitkan.")

    @admin.action(description="Jadikan draf")
    def draft_selected(self, request, queryset):
        count = queryset.update(status="draft")
        self.message_user(request, f"{count} konten dijadikan draf.")

    @admin.action(description="Arsipkan")
    def archive_selected(self, request, queryset):
        count = queryset.update(status="archived")
        self.message_user(request, f"{count} konten diarsipkan.")


@admin.register(SiteSetting)
class SiteSettingAdmin(ImagePreviewAdmin):
    list_display = ("faculty_name", "university_name", "updated_at")
    fieldsets = (
        ("Identitas", {"fields": ("faculty_name", "university_name", "tagline")}),
        ("Kontak", {"fields": ("address", "phone", "email", "maps_embed_url")}),
        (
            "Media sosial",
            {
                "fields": (
                    "social_instagram",
                    "social_facebook",
                    "social_youtube",
                    "social_linkedin",
                )
            },
        ),
        (
            "Statistik dan PMB",
            {
                "fields": (
                    "stats_programs",
                    "stats_lecturers",
                    "stats_students",
                    "stats_partners",
                    "pmb_url",
                )
            },
        ),
        ("SEO", {"fields": ("meta_title", "meta_description", "og_image")}),
        ("Riwayat", {"fields": ("created_at", "updated_at")}),
    )

    def has_module_permission(self, request):
        return (
            request.user.is_superuser
            or request.user.groups.filter(name="Admin Fakultas").exists()
        )

    def has_view_permission(self, request, obj=None):
        return self.has_module_permission(request)

    def has_add_permission(self, request):
        return self.has_module_permission(request) and not SiteSetting.objects.exists()

    def has_change_permission(self, request, obj=None):
        return self.has_module_permission(request)

    def has_delete_permission(self, request, obj=None):
        return False
