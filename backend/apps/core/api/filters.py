import django_filters
from rest_framework.filters import SearchFilter

from apps.academics.models import StudyProgram
from apps.downloads.models import DownloadItem
from apps.news.models import Announcement, NewsPost
from apps.research.models import ResearchItem


class QuerySearchFilter(SearchFilter):
    search_param = "q"


class NewsFilter(django_filters.FilterSet):
    kategori = django_filters.CharFilter(field_name="categories__slug")
    tag = django_filters.CharFilter(field_name="tags__slug")
    jenis = django_filters.ChoiceFilter(
        field_name="kind", choices=NewsPost.Kind.choices
    )
    tahun = django_filters.NumberFilter(field_name="published_at__year")

    class Meta:
        model = NewsPost
        fields = ()


class AnnouncementFilter(django_filters.FilterSet):
    class Meta:
        model = Announcement
        fields = ()


class ResearchFilter(django_filters.FilterSet):
    type = django_filters.ChoiceFilter(
        field_name="kind", choices=ResearchItem.Kind.choices
    )
    tahun = django_filters.NumberFilter(field_name="year")

    class Meta:
        model = ResearchItem
        fields = ()


class DownloadFilter(django_filters.FilterSet):
    class Meta:
        model = DownloadItem
        fields = ("category",)


class ProgramFilter(django_filters.FilterSet):
    class Meta:
        model = StudyProgram
        fields = ("degree",)
