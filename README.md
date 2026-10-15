# GameVault 🎮
Catálogo de videojuegos (Node.js + Express). Proyecto Unidad 3: seguridad, web services y APIs.

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
