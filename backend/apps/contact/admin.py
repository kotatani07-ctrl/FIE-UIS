from django.contrib import admin

from apps.contact.models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("subject", "name", "email", "created_at", "is_read")
    list_filter = ("is_read", "created_at")
    search_fields = ("name", "email", "subject", "message")
    date_hierarchy = "created_at"
    list_per_page = 25
    readonly_fields = (
        "name",
        "email",
        "subject",
        "message",
        "ip_hash",
        "user_agent",
        "created_at",
        "is_read",
    )

    def has_module_permission(self, request):
        return (
            request.user.is_superuser
            or request.user.groups.filter(name="Admin Fakultas").exists()
        )

    def has_view_permission(self, request, obj=None):
        return self.has_module_permission(request)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return self.has_view_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return False
