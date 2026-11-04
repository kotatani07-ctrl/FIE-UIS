from django.db import models
from django_ckeditor_5.fields import CKEditor5Field
from simple_history.models import HistoricalRecords

from apps.core.models import Publishable, SeoFields, SlugMixin
from apps.core.validators import validate_image


class StudyProgram(Publishable, SlugMixin, SeoFields):
    class Degree(models.TextChoices):
        D3 = "D3", "Diploma 3"
        S1 = "S1", "Sarjana"
        S2 = "S2", "Magister"

    name = models.CharField("Nama program studi", max_length=160)
    slug_source_field = "name"
    degree = models.CharField("Jenjang", max_length=2, choices=Degree.choices)
    summary = models.TextField("Ringkasan")
    vision = models.TextField("Visi", blank=True)
    mission = models.TextField("Misi", blank=True)
    accreditation_body = models.CharField(
        "Lembaga akreditasi", max_length=160, blank=True
    )
    accreditation_grade = models.CharField(
        "Peringkat akreditasi", max_length=80, blank=True
    )
    accreditation_number = models.CharField(
        "Nomor akreditasi", max_length=120, blank=True
    )
    accreditation_valid_until = models.DateField(
        "Berlaku sampai", null=True, blank=True
    )
    accreditation_certificate = models.ImageField(
        "Sertifikat akreditasi",
        upload_to="programs/accreditation/",
        blank=True,
        validators=[validate_image],
    )
    accreditation_certificate_alt = models.CharField(
        "Teks alternatif sertifikat", max_length=180, blank=True
    )
    curriculum = CKEditor5Field("Kurikulum", config_name="default")
    career_prospects = CKEditor5Field("Prospek karier", config_name="default")
    head_name = models.CharField("Nama ketua program studi", max_length=160, blank=True)
    head_photo = models.ImageField(
        "Foto ketua program studi",
        upload_to="programs/heads/",
        blank=True,
        validators=[validate_image],
    )
    cover = models.ImageField(
        "Sampul", upload_to="programs/", blank=True, validators=[validate_image]
    )
    cover_alt = models.CharField("Teks alternatif sampul", max_length=180, blank=True)
    order = models.PositiveSmallIntegerField("Urutan", default=0)
    rich_text_fields = ("curriculum", "career_prospects")
    history = HistoricalRecords()

    class Meta:
        ordering = ("order", "name")
        verbose_name = "Program studi"
        verbose_name_plural = "Program studi"

    def __str__(self) -> str:
        return self.name
