// Swatch: the client remembers a color from the meeting. You see it for 3 seconds, then make it again.
// Five rounds, scored out of 10 each with CIEDE2000. The daily set is the same for everyone.
import { gameHead, load, store, sfx, buzz, rnd, shareText, SITE } from './shared.js';
import { markPaths } from './art.js';

const KEY = 'ag:swatch';
const ROUNDS = 5;
const SHOW_MS = 3000;
const QUOTES = [
  'that blue from the meeting', 'the color from the moodboard', 'like the one on their old cups',
  'what the CEO is wearing in the photo', 'the color from the trip', 'the one from the competitor, but ours',
  'the color of the wine at the launch', 'what their wife picked', 'from the screenshot they sent',
  'like the sofa in the office', 'the color they saw in Milan', 'the one they described on the call',
];

// ---------- color math ----------
export function hsv2rgb(h, s, v) {
  s /= 100; v /= 100;
  const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [f(5), f(3), f(1)].map((x) => Math.round(x * 255));
}
const css = ([h, s, v]) => `rgb(${hsv2rgb(h, s, v).join(',')})`;
function rgb2lab([r, g, b]) {
  const lin = (c) => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
// CIEDE2000 (Sharma, Wu, Dalal 2005)
export function de2000([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180, deg = 180 / Math.PI;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const hp = (b, a) => { if (b === 0 && a === 0) return 0; const h = Math.atan2(b, a) * deg; return h >= 0 ? h : h + 360; };
  const h1p = hp(b1, a1p), h2p = hp(b2, a2p);
  const dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p !== 0) { if (Math.abs(h1p - h2p) > 180) hbp += h1p + h2p < 360 ? 360 : -360; hbp /= 2; }
  const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}
export const scoreOf = (t, p) => Math.round(10 * Math.exp(-de2000(rgb2lab(hsv2rgb(...t)), rgb2lab(hsv2rgb(...p))) / 22) * 10) / 10;

// a small seeded random, so everyone gets the same five colors on the same day
function mulberry(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
function roundsFor(r) {
  const out = [];
  for (let i = 0; i < ROUNDS; i++) out.push({ t: [Math.round(r() * 360), Math.round(25 + r() * 70), Math.round(35 + r() * 60)], q: QUOTES[Math.floor(r() * QUOTES.length)] });
  return out;
}
const comment = (sc) => (sc >= 9 ? 'Basically Pantone. Ahre.' : sc >= 7.5 ? "The client won't notice." : sc >= 5.5 ? 'Close-ish. ¿Ubicás?' : sc >= 3 ? "That's a different brand." : 'Ahre. No.');
const splitMark = (a, b, size = 40) => `<svg viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true">${markPaths(20, 20, 19, a, b)}</svg>`;

export function Swatch(root) {
  root.classList.add('sw');
  const data = load(KEY, { best: 0, daily: null });
  let mode = 'daily', rounds = [], i = 0, pick = [0, 50, 70], results = [], timer = 0;

  root.innerHTML = `${gameHead('Swatch', '<span class="gpill sw-r"></span>')}<div class="swbody"></div>`;
  const bodyEl = root.querySelector('.swbody');
  const rEl = root.querySelector('.sw-r');
  const total = () => Math.round(results.reduce((a, r) => a + r.sc, 0) * 10) / 10;
  const dailyDone = () => data.daily && data.daily.date === today();

  function intro() {
    clearTimeout(timer);
    rEl.textContent = '';
    const done = dailyDone();
    bodyEl.innerHTML = `<div class="sw-intro">
      <div class="sw-marks">${splitMark('#2354b5', '#a5c8d1', 64)}${splitMark('#fcd5bd', '#e2d286', 64)}${splitMark('#111', '#b09f36', 64)}</div>
      <h2>Swatch</h2>
      <p>The client remembers a color from the meeting. You get three seconds to look. Then make it again.</p>
      ${done
        ? `<div class="sw-today"><small>TODAY</small><b>${data.daily.score}<span>/50</span></b><div class="sw-row">${data.daily.rounds.map((r) => splitMark(css(r.t), css(r.p), 34)).join('')}</div></div>
           <div class="sw-btns"><button class="pill go" data-a="practice">Practice round</button><button class="pill" data-a="share">Share today</button></div>`
        : `<p class="sw-sub">Five colors. Same five for everyone today.</p><div class="sw-btns"><button class="pill go" data-a="daily">Play today's swatches</button></div>`}
      ${data.best ? `<p class="sw-best">Best ever ${data.best}/50</p>` : ''}
    </div>`;
  }
  function begin(m) {
    mode = m;
    const seed = [...today()].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 7);
    rounds = roundsFor(m === 'daily' ? mulberry(seed) : Math.random);
    results = [];
    i = 0;
    show();
  }
  function show() {
    const r = rounds[i];
    rEl.textContent = `${i + 1}/${ROUNDS}`;
    bodyEl.innerHTML = `<div class="sw-look">
      <p class="sw-q"><small>CLIENT</small>"${r.q}"</p>
      <div class="sw-big" style="background:${css(r.t)}"></div>
      <div class="sw-timer"><i></i></div>
    </div>`;
    requestAnimationFrame(() => bodyEl.querySelector('.sw-timer i')?.classList.add('go'));
    sfx(520, 0.08);
    clearTimeout(timer);
    timer = setTimeout(choose, SHOW_MS);
  }
  function choose() {
    pick = [Math.floor(Math.random() * 360), 50, 70];
    bodyEl.innerHTML = `<div class="sw-pick">
      <p class="sw-q"><small>CLIENT</small>"${rounds[i].q}"</p>
      <div class="sw-big sw-mine"></div>
      <label class="sw-sl"><small>Hue</small><input type="range" min="0" max="359" data-k="0"></label>
      <label class="sw-sl"><small>Saturation</small><input type="range" min="0" max="100" data-k="1"></label>
      <label class="sw-sl"><small>Brightness</small><input type="range" min="0" max="100" data-k="2"></label>
      <button class="pill go sw-send" data-a="send">Send to client</button>
    </div>`;
    bodyEl.querySelectorAll('input').forEach((inp) => { inp.value = pick[+inp.dataset.k]; });
    paintPick();
  }
  function paintPick() {
    const [h, s, v] = pick;
    const box = bodyEl.querySelector('.sw-mine');
    if (box) box.style.background = css(pick);
    const ins = bodyEl.querySelectorAll('input');
    if (ins.length < 3) return;
    ins[0].style.background = `linear-gradient(90deg, ${[0, 60, 120, 180, 240, 300, 359].map((x) => css([x, 100, 100])).join(',')})`;
    ins[1].style.background = `linear-gradient(90deg, ${css([h, 0, v])}, ${css([h, 100, v])})`;
    ins[2].style.background = `linear-gradient(90deg, #000, ${css([h, s, 100])})`;
  }
  bodyEl.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (k === undefined) return;
    pick[+k] = +e.target.value;
    paintPick();
  });
  function send() {
    const r = rounds[i];
    const sc = scoreOf(r.t, pick);
    results.push({ t: r.t, p: [...pick], sc });
    sfx(300 + sc * 60, 0.2);
    buzz(sc >= 8 ? 25 : 10);
    bodyEl.innerHTML = `<div class="sw-res">
      <div class="sw-split"><div style="background:${css(r.t)}"><small>Theirs</small></div><div style="background:${css(pick)}"><small>Yours</small></div></div>
      <b class="sw-score">${sc.toFixed(1)}</b>
      <p class="sw-com">Daphi: ${comment(sc)}</p>
      <button class="pill go" data-a="next">${i + 1 < ROUNDS ? 'Next color' : 'See the total'}</button>
    </div>`;
  }
  function end() {
    rEl.textContent = '';
    const t = total();
    const newBest = t > (data.best || 0);
    data.best = Math.max(data.best || 0, t);
    if (mode === 'daily') data.daily = { date: today(), score: t, rounds: results };
    store(KEY, data);
    sfx(newBest ? 880 : 600, 0.3);
    bodyEl.innerHTML = `<div class="sw-end">
      <small>${mode === 'daily' ? 'TODAY' : 'PRACTICE'}</small>
      <b>${t}<span>/50</span></b>
      <div class="sw-row">${results.map((r) => `<div>${splitMark(css(r.t), css(r.p), 46)}<i>${r.sc.toFixed(1)}</i></div>`).join('')}</div>
      <p>${newBest ? 'New best. ' : ''}Daphi: ${comment(t / 5)}</p>
      <div class="sw-btns">${mode === 'daily' ? '<button class="pill go" data-a="share">Share</button>' : ''}<button class="pill${mode === 'daily' ? '' : ' go'}" data-a="practice">Practice round</button><button class="pill" data-a="home">Done</button></div>
    </div>`;
  }
  bodyEl.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'daily') begin('daily');
    if (a === 'practice') begin('practice');
    if (a === 'send') send();
    if (a === 'next') { i++; if (i < ROUNDS) show(); else end(); }
    if (a === 'home') intro();
    if (a === 'share' && data.daily) shareText(`Swatch ${data.daily.date}: ${data.daily.score}/50. Can you remember a color for three seconds? A game by Ademan Studio.`, `${SITE}#swatch`);
  });

  intro();
  return {
    show() { if (!rounds.length || !bodyEl.querySelector('.sw-look, .sw-pick, .sw-res')) intro(); },
    hide() { clearTimeout(timer); rounds = []; },
    status() { return dailyDone() ? `Today ${data.daily.score}` : 'Daily'; },
    get state() { return { i, results: results.length, rounds }; },
  };
}
