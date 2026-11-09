"""JSON feed for the custom React dashboard inside Django admin."""

from __future__ import annotations

from datetime import date
from typing import Any

from django.conf import settings
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Count, Q
from django.http import JsonResponse
from django.urls import NoReverseMatch, reverse
from django.utils import timezone
from django.views.decorators.http import require_GET

from apps.academics.models import StudyProgram
from apps.content.models import Partner, StaticPage
from apps.contact.models import ContactMessage
from apps.core.models import SiteSetting
from apps.downloads.models import DownloadItem
from apps.events.models import Event
from apps.news.models import Announcement, NewsPost
from apps.research.models import ResearchItem

MONTH_LABELS = (
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
)


def _admin_url(name: str, *args: Any) -> str:
    try:
        return reverse(f"admin:{name}", args=args)
    except NoReverseMatch:
        return ""


def _iso(value: Any) -> str | None:
    return value.isoformat() if value else None


def _status_label(value: str) -> str:
    return dict(NewsPost.Status.choices).get(value, value)


def _month_start(today: date, months_ago: int) -> date:
    year = today.year
    month = today.month - months_ago
    while month <= 0:
        month += 12
        year -= 1
    return date(year, month, 1)


def _next_month(month_start: date) -> date:
    if month_start.month == 12:
        return date(month_start.year + 1, 1, 1)
    return date(month_start.year, month_start.month + 1, 1)


def _content_trend(today: date) -> list[dict[str, Any]]:
    trend: list[dict[str, Any]] = []
    for months_ago in range(5, -1, -1):
        start = _month_start(today, months_ago)
        end = _next_month(start)
        count = (
            NewsPost.objects.filter(
                created_at__date__gte=start, created_at__date__lt=end
            ).count()
            + Event.objects.filter(
                created_at__date__gte=start, created_at__date__lt=end
            ).count()
            + Announcement.objects.filter(
                created_at__date__gte=start, created_at__date__lt=end
            ).count()
            + ResearchItem.objects.filter(
                created_at__date__gte=start, created_at__date__lt=end
            ).count()
        )
        trend.append(
            {
                "label": MONTH_LABELS[start.month - 1],
                "full": f"{MONTH_LABELS[start.month - 1]} {start.year}",
                "count": count,
            }
        )
    return trend


def _initials(name: str) -> str:
    parts = [part for part in name.split() if part]
    if not parts:
        return "AD"
    return "".join(part[0] for part in parts[:2]).upper()


@require_GET
@staff_member_required(login_url=f"/{settings.ADMIN_URL_PREFIX}login/")
def admin_dashboard_data(request):
    now = timezone.localtime()
    today = now.date()

    news = NewsPost.objects.aggregate(
        total=Count("id"),
        published=Count("id", filter=Q(status=NewsPost.Status.PUBLISHED)),
        draft=Count("id", filter=Q(status=NewsPost.Status.DRAFT)),
        scheduled=Count("id", filter=Q(status=NewsPost.Status.SCHEDULED)),
    )
    event_total = Event.objects.count()
    event_upcoming = Event.objects.filter(
        start_at__gte=now, status=Event.Status.PUBLISHED
    ).count()
    program_total = StudyProgram.objects.count()
    program_published = StudyProgram.objects.filter(
        status=StudyProgram.Status.PUBLISHED
    ).count()
    announcement_total = Announcement.objects.count()
    announcement_published = Announcement.objects.filter(
        status=Announcement.Status.PUBLISHED
    ).count()
    research_total = ResearchItem.objects.count()
    research_published = ResearchItem.objects.filter(
        status=ResearchItem.Status.PUBLISHED
    ).count()
    download_total = DownloadItem.objects.count()
    download_active = DownloadItem.objects.filter(is_active=True).count()
    message_total = ContactMessage.objects.count()
    message_unread = ContactMessage.objects.filter(is_read=False).count()
    partner_active = Partner.objects.filter(is_active=True).count()
    page_published = StaticPage.objects.filter(
        status=StaticPage.Status.PUBLISHED
    ).count()

    cards = [
        {
            "key": "news",
            "label": "Berita & Artikel",
            "value": news["total"],
            "detail": f"{news['published']} terbit · {news['draft']} draf",
            "href": _admin_url("news_news_post_changelist"),
            "add_href": _admin_url("news_news_post_add"),
            "icon": "news",
            "tone": "brand",
        },
        {
            "key": "events",
            "label": "Agenda Mendatang",
            "value": event_upcoming,
            "detail": f"dari {event_total} agenda",
            "href": _admin_url("events_event_changelist"),
            "add_href": _admin_url("events_event_add"),
            "icon": "calendar",
            "tone": "accent",
        },
        {
            "key": "programs",
            "label": "Program Studi",
            "value": program_total,
            "detail": f"{program_published} terbit",
            "href": _admin_url("academics_studyprogram_changelist"),
            "add_href": _admin_url("academics_studyprogram_add"),
            "icon": "academic",
            "tone": "emerald",
        },
        {
            "key": "messages",
            "label": "Pesan Belum Dibaca",
            "value": message_unread,
            "detail": f"dari {message_total} pesan masuk",
            "href": _admin_url("contact_contactmessage_changelist"),
            "add_href": "",
            "icon": "mail",
            "tone": "amber",
        },
    ]

    secondary = [
        {
            "label": "Pengumuman",
            "value": announcement_total,
            "detail": f"{announcement_published} terbit",
            "href": _admin_url("news_announcement_changelist"),
        },
        {
            "label": "Karya riset",
            "value": research_total,
            "detail": f"{research_published} terbit",
            "href": _admin_url("research_researchitem_changelist"),
        },
        {
            "label": "Unduhan aktif",
            "value": download_active,
            "detail": f"dari {download_total} berkas",
            "href": _admin_url("downloads_downloaditem_changelist"),
        },
        {
            "label": "Halaman terbit",
            "value": page_published,
            "detail": f"{partner_active} mitra aktif",
            "href": _admin_url("content_staticpage_changelist"),
        },
    ]

    recent_news = [
        {
            "id": item.pk,
            "title": item.title,
            "kind": item.get_kind_display(),
            "status": item.get_status_display(),
            "status_key": item.status,
            "updated_at": _iso(item.updated_at),
            "published_at": _iso(item.published_at),
            "url": _admin_url("news_news_post_change", item.pk),
        }
        for item in NewsPost.objects.order_by("-updated_at")[:6]
    ]

    recent_messages = [
        {
            "id": item.pk,
            "name": item.name,
            "email": item.email,
            "subject": item.subject,
            "created_at": _iso(item.created_at),
            "is_read": item.is_read,
            "url": _admin_url("contact_contactmessage_change", item.pk),
        }
        for item in ContactMessage.objects.order_by("-created_at")[:5]
    ]

    quick_actions = [
        {
            "label": "Tulis berita",
            "description": "Bagikan kabar dan cerita terbaru.",
            "href": _admin_url("news_news_post_add"),
            "icon": "news",
        },
        {
            "label": "Tambah agenda",
            "description": "Jadwalkan kegiatan fakultas.",
            "href": _admin_url("events_event_add"),
            "icon": "calendar",
        },
        {
            "label": "Kelola program studi",
            "description": "Perbarui profil dan akreditasi.",
            "href": _admin_url("academics_studyprogram_changelist"),
            "icon": "academic",
        },
        {
            "label": "Baca pesan masuk",
            "description": "Tindak lanjuti pertanyaan publik.",
            "href": _admin_url("contact_contactmessage_changelist"),
            "icon": "mail",
        },
        {
            "label": "Pengaturan situs",
            "description": "Identitas, kontak, dan statistik.",
            "href": _admin_url("core_sitesetting_changelist"),
            "icon": "settings",
        },
    ]

    site = SiteSetting.objects.first()
    display_name = request.user.get_full_name() or request.user.get_username()

    payload = {
        "user": {
            "display_name": display_name,
            "username": request.user.get_username(),
            "initials": _initials(display_name),
            "is_superuser": request.user.is_superuser,
            "last_login": _iso(request.user.last_login),
        },
        "site": {
            "faculty_name": (
                site.faculty_name if site else "Fakultas Ilmu Ekonomi"
            ),
            "university_name": site.university_name if site else "",
            "tagline": site.tagline if site else "",
        },
        "cards": cards,
        "secondary": secondary,
        "trend": _content_trend(today),
        "recent_news": recent_news,
        "recent_messages": recent_messages,
        "quick_actions": quick_actions,
        "generated_at": _iso(timezone.now()),
    }
    return JsonResponse(payload, json_dumps_params={"ensure_ascii": False})
