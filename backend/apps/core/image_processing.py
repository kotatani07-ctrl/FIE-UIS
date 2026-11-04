import base64
import io
from uuid import uuid4

import pillow_avif  # noqa: F401
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from PIL import Image, ImageOps


def optimize_image(image_file) -> dict:
    """Create bounded responsive variants while removing source metadata."""
    image_file.seek(0)
    with Image.open(image_file) as source:
        image = ImageOps.exif_transpose(source)
        if image.mode not in {"RGB", "RGBA"}:
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        image.thumbnail((2000, 2000), Image.Resampling.LANCZOS)
        width, height = image.size
        image_id = uuid4().hex

        blur_image = image.copy()
        blur_image.thumbnail((20, 20), Image.Resampling.LANCZOS)
        blur_buffer = io.BytesIO()
        blur_image.save(blur_buffer, format="WEBP", quality=45, method=4)
        blur_data = "data:image/webp;base64," + base64.b64encode(
            blur_buffer.getvalue()
        ).decode("ascii")

        available_widths = sorted({min(width, size) for size in (480, 960, 1440)})
        webp_variants = []
        avif_variants = []
        for variant_width in available_widths:
            variant = image.copy()
            if variant.width != variant_width:
                variant.thumbnail(
                    (variant_width, variant_width * 2), Image.Resampling.LANCZOS
                )
            for image_format, extension, quality in (
                ("WEBP", "webp", 78),
                ("AVIF", "avif", 55),
            ):
                output = io.BytesIO()
                variant.save(output, format=image_format, quality=quality)
                relative_path = f"images/{image_id}/{variant.width}.{extension}"
                saved_path = default_storage.save(
                    relative_path, ContentFile(output.getvalue())
                )
                metadata = {"file": saved_path, "width": variant.width}
                if image_format == "WEBP":
                    webp_variants.append(metadata)
                else:
                    avif_variants.append(metadata)

        return {
            "file": webp_variants[-1]["file"],
            "blur": blur_data,
            "width": width,
            "height": height,
            "webp_variants": webp_variants,
            "avif_variants": avif_variants,
        }
