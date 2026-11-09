import hashlib
import hmac
import io
import json
import logging
from datetime import timedelta
from email.utils import format_datetime
from html import escape
from pathlib import Path
from smtplib import SMTPException
from urllib.parse import quote, urlencode, urljoin
from urllib.request import Request, urlopen
from xml.etree import ElementTree

from django.conf import settings
from django.core import signing
from django.core.exceptions import (
    ObjectDoesNotExist,
)
from django.core.exceptions import (
    ValidationError as DjangoValidationError,
)
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db.models import Count, Q
from django.http import FileResponse, HttpResponse, HttpResponseNotFound
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.text import slugify
from django.views.decorators.http import require_GET
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import action
from rest_framework.exceptions import (
    APIException,
    NotFound,
    ParseError,
    ValidationError,
)
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle
from rest_framework.views import APIView

from apps.academics.models import StudyProgram
from apps.contact.models import ContactMessage
from apps.content.models import HeroSlide, Partner, StaticPage
from apps.core.api.filters import (
    AnnouncementFilter,
    DownloadFilter,
    NewsFilter,
    ProgramFilter,
    ResearchFilter,
)
from apps.core.api.pagination import DefaultPagination
from apps.core.api.serializers import (
    AnnouncementDetailSerializer,
    AnnouncementListSerializer,
    ApiErrorSerializer,
    CategorySerializer,
    ContactInputSerializer,
    ContactSuccessSerializer,
    DownloadSerializer,
    EventDetailSerializer,
    EventListSerializer,
    HealthSerializer,
    HeroSlideSerializer,
    NewsDetailSerializer,
    NewsListSerializer,
    PartnerSerializer,
    ProgramDetailSerializer,
    ProgramListSerializer,
    ResearchSerializer,
    SearchResponseSerializer,
    SiteSettingSerializer,
    StaticPageSerializer,
    TagSerializer,
    load_media_assets,
)
from apps.core.api.throttles import ContactEmailRateThrottle
from apps.core.models import SiteSetting
from apps.core.sanitizer import sanitize_html
from apps.downloads.models import DownloadItem
from apps.events.models import Event
from apps.news.models import Announcement, NewsCategory, NewsPost, Tag
from apps.research.models import ResearchItem

logger = logging.getLogger(__name__)


def live_announcements():
    return Announcement.live_queryset().filter(
        Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
    )


class ServiceUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Layanan sementara tidak tersedia."
    default_code = "service_unavailable"


class ContactJSONParser(JSONParser):
    max_bytes = 100_000

    def parse(self, stream, media_type=None, parser_context=None):
        request = parser_context["request"]
        raw_length = request.META.get("CONTENT_LENGTH")
        if raw_length:
            try:
                too_large = int(raw_length) > self.max_bytes
            except ValueError as error:
                raise ParseError("Ukuran permintaan tidak valid.") from error
            if too_large:
                raise ParseError("Ukuran pesan melebihi batas 100 KB.")
        body = stream.read(self.max_bytes + 1)
        if len(body) > self.max_bytes:
            raise ParseError("Ukuran pesan melebihi batas 100 KB.")
        return super().parse(io.BytesIO(body), media_type, parser_context)


class PublicReadOnlyViewSet(viewsets.ReadOnlyModelViewSet):
    authentication_classes = ()
    permission_classes = (AllowAny,)
    pagination_class = DefaultPagination
    image_fields = ()
    lookup_field = "slug"

    def get_serializer(self, *args, **kwargs):
        instance = args[0] if args else kwargs.get("instance")
        items = (
            list(instance)
            if kwargs.get("many") and instance is not None
            else ([instance] if instance is not None else [])
        )
        context = self.get_serializer_context()
        context["media_assets"] = load_media_assets(items, self.image_fields)
        kwargs["context"] = context
        return super().get_serializer(*args, **kwargs)


class PublicListViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    authentication_classes = ()
    permission_classes = (AllowAny,)
    pagination_class = None
    image_fields = ()

    def get_serializer(self, *args, **kwargs):
        instance = args[0] if args else kwargs.get("instance")
        items = (
            list(instance)
            if kwargs.get("many") and instance is not None
            else ([instance] if instance is not None else [])
        )
        context = self.get_serializer_context()
        context["media_assets"] = load_media_assets(items, self.image_fields)
        kwargs["context"] = context
        return super().get_serializer(*args, **kwargs)


class PublicDetailViewSet(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    authentication_classes = ()
    permission_classes = (AllowAny,)
    pagination_class = None


class SiteSettingView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)

    @extend_schema(responses={200: SiteSettingSerializer, 404: ApiErrorSerializer})
    def get(self, request):
        setting = SiteSetting.objects.first()
        if setting is None:
            raise NotFound("Pengaturan situs belum tersedia.")
        return Response(SiteSettingSerializer(setting).data)


class HeroSlideViewSet(PublicListViewSet):
    serializer_class = HeroSlideSerializer
    image_fields = ("image",)

    def get_queryset(self):
        now = timezone.now()
        return (
            HeroSlide.objects.filter(is_active=True)
            .filter(Q(starts_at__isnull=True) | Q(starts_at__lte=now))
            .filter(Q(ends_at__isnull=True) | Q(ends_at__gt=now))
            .order_by("order", "pk")
        )


class StaticPageViewSet(PublicDetailViewSet):
    serializer_class = StaticPageSerializer
    lookup_field = "key"
    lookup_url_kwarg = "key"

    def get_queryset(self):
        return StaticPage.live_queryset()


class StudyProgramViewSet(PublicReadOnlyViewSet):
    filterset_class = ProgramFilter
    search_fields = ("name", "summary")
    image_fields = (
        "cover",
        "og_image",
        "accreditation_certificate",
        "head_photo",
    )

    def get_queryset(self):
        return StudyProgram.live_queryset().order_by("order", "name")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProgramDetailSerializer
        return ProgramListSerializer


class NewsViewSet(PublicReadOnlyViewSet):
    filterset_class = NewsFilter
    search_fields = ("title", "excerpt", "body", "author_name")
    image_fields = ("cover", "og_image")

    def get_queryset(self):
        return (
            NewsPost.live_queryset().prefetch_related("categories", "tags").distinct()
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return NewsDetailSerializer
        return NewsListSerializer

    @action(detail=False, methods=("get",), url_path="featured")
    def featured(self, request):
        items = list(
            self.filter_queryset(self.get_queryset()).order_by("-published_at", "-id")[
                :5
            ]
        )
        return Response(self.get_serializer(items, many=True).data)


class AnnouncementViewSet(PublicReadOnlyViewSet):
    filterset_class = AnnouncementFilter
    search_fields = ("title", "body")

    def get_queryset(self):
        return live_announcements().order_by("-is_pinned", "-published_at", "-id")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return AnnouncementDetailSerializer
        return AnnouncementListSerializer


class EventViewSet(PublicReadOnlyViewSet):
    image_fields = ("cover",)

    def get_queryset(self):
        now = timezone.now()
        queryset = Event.live_queryset()
        if self.action == "retrieve":
            return queryset
        when = self.request.query_params.get("when", "upcoming")
        if when == "upcoming":
            return queryset.filter(end_at__gte=now).order_by("start_at", "id")
        if when == "past":
            return queryset.filter(end_at__lt=now).order_by("-start_at", "-id")
        if when == "all":
            return queryset.order_by("-start_at", "-id")
        raise ValidationError({"when": "Pilih upcoming, past, atau all."})

    def get_serializer_class(self):
        if self.action == "retrieve":
            return EventDetailSerializer
        return EventListSerializer


class ResearchViewSet(PublicReadOnlyViewSet):
    filterset_class = ResearchFilter
    search_fields = ("title", "authors", "abstract")

    def get_queryset(self):
        return ResearchItem.live_queryset().order_by("-year", "title")

    def get_serializer_class(self):
        return ResearchSerializer


class DownloadViewSet(PublicListViewSet):
    serializer_class = DownloadSerializer
    filterset_class = DownloadFilter
    search_fields = ("title", "description")

    def get_queryset(self):
        return DownloadItem.objects.filter(is_active=True).order_by("order", "title")


class PartnerViewSet(PublicListViewSet):
    serializer_class = PartnerSerializer
    image_fields = ("logo",)

    def get_queryset(self):
        return Partner.objects.filter(is_active=True).order_by("order", "name")


class NewsCategoryViewSet(PublicListViewSet):
    serializer_class = CategorySerializer

    def get_queryset(self):
        now = timezone.now()
        return NewsCategory.objects.annotate(
            count=Count(
                "newspost",
                filter=Q(
                    newspost__status="published",
                    newspost__published_at__lte=now,
                ),
                distinct=True,
            )
        ).order_by("name")


class TagViewSet(PublicListViewSet):
    serializer_class = TagSerializer

    def get_queryset(self):
        now = timezone.now()
        return Tag.objects.annotate(
            count=Count(
                "newspost",
                filter=Q(
                    newspost__status="published",
                    newspost__published_at__lte=now,
                ),
                distinct=True,
            )
        ).order_by("name")


class SearchView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)
    throttle_classes = (AnonRateThrottle, ScopedRateThrottle)
    throttle_scope = "search"

    @extend_schema(
        responses={
            200: SearchResponseSerializer,
            400: ApiErrorSerializer,
            429: ApiErrorSerializer,
        }
    )
    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not 2 <= len(query) <= 80:
            raise ValidationError(
                {"q": "Kata kunci harus terdiri dari 2 sampai 80 karakter."}
            )

        results = []
        news = (
            NewsPost.live_queryset()
            .filter(
                Q(title__icontains=query)
                | Q(excerpt__icontains=query)
                | Q(body__icontains=query)
            )
            .order_by("-published_at", "-id")[:100]
        )
        results.extend(
            search_item("berita", item.slug, item.title, item.excerpt) for item in news
        )

        announcements = (
            live_announcements()
            .filter(Q(title__icontains=query) | Q(body__icontains=query))
            .order_by("-published_at", "-id")[:100]
        )
        results.extend(
            search_item("pengumuman", item.slug, item.title, "")
            for item in announcements
        )

        events = (
            Event.live_queryset()
            .filter(Q(title__icontains=query) | Q(description__icontains=query))
            .order_by("-start_at", "-id")[:100]
        )
        results.extend(
            search_item("agenda", item.slug, item.title, item.location)
            for item in events
        )

        programs = (
            StudyProgram.live_queryset()
            .filter(Q(name__icontains=query) | Q(summary__icontains=query))
            .order_by("order", "name")[:100]
        )
        results.extend(
            search_item("prodi", item.slug, item.name, item.summary)
            for item in programs
        )

        pages = (
            StaticPage.live_queryset()
            .filter(Q(title__icontains=query) | Q(body__icontains=query))
            .order_by("title")[:100]
        )
        results.extend(
            search_item("halaman", item.key, item.title, "") for item in pages
        )

        paginator = DefaultPagination()
        page = paginator.paginate_queryset(results, request, view=self)
        return paginator.get_paginated_response(page)


class HealthView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)

    @extend_schema(responses=HealthSerializer)
    def get(self, request):
        return Response({"status": "ok"})


def _download_response(file_field):
    raw_filename = Path(file_field.name).name
    try:
        uploaded_file = file_field.open("rb")
    except (FileNotFoundError, OSError, ValueError):
        logger.error("Published file is missing from storage (name=%s)", raw_filename)
        return HttpResponseNotFound("Berkas tidak ditemukan.")
    filename = f"{slugify(Path(raw_filename).stem)}{Path(raw_filename).suffix.lower()}"
    response = FileResponse(
        uploaded_file,
        as_attachment=True,
        filename=filename,
        content_type="application/octet-stream",
    )
    response["X-Content-Type-Options"] = "nosniff"
    return response


@require_GET
def download_file(request, pk):
    item = get_object_or_404(DownloadItem, pk=pk, is_active=True)
    return _download_response(item.file)


@require_GET
def announcement_attachment(request, pk):
    item = get_object_or_404(live_announcements().exclude(attachment=""), pk=pk)
    return _download_response(item.attachment)


@require_GET
def research_file(request, pk):
    item = get_object_or_404(ResearchItem.live_queryset().exclude(file=""), pk=pk)
    return _download_response(item.file)


class ContactView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)
    throttle_classes = (
        AnonRateThrottle,
        ScopedRateThrottle,
        ContactEmailRateThrottle,
    )
    throttle_scope = "contact"
    parser_classes = (ContactJSONParser,)

    @extend_schema(
        request=ContactInputSerializer,
        responses={
            201: ContactSuccessSerializer,
            400: ApiErrorSerializer,
            403: ApiErrorSerializer,
            429: ApiErrorSerializer,
            503: ApiErrorSerializer,
        },
    )
    def post(self, request):
        serializer = ContactInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if data.get("website"):
            raise ValidationError({"website": "Permintaan tidak valid."})
        if not settings.TURNSTILE_SECRET_KEY:
            raise ServiceUnavailable("Verifikasi formulir belum dikonfigurasi.")
        if not verify_turnstile(data["turnstile_token"]):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Verifikasi keamanan gagal.")

        setting = SiteSetting.objects.first()
        recipient = settings.CONTACT_NOTIFICATION_EMAIL or (
            setting.email if setting else ""
        )
        if not recipient:
            raise ServiceUnavailable("Penerima pesan belum dikonfigurasi.")
        try:
            validate_email(recipient)
            validate_email(settings.DEFAULT_FROM_EMAIL)
        except DjangoValidationError as error:
            raise ServiceUnavailable("Konfigurasi email tidak valid.") from error
        if (
            settings.EMAIL_BACKEND.endswith("smtp.EmailBackend")
            and not settings.EMAIL_HOST
        ):
            raise ServiceUnavailable("Server email belum dikonfigurasi.")

        remote_ip = request.META.get("HTTP_X_REAL_IP") or request.META.get(
            "REMOTE_ADDR", ""
        )
        ip_hash = hmac.new(
            settings.CONTACT_IP_HASH_KEY.encode(),
            remote_ip.encode(),
            hashlib.sha256,
        ).hexdigest()
        message = ContactMessage.objects.create(
            name=data["name"],
            email=data["email"],
            subject=data["subject"],
            message=data["message"],
            ip_hash=ip_hash,
            user_agent=request.headers.get("User-Agent", "")[:512],
        )
        try:
            delivered = send_mail(
                subject=f"Pesan baru FIE: {message.subject}",
                message=(
                    f"Nama: {message.name}\nEmail: {message.email}\n\n{message.message}"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
        except (SMTPException, OSError):
            logger.exception("Contact notification delivery failed")
            return Response(
                {
                    "detail": "Pesan tersimpan, tetapi notifikasi email gagal dikirim.",
                    "code": "notification_failed",
                    "errors": {},
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if not delivered:
            logger.error("Contact notification backend did not deliver the message")
            return Response(
                {
                    "detail": "Pesan tersimpan, tetapi notifikasi email gagal dikirim.",
                    "code": "notification_failed",
                    "errors": {},
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {"detail": "Pesan terkirim. Terima kasih."},
            status=status.HTTP_201_CREATED,
        )


PREVIEW_MODELS = {
    "news": (NewsPost, NewsDetailSerializer),
    "page": (StaticPage, StaticPageSerializer),
    "program": (StudyProgram, ProgramDetailSerializer),
    "announcement": (Announcement, AnnouncementDetailSerializer),
    "event": (Event, EventDetailSerializer),
    "research": (ResearchItem, ResearchSerializer),
}


def create_preview_token(model_name, object_id):
    return signing.TimestampSigner(salt="fie.api.preview").sign(
        f"{model_name}:{object_id}"
    )


class PreviewView(APIView):
    authentication_classes = (SessionAuthentication,)
    permission_classes = (IsAdminUser,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "preview"

    @extend_schema(
        responses={
            200: OpenApiResponse(description="Draf konten yang boleh dilihat staf."),
            403: ApiErrorSerializer,
            404: ApiErrorSerializer,
        }
    )
    def get(self, request, model, object_id):
        model_entry = PREVIEW_MODELS.get(model)
        token = request.query_params.get("token", "")
        try:
            signed_value = signing.TimestampSigner(salt="fie.api.preview").unsign(
                token, max_age=1800
            )
        except signing.BadSignature:
            raise NotFound("Pratinjau tidak ditemukan.")
        if signed_value != f"{model}:{object_id}" or model_entry is None:
            raise NotFound("Pratinjau tidak ditemukan.")

        model_class, serializer_class = model_entry
        try:
            instance = model_class.objects.get(pk=object_id)
        except ObjectDoesNotExist:
            raise NotFound("Pratinjau tidak ditemukan.")
        image_fields = {
            "news": ("cover", "og_image"),
            "page": ("cover", "og_image"),
            "program": ("cover", "og_image", "accreditation_certificate", "head_photo"),
            "event": ("cover",),
        }.get(model, ())
        context = {
            "request": request,
            "media_assets": load_media_assets([instance], image_fields),
        }
        return Response(serializer_class(instance, context=context).data)


@require_GET
def sitemap_xml(request):
    base_url = settings.FRONTEND_BASE_URL.rstrip("/") + "/"
    root = ElementTree.Element(
        "urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    )
    # Detail routes ship in Phase 4; list only pages the frontend can serve.
    paths = (
        "",
        "prodi",
        "informasi/berita",
        "informasi/agenda",
        "informasi/pengumuman",
        "kontak",
    )
    for path in paths:
        item = ElementTree.SubElement(root, "url")
        ElementTree.SubElement(item, "loc").text = urljoin(base_url, path)
    body = ElementTree.tostring(root, encoding="utf-8", xml_declaration=True)
    return HttpResponse(body, content_type="application/xml; charset=utf-8")


@require_GET
def robots_txt(request):
    sitemap_url = urljoin(settings.FRONTEND_BASE_URL.rstrip("/") + "/", "sitemap.xml")
    return HttpResponse(
        f"User-agent: *\nAllow: /\nSitemap: {sitemap_url}\n",
        content_type="text/plain; charset=utf-8",
    )


@require_GET
def rss_xml(request):
    root = ElementTree.Element("rss", version="2.0")
    channel = ElementTree.SubElement(root, "channel")
    ElementTree.SubElement(channel, "title").text = "Fakultas Ilmu Ekonomi"
    ElementTree.SubElement(channel, "link").text = settings.FRONTEND_BASE_URL.rstrip(
        "/"
    )
    ElementTree.SubElement(
        channel, "description"
    ).text = "Berita dan artikel Fakultas Ilmu Ekonomi."
    posts = NewsPost.live_queryset().order_by("-published_at", "-id")[:50]
    news_list = urljoin(
        settings.FRONTEND_BASE_URL.rstrip("/") + "/", "informasi/berita"
    )
    for post in posts:
        item = ElementTree.SubElement(channel, "item")
        ElementTree.SubElement(item, "title").text = post.title
        # Detail routes ship in Phase 4; point readers at the list for now.
        ElementTree.SubElement(item, "link").text = news_list
        guid = ElementTree.SubElement(item, "guid", isPermaLink="false")
        guid.text = f"fie:news:{post.slug}"
        ElementTree.SubElement(item, "description").text = post.excerpt
        if post.published_at:
            ElementTree.SubElement(item, "pubDate").text = format_datetime(
                post.published_at
            )
    body = ElementTree.tostring(root, encoding="utf-8", xml_declaration=True)
    return HttpResponse(body, content_type="application/rss+xml; charset=utf-8")


def _seo_record(path):
    clean_path = path.strip("/")
    if clean_path in {"", "beranda"}:
        setting = SiteSetting.objects.first()
        if setting is None:
            return None
        return (
            setting.meta_title or setting.faculty_name,
            setting.meta_description,
            "",
        )

    parts = clean_path.split("/")
    record = None
    body = ""
    if len(parts) == 2 and parts[0] == "profil":
        record = StaticPage.live_queryset().filter(key=parts[1]).first()
        body = record.body if record else ""
    elif len(parts) == 2 and parts[0] == "prodi":
        record = StudyProgram.live_queryset().filter(slug=parts[1]).first()
        body = record.summary if record else ""
    elif len(parts) == 3 and parts[:2] == ["informasi", "berita"]:
        record = NewsPost.live_queryset().filter(slug=parts[2]).first()
        body = record.body if record else ""
    elif len(parts) == 3 and parts[:2] == ["informasi", "pengumuman"]:
        record = live_announcements().filter(slug=parts[2]).first()
        body = record.body if record else ""
    elif len(parts) == 3 and parts[:2] == ["informasi", "agenda"]:
        record = Event.live_queryset().filter(slug=parts[2]).first()
        body = record.description if record else ""
    elif len(parts) == 3 and parts[0] == "riset":
        record = (
            ResearchItem.live_queryset().filter(kind=parts[1], slug=parts[2]).first()
        )
        body = record.abstract if record else ""
    if record is None:
        return None

    title = (
        getattr(record, "meta_title", "")
        or getattr(record, "title", "")
        or getattr(record, "name", "")
    )
    description = getattr(record, "meta_description", "") or getattr(
        record, "excerpt", ""
    )
    description = (
        description or getattr(record, "summary", "") or getattr(record, "abstract", "")
    )
    return title, description, sanitize_html(body)


@require_GET
def seo_page(request, path=""):
    record = _seo_record(path)
    if record is None:
        return HttpResponseNotFound("Halaman tidak ditemukan.")
    title, description, body = record
    canonical = urljoin(
        settings.FRONTEND_BASE_URL.rstrip("/") + "/",
        quote(path.strip("/"), safe="/-._~"),
    )
    markup = (
        '<!doctype html><html lang="id"><head><meta charset="utf-8">'
        f"<title>{escape(title)}</title>"
        f'<meta name="description" content="{escape(description, quote=True)}">'
        f'<link rel="canonical" href="{escape(canonical, quote=True)}">'
        "</head><body><main>"
        f"<h1>{escape(title)}</h1>{body}"
        "</main></body></html>"
    )
    return HttpResponse(markup, content_type="text/html; charset=utf-8")


@require_GET
def security_txt(request):
    setting = SiteSetting.objects.first()
    contact = settings.SECURITY_CONTACT or (setting.email if setting else "")
    if not contact:
        return HttpResponse(
            "Kontak keamanan belum dikonfigurasi.\n",
            status=503,
            content_type="text/plain; charset=utf-8",
        )
    try:
        validate_email(contact)
    except DjangoValidationError:
        return HttpResponse(
            "Kontak keamanan belum dikonfigurasi dengan benar.\n",
            status=503,
            content_type="text/plain; charset=utf-8",
        )
    expires = (timezone.now() + timedelta(days=365)).strftime("%Y-%m-%dT%H:%M:%SZ")
    return HttpResponse(
        f"Contact: mailto:{contact}\nExpires: {expires}\nPreferred-Languages: id\n",
        content_type="text/plain; charset=utf-8",
    )


def search_item(kind, slug, title, summary):
    # Detail routes ship in Phase 4; keep result URLs on existing list pages.
    url_by_kind = {
        "berita": "/informasi/berita",
        "pengumuman": "/informasi/pengumuman",
        "agenda": "/informasi/agenda",
        "prodi": "/prodi",
        "halaman": "/",
    }
    return {
        "type": kind,
        "slug": slug,
        "title": title,
        "url": url_by_kind[kind],
        "excerpt": summary,
    }


def verify_turnstile(token):
    payload = urlencode(
        {"secret": settings.TURNSTILE_SECRET_KEY, "response": token}
    ).encode()
    request = Request(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=3) as response:
            result = json.loads(response.read())
    except (OSError, json.JSONDecodeError, UnicodeDecodeError):
        logger.exception("Turnstile verification is unavailable")
        raise ServiceUnavailable("Verifikasi keamanan sementara tidak tersedia.")
    return isinstance(result, dict) and result.get("success") is True
