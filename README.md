# GameVault 🎮

Catálogo de videojuegos. Proyecto de la Unidad 3: seguridad, web services y APIs.

El repositorio tiene tres partes:

| Carpeta | Qué es | Puerto |
|---|---|---|
| raíz (`server.js`, `public/`) | **Práctica 1:** sitio web con Node.js + Express que consume la API FreeToGame | 3000 |
| `backend/` | **Práctica 4 y RA2:** API con Django + DRF + JWT (usuarios, registro, Swagger) y endpoint SOAP con `zeep` | 8000 |
| `frontend/` | **RA2:** aplicación React (Vite) con login JWT, AuthContext, dashboard protegido y widget de API de terceros | 5173 |

---

# RA2 – Django + React con autenticación y APIs

Cierre de las Unidades 2 y 3 (Desarrollo Web Integral). Esta sección explica cómo instalar y ejecutar el backend y el frontend del RA2, y dónde ver cada entregable.

## Requisitos

- **Python 3.11** o superior
- **Node.js 20.19** o superior (incluye `npm`)
- **Git**
- Conexión a internet (el widget y el servicio SOAP consultan servicios externos)

## Resumen rápido

Se necesitan **dos terminales abiertas a la vez**: una para el backend y otra para el frontend.

| Terminal | Carpeta | Comando final | URL |
|---|---|---|---|
| 1 – Backend | `backend/` | `python manage.py runserver` | http://127.0.0.1:8000 |
| 2 – Frontend | `frontend/` | `npm run dev` | http://localhost:5173 |

## 1. Clonar el repositorio

```bash
git clone https://github.com/emperadoramarte56/GameVault.git
cd GameVault
```

## 2. Backend (Django + DRF + JWT)

En **PowerShell** (Windows):

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

En **Git Bash**, el entorno se activa con `source venv/Scripts/activate`. En **Linux o macOS**: `source venv/bin/activate`.

> Si PowerShell bloquea `activate`, ejecuta una vez
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` y vuelve a intentarlo.

Con el servidor corriendo:

| Recurso | URL |
|---|---|
| Swagger (documentación y pruebas) | http://127.0.0.1:8000/swagger/ |
| Panel de administración | http://127.0.0.1:8000/admin/ |

Pruebas automáticas (debe terminar en `OK`):

```powershell
python manage.py test users
```

### Endpoints principales

Todos cuelgan de `http://127.0.0.1:8000/api/v1/`.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `auth/register/` | Público | Registro de un usuario nuevo |
| POST | `auth/token/` | Público | Login con **email** y contraseña; devuelve `access` y `refresh` (JWT) |
| POST | `auth/token/refresh/` | Público | Renueva el token de acceso |
| GET | `auth/me/` | Con token | Datos del usuario autenticado |
| GET/POST/… | `users/` | Solo administradores | CRUD de usuarios |
| GET | `soap/country/<ISO>/` | Público | Consume un servicio **SOAP** con `zeep` (ej. `soap/country/MX/`) |

Registro de ejemplo (`POST /api/v1/auth/register/`):

```json
{"username": "prueba1", "email": "prueba1@test.com", "password": "Clave-Segura-789!", "gamertag": "Prueba01"}
```

### Consumo de servicio SOAP

El endpoint `soap/country/<ISO>/` usa la librería `zeep` para llamar al servicio público **CountryInfoService** (operación `FullCountryInfo`) y devuelve en JSON el país, su capital y su moneda.

- **WSDL:** http://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso?WSDL
- **Prueba en el navegador:** http://127.0.0.1:8000/api/v1/soap/country/MX/
- **Prueba en terminal:**

  ```bash
  curl http://127.0.0.1:8000/api/v1/soap/country/MX/
  ```

La respuesta incluye `"source": "SOAP · CountryInfoService"`, el país (Mexico), la capital y la moneda (MXN). Si el servicio externo no responde, el endpoint contesta `502`.

## 3. Frontend (React + Vite)

En **otra terminal**, con el backend ya corriendo:

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

En Git Bash o Linux/macOS, la copia se hace con `cp .env.example .env`.

Abre http://localhost:5173.

### Variables de entorno (`frontend/.env`)

El archivo `.env` real no se sube a GitHub; se crea copiando `.env.example`:

```dotenv
VITE_BASE_API_URL=http://localhost:8000
VITE_LOCAL_STORAGE_ITEM_NAME=TOKEN
VITE_GAMES_API_URL=/freetogame/games
```

| Variable | Para qué sirve |
|---|---|
| `VITE_BASE_API_URL` | URL del backend de Django |
| `VITE_LOCAL_STORAGE_ITEM_NAME` | Nombre con el que se guarda el token JWT en el navegador |
| `VITE_GAMES_API_URL` | Ruta del widget de juegos. Vite la reenvía a FreeToGame (proxy configurado en `vite.config.js`) para evitar problemas de CORS |

Después de cambiar el `.env`, reinicia `npm run dev`.

### Rutas del frontend

| Ruta | Pantalla |
|---|---|
| `/` y `/home` | Inicio |
| `/login` | Inicio de sesión (Formik + Yup, errores con toast) |
| `/register` | Registro de usuario |
| `/dashboard` | **Protegida:** saludo con el usuario logueado y widget de la API de terceros. Sin sesión redirige a `/login` |

### Cómo funciona la autenticación

1. `/login` envía email y contraseña a `POST /api/v1/auth/token/`.
2. El token JWT se guarda en `localStorage` y se muestra en la consola del navegador (`Token obtenido: eyJ...`).
3. El **AuthContext** consulta `GET /api/v1/auth/me/` con ese token y mantiene al usuario en toda la app (hooks `useAuth` y `useUser`).
4. Las rutas protegidas leen el AuthContext; si el token falta o venció, se limpia la sesión y se vuelve al login. La sesión sobrevive a recargar la página.

### Widget de API de terceros

El Dashboard incluye **"Juegos gratis populares"**, que consume con `fetch` la API pública **FreeToGame** (sin clave): https://www.freetogame.com/api/games. Muestra portada, nombre, género y plataforma, con un selector de categoría.

## 4. Dónde ver cada entregable del RA2

| Entregable | Cómo verlo |
|---|---|
| **Repositorio** con Frontend y Backend | Carpetas `frontend/` y `backend/` de este repo, con este README |
| **Login funcionando** | http://localhost:5173/login, y la consola del navegador (`F12`) con `Token obtenido: eyJ...` |
| **Dashboard protegido** | Iniciar sesión y entrar a http://localhost:5173/dashboard: aparece "Bienvenido, *tu usuario*" |
| **Widget de API de terceros** | El mismo `/dashboard`, con los juegos de FreeToGame cargados debajo del saludo |
| **Consumo SOAP** | http://127.0.0.1:8000/api/v1/soap/country/MX/ en el navegador, o con `curl` |

### Prueba completa en 2 minutos

1. Levanta backend y frontend (secciones 2 y 3).
2. Ve a `/register`, crea un usuario y serás enviado a `/login`.
3. Inicia sesión con ese correo y contraseña (con `F12` abierto verás el token).
4. En `/dashboard` comprueba el nombre del usuario y el widget de juegos.
5. Abre `http://127.0.0.1:8000/api/v1/soap/country/MX/` para ver la respuesta SOAP.

## Seguridad aplicada en el RA2

- Login con **email**; contraseñas validadas y cifradas por Django.
- El registro solo acepta `username`, `email`, `password` y `gamertag`: nadie puede crearse como administrador enviando `is_staff`.
- **CORS** limitado a `localhost:5173` y `127.0.0.1:5173` (no se permite cualquier origen).
- Las rutas protegidas del frontend y `/auth/me/` exigen un token JWT válido.
- `.env` ignorado por Git; se publica solo `.env.example`.

---

# Práctica 1 – Sitio con Node.js (raíz del repositorio)

## Instalación

1. `npm install`
2. Copia `.env.example` a `.env` y revisa que `API_URL` apunte a FreeToGame (sin clave)
3. `npm start` y abre http://localhost:3000

## Seguridad aplicada

- Configuración y secreto JWT en `.env` (ignorado por Git); FreeToGame no usa clave de API
- Contraseñas con bcrypt, sesión con JWT en cookie httpOnly
- Validación de campos en cliente y servidor
- Helmet (cabeceras + CSP), límite de peticiones, respuestas mínimas
- API REST externa: FreeToGame

# Práctica 4 – Backend con Django y JWT (carpeta `backend/`)

Es la base del backend del RA2. Detalles, correcciones de seguridad y guía de pruebas en [`backend/README.md`](backend/README.md).
