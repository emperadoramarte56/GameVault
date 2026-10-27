from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from users.models import User
from users.serializers import RegisterSerializer, UserSerializer


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


class RegisterView(generics.CreateAPIView):
    """Registro de nuevos usuarios (público, no requiere token)."""

    permission_classes = [AllowAny]
    # Sin autenticación: así un token vencido guardado en el navegador no bloquea el registro.
    authentication_classes = []
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "message": "Usuario registrado exitosamente",
                "user": {"username": user.username, "email": user.email},
            },
            status=status.HTTP_201_CREATED,
        )