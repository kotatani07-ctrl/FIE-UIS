import io
from zipfile import ZipFile

import pytest
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.core.management.base import CommandError
from PIL import Image

from apps.content.models import HeroSlide
from apps.core.image_processing import optimize_image
from apps.core.validators import validate_document, validate_image
from apps.downloads.models import DownloadItem


def create_image_bytes(image_format: str = "JPEG") -> bytes:
    output = io.BytesIO()
    Image.new("RGB", (640, 360), "navy").save(output, format=image_format)
    return output.getvalue()


def test_image_validator_accepts_verified_jpeg() -> None:
    validate_image(SimpleUploadedFile("cover.jpg", create_image_bytes()))


def test_image_validator_rejects_svg_and_invalid_image() -> None:
    with pytest.raises(ValidationError, match="bukan gambar"):
        validate_image(SimpleUploadedFile("cover.svg", b"<svg></svg>"))


def test_document_validator_checks_detected_pdf_mime() -> None:
    upload = SimpleUploadedFile("guide.pdf", b"%PDF-1.4\n%FIE sample\n")

    validate_document(upload)


def test_document_validator_rejects_mismatched_mime() -> None:
    upload = SimpleUploadedFile("guide.pdf", b"not a pdf document")

    with pytest.raises(ValidationError, match="tidak sesuai"):
        validate_document(upload)


def test_document_validator_checks_office_archive_structure() -> None:
    contents = io.BytesIO()
    with ZipFile(contents, "w") as archive:
        archive.writestr("[Content_Types].xml", "<Types/>")
        archive.writestr("word/document.xml", "<document/>")
    validate_document(SimpleUploadedFile("guide.docx", contents.getvalue()))


def test_image_pipeline_writes_webp_avif_variants(tmp_path, settings) -> None:
    settings.MEDIA_ROOT = tmp_path
    metadata = optimize_image(io.BytesIO(create_image_bytes()))

    assert metadata["file"].endswith(("/480.webp", "/640.webp"))
    assert metadata["blur"].startswith("data:image/webp;base64,")
    assert (metadata["width"], metadata["height"]) == (640, 360)
    files = list(tmp_path.rglob("*"))
    assert any(path.suffix == ".webp" for path in files)
    assert any(path.suffix == ".avif" for path in files)


def test_image_pipeline_normalizes_cmyk_and_exif_orientation(
    tmp_path, settings
) -> None:
    settings.MEDIA_ROOT = tmp_path
    image = Image.new("CMYK", (640, 360), (0, 0, 0, 0))
    exif = image.getexif()
    exif[274] = 6
    source = io.BytesIO()
    image.save(source, format="JPEG", exif=exif)

    metadata = optimize_image(io.BytesIO(source.getvalue()))

    assert (metadata["width"], metadata["height"]) == (360, 640)
    with default_storage.open(metadata["file"], "rb") as optimized_file:
        assert Image.open(optimized_file).mode == "RGB"


@pytest.mark.django_db
def test_image_upload_is_replaced_with_responsive_variants(tmp_path, settings) -> None:
    settings.MEDIA_ROOT = tmp_path
    slide = HeroSlide.objects.create(
        title="Banner kampus",
        image=SimpleUploadedFile("banner.jpg", create_image_bytes()),
        alt="Banner kegiatan kampus",
    )

    assert slide.image.name.startswith("images/")
    assert slide.image.name.endswith("/640.webp")
    assert slide.image.storage.exists(slide.image.name)
    assert slide.image.storage.exists(slide.image.name.replace(".webp", ".avif"))
    from apps.core.models import MediaAsset

    metadata = MediaAsset.objects.get(file=slide.image.name)
    assert metadata.width == 640
    assert metadata.height == 360
    assert metadata.blur.startswith("data:image/webp;base64,")
    assert len(metadata.webp_variants) == len(metadata.avif_variants) == 2


def test_seed_dummy_refuses_production_settings(settings) -> None:
    settings.DEBUG = False
    settings.DJANGO_ENV = "production"

    with pytest.raises(CommandError, match="development"):
        call_command("seed_dummy")


@pytest.mark.django_db
def test_check_files_passes_when_media_is_complete() -> None:
    call_command("check_files")


@pytest.mark.django_db
def test_check_files_fails_for_a_missing_document() -> None:
    DownloadItem.objects.create(
        title="Panduan akademik",
        category=DownloadItem.Category.GUIDE,
        file="dokumen/panduan-akademik.pdf",
    )

    with pytest.raises(CommandError, match="tidak ditemukan"):
        call_command("check_files")


@pytest.mark.django_db
def test_publish_scheduled_publishes_only_valid_due_content() -> None:
    from datetime import timedelta

    from django.utils import timezone

    from apps.core.management.commands.publish_scheduled import Command
    from apps.news.models import NewsPost

    post = NewsPost.objects.create(
        kind=NewsPost.Kind.ARTICLE,
        title="Konten terjadwal",
        excerpt="Ringkasan",
        body="<p>Isi yang cukup panjang untuk menjelaskan informasi penting kepada warga "
        "fakultas secara lengkap dan dapat dipahami oleh semua pembaca situs.</p>",
        author_name="Humas",
        status=NewsPost.Status.SCHEDULED,
        published_at=timezone.now() - timedelta(minutes=1),
        meta_title="Konten terjadwal",
        meta_description="Deskripsi SEO yang cukup panjang untuk memenuhi batas karakter "
        "minimal serta menjelaskan isi tulisan kepada calon pembaca situs.",
    )

    Command().handle()
    post.refresh_from_db()

    assert post.status == NewsPost.Status.PUBLISHED
