from django.db import models

from apps.core.models import Publishable, SlugMixin
from apps.core.validators import validate_document


class ResearchItem(Publishable, SlugMixin):
    class Kind(models.TextChoices):
        PUBLICATION = "publikasi", "Publikasi"
        RESEARCH = "penelitian", "Penelitian"
        COMMUNITY = "pengabdian", "Pengabdian kepada masyarakat"

    title = models.CharField("Judul", max_length=200)
    kind = models.CharField("Jenis", max_length=20, choices=Kind.choices)
    authors = models.CharField("Penulis", max_length=320)
    year = models.PositiveSmallIntegerField("Tahun")
    abstract = models.TextField("Abstrak")
    external_url = models.URLField("Tautan eksternal", blank=True)
    file = models.FileField(
        "Berkas", upload_to="research/", blank=True, validators=[validate_document]
    )

    class Meta:
        ordering = ("-year", "title")
        verbose_name = "Karya riset"
        verbose_name_plural = "Karya riset"

    def __str__(self) -> str:
        return self.title
