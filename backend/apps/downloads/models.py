from pathlib import Path

from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify

from apps.core.models import TimeStamped
from apps.core.validators import validate_document


class DownloadItem(TimeStamped):
    class Category(models.TextChoices):
        GUIDE = "panduan", "Panduan"
        CALENDAR = "kalender", "Kalender akademik"
        ACADEMIC = "pedoman", "Pedoman akademik"
        OTHER = "lainnya", "Lainnya"

    title = models.CharField("Judul", max_length=200)
    category = models.CharField("Kategori", max_length=12, choices=Category.choices)
    file = models.FileField(
        "Berkas", upload_to="downloads/", validators=[validate_document]
    )
    file_size = models.PositiveBigIntegerField(
        "Ukuran berkas", editable=False, default=0
    )
    description = models.CharField("Deskripsi", max_length=320, blank=True)
    order = models.PositiveSmallIntegerField("Urutan", default=0)
    is_active = models.BooleanField("Aktif", default=True)

    class Meta:
        ordering = ("order", "title")
        verbose_name = "Berkas unduhan"
        verbose_name_plural = "Berkas unduhan"

    def clean(self) -> None:
        super().clean()
        if (
            self.file
            and getattr(self.file, "_committed", False)
            and not self.file.storage.exists(self.file.name)
        ):
            raise ValidationError({"file": "Berkas tidak ditemukan di penyimpanan."})

    def save(self, *args, **kwargs):
        if self.file and not self.file._committed:
            extension = Path(self.file.name).suffix.lower()
            self.file.name = f"{slugify(Path(self.file.name).stem)}{extension}"
            self.file_size = self.file.size
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title
