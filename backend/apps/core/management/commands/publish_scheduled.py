from django.apps import apps
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.core.models import Publishable


class Command(BaseCommand):
    help = "Terbitkan konten terjadwal yang waktu terbitnya sudah tiba."

    def handle(self, *args, **options):
        now = timezone.now()
        published_count = 0
        for model in apps.get_models():
            if not issubclass(model, Publishable) or model is Publishable:
                continue
            due_items = model.objects.filter(
                status=Publishable.Status.SCHEDULED, published_at__lte=now
            )
            for item in due_items.iterator():
                item.status = Publishable.Status.PUBLISHED
                try:
                    item.full_clean()
                    item.save()
                except ValidationError as error:
                    raise CommandError(
                        f"{model._meta.verbose_name} “{item}” belum layak terbit: "
                        f"{error.messages[0]}"
                    ) from error
                published_count += 1
        self.stdout.write(
            self.style.SUCCESS(f"{published_count} konten terjadwal diterbitkan.")
        )
