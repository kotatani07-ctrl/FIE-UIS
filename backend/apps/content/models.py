from django.core.exceptions import ValidationError
from django.db import models
from django_ckeditor_5.fields import CKEditor5Field
from simple_history.models import HistoricalRecords

from apps.core.models import Publishable, SeoFields, TimeStamped
from apps.core.validators import validate_image


class HeroSlide(TimeStamped):
    title = models.CharField("Judul", max_length=160)
    subtitle = models.CharField("Subjudul", max_length=240, blank=True)
    image = models.ImageField("Gambar", upload_to="hero/", validators=[validate_image])
    alt = models.CharField("Teks alternatif", max_length=180)
    link_url = models.URLField("Tautan tujuan", blank=True)
    link_page = models.CharField("Halaman tujuan", max_length=180, blank=True)
    link_label = models.CharField("Label tautan", max_length=80, blank=True)
    order = models.PositiveSmallIntegerField("Urutan", default=0)
    is_active = models.BooleanField("Aktif", default=True)
    starts_at = models.DateTimeField("Mulai ditampilkan", null=True, blank=True)
    ends_at = models.DateTimeField("Berakhir ditampilkan", null=True, blank=True)

    class Meta:
        ordering = ("order", "pk")
        verbose_name = "Slide utama"
        verbose_name_plural = "Slide utama"

    def clean(self) -> None:
        super().clean()
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValidationError({"ends_at": "Waktu akhir harus setelah waktu mulai."})

    def __str__(self) -> str:
        return self.title


class StaticPage(Publishable, SeoFields):
    class Key(models.TextChoices):
        HISTORY = "sejarah", "Sejarah"
        VISION_MISSION = "visi-misi", "Visi dan misi"
        OBJECTIVES = "tujuan", "Tujuan"
        ORGANIZATION = "struktur-organisasi", "Struktur organisasi"
        PARTNERS = "mitra-kerja-sama", "Mitra kerja sama"

    key = models.SlugField(
        "Kunci halaman", max_length=80, unique=True, choices=Key.choices
    )
    title = models.CharField("Judul", max_length=180)
    body = CKEditor5Field("Isi halaman", config_name="default")
    cover = models.ImageField(
        "Sampul", upload_to="pages/", blank=True, validators=[validate_image]
    )
    rich_text_fields = ("body",)
    history = HistoricalRecords()

    class Meta:
        ordering = ("key",)
        verbose_name = "Halaman statis"
        verbose_name_plural = "Halaman statis"

    def __str__(self) -> str:
        return self.title


class Partner(TimeStamped):
    name = models.CharField("Nama mitra", max_length=160)
    logo = models.ImageField("Logo", upload_to="partners/", validators=[validate_image])
    url = models.URLField("Situs mitra", blank=True)
    order = models.PositiveSmallIntegerField("Urutan", default=0)
    is_active = models.BooleanField("Aktif", default=True)

    class Meta:
        ordering = ("order", "name")
        verbose_name = "Mitra"
        verbose_name_plural = "Mitra"

    def __str__(self) -> str:
        return self.name

    @property
    def logo_alt(self) -> str:
        return self.name
