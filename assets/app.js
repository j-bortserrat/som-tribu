/* ===========================================================
   SOM TRIBU — Escuela de Baile · Paiporta
   Lógica compartida: nav móvil, estado abierto/cerrado,
   reveal, contadores, vídeo hero, galería y pestañas.
   =========================================================== */

/* ---------- HORARIO REAL (minutos desde medianoche) ----------
   Clases de lunes a viernes, 17:30–22:30. Sábado y domingo cerrado.
   17:30 = 1050 · 22:30 = 1350. Si cambia, edita SOLO este objeto.   */
const SCHEDULE = {
  0: [],                // Domingo — cerrado
  1: [[1050, 1350]],    // Lunes 17:30–22:30
  2: [[1050, 1350]],    // Martes
  3: [[1050, 1350]],    // Miércoles
  4: [[1050, 1350]],    // Jueves
  5: [[1050, 1350]],    // Viernes
  6: []                 // Sábado — cerrado
};
const DAYNAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function fmtMin(m) {
  const h = Math.floor(m / 60), mm = m % 60;
  return h.toString().padStart(2, '0') + ':' + mm.toString().padStart(2, '0');
}
function getStatus() {
  const now = new Date(), day = now.getDay(), min = now.getHours() * 60 + now.getMinutes();
  const slots = SCHEDULE[day] || [];
  for (const [s, e] of slots) if (min >= s && min < e) return { open: true, until: e };
  for (const [s] of slots) if (min < s) return { open: false, nextTime: s, sameDay: true };
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    if (SCHEDULE[d] && SCHEDULE[d].length) return { open: false, nextDay: d, nextTime: SCHEDULE[d][0][0], sameDay: false };
  }
  return { open: false };
}
function updateStatus() {
  const st = getStatus();
  let cls, txt;
  if (st.open) { cls = 'status-open'; txt = 'Abierto ahora · hasta las ' + fmtMin(st.until); }
  else {
    cls = 'status-closed';
    if (st.nextTime !== undefined && st.sameDay) txt = 'Cerrado · abre hoy a las ' + fmtMin(st.nextTime);
    else if (st.nextTime !== undefined) txt = 'Cerrado · abre el ' + DAYNAMES[st.nextDay] + ' a las ' + fmtMin(st.nextTime);
    else txt = 'Cerrado ahora';
  }
  document.querySelectorAll('.status-banner').forEach(ind => {
    ind.classList.remove('status-open', 'status-closed');
    ind.classList.add(cls, 'in');
    const s = ind.querySelector('.st-label');
    if (s) s.textContent = txt;
  });
}

/* ---------------------- CONTADORES ---------------------- */
function animateCount(el) {
  const raw = (el.dataset.count || '').replace(',', '.');
  const target = parseFloat(raw); const dur = 1400; const start = performance.now();
  const suffix = el.dataset.suffix || '';
  const decimals = raw.indexOf('.') > -1 ? 1 : 0;
  function step(now) {
    const p = Math.min((now - start) / dur, 1);
    const val = (1 - Math.pow(1 - p, 3)) * target;
    el.textContent = (decimals ? val.toFixed(1).replace('.', ',') : Math.floor(val)) + suffix;
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = (decimals ? target.toFixed(1).replace('.', ',') : target) + suffix;
  }
  requestAnimationFrame(step);
}

/* ---------------------- LIGHTBOX GALERÍA ---------------------- */
function initLightbox() {
  const items = Array.from(document.querySelectorAll('.g-item img'));
  const lb = document.getElementById('lightbox');
  if (!items.length || !lb) return;
  const lbImg = lb.querySelector('img');
  let idx = 0;
  const show = i => { idx = (i + items.length) % items.length; lbImg.src = items[idx].dataset.full || items[idx].src; };
  items.forEach((im, i) => im.addEventListener('click', () => { show(i); lb.classList.add('open'); }));
  lb.querySelector('.lb-close').addEventListener('click', () => lb.classList.remove('open'));
  lb.querySelector('.lb-next').addEventListener('click', () => show(idx + 1));
  lb.querySelector('.lb-prev').addEventListener('click', () => show(idx - 1));
  lb.addEventListener('click', e => { if (e.target === lb) lb.classList.remove('open'); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') lb.classList.remove('open');
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'ArrowLeft') show(idx - 1);
  });
}

/* ---------------------- VÍDEO HERO ---------------------- */
function initHeroVideo() {
  const v = document.getElementById('heroVideo');
  if (!v) return;
  const reveal = () => v.classList.add('ready');
  if (v.readyState >= 2) reveal();
  v.addEventListener('loadeddata', reveal);
  v.addEventListener('canplay', reveal);
  // Autoplay silenciado, tolerante a políticas del navegador
  const tryPlay = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  tryPlay();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tryPlay(); });
}

/* ---------------------- INIT ---------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Nav scroll
  const nav = document.getElementById('nav');
  const onScroll = () => { if (nav) nav.classList.toggle('scrolled', window.scrollY > 40); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Burger / menú móvil
  const burger = document.getElementById('burger');
  const links = document.getElementById('navLinks');
  if (burger && links) {
    const closeMenu = () => { burger.classList.remove('open'); links.classList.remove('open'); document.body.style.overflow = ''; };
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      links.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  }

  // Reveal + contadores
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        e.target.querySelectorAll('[data-count]').forEach(c => animateCount(c));
        if (e.target.dataset.count) animateCount(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.14 });
  document.querySelectorAll('.reveal, .reveal-l, .reveal-r, .stagger').forEach(el => io.observe(el));

  // Resaltar el día de hoy (horario y contacto)
  const today = new Date().getDay();
  document.querySelectorAll(`[data-day="${today}"]`).forEach(el => el.classList.add('today'));

  // Pestañas (Servicios: Disciplinas / Horarios / Precios / Novedades)
  const tabs = Array.from(document.querySelectorAll('.serv-tab'));
  const cats = Array.from(document.querySelectorAll('.serv-cat'));
  if (tabs.length && cats.length) {
    const tabsBar = document.querySelector('.serv-tabs');
    const week = document.querySelector('.week');
    const centerToday = () => {
      if (!week) return;
      const cur = week.querySelector('.day-col.today');
      if (!cur) return;
      week.scrollLeft = Math.max(0, cur.offsetLeft - (week.clientWidth - cur.offsetWidth) / 2);
    };
    const select = (key, scroll) => {
      cats.forEach(c => c.classList.toggle('active', c.dataset.cat === key));
      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === key));
      if (key === 'horarios') centerToday();
      if (scroll && tabsBar) {
        const y = tabsBar.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    };
    tabs.forEach(t => t.addEventListener('click', () => {
      select(t.dataset.tab);
      history.replaceState(null, '', '#' + t.dataset.tab);
    }));
    const initial = (location.hash || '').replace('#', '');
    select(tabs.some(t => t.dataset.tab === initial) ? initial : tabs[0].dataset.tab);
    // Menú desplegable de "Servicios": si ya estamos en la página, cambia de pestaña
    window.addEventListener('hashchange', () => {
      const h = (location.hash || '').replace('#', '');
      if (tabs.some(t => t.dataset.tab === h)) select(h, true);
    });
  }

  // Año en el footer
  document.querySelectorAll('.year').forEach(el => el.textContent = new Date().getFullYear());

  // Estado abierto/cerrado + refresco cada minuto
  updateStatus();
  setInterval(updateStatus, 60000);

  // Vídeo y galería
  initHeroVideo();
  initLightbox();
});
