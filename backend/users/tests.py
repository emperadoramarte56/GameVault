from rest_framework.test import APITestCase

from users.models import User

TOKEN_URL = "/api/v1/auth/token/"
ME_URL = "/api/v1/auth/me/"
USERS_URL = "/api/v1/users/"


class UserApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email="admin@gamevault.test", username="admin", password="Admin-Segura-123"
        )
        self.player = User.objects.create_user(
            email="jugador@gamevault.test",
            username="jugador",
            password="Jugador-Clave-456",
            gamertag="ProPlayer01",
        )

    def login(self, email, password):
        r = self.client.post(TOKEN_URL, {"email": email, "password": password}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
        return r

    def test_token_se_obtiene_con_email(self):
        r = self.login("jugador@gamevault.test", "Jugador-Clave-456")
        self.assertIn("access", r.data)
        self.assertIn("refresh", r.data)

    def test_datos_personales_no_incluyen_password_y_si_el_campo_extra(self):
        self.login("jugador@gamevault.test", "Jugador-Clave-456")
        r = self.client.get(ME_URL)
        self.assertEqual(r.status_code, 200)
        self.assertNotIn("password", r.data)
        self.assertEqual(r.data["gamertag"], "ProPlayer01")
        self.assertNotIn("pbkdf2", r.content.decode())

    def test_datos_personales_requieren_token(self):
        self.assertEqual(self.client.get(ME_URL).status_code, 401)

    def test_listado_y_detalle_no_exponen_password(self):
        self.login("admin@gamevault.test", "Admin-Segura-123")
        lista = self.client.get(USERS_URL)
        detalle = self.client.get(f"{USERS_URL}{self.player.id}/")
        for r in (lista, detalle):
            self.assertEqual(r.status_code, 200)
            self.assertNotIn("password", r.content.decode())
            self.assertNotIn("pbkdf2", r.content.decode())

    def test_crud_solo_para_administradores(self):
        self.login("jugador@gamevault.test", "Jugador-Clave-456")
        self.assertEqual(self.client.get(USERS_URL).status_code, 403)

    def test_crear_usuario_cifra_la_password(self):
        self.login("admin@gamevault.test", "Admin-Segura-123")
        r = self.client.post(
            USERS_URL,
            {"username": "nuevo", "email": "nuevo@gamevault.test", "password": "Nuevo-Clave-789", "gamertag": "Nuevo"},
            format="json",
        )
        self.assertEqual(r.status_code, 201, r.content)
        self.assertNotIn("password", r.data)
        nuevo = User.objects.get(email="nuevo@gamevault.test")
        self.assertNotEqual(nuevo.password, "Nuevo-Clave-789")
        self.assertTrue(nuevo.check_password("Nuevo-Clave-789"))

    def test_crear_usuario_sin_password_falla(self):
        self.login("admin@gamevault.test", "Admin-Segura-123")
        r = self.client.post(USERS_URL, {"username": "x", "email": "x@gamevault.test"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_editar_sin_password_NO_cambia_la_password(self):
        """Corrección 2: el manual asignaba la contraseña de quien hace la petición."""
        hash_antes = User.objects.get(pk=self.player.pk).password
        self.login("admin@gamevault.test", "Admin-Segura-123")
        r = self.client.patch(f"{USERS_URL}{self.player.id}/", {"first_name": "Ana"}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        jugador = User.objects.get(pk=self.player.pk)
        self.assertEqual(jugador.first_name, "Ana")
        self.assertEqual(jugador.password, hash_antes)
        self.assertNotEqual(jugador.password, self.admin.password)
        # y el jugador sigue entrando con su contraseña original
        self.client.credentials()
        self.login("jugador@gamevault.test", "Jugador-Clave-456")

    def test_put_sin_password_tampoco_cambia_la_password(self):
        hash_antes = User.objects.get(pk=self.player.pk).password
        self.login("admin@gamevault.test", "Admin-Segura-123")
        r = self.client.put(
            f"{USERS_URL}{self.player.id}/",
            {"username": "jugador", "email": "jugador@gamevault.test", "gamertag": "Editado"},
            format="json",
        )
        self.assertEqual(r.status_code, 200, r.content)
        jugador = User.objects.get(pk=self.player.pk)
        self.assertEqual(jugador.gamertag, "Editado")
        self.assertEqual(jugador.password, hash_antes)

    def test_editar_con_password_si_la_cambia_y_la_cifra(self):
        self.login("admin@gamevault.test", "Admin-Segura-123")
        r = self.client.patch(f"{USERS_URL}{self.player.id}/", {"password": "Clave-Nueva-999"}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        jugador = User.objects.get(pk=self.player.pk)
        self.assertNotEqual(jugador.password, "Clave-Nueva-999")
        self.assertTrue(jugador.check_password("Clave-Nueva-999"))

    def test_swagger_muestra_titulo_y_campo_extra(self):
        r = self.client.get("/swagger.json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["info"]["title"], "GameVault API")
        self.assertIn("gamertag", r.json()["definitions"]["User"]["properties"])


REGISTER_URL = "/api/v1/auth/register/"


class RegisterApiTests(APITestCase):
    datos = {
        "username": "nuevo",
        "email": "nuevo@gamevault.test",
        "password": "Clave-Segura-789!",
        "gamertag": "Nuevo01",
    }

    def test_registro_publico_crea_usuario_con_password_cifrada(self):
        r = self.client.post(REGISTER_URL, self.datos, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        self.assertNotIn("password", r.content.decode())
        user = User.objects.get(email="nuevo@gamevault.test")
        self.assertNotEqual(user.password, self.datos["password"])
        self.assertTrue(user.check_password(self.datos["password"]))
        self.assertFalse(user.is_staff)

    def test_registro_no_permite_hacerse_administrador(self):
        r = self.client.post(REGISTER_URL, {**self.datos, "is_staff": True, "is_superuser": True}, format="json")
        self.assertEqual(r.status_code, 201)
        user = User.objects.get(email="nuevo@gamevault.test")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_registro_rechaza_password_debil_y_email_repetido(self):
        r = self.client.post(REGISTER_URL, {**self.datos, "password": "123"}, format="json")
        self.assertEqual(r.status_code, 400)
        self.client.post(REGISTER_URL, self.datos, format="json")
        r = self.client.post(REGISTER_URL, {**self.datos, "username": "otro"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_registro_y_luego_login(self):
        self.client.post(REGISTER_URL, self.datos, format="json")
        r = self.client.post(
            TOKEN_URL, {"email": self.datos["email"], "password": self.datos["password"]}, format="json"
        )
        self.assertEqual(r.status_code, 200)

    def test_cors_permite_el_frontend_de_vite(self):
        r = self.client.options(
            TOKEN_URL,
            HTTP_ORIGIN="http://localhost:5173",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
        )
        self.assertEqual(r["Access-Control-Allow-Origin"], "http://localhost:5173")