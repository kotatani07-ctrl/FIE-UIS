from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.news.models import NewsCategory, NewsPost


class Command(BaseCommand):
    help = "Isi basis data development dengan contoh konten yang ditandai [DUMMY]."

    def handle(self, *args, **options):
        if not settings.DEBUG or getattr(settings, "DJANGO_ENV", "") == "production":
            raise CommandError(
                "seed_dummy hanya boleh dijalankan di lingkungan development."
            )

        category, _ = NewsCategory.objects.get_or_create(
            name="[DUMMY] Informasi", defaults={"slug": "dummy-informasi"}
        )
        NewsPost.objects.get_or_create(
            slug="dummy-pembaruan-situs-fakultas",
            defaults={
                "kind": NewsPost.Kind.ARTICLE,
                "title": "[DUMMY] Informasi contoh untuk pratinjau situs",
                "excerpt": "[DUMMY] Konten ini hanya digunakan untuk pengujian development.",
                "body": (
                    "<p>[DUMMY] Konten contoh ini bukan informasi resmi fakultas. "
                    "Ganti melalui Admin sebelum dipublikasikan di lingkungan produksi. "
                    "Situs ini menampilkan konten yang dikelola melalui Django Admin.</p>"
                ),
                "author_name": "[DUMMY] Admin",
                "status": NewsPost.Status.PUBLISHED,
                "published_at": timezone.now(),
                "meta_title": "[DUMMY] Informasi contoh situs",
                "meta_description": (
                    "[DUMMY] Artikel contoh untuk menguji tampilan dan pengelolaan konten "
                    "situs Fakultas Ilmu Ekonomi."
                ),
                "cover_alt": "",
            },
        )
        post = NewsPost.objects.get(slug="dummy-pembaruan-situs-fakultas")
        post.categories.add(category)
        self.stdout.write(self.style.SUCCESS("Konten [DUMMY] siap untuk development."))
