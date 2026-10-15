const $ = s => document.querySelector(s);
const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async r => ({ ok: r.ok, data: await r.json() }));

// Sesión: el menú y las pantallas cambian según haya sesión o no
const pagina_actual = location.pathname.split('/').pop() || 'index.html';
function aplicarSesion(nombre) {
  document.querySelectorAll('[data-auth="in"]').forEach(e => e.hidden = !nombre);
  document.querySelectorAll('[data-auth="out"]').forEach(e => e.hidden = !!nombre);
  if (nombre) { $('#usuario').textContent = nombre; document.querySelectorAll('.nombre').forEach(e => e.textContent = nombre); }
  const actual = document.querySelector(`nav a[href="${location.pathname === '/' ? '/' : location.pathname}"]`); if (actual) actual.classList.add('on');
}
const sesion = fetch('/api/me').then(async r => r.ok ? (await r.json()).nombre : null).catch(() => null);
sesion.then(nombre => {
  aplicarSesion(nombre);
  // Con sesión no tiene sentido ver Registro ni Entrar; sin sesión no se puede ver el catálogo
  if (nombre && ['registro.html', 'login.html'].includes(pagina_actual)) location.replace('/juegos.html');
  if (!nombre && pagina_actual === 'juegos.html') location.replace('/login.html?aviso=1');
  if (!nombre && pagina_actual === 'login.html' && location.search.includes('aviso=1')) $('#aviso').hidden = false;
});
$('#salir').onclick = async e => { e.preventDefault(); await post('/api/logout', {}); location.href = '/login.html'; };

// Validación de campos en el navegador (el servidor valida de nuevo)
const reglas = {
  nombre: v => v.trim().length >= 2 && v.trim().length <= 50 || 'Nombre de 2 a 50 caracteres.',
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Correo no válido.',
  password: (v, reg) => !reg || /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(v) || 'Mínimo 8 caracteres, con letras y números.'
};
function mostrar(f, errs) {
  f.querySelectorAll('input').forEach(i => { const m = errs[i.name]; i.classList.toggle('bad', !!m); i.nextElementSibling.textContent = m || ''; });
}
['registro', 'login'].forEach(id => {
  const f = document.getElementById(id); if (!f) return;
  f.onsubmit = async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f)), errs = {};
    for (const k in d) { const r = reglas[k](d[k], id === 'registro'); if (r !== true) errs[k] = r; }
    mostrar(f, errs); if (Object.keys(errs).length) return;
    const r = await post('/api/' + id, d);
    if (!r.ok) return mostrar(f, r.data.errores || {});
    f.querySelector('.msg').className = 'msg ok'; f.querySelector('.msg').textContent = `¡Bienvenido, ${r.data.nombre}! Redirigiendo…`;
    setTimeout(() => location.href = '/juegos.html', 900);
  };
});

// Catálogo desde la API externa (vía nuestro servidor) con filtros
let pagina = 1, filtrosListos = false;
async function cargar(reset = true) {
  if (reset) pagina = 1;
  const est = $('#estado'), lista = $('#lista'); est.textContent = 'Cargando…'; if (reset) lista.innerHTML = '';
  const p = new URLSearchParams({ q: $('#q').value, genero: $('#genero').value, plataforma: $('#plataforma').value, orden: $('#orden').value, pagina });
  const r = await fetch('/api/juegos?' + p), d = await r.json();
  if (!r.ok) { est.innerHTML = ''; est.append(d.error + ' '); if (r.status === 401) location.replace('/login.html?aviso=1'); return; }
  if (!filtrosListos) { // llena los menús con los valores que trae la API
    d.generos.forEach(x => $('#genero').append(new Option(x, x)));
    d.plataformas.forEach(x => $('#plataforma').append(new Option(x, x)));
    filtrosListos = true;
  }
  est.textContent = `${d.total} juego(s) encontrados`; lista.innerHTML = '';
  d.juegos.forEach(g => { // textContent evita inyección de HTML (XSS)
    const c = document.createElement('div'); c.className = 'game';
    const img = document.createElement('img'); img.alt = g.nombre; if (g.imagen) img.src = g.imagen;
    const b = document.createElement('div'), h = document.createElement('h3'), p1 = document.createElement('p'), p2 = document.createElement('p');
    h.textContent = g.nombre; p1.textContent = `${g.plataforma} · ${g.fecha || 'Sin fecha'}`; p2.textContent = g.generos.join(', ');
    b.append(h, p1, p2); c.append(img, b); lista.append(c);
  });
  $('#mas').hidden = d.juegos.length >= d.total;
}
if ($('#lista')) {
  sesion.then(n => { if (n) cargar(); }); // solo consulta el catálogo si hay sesión
  $('#buscar').onsubmit = e => { e.preventDefault(); cargar(); };
  ['genero', 'plataforma', 'orden'].forEach(id => $('#' + id).onchange = () => cargar());
  $('#limpiar').onclick = () => { $('#buscar').reset(); cargar(); };
  $('#mas').onclick = () => { pagina++; cargar(false); };
}
