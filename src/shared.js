// Bits every game uses: storage, sound, haptics, the bottom sheet, toasts, the game header.
export const $ = (q, r = document) => r.querySelector(q);
export const rnd = (a) => a[Math.floor(Math.random() * a.length)];
export const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

export function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
}
export function store(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

const SKEY = 'ademan-games:settings';
export const settings = { sound: true, ...load(SKEY, {}) };
export const saveSettings = () => store(SKEY, settings);

let ac;
export function sfx(freq = 440, dur = 0.14, type = 'sine') {
  if (!settings.sound) return;
  try {
    ac ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    o.frequency.exponentialRampToValueAtTime(freq * 0.45, t0 + dur);
    g.gain.setValueAtTime(0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(ac.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch { /* no audio */ }
}
export const buzz = (ms = 8) => { try { navigator.vibrate?.(ms); } catch { /* */ } };

export function toast(text) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  document.body.append(t);
  setTimeout(() => t.remove(), 2200);
}

export function sheet({ title, body, actions = [] }) {
  const el = $('#sheet');
  el.innerHTML = `<div class="sheet-card"><h2>${title}</h2><div class="sheet-body">${body}</div><div class="sheet-actions">${actions.map((a, i) => `<button class="pill${a.primary ? ' go' : ''}" data-a="${i}">${a.label}</button>`).join('')}</div></div>`;
  el.hidden = false;
  el.onclick = (e) => {
    const b = e.target.closest('[data-a]');
    if (!b && e.target !== el) return;
    el.hidden = true;
    if (b) actions[+b.dataset.a].fn?.();
  };
}

const chevron = '<svg viewBox="0 0 12 20" aria-hidden="true"><path d="M10 2L2 10l8 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// The bar at the top of every game: Back to the menu, the game's name, and room on the right.
export const gameHead = (title, right = '') =>
  `<header class="ghead"><button class="back" type="button" aria-label="Back to games">${chevron}<span>Games</span></button><b class="gtitle">${title}</b><div class="gright">${right}</div></header>`;

export async function shareText(text, url) {
  try {
    if (navigator.share) await navigator.share({ title: 'Ademan Games', text, url });
    else { await navigator.clipboard.writeText(`${text} ${url}`); toast('Copied. Paste it anywhere.'); }
  } catch { /* cancelled */ }
}
export const SITE = 'https://smith104th.github.io/make-it-pop/';
