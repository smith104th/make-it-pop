// Make It Pop: the merge desk. Briefs, clients, client-note stickies.
import { C, CHAINS, maxLevel, itemName, itemSvg, tileHTML, genHTML, daphiSvg } from './art.js';
import { makeOrder, firstOrder, unlockedChains, xpNeed } from './clients.js';
import { $, rnd, esc, sfx, buzz, sheet, gameHead, settings, saveSettings, shareText, SITE } from './shared.js';

const COLS = 7;
const N = 49;
const GEN = 24; // the Brief generator sits in the middle of the desk
const KEY = 'make-it-pop:v1';
const ROOMS = [
  { id: 'riso', name: 'Riso room', lvl: 3, cost: 150, perk: 'Briefs sometimes print two.' },
  { id: 'photo', name: 'Photo set', lvl: 4, cost: 250, perk: 'Briefs print level 2 work more often.' },
  { id: 'lab', name: 'Packaging lab', lvl: 6, cost: 400, perk: 'Clients pay 25% more.' },
  { id: 'stop', name: 'Stop-motion corner', lvl: 8, cost: 600, perk: 'Client notes land less often.' },
];
const STICKIES = [
  'make it pop', 'can we try it in blue?', 'logo bigger pls', 'my nephew has Canva', 'love it! small tweaks',
  'more premium?', 'can it feel more "wow"', 'circling back', 'revisit the font?', 'the CEO hates green',
  'can it go viral', 'just a few more options', 'per my last email', 'quick call?', 'can the white be whiter',
  'add our Instagram', 'Comic Sans, but chic', 'make it pop (again)',
];
const SECTOR_COLOR = { fashion: [C.ink, '#fff'], beauty: [C.pink, C.ink], hospitality: [C.blue, '#fff'], lifestyle: [C.greenL, C.ink] };

// ---------- state ----------
function fresh() {
  const board = Array(N).fill(null);
  board[GEN - 1] = { c: 'type', l: 1 };
  board[GEN + 1] = { c: 'type', l: 1 };
  board[GEN - COLS] = { c: 'files', l: 1 };
  const s = {
    v: 1, board, stickies: {}, coins: 20, xp: 0, level: 1,
    orders: [], wall: [], wallView: 'grid', rooms: {}, intro: false,
    stats: { merges: 0, launches: 0, cleared: 0, spawns: 0 }, sinceSticky: 0, nextSticky: 8,
  };
  s.orders = [firstOrder()];
  s.orders.push(makeOrder(s));
  s.orders.push(makeOrder(s));
  return s;
}
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.v === 1 && Array.isArray(s.board) && s.board.length === N) {
      const d = fresh();
      return { ...d, ...s, stats: { ...d.stats, ...s.stats }, rooms: { ...s.rooms } };
    }
  } catch { /* start fresh */ }
  return fresh();
}
let S = loadState();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* private mode */ } };
// Feedback used to live in here as Notes; main.js reads this once to carry progress over.
export const legacySolved = () => (Array.isArray(S.notes?.solved) ? S.notes.solved : []);

let sel = -1;
let anim = { spawn: [], merge: -1, sticky: -1, hit: [] };
let tab = 'desk';
let ctx = { feedback: () => ({ solved: 0, total: 10 }) };

// ---------- helpers ----------
const rc = (i) => [Math.floor(i / COLS), i % COLS];
const dist = (a, b) => { const [r1, c1] = rc(a), [r2, c2] = rc(b); return Math.hypot(r1 - r2, c1 - c2); };
const neighbors = (i) => {
  const [r, c] = rc(i);
  return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([y, x]) => y >= 0 && y < 7 && x >= 0 && x < COLS).map(([y, x]) => y * COLS + x);
};

// ---------- status line (Daphi's bubble) ----------
const MSG = {
  start: 'Tap Brief for new work.',
  full: 'The desk is full. Merge or archive something.',
  sticky: 'New client note on the desk.',
  locked: 'That tile has a client note on it. Merge right next to it.',
  cleared: 'Client note resolved.',
  max: 'Max level.',
  archive: 'Archived.',
};
function say(text) {
  const p = $('#daphi p');
  if (!p) return;
  p.textContent = MSG[text] || text;
  const b = $('#daphi .bubble');
  b.classList.remove('talk');
  void b.offsetWidth;
  b.classList.add('talk');
}

// ---------- game actions ----------
function nearestEmpty(from) {
  let best = -1, bd = 1e9;
  for (let i = 0; i < N; i++) {
    if (i === GEN || S.board[i] || S.stickies[i]) continue;
    const d = dist(i, from) + Math.random() * 0.01;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
function pickChain() {
  const ks = unlockedChains(S.level);
  const w = ks.map((k) => 1 + 0.6 * S.orders.reduce((a, o) => a + o.needs.filter((n) => n.c === k).length, 0));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ks.length; i++) { r -= w[i]; if (r <= 0) return ks[i]; }
  return ks[0];
}
function spawn() {
  const target = nearestEmpty(GEN);
  if (target < 0) { say('full'); shake(GEN); return; }
  S.board[target] = { c: pickChain(), l: Math.random() < (S.rooms.photo ? 0.25 : 0.08) ? 2 : 1 };
  S.stats.spawns++;
  anim.spawn = [target];
  if (S.rooms.riso && Math.random() < 0.15) {
    const t2 = nearestEmpty(GEN);
    if (t2 >= 0) { S.board[t2] = { c: pickChain(), l: 1 }; anim.spawn.push(t2); }
  }
  maybeSticky();
  sfx(360, 0.08);
  buzz(5);
  save();
  render();
}
function maybeSticky() {
  S.sinceSticky++;
  if (S.stats.spawns < 12) return;
  const max = Math.min(5, 2 + Math.floor(S.level / 3));
  if (S.sinceSticky < S.nextSticky || Object.keys(S.stickies).length >= max) return;
  const cand = [];
  for (let i = 0; i < N; i++) if (i !== GEN && !S.stickies[i]) cand.push(i);
  if (!cand.length) return;
  const occ = cand.filter((i) => S.board[i]);
  const idx = rnd(occ.length && Math.random() < 0.7 ? occ : cand);
  S.stickies[idx] = { t: rnd(STICKIES), hp: S.level >= 3 && Math.random() < 0.4 ? 2 : 1 };
  S.sinceSticky = 0;
  S.nextSticky = 6 + Math.floor(Math.random() * 5) + (S.rooms.stop ? 4 : 0);
  anim.sticky = idx;
  if (sel === idx) sel = -1;
  say('sticky');
}
function drop(src, dst) {
  if (dst < 0 || dst === src) { render(); return; }
  if (dst === GEN || S.stickies[dst]) { if (S.stickies[dst]) say('locked'); render(); return; }
  const a = S.board[src], b = S.board[dst];
  if (!b) { S.board[dst] = a; S.board[src] = null; sel = dst; sfx(520, 0.05); }
  else if (b.c === a.c && b.l === a.l && a.l < maxLevel(a.c)) merge(src, dst, a);
  else { S.board[dst] = a; S.board[src] = b; sel = dst; sfx(520, 0.05); }
  save();
  render();
}
function merge(src, dst, a) {
  const nl = a.l + 1;
  S.board[dst] = { c: a.c, l: nl };
  S.board[src] = null;
  S.stats.merges++;
  sel = dst;
  anim.merge = dst;
  let cleared = 0;
  for (const n of neighbors(dst)) {
    const st = S.stickies[n];
    if (!st) continue;
    st.hp--;
    anim.hit.push(n);
    if (st.hp <= 0) { delete S.stickies[n]; S.stats.cleared++; cleared++; }
  }
  sfx(280 + nl * 90, 0.18);
  buzz(12);
  burst(dst);
  if (cleared) say('cleared');
  else if (nl === maxLevel(a.c)) say('max');
}
function readyCells(o) {
  const used = new Set();
  for (const n of o.needs) {
    const i = S.board.findIndex((it, idx) => it && !used.has(idx) && !S.stickies[idx] && it.c === n.c && it.l === n.l);
    if (i < 0) return null;
    used.add(i);
  }
  return [...used];
}
function deliver(oi) {
  const o = S.orders[oi];
  const cells = o && readyCells(o);
  if (!cells) return;
  const card = $(`#orders .order[data-o="${oi}"]`);
  if (card) floatText(card, `+$${o.coins}`);
  cells.forEach((i) => { S.board[i] = null; if (sel === i) sel = -1; });
  S.coins += o.coins;
  S.xp += o.xp;
  S.stats.launches++;
  S.wall.unshift({ ...o.client, needs: o.needs, at: Date.now() });
  if (S.wall.length > 200) S.wall.length = 200;
  S.orders[oi] = makeOrder(S);
  sfx(660, 0.2);
  setTimeout(() => sfx(880, 0.2), 90);
  buzz(20);
  say(`Delivered to ${o.client.name}. +$${o.coins}.`);
  levelCheck();
  save();
  render();
}
function levelCheck() {
  let up = false;
  while (S.xp >= xpNeed(S.level)) { S.xp -= xpNeed(S.level); S.level++; up = true; }
  if (!up) return;
  const news = [];
  for (const k of Object.keys(CHAINS)) if (CHAINS[k].unlock === S.level) news.push(`New work type: <b>${CHAINS[k].name}</b>. Briefs can now print it.`);
  for (const r of ROOMS) if (r.lvl === S.level) news.push(`<b>${r.name}</b> can be built in the Studio tab.`);
  if (!news.length) news.push('Clients now ask for bigger things.');
  say(`Studio level ${S.level}.`);
  sheet({ title: `Studio level ${S.level}`, body: news.map((n) => `<p>${n}</p>`).join(''), actions: [{ label: 'Back to work', primary: true }] });
}
function archive(i) {
  const it = S.board[i];
  if (!it) return;
  const v = 2 ** (it.l - 1);
  floatText(cellEl(i), `+$${v}`);
  S.board[i] = null;
  S.coins += v;
  sel = -1;
  say('archive');
  sfx(240, 0.1);
  save();
  render();
}
function buildRoom(id) {
  const r = ROOMS.find((x) => x.id === id);
  if (!r || S.rooms[id] || S.level < r.lvl || S.coins < r.cost) return;
  S.coins -= r.cost;
  S.rooms[id] = true;
  say(`${r.name} built.`);
  sfx(700, 0.25);
  save();
  render();
}

// ---------- rendering ----------
const cellEl = (i) => $(`#board .cell[data-i="${i}"]`);
function renderTop() {
  $('#coins').innerHTML = `<b>$${S.coins}</b>`;
}
function needsHTML(o) {
  const have = {};
  S.board.forEach((it, i) => { if (it && !S.stickies[i]) { const k = `${it.c}:${it.l}`; have[k] = (have[k] || 0) + 1; } });
  return o.needs.map((n) => {
    const k = `${n.c}:${n.l}`;
    const ok = (have[k] || 0) > 0;
    if (ok) have[k]--;
    return `<span class="need${ok ? ' ok' : ''}" title="${esc(itemName(n.c, n.l))}">${tileHTML(n)}</span>`;
  }).join('');
}
function renderOrders() {
  $('#orders').innerHTML = S.orders.map((o, i) => {
    const ready = !!readyCells(o);
    return `<div class="order${ready ? ' ready' : ''}" data-o="${i}">
      <div class="who"><b>${esc(o.client.name)}</b><small>${esc(o.client.type)} · ${esc(o.client.place)}</small></div>
      <div class="needs">${needsHTML(o)}</div>
      <div class="pay">${ready ? `<button class="deliver" data-o="${i}">Deliver $${o.coins}</button>` : `<small>$${o.coins}</small>`}</div>
    </div>`;
  }).join('');
}
function stickyHTML(st, i) {
  return `<div class="sticky${st.hp > 1 ? ' double' : ''}${anim.sticky === i ? ' land' : ''}${anim.hit.includes(i) ? ' hit' : ''}">${esc(st.t)}</div>`;
}
function renderBoard() {
  let h = '';
  for (let i = 0; i < N; i++) {
    const it = S.board[i];
    const st = S.stickies[i];
    let cls = 'cell';
    if (sel === i) cls += ' sel';
    if (st) cls += ' locked';
    let inner = '';
    if (i === GEN) inner = genHTML('live');
    else if (it) inner = tileHTML(it, anim.merge === i ? 'pop' : anim.spawn.includes(i) ? 'in' : '');
    if (st) inner += stickyHTML(st, i);
    else if (anim.hit.includes(i)) inner += '<div class="sticky peel"> </div>';
    h += `<div class="${cls}" data-i="${i}">${inner}</div>`;
  }
  $('#board').innerHTML = h;
  anim = { spawn: [], merge: -1, sticky: -1, hit: [] };
}
function renderInspector() {
  const el = $('#inspector');
  if (sel === GEN) {
    el.innerHTML = `<div class="ins-art gen-mini">${genHTML()}</div><div class="ins-txt"><b>Brief</b><small>Tap for new work.</small></div>`;
    return;
  }
  const st = S.stickies[sel];
  if (st) {
    el.innerHTML = `<div class="ins-txt"><b>Client note: "${esc(st.t)}"</b><small>Merge right next to it to resolve it${st.hp > 1 ? ` (${st.hp} merges)` : ''}.</small></div>`;
    return;
  }
  const it = S.board[sel];
  if (!it) {
    sel = -1;
    el.innerHTML = '<div class="ins-txt"><b>Tap Brief for new work.</b><small>Drag two of the same together to merge. Deliver to clients up top.</small></div>';
    return;
  }
  const max = maxLevel(it.c);
  const next = it.l < max ? `Next: ${esc(itemName(it.c, it.l + 1))}` : 'Max level';
  el.innerHTML = `<div class="ins-art">${tileHTML(it)}</div>
    <div class="ins-txt"><b>${esc(itemName(it.c, it.l))}</b><small>${CHAINS[it.c].name} · ${it.l} of ${max} · ${next}</small></div>
    <button class="pill sm" id="archive">Archive +$${2 ** (it.l - 1)}</button>`;
}
function renderStudio() {
  const need = xpNeed(S.level);
  const pct = Math.min(100, (S.xp / need) * 100);
  const fb = ctx.feedback();
  $('#pop-studio').innerHTML = `
    <div class="scroll">
      <h2>Studio</h2>
      <div class="card lvlcard">
        <div class="row"><b>Level ${S.level}</b><small>${S.xp} / ${need} XP</small></div>
        <div class="bar"><i style="width:${pct}%"></i></div>
      </div>
      <div class="stats">
        <div><b>${S.stats.launches}</b><small>Brands launched</small></div>
        <div><b>${S.stats.cleared}</b><small>Feedback survived</small></div>
        <div><b>${S.stats.merges}</b><small>Merges</small></div>
        <div><b>${fb.solved}/${fb.total}</b><small>Feedback solved</small></div>
      </div>
      <h3>Rooms</h3>
      <div class="rooms">${ROOMS.map((r) => {
        const built = S.rooms[r.id];
        const open = S.level >= r.lvl;
        const btn = built ? '<span class="tag on">Built</span>'
          : !open ? `<span class="tag">Level ${r.lvl}</span>`
          : `<button class="pill sm${S.coins >= r.cost ? ' go' : ''}" data-room="${r.id}" ${S.coins >= r.cost ? '' : 'disabled'}>Build $${r.cost}</button>`;
        return `<div class="room${built ? ' built' : ''}"><div><b>${r.name}</b><small>${r.perk}</small></div>${btn}</div>`;
      }).join('')}</div>
      <h3>Settings</h3>
      <div class="settings">
        <button class="pill sm" id="sound">Sound: ${settings.sound ? 'on' : 'off'}</button>
        <button class="pill sm" id="reset">Start over</button>
      </div>
    </div>`;
}
function renderWall() {
  const n = S.wall.length;
  const items = S.wall.map((w) => {
    const [bg, fg] = SECTOR_COLOR[w.sector] || [C.grey, C.ink];
    const yr = new Date(w.at).getFullYear();
    return S.wallView === 'grid'
      ? `<div class="wcard"><div class="wimg" style="--bg:${bg};--fg:${fg}"><b>${esc(w.name)}</b><div class="wneeds">${w.needs.map((x) => `<span style="background:${CHAINS[x.c].bg}">${itemSvg(x.c, x.l)}</span>`).join('')}</div></div><div class="wmeta"><span>${esc(w.type)}</span><span>${esc(w.place)}</span></div></div>`
      : `<div class="wrow"><b>${esc(w.name)}</b><span>${esc(w.type)}</span><span>${esc(w.place)}</span><span>${yr}</span></div>`;
  }).join('');
  $('#pop-wall').innerHTML = `
    <div class="scroll">
      <div class="whead"><h2>Portfolio <sup>${n}</sup></h2>
        <div class="toggle"><button class="pill sm${S.wallView === 'grid' ? ' on' : ''}" data-view="grid">Grid</button><button class="pill sm${S.wallView === 'list' ? ' on' : ''}" data-view="list">List</button></div>
      </div>
      ${n ? `<div class="${S.wallView === 'grid' ? 'wgrid' : 'wlist'}">${items}</div>` : '<p class="empty">Nothing launched yet. Back to the desk.</p>'}
      <button class="pill share" id="share">Share your portfolio</button>
    </div>`;
}
function render() {
  renderTop();
  if (tab === 'desk') { renderOrders(); renderBoard(); renderInspector(); }
  if (tab === 'studio') renderStudio();
  if (tab === 'wall') renderWall();
  document.querySelectorAll('#pop-dock button').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
}
function go(t) {
  tab = t;
  document.querySelectorAll('.pop-screen').forEach((el) => el.classList.toggle('on', el.id === `pop-${t}`));
  if (t === 'desk') requestAnimationFrame(fit);
  render();
}

// ---------- fx ----------
function burst(i) {
  requestAnimationFrame(() => {
    const el = cellEl(i);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const b = document.createElement('div');
    b.className = 'burst';
    b.style.left = `${r.left + r.width / 2}px`;
    b.style.top = `${r.top + r.height / 2}px`;
    document.body.append(b);
    setTimeout(() => b.remove(), 600);
  });
}
function floatText(el, text) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const f = document.createElement('div');
  f.className = 'float';
  f.textContent = text;
  f.style.left = `${r.left + r.width / 2}px`;
  f.style.top = `${r.top + r.height / 3}px`;
  document.body.append(f);
  setTimeout(() => f.remove(), 1000);
}
function shake(i) {
  const el = cellEl(i);
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}
// ---------- board input: tap and drag ----------
let drag = null;
function tap(i) {
  if (i === GEN) { sel = -1; spawn(); return; }
  if (S.stickies[i]) { sel = i; renderBoard(); renderInspector(); return; }
  sel = S.board[i] && sel !== i ? i : -1;
  renderBoard();
  renderInspector();
}
function startGhost(e) {
  const el = cellEl(drag.src);
  const tile = el.querySelector('.tile');
  const r = tile.getBoundingClientRect();
  const g = tile.cloneNode(true);
  g.classList.add('ghost');
  g.classList.remove('pop', 'in');
  g.style.width = `${r.width}px`;
  g.style.height = `${r.height}px`;
  document.body.append(g);
  drag.ghost = g;
  drag.ox = r.width / 2;
  drag.oy = r.height / 2;
  tile.classList.add('lift');
  const it = S.board[drag.src];
  document.querySelectorAll('#board .cell').forEach((c) => {
    const j = +c.dataset.i;
    const o = S.board[j];
    if (j !== drag.src && o && !S.stickies[j] && o.c === it.c && o.l === it.l && it.l < maxLevel(it.c)) c.classList.add('match');
  });
  moveGhost(e);
}
function cellAt(x, y) {
  const el = document.elementFromPoint(x, y)?.closest('#board .cell');
  return el ? +el.dataset.i : -1;
}
function moveGhost(e) {
  drag.ghost.style.transform = `translate(${e.clientX - drag.ox}px, ${e.clientY - drag.oy - 10}px) scale(1.08)`;
  const t = cellAt(e.clientX, e.clientY);
  if (t !== drag.hover) {
    if (drag.hover >= 0) cellEl(drag.hover)?.classList.remove('hover');
    if (t >= 0 && t !== drag.src) cellEl(t)?.classList.add('hover');
    drag.hover = t;
  }
}
function bindBoard() {
  const board = $('#board');
  board.addEventListener('pointerdown', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell || drag) return;
    e.preventDefault();
    drag = { src: +cell.dataset.i, x0: e.clientX, y0: e.clientY, moved: false, pid: e.pointerId, hover: -1 };
    try { board.setPointerCapture(e.pointerId); } catch { /* */ }
  });
  board.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 7) return;
      const s = drag.src;
      if (s === GEN || !S.board[s] || S.stickies[s]) return;
      drag.moved = true;
      sel = -1;
      startGhost(e);
    }
    moveGhost(e);
  });
  const end = (e, cancel) => {
    if (!drag || e.pointerId !== drag.pid) return;
    const d = drag;
    drag = null;
    if (!d.moved) { if (!cancel) tap(d.src); return; }
    d.ghost.remove();
    drop(d.src, cancel ? -1 : cellAt(e.clientX, e.clientY));
  };
  board.addEventListener('pointerup', (e) => end(e, false));
  board.addEventListener('pointercancel', (e) => end(e, true));
}

// ---------- layout ----------
function fit() {
  const wrap = $('#boardwrap');
  if (!wrap || !wrap.clientWidth) return;
  // wrap padding (24 / 12) + board padding (12) + six 4px gaps (24)
  const cell = Math.floor(Math.min((wrap.clientWidth - 60) / 7, (wrap.clientHeight - 48) / 7, 66));
  document.documentElement.style.setProperty('--cell', `${Math.max(30, cell)}px`);
}

// ---------- the game ----------
export function Pop(root, context) {
  ctx = { ...ctx, ...context };
  root.innerHTML = `${gameHead('Make It Pop', '<span id="coins" class="pill res" aria-label="Money"></span>')}
    <main class="pop-main">
      <section id="pop-desk" class="pop-screen on" aria-label="Desk">
        <div id="orders" class="orders"></div>
        <div id="daphi" class="daphi"><span class="av" aria-hidden="true">${daphiSvg}</span><div class="bubble"><small>DAPHI</small><p></p></div></div>
        <div id="boardwrap"><div id="board" class="board"></div></div>
        <div id="inspector" class="inspector"></div>
      </section>
      <section id="pop-studio" class="pop-screen" aria-label="Studio"></section>
      <section id="pop-wall" class="pop-screen" aria-label="Portfolio"></section>
    </main>
    <nav id="pop-dock" class="subdock">
      <button type="button" data-t="desk">Desk</button>
      <button type="button" data-t="studio">Studio</button>
      <button type="button" data-t="wall">Portfolio</button>
    </nav>`;
  root.classList.add('pop');
  bindBoard();
  $('#orders').addEventListener('click', (e) => { const b = e.target.closest('.deliver'); if (b) deliver(+b.dataset.o); });
  $('#inspector').addEventListener('click', (e) => { if (e.target.closest('#archive') && sel >= 0) archive(sel); });
  $('#pop-dock').addEventListener('click', (e) => { const b = e.target.closest('button[data-t]'); if (b) go(b.dataset.t); });
  $('#pop-studio').addEventListener('click', (e) => {
    const r = e.target.closest('[data-room]');
    if (r) buildRoom(r.dataset.room);
    if (e.target.closest('#sound')) { settings.sound = !settings.sound; saveSettings(); render(); }
    if (e.target.closest('#reset')) {
      sheet({ title: 'Start over?', body: '<p>Wipes your studio and portfolio on this phone. Your other games stay.</p>', actions: [
        { label: 'Wipe it', fn: () => { localStorage.removeItem(KEY); S = fresh(); S.intro = true; sel = -1; save(); go('desk'); } },
        { label: 'Keep it', primary: true },
      ] });
    }
  });
  $('#pop-wall').addEventListener('click', (e) => {
    const v = e.target.closest('[data-view]');
    if (v) { S.wallView = v.dataset.view; save(); renderWall(); }
    if (e.target.closest('#share')) shareText(`Make It Pop: ${S.stats.launches} brands launched.`, `${SITE}#pop`);
  });
  window.addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe($('#boardwrap'));
  return {
    show() {
      render();
      fit();
      say('start');
      if (!S.intro) {
        S.intro = true;
        save();
        sheet({
          title: 'Make It Pop',
          body: `<ul><li>Tap <b>Brief</b> for new work.</li><li>Drag two of the same together to merge them up.</li><li>Deliver what clients ask for, up top.</li><li>Client notes land on the desk and lock tiles. Merge right next to one to clear it.</li></ul>`,
          actions: [{ label: 'Start', primary: true }],
        });
      }
    },
    hide() { save(); },
    pause() { save(); },
    resume() { render(); },
    status() { return S.stats.launches ? `Level ${S.level}` : 'New'; },
    // each solved Feedback puzzle pays $40 here
    reward() {
      S.coins += 40;
      save();
    },
  };
}

// for tests
window.__mip = { get S() { return S; }, GEN, spawn, drop, deliver, readyCells, go };
