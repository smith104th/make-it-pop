// Ademan Games: the menu, and the games that slide in over it (same idea as Bolsillo's Games tab).
import { $, load, store, sfx, buzz, settings, saveSettings, esc } from './shared.js';
import { Final } from './final.js';
import { Feedback, NOTES } from './notes.js';
import { Scope } from './scope.js';
import { Swatch } from './swatch.js';
import { Pop, legacySolved } from './pop.js';

const GAMES = [
  { id: 'final', name: 'Final Final', sub: '2048 with file names, from draft to Approved.' },
  { id: 'feedback', name: 'Feedback', sub: 'Ten puzzles based on client notes.' },
  { id: 'scope', name: 'Scope Creep', sub: 'Snake. Eat requests, avoid the walls.' },
  { id: 'swatch', name: 'Swatch', sub: 'Recreate a color from memory. Daily.' },
  { id: 'pop', name: 'Make It Pop', sub: 'Merge work and deliver client orders.' },
];

// Feedback progress lives on its own (it used to be the Notes tab inside Make It Pop).
const FB = 'ag:feedback';
const fb = load(FB, null) || { solved: legacySolved() };
store(FB, fb);

const app = $('#app');
const screens = {};
for (const g of GAMES) {
  const el = document.createElement('section');
  el.className = 'screen game';
  el.id = `g-${g.id}`;
  el.setAttribute('aria-label', g.name);
  app.append(el);
  screens[g.id] = el;
}

const games = {};
games.pop = Pop(screens.pop, { feedback: () => ({ solved: fb.solved.length, total: NOTES.length }) });
games.final = Final(screens.final);
games.feedback = Feedback(screens.feedback, {
  solved: () => fb.solved,
  solve(id) {
    if (fb.solved.includes(id)) return;
    fb.solved.push(id);
    store(FB, fb);
    games.pop.reward();
  },
  sfx,
  buzz,
});
games.scope = Scope(screens.scope);
games.swatch = Swatch(screens.swatch);

// ---------- the menu ----------
const hub = $('#hub');
function renderHub() {
  hub.innerHTML = `<div class="hub-scroll">
    <header class="hub-head"><small>ADEMAN STUDIO · ${GAMES.length} GAMES</small><h1>Ademan<br>Games</h1></header>
    <nav class="bands">${GAMES.map((g) => `
      <button class="band" type="button" data-g="${g.id}">
        <span class="band-txt"><b>${g.name}</b><small>${g.sub}</small></span>
        <span class="band-pill">${esc(games[g.id].status())}</span>
      </button>`).join('')}
    </nav>
    <footer class="credit">
      <img src="wordmark.png" alt="ademan" width="720" height="149">
      <div class="credit-row"><a href="https://byademan.com" target="_blank" rel="noopener">byademan.com</a><button type="button" class="sound">Sound ${settings.sound ? 'on' : 'off'}</button></div>
    </footer>
  </div>`;
}
hub.addEventListener('click', (e) => {
  const b = e.target.closest('.band');
  if (b) { buzz(8); sfx(480, 0.06); entered = true; location.hash = b.dataset.g; return; }
  if (e.target.closest('.sound')) { settings.sound = !settings.sound; saveSettings(); renderHub(); }
});

// ---------- opening and closing games ----------
let cur = null;
let entered = false; // true when we got here by tapping the menu, so Back can go back in history
const hideTimers = {};
function openGame(id) {
  if (cur === id) return;
  if (cur) closeGame(false);
  cur = id;
  clearTimeout(hideTimers[id]);
  const el = screens[id];
  el.style.transform = '';
  el.classList.add('open');
  hub.setAttribute('aria-hidden', 'true');
  games[id].show();
  document.title = `${GAMES.find((g) => g.id === id).name} · Ademan Games`;
}
function closeGame(animate = true) {
  if (!cur) return;
  const id = cur;
  cur = null;
  const el = screens[id];
  el.classList.remove('open');
  hub.removeAttribute('aria-hidden');
  hideTimers[id] = setTimeout(() => { if (cur !== id) { games[id].hide(); el.style.transform = ''; } }, animate ? 450 : 0);
  document.title = 'Ademan Games';
  renderHub();
}
function route() {
  const id = location.hash.slice(1);
  if (games[id]) openGame(id);
  else closeGame();
}
function back() {
  if (entered && history.length > 1) history.back();
  else { history.replaceState(null, '', location.pathname + location.search); route(); }
  entered = false;
}
window.addEventListener('hashchange', route);
app.addEventListener('click', (e) => { if (e.target.closest('.back')) { buzz(6); back(); } });

// swipe in from the left edge to go back, like Bolsillo
let edge = null;
app.addEventListener('pointerdown', (e) => {
  if (!cur || e.clientX - app.getBoundingClientRect().left > 14) return;
  e.stopPropagation();
  edge = { id: e.pointerId, x0: e.clientX, x: 0, el: screens[cur] };
  edge.el.style.transition = 'none';
}, true);
window.addEventListener('pointermove', (e) => {
  if (!edge || e.pointerId !== edge.id) return;
  edge.x = Math.max(0, e.clientX - edge.x0);
  edge.el.style.transform = `translate3d(${edge.x}px,0,0)`;
});
const edgeEnd = (e) => {
  if (!edge || e.pointerId !== edge.id) return;
  const { el, x } = edge;
  edge = null;
  el.style.transition = '';
  if (x > window.innerWidth * 0.3) { el.style.transform = 'translate3d(100%,0,0)'; back(); }
  else el.style.transform = '';
};
window.addEventListener('pointerup', edgeEnd);
window.addEventListener('pointercancel', edgeEnd);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (cur) games[cur].pause?.(); }
  else if (cur) games[cur].resume?.();
  else renderHub();
});

renderHub();
app.hidden = false;
route();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

// for tests
window.__ag = { games, open: (id) => { entered = true; location.hash = id; }, back, get cur() { return cur; } };
