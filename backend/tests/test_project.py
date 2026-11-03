import pytest
from django.conf import settings


@pytest.mark.django_db
def test_project_uses_indonesian_locale_and_jakarta_timezone() -> None:
    assert settings.LANGUAGE_CODE == "id"
    assert settings.TIME_ZONE == "Asia/Jakarta"
    assert settings.USE_TZ is True
