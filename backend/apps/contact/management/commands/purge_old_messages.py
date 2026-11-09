from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.contact.models import ContactMessage


class Command(BaseCommand):
    help = "Hapus pesan kontak yang telah melewati masa retensi 12 bulan."

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=365)
        deleted_count, _ = ContactMessage.objects.filter(created_at__lt=cutoff).delete()
        self.stdout.write(self.style.SUCCESS(f"{deleted_count} pesan lama dihapus."))
