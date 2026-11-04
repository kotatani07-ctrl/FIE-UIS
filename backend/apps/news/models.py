from django.db import models
from django_ckeditor_5.fields import CKEditor5Field
from simple_history.models import HistoricalRecords

from apps.core.models import Publishable, SeoFields, SlugMixin
from apps.core.validators import validate_document, validate_image


class NameSlugModel(models.Model):
    name = models.CharField("Nama", max_length=100, unique=True)
    slug = models.SlugField("Slug", max_length=120, unique=True, blank=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        from django.utils.text import slugify

        if not self.slug:
            self.slug = slugify(self.name)[:120]
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class NewsCategory(NameSlugModel):
    class Meta:
        ordering = ("name",)
        verbose_name = "Kategori berita"
        verbose_name_plural = "Kategori berita"


class Tag(NameSlugModel):
    class Meta:
        ordering = ("name",)
        verbose_name = "Tag"
        verbose_name_plural = "Tag"


class NewsPost(Publishable, SlugMixin, SeoFields):
    class Kind(models.TextChoices):
        NEWS = "berita", "Berita"
        ARTICLE = "artikel", "Artikel"
        OPINION = "opini", "Opini dosen"

    kind = models.CharField(
        "Jenis konten", max_length=12, choices=Kind.choices, default=Kind.NEWS
    )
    title = models.CharField("Judul", max_length=200)
    excerpt = models.CharField("Ringkasan", max_length=320)
    body = CKEditor5Field("Isi", config_name="default")
    cover = models.ImageField(
        "Sampul", upload_to="news/", blank=True, validators=[validate_image]
    )
    cover_alt = models.CharField("Teks alternatif sampul", max_length=180, blank=True)
    categories = models.ManyToManyField(
        NewsCategory, verbose_name="Kategori", blank=True
    )
    tags = models.ManyToManyField(Tag, verbose_name="Tag", blank=True)
    author_name = models.CharField("Nama penulis", max_length=160)
    rich_text_fields = ("body",)
    history = HistoricalRecords()

    class Meta:
        ordering = ("-published_at", "-id")
        indexes = [models.Index(fields=("status", "-published_at"))]
        verbose_name = "Berita dan artikel"
        verbose_name_plural = "Berita dan artikel"

    def __str__(self) -> str:
        return self.title


class Announcement(Publishable, SlugMixin):
    title = models.CharField("Judul", max_length=200)
    body = CKEditor5Field("Isi pengumuman", config_name="default")
    attachment = models.FileField(
        "Lampiran",
        upload_to="announcements/",
        blank=True,
        validators=[validate_document],
    )
    is_pinned = models.BooleanField("Sematkan", default=False)
    expires_at = models.DateTimeField("Berakhir pada", null=True, blank=True)
    rich_text_fields = ("body",)
    history = HistoricalRecords()

    class Meta:
        ordering = ("-is_pinned", "-published_at")
        verbose_name = "Pengumuman"
        verbose_name_plural = "Pengumuman"

    def __str__(self) -> str:
        return self.title
