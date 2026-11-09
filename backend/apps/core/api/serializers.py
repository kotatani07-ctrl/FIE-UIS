import logging

from django.core.files.storage import default_storage
from django.core.validators import RegexValidator
from django.urls import reverse
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.academics.models import StudyProgram
from apps.content.models import HeroSlide, Partner, StaticPage
from apps.core.models import MediaAsset, SiteSetting
from apps.core.sanitizer import sanitize_html
from apps.downloads.models import DownloadItem
from apps.events.models import Event
from apps.news.models import Announcement, NewsCategory, NewsPost, Tag
from apps.research.models import ResearchItem

logger = logging.getLogger(__name__)


@extend_schema_field(
    {
        "type": "object",
        "nullable": True,
        "required": [
            "src",
            "srcset",
            "avif_srcset",
            "width",
            "height",
            "alt",
            "blur",
        ],
        "properties": {
            "src": {"type": "string"},
            "srcset": {"type": "string"},
            "avif_srcset": {"type": "string"},
            "width": {"type": "integer"},
            "height": {"type": "integer"},
            "alt": {"type": "string"},
            "blur": {"type": "string"},
        },
    }
)
class ImageDataField(serializers.Field):
    def __init__(self, *, alt_field: str | None = None, **kwargs):
        self.alt_field = alt_field
        super().__init__(**kwargs)

    def get_attribute(self, instance):
        self.object_instance = instance
        return super().get_attribute(instance)

    def to_representation(self, value):
        return serialize_image(
            value,
            self.object_instance,
            self.alt_field,
            self.context.get("media_assets", {}),
        )


class SeoMetadataSerializer(serializers.Serializer):
    title = serializers.CharField()
    description = serializers.CharField()
    og_image = ImageDataField()


class ContactSuccessSerializer(serializers.Serializer):
    detail = serializers.CharField()


class ApiErrorSerializer(serializers.Serializer):
    detail = serializers.CharField()
    code = serializers.CharField()
    errors = serializers.DictField(child=serializers.ListField())


class SearchResultSerializer(serializers.Serializer):
    type = serializers.CharField()
    slug = serializers.CharField()
    title = serializers.CharField()
    url = serializers.CharField()
    excerpt = serializers.CharField(allow_blank=True)


class SearchResponseSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    results = SearchResultSerializer(many=True)


class HealthSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=("ok",))


def seo_data(instance, context):
    image = serialize_image(
        instance.og_image,
        instance,
        "meta_title",
        context.get("media_assets", {}),
    )
    return {
        "title": instance.meta_title or getattr(instance, "title", ""),
        "description": instance.meta_description,
        "og_image": image,
    }


class SiteSettingSerializer(serializers.ModelSerializer):
    default_og_image = ImageDataField(source="og_image", alt_field="faculty_name")

    class Meta:
        model = SiteSetting
        fields = (
            "faculty_name",
            "university_name",
            "tagline",
            "address",
            "phone",
            "email",
            "maps_embed_url",
            "social_instagram",
            "social_facebook",
            "social_youtube",
            "social_linkedin",
            "stats_programs",
            "stats_lecturers",
            "stats_students",
            "stats_partners",
            "pmb_url",
            "default_og_image",
        )


class HeroSlideSerializer(serializers.ModelSerializer):
    image = ImageDataField(alt_field="alt")

    class Meta:
        model = HeroSlide
        fields = ("title", "subtitle", "image", "link_url", "link_page", "link_label")


class StaticPageSerializer(serializers.ModelSerializer):
    body_html = serializers.SerializerMethodField()
    cover = ImageDataField(alt_field="title")
    meta = serializers.SerializerMethodField()

    class Meta:
        model = StaticPage
        fields = ("key", "title", "body_html", "cover", "meta")

    @extend_schema_field(serializers.CharField())
    def get_body_html(self, instance):
        return sanitize_html(instance.body)

    @extend_schema_field(SeoMetadataSerializer)
    def get_meta(self, instance):
        return seo_data(instance, self.context)


class ProgramListSerializer(serializers.ModelSerializer):
    cover = ImageDataField(alt_field="cover_alt")
    meta = serializers.SerializerMethodField()

    class Meta:
        model = StudyProgram
        fields = ("slug", "name", "degree", "summary", "cover", "meta")

    @extend_schema_field(SeoMetadataSerializer)
    def get_meta(self, instance):
        return seo_data(instance, self.context)


class ProgramDetailSerializer(ProgramListSerializer):
    accreditation_certificate = ImageDataField(
        alt_field="accreditation_certificate_alt",
        read_only=True,
    )
    head_photo = ImageDataField(alt_field="head_name")
    curriculum_html = serializers.SerializerMethodField()
    career_prospects_html = serializers.SerializerMethodField()

    class Meta(ProgramListSerializer.Meta):
        fields = ProgramListSerializer.Meta.fields + (
            "vision",
            "mission",
            "accreditation_body",
            "accreditation_grade",
            "accreditation_number",
            "accreditation_valid_until",
            "accreditation_certificate",
            "head_name",
            "head_photo",
            "curriculum_html",
            "career_prospects_html",
        )

    @extend_schema_field(serializers.CharField())
    def get_curriculum_html(self, instance):
        return sanitize_html(instance.curriculum)

    @extend_schema_field(serializers.CharField())
    def get_career_prospects_html(self, instance):
        return sanitize_html(instance.career_prospects)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["accreditation"] = {
            "body": data.pop("accreditation_body"),
            "grade": data.pop("accreditation_grade"),
            "number": data.pop("accreditation_number"),
            "valid_until": data.pop("accreditation_valid_until"),
            "certificate": data.pop("accreditation_certificate"),
        }
        data["head"] = {
            "name": data.pop("head_name"),
            "photo": data.pop("head_photo"),
        }
        return data


class CategorySerializer(serializers.ModelSerializer):
    count = serializers.IntegerField(read_only=True)

    class Meta:
        model = NewsCategory
        fields = ("name", "slug", "count")


class TagSerializer(serializers.ModelSerializer):
    count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tag
        fields = ("name", "slug", "count")


class NewsCategoryMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsCategory
        fields = ("name", "slug")


class TagMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("name", "slug")


class NewsListSerializer(serializers.ModelSerializer):
    cover = ImageDataField(alt_field="cover_alt")
    categories = NewsCategoryMiniSerializer(many=True, read_only=True)
    tags = TagMiniSerializer(many=True, read_only=True)

    class Meta:
        model = NewsPost
        fields = (
            "slug",
            "kind",
            "title",
            "excerpt",
            "cover",
            "categories",
            "tags",
            "published_at",
            "author_name",
        )


class NewsDetailSerializer(NewsListSerializer):
    body_html = serializers.SerializerMethodField()
    meta = serializers.SerializerMethodField()
    related = serializers.SerializerMethodField()

    class Meta(NewsListSerializer.Meta):
        fields = NewsListSerializer.Meta.fields + ("body_html", "meta", "related")

    @extend_schema_field(serializers.CharField())
    def get_body_html(self, instance):
        return sanitize_html(instance.body)

    @extend_schema_field(SeoMetadataSerializer)
    def get_meta(self, instance):
        return seo_data(instance, self.context)

    @extend_schema_field(NewsListSerializer(many=True))
    def get_related(self, instance):
        queryset = (
            NewsPost.live_queryset()
            .filter(
                models_q_categories_or_tags(instance),
            )
            .exclude(pk=instance.pk)
            .distinct()
            .prefetch_related("categories", "tags")
            .order_by("-published_at", "-id")[:3]
        )
        related = list(queryset)
        context = dict(self.context)
        context["media_assets"] = load_media_assets(related, ("cover",))
        return NewsListSerializer(related, many=True, context=context).data


class AnnouncementListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ("slug", "title", "is_pinned", "published_at", "expires_at")


class AnnouncementDetailSerializer(AnnouncementListSerializer):
    body_html = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()

    class Meta(AnnouncementListSerializer.Meta):
        fields = AnnouncementListSerializer.Meta.fields + (
            "body_html",
            "attachment_url",
        )

    @extend_schema_field(serializers.CharField())
    def get_body_html(self, instance):
        return sanitize_html(instance.body)

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_attachment_url(self, instance):
        if not instance.attachment:
            return None
        return reverse("announcement-attachment", kwargs={"pk": instance.pk})


class EventListSerializer(serializers.ModelSerializer):
    cover = ImageDataField(alt_field="cover_alt")

    class Meta:
        model = Event
        fields = (
            "slug",
            "title",
            "start_at",
            "end_at",
            "location",
            "cover",
            "registration_url",
        )


class EventDetailSerializer(EventListSerializer):
    description_html = serializers.SerializerMethodField()

    class Meta(EventListSerializer.Meta):
        fields = EventListSerializer.Meta.fields + ("description_html",)

    @extend_schema_field(serializers.CharField())
    def get_description_html(self, instance):
        return sanitize_html(instance.description)


class ResearchSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source="kind", read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ResearchItem
        fields = (
            "slug",
            "type",
            "title",
            "authors",
            "year",
            "abstract",
            "external_url",
            "file_url",
        )

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_file_url(self, instance):
        if not instance.file:
            return None
        return reverse("research-file", kwargs={"pk": instance.pk})


class DownloadSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = DownloadItem
        fields = ("title", "category", "url", "file_size", "description")

    @extend_schema_field(serializers.CharField())
    def get_url(self, instance):
        return reverse("download-file", kwargs={"pk": instance.pk})


class PartnerSerializer(serializers.ModelSerializer):
    logo = ImageDataField(alt_field="logo_alt")

    class Meta:
        model = Partner
        fields = ("name", "logo", "url")


class ContactInputSerializer(serializers.Serializer):
    name = serializers.CharField(
        max_length=120,
        trim_whitespace=True,
        validators=[
            RegexValidator(r"^[^\r\n]*$", "Nama tidak boleh memuat baris baru.")
        ],
    )
    email = serializers.EmailField(max_length=254)
    subject = serializers.CharField(
        max_length=180,
        trim_whitespace=True,
        validators=[
            RegexValidator(r"^[^\r\n]*$", "Subjek tidak boleh memuat baris baru.")
        ],
    )
    message = serializers.CharField(max_length=10_000, trim_whitespace=True)
    turnstile_token = serializers.CharField(max_length=2048, trim_whitespace=True)
    website = serializers.CharField(
        max_length=200, required=False, allow_blank=True, write_only=True
    )


def models_q_categories_or_tags(instance):
    from django.db.models import Q

    return Q(categories__in=instance.categories.all()) | Q(tags__in=instance.tags.all())


def load_media_assets(instances, fields):
    file_names = {
        image.name
        for instance in instances
        for field in fields
        if (image := getattr(instance, field, None))
    }
    if not file_names:
        return {}
    return MediaAsset.objects.filter(file__in=file_names).in_bulk(field_name="file")


def serialize_image(value, instance, alt_field, media_assets):
    if not value:
        return None

    asset = media_assets.get(value.name)
    if asset is None:
        asset = MediaAsset.objects.filter(file=value.name).first()
    if asset is None:
        logger.warning("Missing MediaAsset metadata for %s", value.name)
        return None

    alt = getattr(instance, alt_field, "") if alt_field else ""
    alt = alt or getattr(instance, "title", "") or getattr(instance, "name", "")
    return {
        "src": value.url,
        "srcset": ", ".join(
            f"{default_storage.url(variant['file'])} {variant['width']}w"
            for variant in asset.webp_variants
        ),
        "avif_srcset": ", ".join(
            f"{default_storage.url(variant['file'])} {variant['width']}w"
            for variant in asset.avif_variants
        ),
        "width": asset.width,
        "height": asset.height,
        "alt": alt,
        "blur": asset.blur,
    }
