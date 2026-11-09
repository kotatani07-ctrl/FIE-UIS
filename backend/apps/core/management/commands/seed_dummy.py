import io

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from PIL import Image, ImageDraw

from apps.academics.models import StudyProgram
from apps.core.models import SiteSetting
from apps.events.models import Event
from apps.news.models import Announcement, NewsCategory, NewsPost


def _cover(
    width: int, height: int, base: tuple[int, int, int], label: str
) -> ContentFile:
    image = Image.new("RGB", (width, height), base)
    draw = ImageDraw.Draw(image)
    lighter = tuple(min(255, channel + 60) for channel in base)
    darker = tuple(max(0, channel - 40) for channel in base)
    draw.rectangle((0, height - 140, width, height), fill=lighter)
    draw.rectangle((width - 320, 0, width, height), fill=darker)
    draw.text((48, 48), label, fill=(255, 255, 255))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=88)
    buffer.seek(0)
    return ContentFile(buffer.read())


def _published_news(
    slug: str,
    title: str,
    excerpt: str,
    body: str,
    meta_description: str,
    author: str,
    category: NewsCategory,
    cover_label: str,
) -> None:
    post, created = NewsPost.objects.get_or_create(
        slug=slug,
        defaults={
            "kind": NewsPost.Kind.NEWS,
            "title": title,
            "excerpt": excerpt,
            "body": body,
            "author_name": author,
            "status": NewsPost.Status.PUBLISHED,
            "published_at": timezone.now(),
            "meta_title": title[:60],
            "meta_description": meta_description,
            "cover_alt": f"Ilustrasi {title[:60]}",
        },
    )
    if not created:
        return
    post.categories.add(category)
    # Unggah lewat penugasan field agar sinyal optimasi gambar berjalan,
    # sama seperti alur unggah di Django Admin.
    payload = _cover(1200, 675, (47, 91, 166), cover_label)
    post.cover = SimpleUploadedFile(
        f"{slug}-cover.jpg", payload.read(), content_type="image/jpeg"
    )
    post.save()


class Command(BaseCommand):
    help = "Isi basis data development dengan contoh konten yang ditandai [DUMMY]."

    def handle(self, *args, **options):
        if not settings.DEBUG or getattr(settings, "DJANGO_ENV", "") == "production":
            raise CommandError(
                "seed_dummy hanya boleh dijalankan di lingkungan development."
            )

        self._seed_site_settings()
        self._seed_news()
        self._seed_announcements()
        self._seed_events()
        self._seed_programs()
        self.stdout.write(self.style.SUCCESS("Konten [DUMMY] siap untuk development."))

    def _seed_site_settings(self) -> None:
        if SiteSetting.objects.exists():
            return
        SiteSetting.objects.create(
            faculty_name="Fakultas Ilmu Ekonomi",
            university_name="Universitas Ichsan Satya",
            tagline="[DUMMY] Menumbuhkan pemahaman ekonomi untuk karier yang nyata.",
            maps_embed_url=(
                "https://www.google.com/maps?q=-6.2912708,106.7051347&z=17&output=embed"
            ),
            stats_programs=2,
            meta_title="Fakultas Ilmu Ekonomi Universitas Ichsan Satya",
            meta_description=(
                "Situs resmi Fakultas Ilmu Ekonomi Universitas Ichsan Satya dengan "
                "profil, program studi, berita, agenda akademik, dan informasi "
                "kontak lengkap."
            ),
        )

    def _seed_news(self) -> None:
        pmb, _ = NewsCategory.objects.get_or_create(
            name="[DUMMY] PMB", defaults={"slug": "dummy-pmb"}
        )
        akademik, _ = NewsCategory.objects.get_or_create(
            name="[DUMMY] Akademik", defaults={"slug": "dummy-akademik"}
        )

        _published_news(
            slug="dummy-pendaftaran-mahasiswa-baru",
            title="[DUMMY] Pendaftaran Mahasiswa Baru Gelombang I Dibuka",
            excerpt=(
                "[DUMMY] Ringkasan jadwal, persyaratan, dan alur pendaftaran calon "
                "mahasiswa baru untuk kebutuhan pratinjau development."
            ),
            body=(
                "<p>[DUMMY] Konten contoh ini bukan informasi resmi fakultas. Ganti "
                "melalui Admin sebelum dipublikasikan di lingkungan produksi. Situs "
                "ini menampilkan konten yang dikelola melalui Django Admin.</p>"
            ),
            meta_description=(
                "Pendaftaran mahasiswa baru Gelombang I Fakultas Ilmu Ekonomi dibuka "
                "dengan jadwal, persyaratan, dan alur pendaftaran yang resmi."
            ),
            author="[DUMMY] Admin",
            category=pmb,
            cover_label="[DUMMY] PMB",
        )
        _published_news(
            slug="dummy-workshop-literasi-perpajakan",
            title="[DUMMY] Workshop Literasi Perpajakan Semester Awal",
            excerpt=(
                "[DUMMY] Kegiatan penguatan pemahaman dasar perpajakan bagi mahasiswa "
                "baru untuk kebutuhan pratinjau development."
            ),
            body=(
                "<p>[DUMMY] Konten contoh ini bukan informasi resmi fakultas. Ganti "
                "melalui Admin sebelum dipublikasikan di lingkungan produksi.</p>"
            ),
            meta_description=(
                "Workshop literasi perpajakan memperkuat pemahaman dasar perpajakan "
                "mahasiswa semester awal melalui sesi praktik dan diskusi terbimbing."
            ),
            author="[DUMMY] Admin",
            category=akademik,
            cover_label="[DUMMY] Workshop",
        )
        _published_news(
            slug="dummy-kuliah-umum-manajemen-retail",
            title="[DUMMY] Kuliah Umum Manajemen Retail di Era Digital",
            excerpt=(
                "[DUMMY] Diskusi perkembangan ritel digital bersama praktisi dan dosen "
                "pengampu untuk kebutuhan pratinjau development."
            ),
            body=(
                "<p>[DUMMY] Konten contoh ini bukan informasi resmi fakultas. Ganti "
                "melalui Admin sebelum dipublikasikan di lingkungan produksi.</p>"
            ),
            meta_description=(
                "Kuliah umum membahas tren manajemen retail di era digital bersama "
                "praktisi industri dan dosen pengampu program studi manajemen retail."
            ),
            author="[DUMMY] Admin",
            category=akademik,
            cover_label="[DUMMY] Kuliah Umum",
        )

    def _seed_announcements(self) -> None:
        samples = (
            (
                "dummy-jadwal-uts-ganjil",
                "[DUMMY] Jadwal Ujian Tengah Semester Ganjil",
                (
                    "<p>[DUMMY] Jadwal ujian tengah semester ganjil untuk seluruh "
                    "program studi. Konten contoh ini bukan informasi resmi fakultas "
                    "dan hanya digunakan untuk pratinjau development.</p>"
                ),
                True,
            ),
            (
                "dummy-batas-krs",
                "[DUMMY] Batas Akhir Pengisian Kartu Rencana Studi",
                (
                    "<p>[DUMMY] Batas akhir pengisian Kartu Rencana Studi untuk "
                    "mahasiswa aktif. Konten contoh ini bukan informasi resmi "
                    "fakultas dan hanya untuk pratinjau development.</p>"
                ),
                False,
            ),
            (
                "dummy-pemeliharaan-sistem",
                "[DUMMY] Pemeliharaan Terjadwal Sistem Informasi Akademik",
                (
                    "<p>[DUMMY] Pemeliharaan terjadwal sistem informasi akademik pada "
                    "akhir pekan. Konten contoh ini bukan informasi resmi fakultas "
                    "dan hanya untuk pratinjau development.</p>"
                ),
                False,
            ),
        )
        for slug, title, body, pinned in samples:
            Announcement.objects.get_or_create(
                slug=slug,
                defaults={
                    "title": title,
                    "body": body,
                    "is_pinned": pinned,
                    "status": Announcement.Status.PUBLISHED,
                    "published_at": timezone.now(),
                },
            )

    def _seed_events(self) -> None:
        now = timezone.now()
        samples = (
            (
                "dummy-sosialisasi-kurikulum",
                "[DUMMY] Sosialisasi Kurikulum Semester Ganjil",
                "Aula Fakultas",
                now + timezone.timedelta(days=7),
                now + timezone.timedelta(days=7, hours=3),
            ),
            (
                "dummy-seminar-nasional-ekonomi-digital",
                "[DUMMY] Seminar Nasional Ekonomi Digital",
                "Auditorium Universitas",
                now + timezone.timedelta(days=14),
                now + timezone.timedelta(days=14, hours=6),
            ),
            (
                "dummy-open-house-program-studi",
                "[DUMMY] Open House Program Studi",
                "Gedung FIE",
                now + timezone.timedelta(days=21),
                now + timezone.timedelta(days=21, hours=5),
            ),
        )
        for slug, title, location, start, end in samples:
            Event.objects.get_or_create(
                slug=slug,
                defaults={
                    "title": title,
                    "description": (
                        "<p>[DUMMY] Deskripsi agenda contoh untuk pratinjau "
                        "development. Konten ini bukan informasi resmi fakultas "
                        "dan harus diganti melalui Admin.</p>"
                    ),
                    "start_at": start,
                    "end_at": end,
                    "location": location,
                    "status": Event.Status.PUBLISHED,
                    "published_at": now,
                },
            )

    def _seed_programs(self) -> None:
        StudyProgram.objects.get_or_create(
            slug="s1-perpajakan",
            defaults={
                "name": "[DUMMY] Perpajakan",
                "degree": StudyProgram.Degree.S1,
                "summary": (
                    "[DUMMY] Jenjang sarjana dengan fokus bidang perpajakan dan "
                    "administrasi keuangan. Mahasiswa dibekali kemampuan teknis "
                    "perpajakan, kepatuhan, dan analisis fiskal untuk kebutuhan "
                    "industri. Konten contoh untuk pratinjau development."
                ),
                "meta_title": "Program Studi Perpajakan",
                "meta_description": (
                    "Program studi sarjana Perpajakan dengan fokus perpajakan dan "
                    "administrasi keuangan serta prospek karier di konsultan pajak "
                    "dan instansi."
                ),
                "status": StudyProgram.Status.PUBLISHED,
                "published_at": timezone.now(),
                "order": 1,
            },
        )
        StudyProgram.objects.get_or_create(
            slug="s1-manajemen-retail",
            defaults={
                "name": "[DUMMY] Manajemen Retail",
                "degree": StudyProgram.Degree.S1,
                "summary": (
                    "[DUMMY] Jenjang sarjana dengan fokus bidang manajemen ritel dan "
                    "bisnis modern. Mahasiswa mempelajari operasional toko, rantai "
                    "pasok, serta pengalaman pelanggan untuk kebutuhan pratinjau "
                    "development."
                ),
                "meta_title": "Program Studi Manajemen Retail",
                "meta_description": (
                    "Program studi sarjana Manajemen Retail yang menyiapkan lulusan "
                    "untuk mengelola bisnis ritel modern, rantai pasok, dan "
                    "pengalaman pelanggan."
                ),
                "status": StudyProgram.Status.PUBLISHED,
                "published_at": timezone.now(),
                "order": 2,
            },
        )
