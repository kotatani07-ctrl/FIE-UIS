from pathlib import Path
from zipfile import BadZipFile, ZipFile

import magic
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile
from PIL import Image, UnidentifiedImageError

MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_DOCUMENT_BYTES = 20 * 1024 * 1024
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP", "AVIF"}
DOCUMENT_MIMES = {
    ".pdf": {"application/pdf"},
    ".docx": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    },
    ".xlsx": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
    ".pptx": {
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    },
    ".zip": {"application/zip", "application/x-zip"},
}
OFFICE_CONTENT_TYPES = {
    ".docx": "word/document.xml",
    ".xlsx": "xl/workbook.xml",
    ".pptx": "ppt/presentation.xml",
}


def validate_image(upload: UploadedFile) -> None:
    """Reject images that could exhaust memory or bypass the supported decoders."""
    if upload.size > MAX_IMAGE_BYTES:
        raise ValidationError("Ukuran gambar maksimal 5 MB.")
    try:
        image = Image.open(upload)
        image.verify()
        width, height = image.size
        image_format = image.format
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as error:
        raise ValidationError("Berkas bukan gambar yang valid.") from error
    finally:
        upload.seek(0)
    if image_format not in ALLOWED_IMAGE_FORMATS:
        raise ValidationError(
            "Format gambar yang diizinkan: JPEG, PNG, WebP, atau AVIF."
        )
    if min(width, height) < 1 or max(width, height) > 6000:
        raise ValidationError("Dimensi gambar harus antara 1 dan 6000 piksel.")


def validate_document(upload: UploadedFile) -> None:
    """Check both the extension and the detected file type before storing documents."""
    extension = Path(upload.name or "").suffix.lower()
    if upload.size > MAX_DOCUMENT_BYTES:
        raise ValidationError("Ukuran dokumen maksimal 20 MB.")
    if extension not in DOCUMENT_MIMES:
        raise ValidationError("Format dokumen tidak diizinkan.")

    head = upload.read(8192)
    upload.seek(0)
    detected_mime = magic.from_buffer(head, mime=True)
    if detected_mime not in DOCUMENT_MIMES[extension]:
        raise ValidationError("Isi berkas tidak sesuai dengan ekstensi dokumen.")

    if extension in OFFICE_CONTENT_TYPES:
        try:
            with ZipFile(upload) as archive:
                names = set(archive.namelist())
        except BadZipFile as error:
            raise ValidationError("Dokumen Office tidak valid.") from error
        required = {"[Content_Types].xml", OFFICE_CONTENT_TYPES[extension]}
        if not required.issubset(names):
            raise ValidationError("Struktur dokumen Office tidak valid.")
    upload.seek(0)
