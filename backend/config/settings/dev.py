import secrets

from .base import *

DEBUG = True
if not SECRET_KEY:
    SECRET_KEY = secrets.token_urlsafe(64)
CONTACT_IP_HASH_KEY = CONTACT_IP_HASH_KEY or SECRET_KEY
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
