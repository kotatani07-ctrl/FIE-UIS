import pytest
from django.contrib.auth.models import Group


@pytest.mark.django_db
def test_editor_role_has_content_access_but_not_settings_or_inbox() -> None:
    editor = Group.objects.get(name="Editor")
    permissions = set(editor.permissions.values_list("codename", flat=True))

    assert "add_newspost" in permissions
    assert "change_studyprogram" in permissions
    assert "view_sitesetting" not in permissions
    assert "view_contactmessage" not in permissions


@pytest.mark.django_db
def test_faculty_admin_role_can_manage_settings_and_read_contact_messages() -> None:
    faculty_admin = Group.objects.get(name="Admin Fakultas")
    permissions = set(faculty_admin.permissions.values_list("codename", flat=True))

    assert "change_sitesetting" in permissions
    assert "view_contactmessage" in permissions
    assert "delete_contactmessage" not in permissions
    assert "change_user" not in permissions
