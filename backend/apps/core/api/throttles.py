import hashlib
import hmac

from django.conf import settings
from rest_framework.throttling import SimpleRateThrottle


class ContactEmailRateThrottle(SimpleRateThrottle):
    scope = "contact_email"

    def get_cache_key(self, request, view):
        data = request.data
        email = data.get("email", "") if hasattr(data, "get") else ""
        if not email:
            return None
        identity = hmac.new(
            settings.SECRET_KEY.encode(),
            str(email).strip().lower().encode(),
            hashlib.sha256,
        ).hexdigest()
        return self.cache_format % {"scope": self.scope, "ident": identity}
