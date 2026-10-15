require('dotenv').config();
const express = require('express'), helmet = require('helmet'), rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken'), cookieParser = require('cookie-parser');
const fs = require('fs'), path = require('path');
const { JWT_SECRET, PORT = 3000 } = process.env;
if (!JWT_SECRET) { console.error('Falta JWT_SECRET en .env'); process.exit(1); }

const app = express();
// Cabeceras de seguridad (helmet) + CSP que solo permite imágenes de FreeToGame
app.use(helmet({ contentSecurityPolicy: { directives: {
  ...helmet.contentSecurityPolicy.getDefaultDirectives(),
  'img-src': ["'self'", 'data:', 'https://www.freetogame.com'] } } }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
// Límite de peticiones para evitar abusos (OWASP: consumo ilimitado de recursos)
app.use('/api/', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
app.use(express.static(path.join(__dirname, 'public')));

const FILE = path.join(__dirname, 'data', 'users.json');
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
const getUsers = () => fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE)) : [];
const saveUsers = u => fs.writeFileSync(FILE, JSON.stringify(u, null, 2));

// Validación en servidor (nunca confiar solo en el navegador)
function validar({ nombre, email, password }, registro) {
  const e = {};
  if (registro && (typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.trim().length > 50)) e.nombre = 'Nombre de 2 a 50 caracteres.';
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 100) e.email = 'Correo no válido.';
  if (typeof password !== 'string' || (registro && !/^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(password))) e.password = 'Mínimo 8 caracteres, con letras y números.';
  return e;
}
function darToken(res, u) {
  const t = jwt.sign({ id: u.id, nombre: u.nombre }, JWT_SECRET, { expiresIn: '1h' });
  res.cookie('token', t, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 3600000 });
}
function auth(req, res, next) {
  try { req.user = jwt.verify(req.cookies.token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Inicia sesión para ver esto.' }); }
}

app.post('/api/registro', async (req, res) => {
  const err = validar(req.body, true);
  if (Object.keys(err).length) return res.status(400).json({ errores: err });
  const users = getUsers(), email = req.body.email.toLowerCase();
  if (users.some(u => u.email === email)) return res.status(409).json({ errores: { email: 'Ese correo ya está registrado.' } });
  const u = { id: Date.now(), nombre: req.body.nombre.trim(), email, hash: await bcrypt.hash(req.body.password, 10) };
  users.push(u); saveUsers(users); darToken(res, u);
  res.status(201).json({ nombre: u.nombre });
});
app.post('/api/login', async (req, res) => {
  const err = validar(req.body, false);
  if (Object.keys(err).length) return res.status(400).json({ errores: err });
  const u = getUsers().find(x => x.email === req.body.email.toLowerCase());
  if (!u || !(await bcrypt.compare(req.body.password, u.hash))) return res.status(401).json({ errores: { password: 'Correo o contraseña incorrectos.' } });
  darToken(res, u); res.json({ nombre: u.nombre });
});
app.post('/api/logout', (req, res) => { res.clearCookie('token'); res.json({ ok: true }); });
app.get('/api/me', auth, (req, res) => res.json({ nombre: req.user.nombre }));

// API externa (FreeToGame, gratis y sin clave). La URL se lee desde .env y la consulta la hace el servidor.
let cache = { t: 0, d: [] }; // guarda la lista 10 min para no saturar la API externa
app.get('/api/juegos', auth, async (req, res) => {
  try {
    if (Date.now() - cache.t > 600000) {
      const r = await fetch(process.env.API_URL || 'https://www.freetogame.com/api/games');
      if (!r.ok) throw new Error();
      cache = { t: Date.now(), d: await r.json() };
    }
    const d = cache.d, str = k => String(req.query[k] || '').slice(0, 50);
    const q = str('q').toLowerCase(), genero = str('genero'), plat = str('plataforma'), orden = str('orden');
    const pagina = Math.min(Math.max(parseInt(req.query.pagina) || 1, 1), 100);
    let l = d.filter(g => g.title.toLowerCase().includes(q) && (!genero || g.genre === genero) && (!plat || g.platform === plat));
    if (orden === 'reciente') l.sort((a, b) => b.release_date.localeCompare(a.release_date));
    if (orden === 'antiguo') l.sort((a, b) => a.release_date.localeCompare(b.release_date));
    if (orden === 'nombre') l.sort((a, b) => a.title.localeCompare(b.title));
    // Se devuelve solo lo necesario (OWASP: exposición de propiedades)
    res.json({
      total: l.length,
      generos: [...new Set(d.map(g => g.genre))].sort(),
      plataformas: [...new Set(d.map(g => g.platform))].sort(),
      juegos: l.slice(0, pagina * 12).map(g => ({ nombre: g.title, imagen: g.thumbnail, plataforma: g.platform, fecha: g.release_date, generos: [g.genre] }))
    });
  } catch { res.status(502).json({ error: 'No se pudo consultar la API de juegos.' }); }
});

app.listen(PORT, () => console.log(`GameVault en http://localhost:${PORT}`));
