from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # El login se hace con el correo en lugar del username
    email = models.EmailField(unique=True)

    # Campo extra de la práctica: el nombre de jugador (gamertag) del usuario
    gamertag = models.CharField(
        "Gamertag", max_length=30, blank=True, help_text="Nombre de jugador del usuario."
    )

    USERNAME_FIELD = "email"
    # El manual deja esto vacío, pero entonces createsuperuser guarda username=''
    # y el segundo usuario falla porque username es único. Se pide el username.
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email
