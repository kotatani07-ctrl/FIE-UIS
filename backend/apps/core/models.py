import re
from typing import ClassVar
from urllib.parse import urlparse

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxLengthValidator
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from simple_history.models import HistoricalRecords

from apps.core.sanitizer import plain_text, sanitize_html
from apps.core.validators import validate_image

PLACEHOLDER_PATTERN = re.compile(
    r"lorem ipsum|ini isi content|abc\.{3,}|\bTODO\b|\bxxx\b",
    re.IGNORECASE,
)


class TimeStamped(models.Model):
    created_at = models.DateTimeField("Dibuat pada", auto_now_add=True)
    updated_at = models.DateTimeField("Diperbarui pada", auto_now=True)

    class Meta:
        abstract = True


class Publishable(TimeStamped):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draf"
        SCHEDULED = "scheduled", "Terjadwal"
        PUBLISHED = "published", "Terbit"
        ARCHIVED = "archived", "Diarsipkan"

    status = models.CharField(
        "Status", max_length=12, choices=Status.choices, default=Status.DRAFT
    )
    published_at = models.DateTimeField("Waktu terbit", null=True, blank=True)

    class Meta:
        abstract = True

    @classmethod
    def live_queryset(cls):
        return cls.objects.filter(
            status=cls.Status.PUBLISHED, published_at__lte=timezone.now()
        )

    def clean(self) -> None:
        super().clean()
        if self.status != self.Status.PUBLISHED:
            return

        errors: dict[str, str] = {}
        title = getattr(self, "title", getattr(self, "name", ""))
        if not title.strip():
            errors["title"] = "Judul wajib diisi sebelum konten diterbitkan."
        if not self.published_at:
            errors["published_at"] = "Waktu terbit wajib diisi sebelum diterbitkan."
        meta_title = getattr(self, "meta_title", "")
        if hasattr(self, "meta_title") and not meta_title.strip():
            errors["meta_title"] = "Judul SEO wajib diisi sebelum konten diterbitkan."

        content_field = next(
            (
                field_name
                for field_name in ("body", "description", "summary", "abstract")
                if hasattr(self, field_name)
            ),
            "body",
        )
        content = getattr(self, content_field, "")
        text_content = plain_text(str(content or ""))
        if len(text_content) < 80:
            errors[content_field] = "Isi konten harus memiliki sedikitnya 80 karakter."
        if PLACEHOLDER_PATTERN.search(text_content) or (
            not settings.DEBUG and "[DUMMY]" in text_content
        ):
            errors[content_field] = (
                "Konten mengandung teks sementara yang tidak boleh diterbitkan."
            )
        if re.search(r"file:///|mso-", str(content), re.IGNORECASE):
            errors[content_field] = (
                "Bersihkan markup dari Word atau jalur file lokal sebelum menerbitkan."
            )

        description = getattr(self, "meta_description", "")
        if (
            hasattr(self, "meta_description")
            and not 120 <= len(description.strip()) <= 160
        ):
            errors["meta_description"] = "Deskripsi SEO harus berisi 120–160 karakter."

        if hasattr(self, "cover") and getattr(self, "kind", None) == "berita":
            if not self.cover:
                errors["cover"] = "Gambar sampul wajib untuk berita."
            if not getattr(self, "cover_alt", "").strip():
                errors["cover_alt"] = "Teks alternatif sampul wajib untuk berita."
        if title:
            duplicate = type(self).live_queryset().filter(title__iexact=title)
            if self.pk:
                duplicate = duplicate.exclude(pk=self.pk)
            if duplicate.exists():
                errors["title"] = (
                    "Judul sudah digunakan oleh konten lain yang telah terbit."
                )
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        for field_name in getattr(self, "rich_text_fields", ()):
            value = getattr(self, field_name, "")
            setattr(self, field_name, sanitize_html(value or ""))
        if self.status == self.Status.PUBLISHED and self.published_at is None:
            self.published_at = timezone.now()
        return super().save(*args, **kwargs)


class SeoFields(models.Model):
    meta_title = models.CharField(
        "Judul SEO", max_length=60, blank=True, validators=[MaxLengthValidator(60)]
    )
    meta_description = models.CharField("Deskripsi SEO", max_length=160, blank=True)
    og_image = models.ImageField(
        "Gambar Open Graph",
        upload_to="seo/",
        blank=True,
        validators=[validate_image],
    )

    class Meta:
        abstract = True


class SlugMixin(models.Model):
    slug = models.SlugField("Slug", max_length=180, unique=True, blank=True)
    slug_source_field: ClassVar[str] = "title"

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        base = (self.slug or slugify(getattr(self, self.slug_source_field, "")))[
            :180
        ] or "item"
        candidate, suffix = base, 2
        while type(self).objects.filter(slug=candidate).exclude(pk=self.pk).exists():
            candidate = f"{base[:175]}-{suffix}"
            suffix += 1
        self.slug = candidate
        return super().save(*args, **kwargs)


class SiteSetting(TimeStamped, SeoFields):
    faculty_name = models.CharField(
        "Nama fakultas", max_length=160, default="Fakultas Ilmu Ekonomi"
    )
    university_name = models.CharField(
        "Nama universitas", max_length=160, default="Universitas Ichsan Satya"
    )
    tagline = models.CharField("Slogan", max_length=240, blank=True)
    address = models.TextField("Alamat", blank=True)
    phone = models.CharField("Telepon", max_length=40, blank=True)
    email = models.EmailField("Email", blank=True)
    maps_embed_url = models.URLField("Tautan peta", blank=True)
    social_instagram = models.URLField("Instagram", blank=True)
    social_facebook = models.URLField("Facebook", blank=True)
    social_youtube = models.URLField("YouTube", blank=True)
    social_linkedin = models.URLField("LinkedIn", blank=True)
    stats_programs = models.PositiveIntegerField("Jumlah program studi", default=0)
    stats_lecturers = models.PositiveIntegerField("Jumlah dosen", default=0)
    stats_students = models.PositiveIntegerField("Jumlah mahasiswa", default=0)
    stats_partners = models.PositiveIntegerField("Jumlah mitra", default=0)
    pmb_url = models.URLField("Tautan penerimaan mahasiswa baru", blank=True)
    history = HistoricalRecords()

    class Meta:
        verbose_name = "Pengaturan situs"
        verbose_name_plural = "Pengaturan situs"

    def clean(self) -> None:
        super().clean()
        if self.maps_embed_url:
            host = urlparse(self.maps_embed_url).hostname or ""
            if host not in {"maps.google.com", "www.google.com", "google.com"}:
                raise ValidationError(
                    {"maps_embed_url": "Gunakan URL peta resmi dari Google Maps."}
                )

    def save(self, *args, **kwargs):
        self.pk = 1
        if self._state.adding and type(self).objects.filter(pk=self.pk).exists():
            raise ValidationError(
                "Pengaturan situs sudah tersedia. Ubah data yang ada, bukan menambahkan baris baru."
            )
        self.full_clean()
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Pengaturan situs tunggal tidak dapat dihapus.")

    def __str__(self) -> str:
        return self.faculty_name


class MediaAsset(models.Model):
    file = models.CharField("Berkas utama", max_length=255, unique=True)
    width = models.PositiveIntegerField("Lebar gambar")
    height = models.PositiveIntegerField("Tinggi gambar")
    blur = models.TextField("Pratinjau buram")
    webp_variants = models.JSONField("Varian WebP", default=list)
    avif_variants = models.JSONField("Varian AVIF", default=list)

    class Meta:
        verbose_name = "Metadata gambar"
        verbose_name_plural = "Metadata gambar"

    def __str__(self) -> str:
        return self.file
