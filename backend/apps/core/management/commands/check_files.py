from django.apps import apps
from django.core.management.base import BaseCommand, CommandError
from django.db.models import FileField


class Command(BaseCommand):
    help = "Periksa semua berkas media yang tercatat di basis data."

    def handle(self, *args, **options):
        missing: list[str] = []
        for model in apps.get_models():
            if model._meta.app_label.startswith("historical"):
                continue
            for field in model._meta.get_fields():
                if not isinstance(field, FileField):
                    continue
                for item in model.objects.exclude(**{field.name: ""}).iterator():
                    stored_file = getattr(item, field.name)
                    if stored_file and not stored_file.storage.exists(stored_file.name):
                        missing.append(
                            f"{model._meta.label}.{field.name}: {stored_file.name}"
                        )

        if missing:
            raise CommandError("Berkas berikut tidak ditemukan:\n" + "\n".join(missing))
        self.stdout.write(self.style.SUCCESS("Semua berkas media tersedia."))
