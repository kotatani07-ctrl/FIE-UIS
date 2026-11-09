from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.core.api.schema import DevelopmentSchemaView
from apps.core.api.views import (
    AnnouncementViewSet,
    ContactView,
    DownloadViewSet,
    EventViewSet,
    HealthView,
    HeroSlideViewSet,
    NewsCategoryViewSet,
    NewsViewSet,
    PartnerViewSet,
    PreviewView,
    ResearchViewSet,
    SearchView,
    SiteSettingView,
    StaticPageViewSet,
    StudyProgramViewSet,
    TagViewSet,
)

router = SimpleRouter()
router.register("pages", StaticPageViewSet, basename="static-page")
router.register("programs", StudyProgramViewSet, basename="program")
router.register("news", NewsViewSet, basename="news")
router.register("categories", NewsCategoryViewSet, basename="category")
router.register("tags", TagViewSet, basename="tag")
router.register("announcements", AnnouncementViewSet, basename="announcement")
router.register("events", EventViewSet, basename="event")
router.register("research", ResearchViewSet, basename="research")
router.register("downloads", DownloadViewSet, basename="download")
router.register("partners", PartnerViewSet, basename="partner")

urlpatterns = [
    path("", include(router.urls)),
    path("site/", SiteSettingView.as_view(), name="site-settings"),
    path("hero-slides/", HeroSlideViewSet.as_view({"get": "list"}), name="hero-slides"),
    path("search/", SearchView.as_view(), name="search"),
    path("contact/", ContactView.as_view(), name="contact"),
    path("health/", HealthView.as_view(), name="api-health"),
    path(
        "preview/<str:model>/<str:object_id>/",
        PreviewView.as_view(),
        name="content-preview",
    ),
]

urlpatterns.append(
    path("schema/", DevelopmentSchemaView.as_view(), name="openapi-schema")
)
