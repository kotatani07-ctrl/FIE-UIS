from django.db import models


class ContactMessage(models.Model):
    name = models.CharField("Nama", max_length=120)
    email = models.EmailField("Email")
    subject = models.CharField("Subjek", max_length=180)
    message = models.TextField("Pesan")
    ip_hash = models.CharField("Hash alamat IP", max_length=64, blank=True)
    user_agent = models.CharField("User agent", max_length=512, blank=True)
    created_at = models.DateTimeField("Dikirim pada", auto_now_add=True)
    is_read = models.BooleanField("Sudah dibaca", default=False)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "Pesan masuk"
        verbose_name_plural = "Kotak masuk"

    def __str__(self) -> str:
        return f"{self.subject} — {self.name}"
