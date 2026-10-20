# GameVault 🎮
Catálogo de videojuegos. Proyecto de la Unidad 3: seguridad, web services y APIs.

El repositorio tiene dos partes:

| Carpeta | Qué es |
|---|---|
| raíz (`server.js`, `public/`) | Práctica 1: sitio web con Node.js + Express que consume la API FreeToGame |
| `backend/` | Práctica 4: API con **Django + DRF + JWT** (usuarios, Swagger). Ver `backend/README.md` |

---

## Práctica 1 – Sitio con Node.js

### Instalación
1. `npm install`
2. Copia `.env.example` a `.env` y revisa que `API_URL` apunte a FreeToGame (sin clave)
3. `npm start` y abre http://localhost:3000

### Seguridad aplicada
- Configuración y secreto JWT en `.env` (ignorado por Git); FreeToGame no usa clave de API
- Contraseñas con bcrypt, sesión con JWT en cookie httpOnly
- Validación de campos en cliente y servidor
- Helmet (cabeceras + CSP), límite de peticiones, respuestas mínimas
- API REST externa: FreeToGame

---

## Práctica 4 – Backend con Django y JWT (carpeta `backend/`)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Swagger: http://127.0.0.1:8000/swagger/ · Admin: http://127.0.0.1:8000/admin/

Detalles, correcciones de seguridad y guía de pruebas en [`backend/README.md`](backend/README.md).
