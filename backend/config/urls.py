from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path

admin.site.site_header = "Administrasi Fakultas Ilmu Ekonomi"
admin.site.site_title = "Admin FIE"
admin.site.index_title = "Pengelolaan Konten Fakultas"

urlpatterns = [path("admin/", admin.site.urls)]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
