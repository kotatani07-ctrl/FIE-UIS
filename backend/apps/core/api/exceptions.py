from django.http import JsonResponse
from django.views.defaults import page_not_found, server_error
from rest_framework.exceptions import ValidationError
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    status_code = response.status_code
    raw_detail = (
        response.data.get("detail") if isinstance(response.data, dict) else None
    )
    if status_code == 404:
        code = "not_found"
        detail = (
            "Halaman tidak ditemukan."
            if str(raw_detail).lower() == "invalid page."
            else str(raw_detail or "Halaman atau konten tidak ditemukan.")
        )
    elif status_code == 400:
        code = "validation_error"
        detail = "Periksa kembali data yang dikirim."
    elif status_code == 429:
        code = "throttled"
        detail = "Terlalu banyak permintaan. Silakan coba lagi nanti."
    elif status_code == 403:
        code = "forbidden"
        detail = str(raw_detail or "Permintaan tidak diizinkan.")
    elif status_code == 401:
        code = "not_authenticated"
        detail = "Autentikasi diperlukan."
    elif status_code == 405:
        code = "method_not_allowed"
        detail = "Metode permintaan tidak diizinkan."
    elif status_code == 503:
        code = str(getattr(exc, "default_code", "service_unavailable"))
        detail = str(raw_detail or "Layanan sementara tidak tersedia.")
    else:
        code = "api_error"
        detail = "Permintaan tidak dapat diproses."

    if isinstance(exc, ValidationError):
        errors = (
            {key: value for key, value in response.data.items() if key != "detail"}
            if isinstance(response.data, dict)
            else {"non_field_errors": response.data}
        )
    else:
        errors = {}
    response.data = {
        "detail": detail,
        "code": code,
        "errors": errors,
    }
    return response


def api_not_found(request, exception):
    if request.path.startswith("/api/v1/"):
        return JsonResponse(
            {
                "detail": "Halaman atau konten tidak ditemukan.",
                "code": "not_found",
                "errors": {},
            },
            status=404,
        )
    return page_not_found(request, exception)


def api_server_error(request):
    if request.path.startswith("/api/v1/"):
        return JsonResponse(
            {
                "detail": "Terjadi kesalahan internal.",
                "code": "internal_error",
                "errors": {},
            },
            status=500,
        )
    return server_error(request)
