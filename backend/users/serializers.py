from django.contrib.auth import password_validation
from rest_framework import serializers

from users.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "gamertag",
            "password",
            "is_active",
            "is_staff",
        ]
        extra_kwargs = {
            # CORRECCIÓN 1: la contraseña solo se puede escribir, nunca se devuelve
            # (ni en /users/ ni en /auth/me/). Así el hash no sale en ninguna respuesta.
            # required=False: al editar no hace falta mandarla (se exige solo al crear).
            "password": {"write_only": True, "required": False, "style": {"input_type": "password"}},
        }

    def validate_password(self, value):
        # Aplica las reglas de AUTH_PASSWORD_VALIDATORS (largo mínimo, muy común, etc.)
        password_validation.validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        if not password:
            raise serializers.ValidationError({"password": "La contraseña es obligatoria."})
        user = User(**validated_data)
        user.set_password(password)  # se guarda cifrada, nunca en texto plano
        user.save()
        return user

    def update(self, instance, validated_data):
        # CORRECCIÓN 2: la contraseña solo cambia si viene en la petición.
        # Sin password en el cuerpo, el campo no se toca (cubre PATCH y PUT).
        password = validated_data.pop("password", None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class RegisterSerializer(serializers.ModelSerializer):
    """Registro público: solo los campos que un usuario nuevo puede elegir.

    No incluye is_staff / is_active, así nadie puede registrarse como administrador.
    """

    class Meta:
        model = User
        fields = ["username", "email", "password", "gamertag"]
        extra_kwargs = {
            "password": {"write_only": True, "style": {"input_type": "password"}},
            "gamertag": {"required": False},
        }

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)  # se guarda cifrada
        user.save()
        return user