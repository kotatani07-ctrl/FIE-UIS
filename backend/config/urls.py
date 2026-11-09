from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from apps.core.admin_views import admin_dashboard_data
from apps.core.api.exceptions import api_not_found, api_server_error
from apps.core.api.views import (
    HealthView,
    announcement_attachment,
    download_file,
    research_file,
    robots_txt,
    rss_xml,
    security_txt,
    seo_page,
    sitemap_xml,
)

admin.site.site_header = "Administrasi Fakultas Ilmu Ekonomi"
admin.site.site_title = "Admin FIE"
admin.site.index_title = "Pengelolaan Konten Fakultas"

urlpatterns = [
    path(
        f"{settings.ADMIN_URL_PREFIX}dashboard/data/",
        admin_dashboard_data,
        name="admin-dashboard-data",
    ),
    path(settings.ADMIN_URL_PREFIX, admin.site.urls),
    path("ckeditor5/", include("django_ckeditor_5.urls")),
    path("api/v1/", include("apps.core.api.urls")),
    path("health/", HealthView.as_view(), name="health"),
    path("files/download/<int:pk>/", download_file, name="download-file"),
    path(
        "files/announcement/<int:pk>/",
        announcement_attachment,
        name="announcement-attachment",
    ),
    path("files/research/<int:pk>/", research_file, name="research-file"),
    path("sitemap.xml", sitemap_xml, name="sitemap"),
    path("robots.txt", robots_txt, name="robots"),
    path("rss.xml", rss_xml, name="rss"),
    path("seo/", seo_page, {"path": ""}, name="seo-home"),
    path("seo/<path:path>", seo_page, name="seo-page"),
    path(".well-known/security.txt", security_txt, name="security-txt"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

handler404 = api_not_found
handler500 = api_server_error
