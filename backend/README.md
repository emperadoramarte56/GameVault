# GameVault API 🎮 (carpeta `backend/`)

Backend con **Django + Django REST Framework + JWT** para la plataforma de videojuegos GameVault.
Proyecto de la Unidad 3 – Práctica 4 (Desarrollo Web Integral). Se ejecuta de forma local.
Vive dentro del repositorio GameVault, junto al sitio de Node.js de la Práctica 1 (en la raíz).

## Qué incluye

- Usuario personalizado que inicia sesión con **correo** y tiene un campo extra: **`gamertag`**.
- CRUD de usuarios en `/api/v1/users/` (solo administradores).
- Datos personales del usuario autenticado en `/api/v1/auth/me/`.
- Login con JWT en `/api/v1/auth/token/` y renovación en `/api/v1/auth/token/refresh/`.
- Documentación en **Swagger** (`/swagger/`, título "GameVault API") y ReDoc (`/redoc/`).
- Token de acceso configurado con `ACCESS_TOKEN_LIFETIME = 30 minutos` (en `gamevault/settings.py`).

## Correcciones de seguridad respecto al manual

| Problema del manual | Corrección |
|---|---|
| La respuesta incluía el campo `password` (hash), también en `/auth/me/` | `password` es `write_only` en `UserSerializer`: se puede enviar pero nunca se devuelve |
| `partial_update` asignaba `request.user.password` cuando no venía contraseña (copiaba la del administrador al usuario editado) | La contraseña solo cambia si viene en la petición; se maneja en `UserSerializer.update` |
| Solo se cifraba la contraseña en `create` y `partial_update`; con `PUT` se guardaba en texto plano | El cifrado (`set_password`) está en el serializer y cubre POST, PUT y PATCH |
| Se modificaba `request.data` directamente (puede ser inmutable) | Ya no se toca `request.data` |
| `REQUIRED_FIELDS = []` dejaba `username` vacío y el segundo usuario fallaba por duplicado | `REQUIRED_FIELDS = ["username"]` |
| `admin.site.register(User)` mostraba el hash como texto editable | Se usa `UserAdmin` con el campo `gamertag` |

## Instalación y ejecución (Windows / PowerShell)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser     # pide email, username y contraseña
python manage.py runserver
```

Abrir <http://127.0.0.1:8000/swagger/>.

Pruebas automáticas (11 pruebas, incluyen las dos correcciones de seguridad):

```powershell
python manage.py test users
```

## Guía para las capturas del PDF

1. **Swagger con los endpoints**: abrir `http://127.0.0.1:8000/swagger/` y capturar la lista completa (`auth` y `users`).
2. **Obtención del token**: en `POST /auth/token/` pulsar *Try it out*, poner
   `{"email": "tu_correo", "password": "tu_contraseña"}` y ejecutar. Capturar la respuesta con `access` y `refresh`.
3. **Datos personales con el token**: copiar el `access`, pulsar **Authorize**, escribir `Bearer <access>`, y ejecutar
   `GET /auth/me/`. Capturar la respuesta (debe aparecer `gamertag` y **no** `password`).
4. **Editar sin contraseña NO la cambia** (con el token de un administrador autorizado):
   1. Crear un usuario de prueba con `POST /users/` (con su `password` y `gamertag`).
   2. Editarlo con `PATCH /users/{id}/` enviando solo `{"first_name": "Ana"}` (sin `password`).
   3. Pedir un token con el correo y la contraseña **original** de ese usuario: debe responder `200` con `access`/`refresh`.
   4. (Opcional) Probar el token con la contraseña del administrador: debe responder `401`.
   Capturar el `PATCH` y el token obtenido después.

## Estructura

```
backend/
  gamevault/        configuración del proyecto (settings.py, urls.py)
  users/            app de usuarios (models, serializers, views, urls, admin, tests)
  manage.py
  requirements.txt
(.gitignore en la raíz del repo: excluye venv/ y db.sqlite3)
```
