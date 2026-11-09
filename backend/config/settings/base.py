from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parents[2]
env = environ.Env()
environ.Env.read_env(BASE_DIR.parent / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY", default="")
DEBUG = False
DJANGO_ENV = env("DJANGO_ENV", default="development")
ALLOWED_HOSTS = env.list(
    "DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1", "backend"]
)
_admin_prefix = env("ADMIN_URL_PREFIX", default="kelola/").strip("/")
ADMIN_URL_PREFIX = f"{_admin_prefix or 'kelola'}/"
LOGIN_URL = f"/{ADMIN_URL_PREFIX}login/"
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "django_filters",
    "drf_spectacular",
    "simple_history",
    "django_ckeditor_5",
    "apps.core.apps.CoreConfig",
    "apps.content.apps.ContentConfig",
    "apps.academics.apps.AcademicsConfig",
    "apps.news.apps.NewsConfig",
    "apps.events.apps.EventsConfig",
    "apps.research.apps.ResearchConfig",
    "apps.downloads.apps.DownloadsConfig",
    "apps.contact.apps.ContactConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "simple_history.middleware.HistoryRequestMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.core.api.middleware.SecurityHeadersMiddleware",
    "apps.core.api.middleware.PublicApiCacheMiddleware",
]

ROOT_URLCONF = "config.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default="postgres://fie_local:local-only-password@db:5432/fie_local",
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 12},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "id"
TIME_ZONE = "Asia/Jakarta"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
MEDIA_URL = "/media/"
MEDIA_ROOT = env("MEDIA_ROOT", default=str(BASE_DIR / "media"))
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
DATA_UPLOAD_MAX_MEMORY_SIZE = 2_621_440
DATA_UPLOAD_MAX_NUMBER_FIELDS = 200
FILE_UPLOAD_MAX_MEMORY_SIZE = 2_621_440

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAdminUser"],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "apps.core.api.filters.QuerySearchFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.core.api.pagination.DefaultPagination",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "120/min",
        "contact": "5/hour",
        "contact_email": "20/day",
        "search": "30/min",
        "preview": "30/min",
    },
    "EXCEPTION_HANDLER": "apps.core.api.exceptions.api_exception_handler",
    "NUM_PROXIES": 1,
}
CACHE_URL = env("CACHE_URL", default="")
if CACHE_URL:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": CACHE_URL,
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "fie-development",
        }
    }
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = False
CORS_ALLOWED_METHODS = ("GET", "POST", "OPTIONS")
CORS_ALLOWED_HEADERS = ("accept", "content-type")
CORS_URLS_REGEX = r"^/api/v1/.*$"
FRONTEND_BASE_URL = env("FRONTEND_BASE_URL", default="http://localhost:8080")
TURNSTILE_SECRET_KEY = env("TURNSTILE_SECRET_KEY", default="")
CONTACT_NOTIFICATION_EMAIL = env("CONTACT_NOTIFICATION_EMAIL", default="")
CONTACT_IP_HASH_KEY = env("CONTACT_IP_HASH_KEY", default="")
SECURITY_CONTACT = env("SECURITY_CONTACT", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="webmaster@localhost")
EMAIL_BACKEND = env(
    "EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend"
)
EMAIL_HOST = env("EMAIL_HOST", default="")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL", default=False)
SPECTACULAR_SETTINGS = {
    "TITLE": "API Fakultas Ilmu Ekonomi",
    "DESCRIPTION": "API publik Website Fakultas Ilmu Ekonomi Universitas Ichsan Satya.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

SESSION_COOKIE_AGE = 8 * 60 * 60
# Unggahan CKEditor hanya untuk staf; endpoint juga diproteksi login admin.
CKEDITOR_5_FILE_UPLOAD_PERMISSION = "staff"
CKEDITOR_5_CONFIGS = {
    "default": {
        "toolbar": [
            "heading",
            "|",
            "bold",
            "italic",
            "link",
            "bulletedList",
            "numberedList",
            "blockQuote",
            "insertTable",
            "undo",
            "redo",
        ],
        "heading": {
            "options": [
                {
                    "model": "paragraph",
                    "title": "Paragraf",
                    "class": "ck-heading_paragraph",
                },
                {
                    "model": "heading2",
                    "view": "h2",
                    "title": "Judul 2",
                    "class": "ck-heading_heading2",
                },
                {
                    "model": "heading3",
                    "view": "h3",
                    "title": "Judul 3",
                    "class": "ck-heading_heading3",
                },
                {
                    "model": "heading4",
                    "view": "h4",
                    "title": "Judul 4",
                    "class": "ck-heading_heading4",
                },
            ]
        },
        "htmlSupport": {
            "allow": [
                {"name": "img", "attributes": ["src", "alt", "width", "height"]},
                {"name": "figure", "classes": ["image"]},
                {"name": "figcaption"},
            ]
        },
    }
}
