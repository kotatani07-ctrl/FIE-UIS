import hashlib

from django.http import HttpResponseNotModified


class SecurityHeadersMiddleware:
    """Header keamanan dasar untuk semua respons Django (API, admin, SEO, file)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response.setdefault("X-Content-Type-Options", "nosniff")
        response.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.setdefault("X-Frame-Options", "DENY")
        if request.path.startswith("/api/v1/"):
            response.setdefault(
                "Content-Security-Policy",
                "default-src 'none'; frame-ancestors 'none'",
            )
        return response


class PublicApiCacheMiddleware:
    cache_control = "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    uncached_prefixes = ("/api/v1/health/", "/api/v1/preview/", "/api/v1/contact/")

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if not request.path.startswith("/api/v1/"):
            return response

        response.setdefault("Vary", "Accept")
        if (
            request.method != "GET"
            or request.path.startswith(self.uncached_prefixes)
            or response.status_code >= 400
        ):
            return response

        etag = f'"{hashlib.sha256(response.content).hexdigest()}"'
        response["ETag"] = etag
        response["Cache-Control"] = self.cache_control
        supplied_tags = {
            tag.strip() for tag in request.headers.get("If-None-Match", "").split(",")
        }
        if etag in supplied_tags or "*" in supplied_tags:
            not_modified = HttpResponseNotModified()
            not_modified["ETag"] = etag
            not_modified["Cache-Control"] = self.cache_control
            not_modified["Vary"] = "Accept"
            return not_modified
        return response
