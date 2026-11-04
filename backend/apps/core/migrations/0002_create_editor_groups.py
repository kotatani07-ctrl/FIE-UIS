from django.db import migrations

ROLE_MODELS = {
    "Editor": (
        ("content", "heroslide"),
        ("content", "staticpage"),
        ("content", "partner"),
        ("academics", "studyprogram"),
        ("news", "newscategory"),
        ("news", "tag"),
        ("news", "newspost"),
        ("news", "announcement"),
        ("events", "event"),
        ("research", "researchitem"),
        ("downloads", "downloaditem"),
    ),
    "Admin Fakultas": (
        ("core", "sitesetting"),
        ("content", "heroslide"),
        ("content", "staticpage"),
        ("content", "partner"),
        ("academics", "studyprogram"),
        ("news", "newscategory"),
        ("news", "tag"),
        ("news", "newspost"),
        ("news", "announcement"),
        ("events", "event"),
        ("research", "researchitem"),
        ("downloads", "downloaditem"),
        ("contact", "contactmessage"),
    ),
}


def create_editor_groups(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    database = schema_editor.connection.alias

    for role, models in ROLE_MODELS.items():
        group, _ = Group.objects.using(database).get_or_create(name=role)
        for app_label, model_name in models:
            content_type, _ = ContentType.objects.using(database).get_or_create(
                app_label=app_label, model=model_name
            )
            actions = ("view", "add", "change", "delete")
            if app_label == "contact":
                actions = ("view", "change")
            for action in actions:
                codename = f"{action}_{model_name}"
                permission, _ = Permission.objects.using(database).get_or_create(
                    content_type=content_type,
                    codename=codename,
                    defaults={"name": f"Can {action} {model_name}"},
                )
                group.permissions.add(permission)


def remove_editor_groups(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Group.objects.using(schema_editor.connection.alias).filter(
        name__in=ROLE_MODELS
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("academics", "0001_initial"),
        ("contact", "0001_initial"),
        ("content", "0001_initial"),
        ("core", "0001_initial"),
        ("downloads", "0001_initial"),
        ("events", "0001_initial"),
        ("news", "0001_initial"),
        ("research", "0001_initial"),
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [migrations.RunPython(create_editor_groups, remove_editor_groups)]
