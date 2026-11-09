from .base import *

DEBUG = True
SECRET_KEY = "test-only-secret-key-not-for-production"
CONTACT_IP_HASH_KEY = CONTACT_IP_HASH_KEY or SECRET_KEY
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
