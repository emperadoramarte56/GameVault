from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from users.models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Admin de usuarios con el campo extra (gamertag) y login por correo.

    Se usa UserAdmin y no admin.site.register(User) a secas porque este último
    muestra el hash de la contraseña como un campo de texto editable.
    """

    list_display = ("email", "username", "gamertag", "first_name", "last_name", "is_staff")
    search_fields = ("email", "username", "gamertag")
    ordering = ("email",)

    fieldsets = UserAdmin.fieldsets + (("Datos de GameVault", {"fields": ("gamertag",)}),)
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Datos de GameVault", {"fields": ("email", "gamertag")}),
    )
