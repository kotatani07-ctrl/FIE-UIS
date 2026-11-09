import io
import json
from datetime import timedelta
from unittest.mock import patch

import pytest
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory, override_settings
from django.utils import timezone
from PIL import Image
from rest_framework.exceptions import ParseError
from rest_framework.test import APIClient, APIRequestFactory

from apps.academics.models import StudyProgram
from apps.contact.models import ContactMessage
from apps.content.models import HeroSlide, StaticPage
from apps.core.api.exceptions import api_server_error
from apps.core.api.views import ContactJSONParser, create_preview_token
from apps.core.models import SiteSetting
from apps.downloads.models import DownloadItem
from apps.events.models import Event
from apps.news.models import Announcement, NewsCategory, NewsPost, Tag
from apps.research.models import ResearchItem


@pytest.fixture(autouse=True)
def clear_api_cache():
    cache.clear()


def create_news(*, slug, status="published", published_at=None, category=None):
    post = NewsPost.objects.create(
        kind=NewsPost.Kind.ARTICLE,
        title=f"Berita {slug}",
        slug=slug,
        excerpt="Ringkasan berita untuk pengujian.",
        body="<p>Isi berita untuk pengujian API dengan teks yang cukup.</p>",
        author_name="Humas FIE",
        status=status,
        published_at=published_at or timezone.now() - timedelta(minutes=1),
    )
    if category:
        post.categories.add(category)
    return post


def create_announcement(*, slug, expires_at=None):
    return Announcement.objects.create(
        title=f"Pengumuman {slug}",
        slug=slug,
        body="<p>Isi pengumuman untuk uji API.</p>",
        status="published",
        published_at=timezone.now() - timedelta(minutes=1),
        expires_at=expires_at,
    )


def create_event(*, slug, start_at, end_at):
    return Event.objects.create(
        title=f"Agenda {slug}",
        slug=slug,
        description="<p>Deskripsi agenda untuk pengujian API.</p>",
        start_at=start_at,
        end_at=end_at,
        location="Tangerang Selatan",
        status="published",
        published_at=timezone.now() - timedelta(minutes=1),
    )


def create_jpeg():
    output = io.BytesIO()
    Image.new("RGB", (640, 360), "navy").save(output, format="JPEG")
    return output.getvalue()


@pytest.mark.django_db
def test_public_news_hides_unpublished_and_future_content_and_is_paginated():
    client = APIClient()
    create_news(slug="lama")
    create_news(slug="draf", status="draft", published_at=None)
    create_news(
        slug="masa-depan",
        published_at=timezone.now() + timedelta(days=1),
    )

    response = client.get("/api/v1/news/")

    assert response.status_code == 200
    assert response["Content-Type"].startswith("application/json")
    assert response.data["count"] == 1
    assert [item["slug"] for item in response.data["results"]] == ["lama"]
    assert response["Cache-Control"].startswith("public")
    assert response["ETag"]


@pytest.mark.django_db
def test_news_results_are_ordered_by_publication_time_then_id():
    older = create_news(
        slug="lebih-lama",
        published_at=timezone.now() - timedelta(days=2),
    )
    newer = create_news(
        slug="lebih-baru",
        published_at=timezone.now() - timedelta(days=1),
    )

    response = APIClient().get("/api/v1/news/")

    assert [item["slug"] for item in response.data["results"]] == [
        newer.slug,
        older.slug,
    ]


@pytest.mark.django_db
def test_page_size_is_capped_at_fifty():
    for index in range(55):
        create_news(slug=f"berita-{index}")

    response = APIClient().get("/api/v1/news/?page_size=100")

    assert response.status_code == 200
    assert len(response.data["results"]) == 50


@pytest.mark.django_db
def test_news_list_uses_a_bounded_query_count(django_assert_num_queries):
    client = APIClient()
    create_news(slug="satu")
    create_news(slug="dua")

    with django_assert_num_queries(4):
        response = client.get("/api/v1/news/")

    assert response.status_code == 200


@pytest.mark.django_db
def test_news_filters_by_category_tag_kind_and_year():
    client = APIClient()
    category = NewsCategory.objects.create(name="Akademik", slug="akademik")
    post = create_news(slug="akademik", category=category)

    response = client.get(
        "/api/v1/news/",
        {
            "kategori": "akademik",
            "jenis": "artikel",
            "tahun": post.published_at.year,
        },
    )

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["categories"] == [
        {"name": "Akademik", "slug": "akademik"}
    ]


@pytest.mark.django_db
def test_category_and_tag_counts_only_include_live_news():
    category = NewsCategory.objects.create(name="Berita", slug="berita")
    tag = Tag.objects.create(name="PMB", slug="pmb")
    live = create_news(slug="live", category=category)
    live.tags.add(tag)
    create_news(slug="draft", status="draft", category=category)

    categories = APIClient().get("/api/v1/categories/")
    tags = APIClient().get("/api/v1/tags/")

    assert categories.data[0]["count"] == 1
    assert tags.data[0]["count"] == 1


@pytest.mark.django_db
def test_combined_many_to_many_filters_do_not_duplicate_news():
    first_category = NewsCategory.objects.create(name="Akademik", slug="akademik")
    second_category = NewsCategory.objects.create(name="Kampus", slug="kampus")
    first_tag = Tag.objects.create(name="PMB", slug="pmb")
    second_tag = Tag.objects.create(name="Mahasiswa", slug="mahasiswa")
    post = create_news(slug="berita-filter", category=first_category)
    post.categories.add(second_category)
    post.tags.add(first_tag, second_tag)

    response = APIClient().get("/api/v1/news/?kategori=akademik&tag=pmb")

    assert response.data["count"] == 1
    assert [item["slug"] for item in response.data["results"]] == ["berita-filter"]


@pytest.mark.django_db
def test_featured_news_is_limited_to_five():
    for index in range(7):
        create_news(slug=f"featured-{index}")

    response = APIClient().get("/api/v1/news/featured/")

    assert response.status_code == 200
    assert len(response.data) == 5


@pytest.mark.django_db
def test_out_of_range_and_missing_content_return_uniform_json_404():
    client = APIClient()
    create_news(slug="ada")

    page_response = client.get("/api/v1/news/?page=99")
    detail_response = client.get("/api/v1/news/tidak-ada/")

    for response in (page_response, detail_response):
        assert response.status_code == 404
        assert set(response.data) == {"detail", "code", "errors"}
        assert response.data["code"] == "not_found"
    assert page_response.data["detail"] == "Halaman tidak ditemukan."


@pytest.mark.django_db
def test_if_none_match_returns_304():
    client = APIClient()
    create_news(slug="cache")

    response = client.get("/api/v1/news/")
    cached_response = client.get("/api/v1/news/", HTTP_IF_NONE_MATCH=response["ETag"])

    assert response.status_code == 200
    assert cached_response.status_code == 304
    assert cached_response["ETag"] == response["ETag"]


@pytest.mark.django_db
def test_news_write_methods_are_not_exposed():
    response = APIClient().post("/api/v1/news/", {}, format="json")

    assert response.status_code == 405
    assert response.data["code"] == "method_not_allowed"


@pytest.mark.django_db
def test_news_detail_sanitizes_html_again_when_serializing():
    post = create_news(slug="html-bersih")
    NewsPost.objects.filter(pk=post.pk).update(
        body="<p>Konten aman</p><script>alert(1)</script>"
    )

    response = APIClient().get(f"/api/v1/news/{post.slug}/")

    assert response.status_code == 200
    assert response.data["body_html"] == "<p>Konten aman</p>"


@pytest.mark.django_db
def test_static_page_requires_live_published_status():
    StaticPage.objects.create(
        key=StaticPage.Key.HISTORY,
        title="Sejarah",
        body="<p>Halaman draf yang tidak boleh dipublikasikan.</p>",
        status="draft",
    )

    response = APIClient().get("/api/v1/pages/sejarah/")

    assert response.status_code == 404
    assert response.data["code"] == "not_found"


@pytest.mark.django_db
def test_site_and_hero_endpoints_use_active_content():
    SiteSetting.objects.create(tagline="Belajar untuk masa depan.")
    now = timezone.now()
    HeroSlide.objects.create(
        title="Aktif",
        subtitle="Slide utama",
        image="",
        alt="Deskripsi gambar",
        is_active=True,
        starts_at=now - timedelta(days=1),
        ends_at=now + timedelta(days=1),
    )
    HeroSlide.objects.create(
        title="Kedaluwarsa",
        image="",
        alt="Deskripsi gambar",
        is_active=True,
        ends_at=now - timedelta(seconds=1),
    )

    client = APIClient()
    site = client.get("/api/v1/site/")
    slides = client.get("/api/v1/hero-slides/")

    assert site.status_code == 200
    assert site.data["faculty_name"] == "Fakultas Ilmu Ekonomi"
    assert site.data["tagline"] == "Belajar untuk masa depan."
    assert site.data["default_og_image"] is None
    assert [slide["title"] for slide in slides.data] == ["Aktif"]


@pytest.mark.django_db
def test_hero_images_include_responsive_metadata_without_n_plus_one_queries(
    tmp_path, django_assert_num_queries
):
    with override_settings(MEDIA_ROOT=tmp_path):
        for index in range(2):
            HeroSlide.objects.create(
                title=f"Slide {index}",
                image=SimpleUploadedFile(
                    f"slide-{index}.jpg",
                    create_jpeg(),
                    content_type="image/jpeg",
                ),
                alt="Kegiatan fakultas",
            )

        with django_assert_num_queries(2):
            response = APIClient().get("/api/v1/hero-slides/")

    image = response.data[0]["image"]
    assert image["width"] == 640
    assert image["height"] == 360
    assert image["alt"] == "Kegiatan fakultas"
    assert "480w" in image["srcset"]
    assert "640w" in image["avif_srcset"]
    assert image["blur"].startswith("data:image/webp;base64,")


@pytest.mark.django_db
def test_program_list_and_detail_use_explicit_nested_shapes():
    program = StudyProgram.objects.create(
        name="S1 Perpajakan",
        slug="s1-perpajakan",
        degree=StudyProgram.Degree.S1,
        summary="Program studi perpajakan.",
        vision="Menjadi program unggul.",
        mission="Mendidik calon profesional.",
        accreditation_body="",
        accreditation_grade="Baik",
        accreditation_number="",
        curriculum="<p>Kurikulum</p>",
        career_prospects="<p>Karier</p>",
        status="published",
        published_at=timezone.now() - timedelta(minutes=1),
    )

    client = APIClient()
    listing = client.get("/api/v1/programs/")
    detail = client.get(f"/api/v1/programs/{program.slug}/")

    assert listing.status_code == 200
    assert listing.data["results"][0]["name"] == "S1 Perpajakan"
    assert detail.status_code == 200
    assert detail.data["accreditation"]["grade"] == "Baik"
    assert detail.data["head"] == {"name": "", "photo": None}
    assert detail.data["curriculum_html"] == "<p>Kurikulum</p>"


@pytest.mark.django_db
def test_announcement_expiry_and_event_time_filters():
    now = timezone.now()
    create_announcement(slug="berlaku", expires_at=now + timedelta(days=1))
    create_announcement(slug="lewat", expires_at=now - timedelta(seconds=1))
    create_event(
        slug="mendatang",
        start_at=now + timedelta(days=2),
        end_at=now + timedelta(days=2, hours=1),
    )
    create_event(
        slug="berlangsung",
        start_at=now - timedelta(minutes=30),
        end_at=now + timedelta(minutes=30),
    )
    create_event(
        slug="lampau",
        start_at=now - timedelta(days=2),
        end_at=now - timedelta(days=2) + timedelta(hours=1),
    )

    client = APIClient()
    announcements = client.get("/api/v1/announcements/")
    upcoming = client.get("/api/v1/events/?when=upcoming")
    past = client.get("/api/v1/events/?when=past")
    invalid = client.get("/api/v1/events/?when=invalid")

    assert [item["slug"] for item in announcements.data["results"]] == ["berlaku"]
    assert {item["slug"] for item in upcoming.data["results"]} == {
        "mendatang",
        "berlangsung",
    }
    assert [item["slug"] for item in past.data["results"]] == ["lampau"]
    assert invalid.status_code == 400
    assert invalid.data["code"] == "validation_error"


@pytest.mark.django_db
def test_research_filter_and_download_list_use_public_fields():
    ResearchItem.objects.create(
        title="Kajian perpajakan",
        slug="kajian-pajak",
        kind=ResearchItem.Kind.RESEARCH,
        authors="Dosen FIE",
        year=2026,
        abstract="Kajian tentang kebijakan pajak.",
        status="published",
        published_at=timezone.now() - timedelta(minutes=1),
    )
    DownloadItem.objects.create(
        title="Panduan akademik",
        category=DownloadItem.Category.GUIDE,
        file="downloads/panduan.pdf",
        file_size=20,
        description="Panduan untuk mahasiswa.",
        is_active=True,
    )

    research = APIClient().get("/api/v1/research/?type=penelitian&tahun=2026")
    downloads = APIClient().get("/api/v1/downloads/?category=panduan")

    assert research.status_code == 200
    assert research.data["results"][0]["type"] == "penelitian"
    assert research.data["results"][0]["slug"] == "kajian-pajak"
    assert downloads.status_code == 200
    assert downloads.data[0]["url"].startswith("/files/download/")


@pytest.mark.django_db
def test_download_file_is_served_as_attachment(tmp_path):
    upload = SimpleUploadedFile(
        "Panduan Akademik.pdf", b"sample pdf contents", content_type="application/pdf"
    )
    with override_settings(MEDIA_ROOT=tmp_path):
        item = DownloadItem.objects.create(
            title="Panduan",
            category=DownloadItem.Category.GUIDE,
            file=upload,
            description="Panduan akademik.",
        )
        response = APIClient().get(f"/files/download/{item.pk}/")

        assert response.status_code == 200
        assert response["Content-Disposition"].startswith("attachment;")
        assert response["X-Content-Type-Options"] == "nosniff"
        assert b"".join(response.streaming_content) == b"sample pdf contents"
        response.close()


@pytest.mark.django_db
def test_unknown_api_route_uses_uniform_json_404():
    with override_settings(DEBUG=False):
        response = APIClient().get("/api/v1/unknown/")

    assert response.status_code == 404
    assert response.json()["code"] == "not_found"
    assert response["Content-Type"].startswith("application/json")


@pytest.mark.django_db
def test_global_search_validates_query_length():
    response = APIClient().get("/api/v1/search/?q=a")

    assert response.status_code == 400
    assert response.data["code"] == "validation_error"
    assert "q" in response.data["errors"]


@pytest.mark.django_db
def test_global_search_returns_public_results():
    create_news(slug="pajak", category=None)

    response = APIClient().get("/api/v1/search/?q=Berita")

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["type"] == "berita"
    assert response.data["results"][0]["url"] == "/informasi/berita/pajak"


@pytest.mark.django_db
def test_contact_rejects_honeypot_without_storing_message():
    response = APIClient().post(
        "/api/v1/contact/",
        {
            "name": "Pengunjung",
            "email": "visitor@example.test",
            "subject": "Pertanyaan",
            "message": "Pesan pengujian.",
            "turnstile_token": "token",
            "website": "filled-by-bot",
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.data["code"] == "validation_error"
    assert not SiteSetting.objects.exists()


@pytest.mark.django_db
@override_settings(TURNSTILE_SECRET_KEY="test-secret")
def test_contact_rejects_failed_turnstile_without_storing_message():
    payload = {
        "name": "Pengunjung",
        "email": "visitor@example.test",
        "subject": "Pertanyaan",
        "message": "Pesan pengujian.",
        "turnstile_token": "invalid-token",
    }

    with patch("apps.core.api.views.verify_turnstile", return_value=False):
        response = APIClient().post("/api/v1/contact/", payload, format="json")

    assert response.status_code == 403
    assert response.data["code"] == "forbidden"
    assert not ContactMessage.objects.exists()


@pytest.mark.django_db
@override_settings(TURNSTILE_SECRET_KEY="")
def test_contact_fails_closed_when_turnstile_is_not_configured():
    payload = {
        "name": "Pengunjung",
        "email": "visitor@example.test",
        "subject": "Pertanyaan",
        "message": "Pesan pengujian.",
        "turnstile_token": "token",
    }

    response = APIClient().post("/api/v1/contact/", payload, format="json")

    assert response.status_code == 503
    assert response.data["code"] == "service_unavailable"


@pytest.mark.django_db
@override_settings(TURNSTILE_SECRET_KEY="test-secret")
def test_contact_fails_closed_when_turnstile_verification_is_unavailable():
    payload = {
        "name": "Pengunjung",
        "email": "visitor@example.test",
        "subject": "Pertanyaan",
        "message": "Pesan pengujian.",
        "turnstile_token": "token",
    }

    with patch(
        "apps.core.api.views.urlopen",
        side_effect=OSError("service unavailable"),
    ):
        response = APIClient().post("/api/v1/contact/", payload, format="json")

    assert response.status_code == 503
    assert response.data["code"] == "service_unavailable"
    assert not ContactMessage.objects.exists()


@pytest.mark.django_db
def test_contact_parser_rejects_payloads_over_100_kb():
    request = APIRequestFactory().post(
        "/api/v1/contact/",
        data=b"x" * 100_001,
        content_type="application/json",
    )

    with pytest.raises(ParseError, match="100 KB"):
        ContactJSONParser().parse(
            io.BytesIO(b"{}"), parser_context={"request": request}
        )


@pytest.mark.django_db
@override_settings(
    TURNSTILE_SECRET_KEY="test-secret",
    CONTACT_NOTIFICATION_EMAIL="fakultas@example.test",
    CONTACT_IP_HASH_KEY="test-hash-secret",
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
)
def test_contact_stores_minimal_data_and_sends_plain_text_notification():
    payload = {
        "name": "Pengunjung",
        "email": "visitor@example.test",
        "subject": "Pertanyaan",
        "message": "Pesan pengujian.",
        "turnstile_token": "valid-token",
    }
    client = APIClient()

    with patch("apps.core.api.views.verify_turnstile", return_value=True):
        response = client.post("/api/v1/contact/", payload, format="json")

    from django.core import mail

    assert response.status_code == 201
    assert response.data == {"detail": "Pesan terkirim. Terima kasih."}
    message = mail.outbox[0]
    assert message.content_subtype == "plain"
    assert message.to == ["fakultas@example.test"]

    from apps.contact.models import ContactMessage

    saved = ContactMessage.objects.get()
    assert saved.email == payload["email"]
    assert saved.ip_hash != "127.0.0.1"
    assert len(saved.ip_hash) == 64


@pytest.mark.django_db
@override_settings(
    TURNSTILE_SECRET_KEY="test-secret",
    CONTACT_NOTIFICATION_EMAIL="fakultas@example.test",
    CONTACT_IP_HASH_KEY="test-hash-secret",
    DEFAULT_FROM_EMAIL="website@example.test",
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
)
def test_contact_reports_notification_failure_after_persisting_message():
    payload = {
        "name": "Pengunjung",
        "email": "visitor@example.test",
        "subject": "Pertanyaan",
        "message": "Pesan pengujian.",
        "turnstile_token": "valid-token",
    }

    with (
        patch("apps.core.api.views.verify_turnstile", return_value=True),
        patch(
            "apps.core.api.views.send_mail",
            side_effect=OSError("mail service unavailable"),
        ),
    ):
        response = APIClient().post("/api/v1/contact/", payload, format="json")

    assert response.status_code == 503
    assert response.data["code"] == "notification_failed"
    assert ContactMessage.objects.count() == 1


@pytest.mark.django_db
@override_settings(
    TURNSTILE_SECRET_KEY="test-secret",
    CONTACT_NOTIFICATION_EMAIL="fakultas@example.test",
    CONTACT_IP_HASH_KEY="test-hash-secret",
    DEFAULT_FROM_EMAIL="website@example.test",
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
)
def test_contact_email_throttle_applies_across_different_ips():
    payload = {
        "name": "Pengunjung",
        "email": "visitor@example.test",
        "subject": "Pertanyaan",
        "message": "Pesan pengujian.",
        "turnstile_token": "valid-token",
    }

    with patch("apps.core.api.views.verify_turnstile", return_value=True):
        responses = [
            APIClient().post(
                "/api/v1/contact/",
                payload,
                format="json",
                REMOTE_ADDR=f"192.0.2.{index}",
            )
            for index in range(1, 22)
        ]

    assert all(response.status_code == 201 for response in responses[:20])
    assert responses[20].status_code == 429
    assert responses[20].data["code"] == "throttled"
    assert ContactMessage.objects.count() == 20


@pytest.mark.django_db
def test_contact_rejects_header_injection():
    payload = {
        "name": "Pengunjung",
        "email": "visitor@example.test",
        "subject": "Pertanyaan\nBcc: attacker@example.test",
        "message": "Pesan pengujian.",
        "turnstile_token": "token",
    }

    response = APIClient().post("/api/v1/contact/", payload, format="json")

    assert response.status_code == 400
    assert response.data["code"] == "validation_error"


@pytest.mark.django_db
def test_health_and_seo_endpoints_return_expected_types():
    now = timezone.now()
    StaticPage.objects.create(
        key=StaticPage.Key.HISTORY,
        title="Sejarah Fakultas",
        body="<p>Isi sejarah yang dikelola melalui CMS.</p>",
        status="published",
        published_at=now - timedelta(minutes=1),
    )
    client = APIClient()

    health = client.get("/health/")
    sitemap = client.get("/sitemap.xml")
    robots = client.get("/robots.txt")
    seo = client.get("/seo/profil/sejarah")

    assert health.status_code == 200
    assert health.json() == {"status": "ok"}
    assert sitemap["Content-Type"].startswith("application/xml")
    assert b"/profil/sejarah" in sitemap.content
    assert robots["Content-Type"].startswith("text/plain")
    assert b"Sitemap:" in robots.content
    assert seo.status_code == 200
    assert b"Sejarah Fakultas" in seo.content


@pytest.mark.django_db
def test_rss_endpoint_returns_well_formed_feed():
    create_news(slug="rss")

    response = APIClient().get("/rss.xml")

    assert response.status_code == 200
    assert response["Content-Type"].startswith("application/rss+xml")
    assert b"<item>" in response.content
    assert b"/informasi/berita/rss" in response.content


@pytest.mark.django_db
@override_settings(DEBUG=True)
def test_openapi_schema_is_available_in_development():
    response = APIClient().get("/api/v1/schema/")

    assert response.status_code == 200
    assert response.data["openapi"].startswith("3.")
    assert "/api/v1/news/" in response.data["paths"]


@pytest.mark.django_db
@override_settings(CORS_ALLOWED_ORIGINS=["https://fie.example.test"])
def test_cors_allows_only_configured_origins():
    client = APIClient()
    allowed = client.get("/api/v1/health/", HTTP_ORIGIN="https://fie.example.test")
    denied = client.get("/api/v1/health/", HTTP_ORIGIN="https://untrusted.example.test")

    assert allowed["Access-Control-Allow-Origin"] == "https://fie.example.test"
    assert "Access-Control-Allow-Origin" not in denied


@pytest.mark.django_db
@override_settings(SECURITY_CONTACT="security@example.test")
def test_security_txt_is_available_when_contact_is_configured():
    response = APIClient().get("/.well-known/security.txt")

    assert response.status_code == 200
    assert response["Content-Type"].startswith("text/plain")
    assert b"Contact: mailto:security@example.test" in response.content


@pytest.mark.django_db
def test_security_txt_fails_explicitly_without_a_contact():
    response = APIClient().get("/.well-known/security.txt")

    assert response.status_code == 503
    assert b"belum dikonfigurasi" in response.content


@pytest.mark.django_db
def test_preview_requires_staff_and_signed_token():
    page = StaticPage.objects.create(
        key=StaticPage.Key.HISTORY,
        title="Draf",
        body="<p>Pratinjau draf yang hanya dapat dilihat staf.</p>",
        status="draft",
    )
    client = APIClient()
    token = create_preview_token("page", page.pk)

    denied = client.get(f"/api/v1/preview/page/{page.pk}/?token={token}")

    from django.contrib.auth import get_user_model

    user = get_user_model().objects.create_user(
        username="editor-preview", password="safe-test-password", is_staff=True
    )
    client.force_authenticate(user=user)
    allowed = client.get(f"/api/v1/preview/page/{page.pk}/?token={token}")
    invalid = client.get(f"/api/v1/preview/page/{page.pk}/?token=invalid")

    assert denied.status_code == 403
    assert allowed.status_code == 200
    assert allowed.data["title"] == "Draf"
    assert invalid.status_code == 404


@pytest.mark.django_db
def test_purge_old_messages_removes_only_messages_past_retention():
    old_message = ContactMessage.objects.create(
        name="Pengunjung lama",
        email="old@example.test",
        subject="Lama",
        message="Pesan lama.",
    )
    ContactMessage.objects.filter(pk=old_message.pk).update(
        created_at=timezone.now() - timedelta(days=366)
    )
    ContactMessage.objects.create(
        name="Pengunjung baru",
        email="new@example.test",
        subject="Baru",
        message="Pesan baru.",
    )

    from django.core.management import call_command

    call_command("purge_old_messages")

    assert ContactMessage.objects.count() == 1
    assert ContactMessage.objects.get().email == "new@example.test"


def test_unhandled_api_errors_use_a_generic_json_response():
    request = RequestFactory().get("/api/v1/failure/")

    response = api_server_error(request)

    assert response.status_code == 500
    assert json.loads(response.content) == {
        "detail": "Terjadi kesalahan internal.",
        "code": "internal_error",
        "errors": {},
    }
