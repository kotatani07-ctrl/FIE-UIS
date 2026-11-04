from django.db.models import ImageField
from django.db.models.signals import pre_save
from django.dispatch import receiver

from apps.core.image_processing import optimize_image
from apps.core.models import MediaAsset


@receiver(pre_save, dispatch_uid="core.optimize_uploaded_images")
def optimize_uploaded_images(sender, instance, **kwargs) -> None:
    if not getattr(sender, "_meta", None):
        return
    for field in sender._meta.get_fields():
        if not isinstance(field, ImageField):
            continue
        uploaded = getattr(instance, field.name, None)
        if uploaded and not uploaded._committed:
            metadata = optimize_image(uploaded.file)
            MediaAsset.objects.update_or_create(
                file=metadata["file"],
                defaults={
                    "blur": metadata["blur"],
                    "width": metadata["width"],
                    "height": metadata["height"],
                    "webp_variants": metadata["webp_variants"],
                    "avif_variants": metadata["avif_variants"],
                },
            )
            setattr(instance, field.name, metadata["file"])
