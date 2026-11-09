from datetime import timedelta

import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.content.models import StaticPage
from apps.core.models import SiteSetting
from apps.events.models import Event
from apps.news.models import NewsPost


@pytest.mark.django_db
def test_published_news_requires_complete_real_seo_and_body() -> None:
    post = NewsPost(
        kind=NewsPost.Kind.ARTICLE,
        title="Informasi akademik terbaru",
        excerpt="Ringkasan untuk pembaca",
        body="<p>Isi yang cukup panjang untuk menjelaskan informasi penting kepada warga "
        "fakultas secara lengkap dan dapat dipahami oleh semua pembaca situs.</p>",
        author_name="Humas",
        status=NewsPost.Status.PUBLISHED,
        published_at=timezone.now(),
        meta_title="Informasi akademik terbaru",
        meta_description="Deskripsi SEO yang cukup panjang untuk memenuhi batas karakter "
        "minimal serta menjelaskan isi tulisan kepada calon pembaca situs.",
    )

    post.full_clean()


@pytest.mark.django_db
def test_published_news_rejects_placeholder_content() -> None:
    post = NewsPost(
        kind=NewsPost.Kind.ARTICLE,
        title="TODO",
        excerpt="TODO",
        body="<p>lorem ipsum " + ("teks contoh " * 12) + "</p>",
        author_name="Humas",
        status=NewsPost.Status.PUBLISHED,
        published_at=timezone.now(),
        meta_title="TODO",
        meta_description="Deskripsi SEO yang sengaja dibuat cukup panjang untuk lolos "
        "batas minimal, tetapi isi konten tetap memakai placeholder lorem ipsum.",
    )

    with pytest.raises(ValidationError, match="sementara"):
        post.full_clean()


@pytest.mark.django_db
def test_editor_rich_text_is_sanitized_on_save() -> None:
    page = StaticPage(
        key=StaticPage.Key.HISTORY,
        title="Riwayat fakultas",
        body='<p style="color:red" onclick="bad()">Teks aman</p>',
    )
    page.save()

    assert "onclick" not in page.body
    assert "style=" not in page.body


@pytest.mark.django_db
def test_site_settings_are_a_singleton() -> None:
    first = SiteSetting.objects.create()

    assert first.pk == 1
    assert SiteSetting.objects.count() == 1
    with pytest.raises(ValidationError, match="sudah tersedia"):
        SiteSetting.objects.create()


@pytest.mark.django_db
def test_site_settings_reject_non_google_map_embed_hosts() -> None:
    setting = SiteSetting(maps_embed_url="https://attacker.example/map")

    with pytest.raises(ValidationError, match="Google Maps"):
        setting.full_clean()


@pytest.mark.django_db
def test_editor_can_publish_distinct_titles_but_not_duplicate_live_titles() -> None:
    NewsPost.objects.create(
        kind=NewsPost.Kind.ARTICLE,
        title="Informasi akademik terbaru",
        slug="draf-informasi-akademik",
        excerpt="Ringkasan",
        body="<p>Isi yang cukup panjang untuk menjelaskan informasi penting kepada warga "
        "fakultas secara lengkap dan dapat dipahami oleh semua pembaca situs.</p>",
        author_name="Humas",
        status=NewsPost.Status.DRAFT,
    )
    existing = NewsPost(
        kind=NewsPost.Kind.ARTICLE,
        title="Informasi akademik terbaru",
        excerpt="Ringkasan",
        body="<p>Isi yang cukup panjang untuk menjelaskan informasi penting kepada warga "
        "fakultas secara lengkap dan dapat dipahami oleh semua pembaca situs.</p>",
        author_name="Humas",
        status=NewsPost.Status.PUBLISHED,
        published_at=timezone.now(),
        meta_title="Informasi akademik terbaru",
        meta_description="Deskripsi SEO yang cukup panjang untuk memenuhi batas karakter "
        "minimal serta menjelaskan isi tulisan kepada calon pembaca situs.",
    )
    existing.full_clean()
    existing.save()
    duplicate = NewsPost(
        kind=NewsPost.Kind.ARTICLE,
        title=existing.title,
        excerpt="Ringkasan",
        body="<p>Isi yang cukup panjang untuk menjelaskan informasi penting kepada warga "
        "fakultas secara lengkap dan dapat dipahami oleh semua pembaca situs.</p>",
        author_name="Humas",
        status=NewsPost.Status.PUBLISHED,
        published_at=timezone.now(),
        meta_title="Informasi akademik terbaru",
        meta_description="Deskripsi SEO yang cukup panjang untuk memenuhi batas karakter "
        "minimal serta menjelaskan isi tulisan kepada calon pembaca situs.",
    )

    with pytest.raises(ValidationError, match="sudah digunakan"):
        duplicate.full_clean()


@pytest.mark.django_db
def test_event_rejects_end_before_start() -> None:
    event = Event(
        title="Agenda akademik",
        description="<p>Deskripsi agenda fakultas.</p>",
        start_at=timezone.now(),
        end_at=timezone.now() - timedelta(hours=1),
        location="Kampus",
    )

    with pytest.raises(ValidationError, match="Waktu selesai"):
        event.full_clean()
