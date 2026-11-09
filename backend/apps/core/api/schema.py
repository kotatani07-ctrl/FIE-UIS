from django.conf import settings
from django.http import Http404
from drf_spectacular.utils import extend_schema
from drf_spectacular.views import SpectacularAPIView


class DevelopmentSchemaView(SpectacularAPIView):
    authentication_classes = ()
    permission_classes = ()

    @extend_schema(exclude=True)
    def get(self, request, *args, **kwargs):
        if not settings.DEBUG:
            raise Http404
        return super().get(request, *args, **kwargs)
