from drf_yasg.utils import swagger_auto_schema
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from users.models import User
from users.serializers import UserSerializer


class UserApiViewSet(ModelViewSet):
    """CRUD de usuarios (solo administradores).

    El cifrado de la contraseña y la regla de "solo cambiarla si viene en la
    petición" viven en UserSerializer.create/update, para que apliquen igual a
    POST, PUT y PATCH.
    """

    permission_classes = [IsAdminUser]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by("id")


class UserView(APIView):
    """Datos personales del usuario autenticado."""

    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(responses={200: UserSerializer})
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
