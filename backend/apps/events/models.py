from django.core.exceptions import ValidationError
from django.db import models
from django_ckeditor_5.fields import CKEditor5Field
from simple_history.models import HistoricalRecords

from apps.core.models import Publishable, SlugMixin
from apps.core.validators import validate_image


class Event(Publishable, SlugMixin):
    title = models.CharField("Judul agenda", max_length=200)
    description = CKEditor5Field("Deskripsi", config_name="default")
    start_at = models.DateTimeField("Mulai")
    end_at = models.DateTimeField("Selesai")
    location = models.CharField("Lokasi", max_length=200)
    registration_url = models.URLField("Tautan pendaftaran", blank=True)
    cover = models.ImageField(
        "Sampul", upload_to="events/", blank=True, validators=[validate_image]
    )
    cover_alt = models.CharField("Teks alternatif sampul", max_length=180, blank=True)
    rich_text_fields = ("description",)
    history = HistoricalRecords()

    class Meta:
        ordering = ("start_at",)
        verbose_name = "Agenda"
        verbose_name_plural = "Agenda"

    def clean(self) -> None:
        super().clean()
        if self.start_at and self.end_at and self.end_at < self.start_at:
            raise ValidationError(
                {"end_at": "Waktu selesai harus setelah waktu mulai."}
            )

    def __str__(self) -> str:
        return self.title
