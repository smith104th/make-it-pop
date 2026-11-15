// Scope Creep: snake, but every client request you eat makes the project longer.
// The walls are the deadline. Invoices trim the scope back.
import { gameHead, load, store, sfx, buzz, rnd, shareText, SITE, esc } from './shared.js';
import { C } from './art.js';

const KEY = 'ag:scope';
const COLS = 15, ROWS = 19;
const V = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
const REQUESTS = [
  'can we add a TikTok', 'one more logo option', 'can it be animated', 'Portuguese version too', 'a quick deck',
  'merch?', 'a podcast intro', 'the website too', 'a mascot', 'can we see it in 3D', 'a jingle',
  'packaging for the packaging', 'a sub-brand', 'a sub-sub-brand', 'Instagram filters', 'a custom font',
  "the CEO's LinkedIn banner", 'a launch video', 'rioplatense version', 'just a small favor', 'the menu, while you are there',
  'business cards for the dog', 'a newsletter template', 'a pop-up store', 'uniforms?', 'a scent', 'tote bags',
  'a QR code, but nice', 'an AI version', 'the Christmas card', 'one more round', 'Spanish, Portuguese and French',
];
const MILESTONES = {
  10: 'Daphi: this was supposed to be a logo. Ahre.',
  20: "Daphi: we're full-service now, ¿ubicás?",
  30: "Daphi: I'm invoicing.",
  45: 'Daphi: this is a retainer now. Ahre.',
};

export function Scope(root) {
  root.classList.add('sc');
  const saved = load(KEY, { best: 0 });
  let best = saved.best || 0;
  let snake, dir, queue, food, invoice, eaten, speed, timer = 0, state = 'ready', absorbed, cause = '';

  root.innerHTML = `${gameHead('Scope Creep', '<span class="gpill sc-n">0</span>')}
    <div class="scbody" data-nopager>
      <div class="sc-ticker"><small>SCOPE</small><p>Eat every request. Don't hit the deadline.</p></div>
      <div class="sc-wrap"><canvas aria-label="Scope Creep board"></canvas><div class="sc-over"></div></div>
      <p class="sc-foot">Swipe to steer · Best <b class="sc-best">${best}</b></p>
    </div>`;
  const body = root.querySelector('.scbody');
  const wrap = root.querySelector('.sc-wrap');
  const cv = root.querySelector('canvas');
  const g = cv.getContext('2d');
  const over = root.querySelector('.sc-over');
  const ticker = root.querySelector('.sc-ticker p');
  const nEl = root.querySelector('.sc-n');
  let cell = 18;

  function fit() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    cell = Math.max(12, Math.floor(Math.min(w / COLS, h / ROWS)));
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    cv.style.width = `${cell * COLS}px`;
    cv.style.height = `${cell * ROWS}px`;
    cv.width = cell * COLS * dpr;
    cv.height = cell * ROWS * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function free() {
    for (let k = 0; k < 500; k++) {
      const p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
      if (snake.some((s) => s.x === p.x && s.y === p.y)) continue;
      if (food && food.x === p.x && food.y === p.y) continue;
      if (invoice && invoice.x === p.x && invoice.y === p.y) continue;
      return p;
    }
    return null;
  }
  function reset() {
    const y = Math.floor(ROWS / 2);
    snake = [{ x: 6, y }, { x: 5, y }, { x: 4, y }, { x: 3, y }];
    dir = 'right'; queue = []; eaten = 0; speed = 150; absorbed = []; invoice = null; food = null;
    food = { ...free(), t: rnd(REQUESTS) };
    nEl.textContent = '0';
  }

  const rr = (x, y, w, h, r) => {
    g.beginPath();
    if (g.roundRect) g.roundRect(x, y, w, h, r);
    else { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  };
  const mix = (a, b, t) => {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [x, y] = [p(a), p(b)];
    return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
  };
  function draw() {
    const W = cell * COLS, H = cell * ROWS;
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#f3f3f5';
    rr(0, 0, W, H, 14); g.fill();
    g.fillStyle = '#e2e2e6';
    for (let x = 1; x < COLS; x++) for (let y = 1; y < ROWS; y++) { g.beginPath(); g.arc(x * cell, y * cell, 1, 0, Math.PI * 2); g.fill(); }
    if (!snake) return;
    if (food) {
      const x = food.x * cell, y = food.y * cell;
      g.save();
      g.translate(x + cell / 2, y + cell / 2);
      g.rotate(-0.14);
      g.shadowColor = 'rgba(0,0,0,.18)'; g.shadowBlur = 4; g.shadowOffsetY = 2;
      g.fillStyle = C.greenL;
      g.fillRect(-cell * 0.4, -cell * 0.4, cell * 0.8, cell * 0.8);
      g.shadowColor = 'transparent';
      g.fillStyle = 'rgba(59,53,16,.45)';
      g.fillRect(-cell * 0.26, -cell * 0.16, cell * 0.5, 1.2);
      g.fillRect(-cell * 0.26, cell * 0.02, cell * 0.36, 1.2);
      g.restore();
    }
    if (invoice) {
      const x = invoice.x * cell + cell / 2, y = invoice.y * cell + cell / 2;
      const left = Math.max(0, invoice.until - performance.now());
      g.fillStyle = C.green;
      g.globalAlpha = left < 2000 ? 0.4 + 0.6 * Math.abs(Math.sin(left / 120)) : 1;
      g.beginPath(); g.arc(x, y, cell * 0.44, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff';
      g.font = `600 ${Math.round(cell * 0.6)}px Switzer, system-ui, sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('$', x, y + 1);
      g.globalAlpha = 1;
    }
    const n = snake.length;
    for (let i = n - 1; i >= 0; i--) {
      const s = snake[i];
      g.fillStyle = i === 0 ? C.blue : mix(C.blue, C.lblue, Math.min(1, i / Math.max(6, n - 1)));
      const pad = i === 0 ? 1 : 2;
      rr(s.x * cell + pad, s.y * cell + pad, cell - pad * 2, cell - pad * 2, Math.max(3, cell * 0.28));
      g.fill();
    }
    // eyes on the head, looking where it's going
    const h = snake[0], [dx, dy] = V[dir];
    const cx = h.x * cell + cell / 2, cy = h.y * cell + cell / 2;
    const ox = -dy * cell * 0.2, oy = dx * cell * 0.2, fx = dx * cell * 0.14, fy = dy * cell * 0.14;
    g.fillStyle = '#fff';
    for (const k of [1, -1]) { g.beginPath(); g.arc(cx + ox * k + fx, cy + oy * k + fy, Math.max(1.6, cell * 0.11), 0, Math.PI * 2); g.fill(); }
  }

  function say(text) {
    ticker.textContent = text;
    ticker.classList.remove('in');
    void ticker.offsetWidth;
    ticker.classList.add('in');
  }

  function step() {
    if (queue.length) dir = queue.shift();
    const [dx, dy] = V[dir];
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS) return die('wall');
    const eat = food && head.x === food.x && head.y === food.y;
    const body = eat ? snake : snake.slice(0, -1);
    if (body.some((s) => s.x === head.x && s.y === head.y)) return die('self');
    snake.unshift(head);
    if (eat) {
      eaten++;
      absorbed.push(food.t);
      nEl.textContent = eaten;
      say(MILESTONES[eaten] || `+ "${food.t}"`);
      speed = Math.max(72, speed - 3);
      sfx(420 + Math.min(eaten, 30) * 12, 0.08);
      buzz(8);
      food = null;
      food = { ...free(), t: rnd(REQUESTS) };
      if (eaten % 5 === 0 && !invoice) { const p = free(); if (p) invoice = { ...p, until: performance.now() + 8000 }; }
    } else snake.pop();
    if (invoice && head.x === invoice.x && head.y === invoice.y) {
      const cut = Math.min(3, snake.length - 3);
      if (cut > 0) snake.length -= cut;
      invoice = null;
      say('Invoice paid. Scope trimmed. Ahre.');
      sfx(880, 0.2);
      buzz(15);
    }
    if (invoice && performance.now() > invoice.until) invoice = null;
    draw();
  }
  function loop() {
    if (state !== 'play') return;
    step();
    if (state === 'play') timer = setTimeout(loop, speed);
  }
  function start() {
    reset();
    state = 'play';
    over.hidden = true;
    say("Eat every request. Don't hit the deadline.");
    draw();
    clearTimeout(timer);
    timer = setTimeout(loop, speed);
  }
  function die(why) {
    state = 'over';
    clearTimeout(timer);
    cause = why;
    const isBest = eaten > best;
    best = Math.max(best, eaten);
    store(KEY, { best });
    root.querySelector('.sc-best').textContent = best;
    sfx(150, 0.4, 'triangle');
    buzz(40);
    draw();
    const last = absorbed.slice(-3).reverse();
    over.innerHTML = `<b>${why === 'wall' ? 'Missed the deadline.' : 'Scope collapsed on itself.'}</b>
      <p>${eaten} request${eaten === 1 ? '' : 's'} absorbed${isBest && eaten ? '. New best.' : `. Best ${best}.`}</p>
      ${last.length ? `<ul>${last.map((t) => `<li>"${esc(t)}"</li>`).join('')}</ul>` : ''}
      <div class="sc-btns"><button class="pill go" data-a="go">Again</button>${eaten ? '<button class="pill" data-a="share">Share</button>' : ''}</div>`;
    over.hidden = false;
  }
  function ready(paused) {
    over.innerHTML = paused
      ? '<b>Paused.</b><p>The client is still typing.</p><div class="sc-btns"><button class="pill go" data-a="resume">Keep going</button></div>'
      : `<b>Scope Creep</b><p>Eat every client request. Each one makes the project longer. Don't hit the deadline. Don't hit yourself. Invoices trim the scope.</p><div class="sc-btns"><button class="pill go" data-a="go">Start</button></div>`;
    over.hidden = false;
  }
  over.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'go') start();
    if (a === 'resume') { state = 'play'; over.hidden = true; timer = setTimeout(loop, 300); }
    if (a === 'share') shareText(`My project grew to ${eaten} client requests before ${cause === 'wall' ? 'the deadline hit' : 'it collapsed'}. Scope Creep, a game by Ademan Studio.`, `${SITE}#scope`);
  });

  function turn(d) {
    if (state !== 'play') return;
    const last = queue.length ? queue[queue.length - 1] : dir;
    if (d === last || d === OPP[last] || queue.length >= 2) return;
    queue.push(d);
  }
  let sw = null;
  body.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.sc-over')) return;
    e.preventDefault();
    sw = { x: e.clientX, y: e.clientY, id: e.pointerId };
    try { body.setPointerCapture(e.pointerId); } catch { /* */ }
  });
  body.addEventListener('pointermove', (e) => {
    if (!sw || e.pointerId !== sw.id) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    sw.x = e.clientX; sw.y = e.clientY;
  });
  const swEnd = () => { sw = null; };
  body.addEventListener('pointerup', swEnd);
  body.addEventListener('pointercancel', swEnd);
  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
  let active = false;
  window.addEventListener('keydown', (e) => {
    if (!active || !KEYS[e.key]) return;
    e.preventDefault();
    turn(KEYS[e.key]);
  });
  if (window.ResizeObserver) new ResizeObserver(fit).observe(wrap);
  ready(false);

  return {
    show() { active = true; fit(); if (state === 'paused') ready(true); },
    hide() { active = false; if (state === 'play') { state = 'paused'; clearTimeout(timer); } },
    pause() { if (state === 'play') { state = 'paused'; clearTimeout(timer); } },
    resume() { if (state === 'paused') ready(true); },
    status() { return best ? `Best ${best}` : 'New'; },
    get state() { return { state, eaten, len: snake?.length || 0, dir }; },
    turn, // tests
  };
}
