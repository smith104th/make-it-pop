// Final Final: 2048, but every tile is a file name. Merge your way from draft.pdf to Approved.
import { gameHead, load, store, sfx, buzz, sheet, shareText, SITE } from './shared.js';

const KEY = 'ag:final';
// value → [name, background, text]
const FILES = {
  2: ['draft', '#ffffff', '#111'],
  4: ['v2', '#f3f3f5', '#111'],
  8: ['v3', '#e6e6e6', '#111'],
  16: ['v3_final', '#a5c8d1', '#111'],
  32: ['FINAL', '#fcd5bd', '#111'],
  64: ['FINAL_v2', '#e2d286', '#111'],
  128: ['FINAL_FINAL', '#b09f36', '#fff'],
  256: ['FINAL_FINAL_v2', '#6f97a6', '#fff'],
  512: ['USE_THIS', '#e39a76', '#fff'],
  1024: ['USE_THIS_ONE', '#111111', '#fff'],
  2048: ['Approved', '#2354b5', '#fff'],
  4096: ['rebrand', '#2354b5', '#fff'],
  8192: ['rebrand_FINAL', '#111111', '#fcd5bd'],
};
const file = (v) => FILES[v] || ['ok, new agency', '#111111', '#e2d286'];

export function Final(root) {
  root.classList.add('ff');
  let st = load(KEY, null);
  let tiles = [], score = 0, best = 0, won = false, over = false, nextId = 1;
  let pending = null; // second half of a move's animation
  let bestTile = 2;

  root.innerHTML = `${gameHead('Final Final', '<button class="pill sm ffnew" type="button">New</button>')}
    <div class="ffbody">
      <div class="ffscore"><div><small>Score</small><b class="ffs">0</b></div><div><small>Best</small><b class="ffb">0</b></div><div class="ffbest"><small>Best file</small><b class="ffbt">draft</b></div></div>
      <div class="ffboard" data-nopager><div class="ffgrid">${'<i></i>'.repeat(16)}</div><div class="fftiles"></div><div class="ffover" hidden></div></div>
      <p class="ffmsg">Swipe to merge matching files. Get it to Approved.</p>
    </div>`;
  const tilesEl = root.querySelector('.fftiles');
  const board = root.querySelector('.ffboard');
  const overEl = root.querySelector('.ffover');
  const msg = root.querySelector('.ffmsg');

  const persist = () => store(KEY, { tiles: tiles.map(({ v, r, c }) => ({ v, r, c })), score, best, won, over, bestTile });
  const empties = () => {
    const taken = new Set(tiles.map((t) => t.r * 4 + t.c));
    const out = [];
    for (let i = 0; i < 16; i++) if (!taken.has(i)) out.push(i);
    return out;
  };
  function add() {
    const e = empties();
    if (!e.length) return null;
    const i = e[Math.floor(Math.random() * e.length)];
    const t = { id: nextId++, v: Math.random() < 0.9 ? 2 : 4, r: Math.floor(i / 4), c: i % 4, isNew: true };
    tiles.push(t);
    return t;
  }
  function newGame() {
    tiles = []; score = 0; won = false; over = false; nextId = 1; bestTile = 2;
    add(); add();
    overEl.hidden = true;
    msg.textContent = 'Swipe to merge matching files. Get it to Approved.';
    draw(true);
    persist();
  }

  const label = (v) => {
    const [name] = file(v);
    const len = name.length;
    const size = len <= 5 ? 1 : len <= 8 ? 0.82 : len <= 11 ? 0.66 : 0.56;
    return `<div class="ffi"><span class="ffn" style="--s:${size}">${name.replace(/_/g, '_<wbr>')}</span><small>${v === 2048 ? '✓' : '.pdf'}</small><i>${v}</i></div>`;
  };
  function tileEl(t) {
    let el = tilesEl.querySelector(`[data-id="${t.id}"]`);
    if (!el) {
      el = document.createElement('div');
      el.className = 'fft';
      el.dataset.id = t.id;
      tilesEl.append(el);
    }
    return el;
  }
  function paint(el, v) {
    const [, bg, fg] = file(v);
    el.style.setProperty('--bg', bg);
    el.style.setProperty('--fg', fg);
    el.dataset.v = v;
    el.innerHTML = label(v);
  }
  function place(el, t) { el.style.setProperty('--r', t.r); el.style.setProperty('--c', t.c); }
  function draw(full) {
    if (full) tilesEl.innerHTML = '';
    const hold = pending ? pending.merged : [];
    for (const t of tiles) {
      const el = tileEl(t);
      place(el, t);
      if (el.dataset.v !== String(t.v) && !hold.includes(t)) paint(el, t.v);
      if (t.isNew) { el.classList.remove('pop'); el.classList.add('new'); t.isNew = false; }
    }
    root.querySelector('.ffs').textContent = score.toLocaleString('en-US');
    root.querySelector('.ffb').textContent = Math.max(best, score).toLocaleString('en-US');
    root.querySelector('.ffbt').textContent = file(bestTile)[0];
  }

  function canMove() {
    if (empties().length) return true;
    const g = {};
    tiles.forEach((t) => { g[t.r * 4 + t.c] = t.v; });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const v = g[r * 4 + c];
      if ((c < 3 && g[r * 4 + c + 1] === v) || (r < 3 && g[(r + 1) * 4 + c] === v)) return true;
    }
    return false;
  }

  function finish() {
    if (!pending) return;
    clearTimeout(pending.timer);
    const { dying, merged } = pending;
    pending = null;
    for (const t of dying) tilesEl.querySelector(`[data-id="${t.id}"]`)?.remove();
    for (const t of merged) {
      const el = tileEl(t);
      paint(el, t.v);
      el.classList.remove('pop', 'new');
      void el.offsetWidth;
      el.classList.add('pop');
    }
    draw();
  }

  function move(dir) {
    if (over) return;
    finish();
    const [dr, dc] = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[dir];
    const grid = Array.from({ length: 4 }, () => Array(4).fill(null));
    tiles.forEach((t) => { grid[t.r][t.c] = t; });
    const seq = [0, 1, 2, 3];
    const rows = dr === 1 ? [...seq].reverse() : seq;
    const cols = dc === 1 ? [...seq].reverse() : seq;
    let moved = false, gained = 0;
    const dying = [], merged = [];
    for (const r of rows) for (const c of cols) {
      const t = grid[r][c];
      if (!t) continue;
      let nr = r, nc = c, into = null;
      for (;;) {
        const rr = nr + dr, cc = nc + dc;
        if (rr < 0 || rr > 3 || cc < 0 || cc > 3) break;
        const o = grid[rr][cc];
        if (!o) { nr = rr; nc = cc; continue; }
        if (o.v === t.v && !merged.includes(o)) into = o;
        break;
      }
      if (into) {
        grid[r][c] = null;
        t.r = into.r; t.c = into.c;
        dying.push(t);
        into.v *= 2;
        merged.push(into);
        gained += into.v;
        moved = true;
      } else if (nr !== r || nc !== c) {
        grid[r][c] = null;
        grid[nr][nc] = t;
        t.r = nr; t.c = nc;
        moved = true;
      }
    }
    if (!moved) return;

    // slide everything first, with merged tiles still showing their old file
    for (const t of tiles) place(tileEl(t), t);
    tiles = tiles.filter((t) => !dying.includes(t));
    score += gained;
    best = Math.max(best, score);
    const top = Math.max(...tiles.map((t) => t.v));
    const newTop = top > bestTile;
    bestTile = Math.max(bestTile, top);
    add();
    pending = { dying, merged, timer: setTimeout(finish, 110) };
    if (merged.length) {
      const hi = Math.max(...merged.map((t) => t.v));
      sfx(300 + Math.log2(hi) * 45, 0.12);
      buzz(merged.length > 1 ? 14 : 8);
      if (newTop && top >= 32) msg.textContent = `New best file: ${file(top)[0]}.pdf`;
    } else sfx(520, 0.03);
    if (!won && top >= 2048) {
      won = true;
      setTimeout(() => showOver('Approved.', `You got the file to Approved. Score ${score.toLocaleString('en-US')}.`, true), 350);
    } else if (!canMove()) {
      over = true;
      setTimeout(() => showOver('No moves left.', `Best file: ${file(bestTile)[0]}.pdf. Score ${score.toLocaleString('en-US')}.`, false), 350);
    }
    persist();
  }

  function showOver(title, text, win) {
    overEl.innerHTML = `<b>${title}</b><p>${text}</p><div class="ffover-btns">${win ? '<button class="pill go" data-a="keep">Keep going</button>' : '<button class="pill go" data-a="again">Again</button>'}<button class="pill" data-a="share">Share</button></div>`;
    overEl.hidden = false;
    sfx(win ? 880 : 220, 0.3);
  }
  overEl.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'keep') overEl.hidden = true;
    if (a === 'again') newGame();
    if (a === 'share') shareText(`Final Final: ${file(bestTile)[0]}.pdf, ${score.toLocaleString('en-US')} points.`, `${SITE}#final`);
  });
  root.querySelector('.ffnew').addEventListener('click', () => {
    if (over || !tiles.length || score === 0) { newGame(); return; }
    sheet({ title: 'New game?', body: '<p>Score and best file reset.</p>', actions: [{ label: 'Start over', primary: true, fn: newGame }, { label: 'Keep playing' }] });
  });

  // swipe anywhere on the board; arrow keys and WASD on a keyboard
  let sw = null;
  board.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.ffover')) return;
    e.preventDefault();
    sw = { x: e.clientX, y: e.clientY, id: e.pointerId };
    try { board.setPointerCapture(e.pointerId); } catch { /* */ }
  });
  const swEnd = (e) => {
    if (!sw || e.pointerId !== sw.id) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    sw = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
  };
  board.addEventListener('pointerup', swEnd);
  board.addEventListener('pointercancel', () => { sw = null; });
  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
  let active = false;
  window.addEventListener('keydown', (e) => {
    if (!active || !KEYS[e.key]) return;
    e.preventDefault();
    move(KEYS[e.key]);
  });

  if (st && Array.isArray(st.tiles) && st.tiles.length) {
    tiles = st.tiles.map((t) => ({ ...t, id: nextId++ }));
    score = st.score || 0; best = st.best || 0; won = !!st.won; over = !!st.over; bestTile = st.bestTile || 2;
    draw(true);
    if (over) showOver('No moves left.', `Best file: ${file(bestTile)[0]}.pdf. Score ${score.toLocaleString('en-US')}.`, false);
  } else {
    best = st?.best || 0;
    newGame();
  }

  return {
    show() { active = true; },
    hide() { active = false; finish(); persist(); },
    status() { return best ? `Best ${best.toLocaleString('en-US')}` : 'New'; },
    move, // tests
    get state() { return { tiles: tiles.map(({ v, r, c }) => ({ v, r, c })), score, over, won }; },
  };
}
