from django.core.exceptions import ImproperlyConfigured

from .base import *

DEBUG = False
if len(SECRET_KEY) < 50:
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY harus minimal 50 karakter di produksi."
    )
if ADMIN_URL_PREFIX in {"admin/", "kelola/"}:
    raise ImproperlyConfigured(
        "ADMIN_URL_PREFIX harus berupa path rahasia di produksi."
    )
CONTACT_IP_HASH_KEY = CONTACT_IP_HASH_KEY or SECRET_KEY
if not env.list("DJANGO_ALLOWED_HOSTS", default=[]) or "*" in ALLOWED_HOSTS:
    raise ImproperlyConfigured(
        "DJANGO_ALLOWED_HOSTS wajib diatur tanpa wildcard di produksi."
    )
if not env("DATABASE_URL", default=""):
    raise ImproperlyConfigured("DATABASE_URL wajib diatur di produksi.")
REDIS_URL = env("REDIS_URL", default="")
if not REDIS_URL:
    raise ImproperlyConfigured("REDIS_URL wajib diatur di produksi.")
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
        "KEY_PREFIX": "fie",
    }
}
if "*" in CORS_ALLOWED_ORIGINS:
    raise ImproperlyConfigured("CORS_ALLOWED_ORIGINS tidak boleh memakai wildcard.")

SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 63072000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"
    },
}
