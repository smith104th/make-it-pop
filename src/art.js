// Every tile is drawn here as a small SVG in Ademan colors. No emoji, no clip art.
export const C = {
  blue: '#2354B5',
  lblue: '#A5C8D1',
  pink: '#FCD5BD',
  green: '#B09F36',
  greenL: '#E2D286',
  grey: '#EBEBEB',
  ink: '#111111',
  tgrey: '#757575',
  kraft: '#C9A47E',
};

const SANS = "Switzer, 'Inter Tight', system-ui, sans-serif";
const MONO = "'Chivo Mono', ui-monospace, monospace";

// The chains. Tile background comes from `bg`, the drawing sits on top.
export const CHAINS = {
  type: { name: 'Type', bg: C.blue, unlock: 1, items: ['Letter', 'Pair', 'Wordmark', 'Mark', 'Lockup', 'Identity system', 'Brand book'] },
  files: { name: 'Files', bg: '#ffffff', unlock: 1, items: ['draft.pdf', 'v2.pdf', 'v3_final.pdf', 'FINAL.pdf', 'FINAL_FINAL.pdf', 'FINAL_FINAL_USE_THIS.pdf', 'Approved'] },
  photo: { name: 'Photo', bg: C.lblue, unlock: 2, items: ['Polaroid', 'Contact sheet', 'Retouched', 'Campaign', 'Billboard'] },
  pack: { name: 'Packaging', bg: C.pink, unlock: 3, items: ['Cardboard', 'Box', 'Foil-stamped box', 'Jar', 'Perfume bottle', 'Gift set'] },
};
export const maxLevel = (c) => CHAINS[c].items.length;
export const itemName = (c, l) => CHAINS[c].items[l - 1];

const svg = (inner, vb = '0 0 48 48') => `<svg viewBox="${vb}" aria-hidden="true">${inner}</svg>`;
const t = (x, y, s, str, { fill = C.ink, font = SANS, w = 500, anchor = 'middle', ls = 0 } = {}) =>
  `<text x="${x}" y="${y}" font-size="${s}" font-family="${font}" font-weight="${w}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${ls}">${str}</text>`;
// The Ademan mark: a circle in two halves. Merging two halves is the whole game, if you think about it.
export const markPaths = (cx, cy, r, top = '#fff', bot = C.lblue) =>
  `<path d="M${cx - r} ${cy}a${r} ${r} 0 0 1 ${2 * r} 0z" fill="${top}"/><path d="M${cx - r} ${cy}a${r} ${r} 0 0 0 ${2 * r} 0z" fill="${bot}"/>`;
const doc = (dx = 0, dy = 0) =>
  `<g transform="translate(${dx} ${dy})"><path d="M13 7h15l8 8v26H13z" fill="#fff" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/><path d="M28 7v8h8" fill="none" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/></g>`;
const polaroid = (img) =>
  `<g transform="rotate(-6 24 24)"><rect x="12" y="8" width="24" height="30" rx="1.5" fill="#fff"/><rect x="15" y="11" width="18" height="18" fill="${C.ink}"/>${img}</g>`;
const cube = (top, left, right) =>
  `<path d="M24 9l13 7-13 7-13-7z" fill="${top}"/><path d="M11 16l13 7v16l-13-7z" fill="${left}"/><path d="M37 16l-13 7v16l13-7z" fill="${right}"/>`;
const sparkle = (x, y, s, f = '#fff') =>
  `<path d="M${x} ${y - s}l${s * 0.28} ${s * 0.72} ${s * 0.72} ${s * 0.28}-${s * 0.72} ${s * 0.28}-${s * 0.28} ${s * 0.72}-${s * 0.28}-${s * 0.72}-${s * 0.72}-${s * 0.28} ${s * 0.72}-${s * 0.28}z" fill="${f}"/>`;

const ART = {
  type: [
    () => t(24, 33, 28, 'a', { fill: '#fff' }),
    () => t(24, 32, 23, 'ab', { fill: '#fff', ls: -1 }),
    () => t(24, 28, 15, 'abc', { fill: '#fff', ls: -0.5 }) + `<rect x="13" y="32" width="22" height="1.6" fill="#fff"/>`,
    () => markPaths(24, 24, 13),
    () => markPaths(13.5, 24, 6.5) + t(22, 28, 11.5, 'abc', { fill: '#fff', anchor: 'start', ls: -0.3 }),
    () =>
      [[11, 11, '#fff'], [25, 11, C.pink], [11, 25, C.lblue], [25, 25, C.greenL]]
        .map(([x, y, f]) => `<rect x="${x}" y="${y}" width="12" height="12" rx="2" fill="${f}"/>`)
        .join('') + markPaths(17, 17, 4, C.blue, C.lblue),
    () =>
      `<rect x="13" y="8" width="23" height="32" rx="2" fill="#fff"/><rect x="13" y="8" width="3.5" height="32" rx="1" fill="${C.lblue}"/>` +
      markPaths(26.5, 20, 5.5, C.blue, C.lblue) +
      `<rect x="21" y="30" width="11" height="1.5" fill="${C.blue}"/><rect x="21" y="33.5" width="7" height="1.5" fill="${C.blue}"/>`,
  ],
  files: [
    () => doc() + `<path d="M17 22h14M17 26.5h10M17 31h12" stroke="${C.ink}" stroke-width="1.4" stroke-linecap="round"/>`,
    () => doc() + t(24.5, 30, 10, 'v2', { font: MONO, w: 400 }),
    () => doc() + t(24.5, 26, 8.5, 'v3', { font: MONO, w: 400 }) + t(24.5, 34, 6, '_final', { font: MONO, w: 400 }),
    () => doc() + t(24.5, 29.5, 6.8, 'FINAL', { font: MONO, w: 700 }),
    () => doc(3, -2) + doc(-1, 2) + t(23.5, 28, 6, 'FINAL', { font: MONO, w: 700 }) + t(23.5, 35, 6, 'FINAL', { font: MONO, w: 700 }),
    () =>
      doc(4, -3) + doc(1.5, -0.5) + doc(-1, 2) +
      t(23.5, 29, 6.4, 'USE', { font: MONO, w: 700, fill: C.blue }) + t(23.5, 36, 6.4, 'THIS', { font: MONO, w: 700, fill: C.blue }),
    () =>
      `<g transform="rotate(-10 24 24)"><circle cx="24" cy="24" r="15" fill="none" stroke="${C.blue}" stroke-width="2.4"/><circle cx="24" cy="24" r="11.5" fill="none" stroke="${C.blue}" stroke-width="1"/><path d="M17.5 24.5l4.5 4.5 8.5-9.5" fill="none" stroke="${C.blue}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  ],
  photo: [
    () => polaroid(`<circle cx="28.5" cy="16" r="2.6" fill="${C.pink}"/><path d="M15 29l6-7 4 4 3-3 5 6z" fill="#444"/>`),
    () =>
      `<rect x="8" y="8" width="32" height="32" rx="1.5" fill="#fff"/>` +
      [11, 20.5, 30].flatMap((y) => [11, 20.5, 30].map((x) => `<rect x="${x}" y="${y}" width="7" height="7" fill="${C.ink}"/>`)).join('') +
      `<circle cx="24" cy="24" r="6.5" fill="none" stroke="${C.blue}" stroke-width="1.8"/>`,
    () =>
      polaroid(`<rect x="15" y="11" width="18" height="18" fill="#2a2a2a"/><circle cx="27" cy="17" r="4" fill="${C.pink}"/><path d="M15 29l6-7 4 4 3-3 5 6z" fill="#555"/>`) +
      sparkle(37, 10, 5) + sparkle(41, 19, 3),
    () =>
      `<rect x="12" y="6" width="24" height="35" rx="1" fill="#fff"/><rect x="15" y="15" width="18" height="23" fill="${C.pink}"/>` +
      t(24, 13, 6.5, 'mag', { w: 600, ls: -0.2 }) +
      `<circle cx="24" cy="23" r="3.2" fill="${C.ink}"/><path d="M18 38c0-6 3-10 6-10s6 4 6 10z" fill="${C.ink}"/>`,
    () =>
      `<rect x="16" y="30" width="2.4" height="12" fill="${C.ink}"/><rect x="29.6" y="30" width="2.4" height="12" fill="${C.ink}"/>` +
      `<rect x="5" y="10" width="38" height="21" rx="1" fill="#fff"/><rect x="8" y="13" width="32" height="15" fill="${C.blue}"/>` +
      markPaths(17, 20.5, 4.5) + `<rect x="25" y="18" width="11" height="1.6" fill="#fff"/><rect x="25" y="21.5" width="7" height="1.6" fill="#fff"/>`,
  ],
  pack: [
    () =>
      `<path d="M18 8h12v10h10v12H30v10H18V30H8V18h10z" fill="${C.kraft}"/>` +
      `<rect x="18" y="18" width="12" height="12" fill="none" stroke="#8a6b48" stroke-width="1" stroke-dasharray="2 1.6"/>`,
    () => cube('#dcbb98', C.kraft, '#b48d65'),
    () => cube('#ffffff', '#f2f2f2', '#dedede') + `<path d="M11 22l13 7v3l-13-7z" fill="${C.green}"/><path d="M37 22l-13 7v3l13-7z" fill="#958625"/>`,
    () =>
      `<rect x="12" y="15" width="24" height="25" rx="6" fill="#fff"/><rect x="14" y="9" width="20" height="7" rx="2" fill="${C.blue}"/>` +
      `<rect x="16" y="23" width="16" height="9" rx="1" fill="${C.lblue}"/>`,
    () =>
      `<rect x="20" y="6" width="8" height="7" rx="1" fill="${C.ink}"/><rect x="22" y="12.5" width="4" height="4" fill="#d8d8d8"/>` +
      `<rect x="12" y="16" width="24" height="25" rx="3" fill="#fff"/><rect x="14.5" y="25" width="19" height="13.5" rx="2" fill="${C.greenL}"/>` +
      `<rect x="18" y="20" width="12" height="7" fill="#fff" stroke="${C.ink}" stroke-width=".6"/>` + markPaths(24, 23.5, 2.4, C.blue, C.lblue),
    () =>
      `<rect x="11" y="16" width="9" height="14" rx="1.5" fill="#fff"/><rect x="13.5" y="12" width="4" height="4" fill="${C.ink}"/>` +
      `<rect x="22" y="20" width="9" height="10" rx="2.5" fill="#fff"/><rect x="22.5" y="17.5" width="8" height="3" rx="1" fill="${C.blue}"/>` +
      `<rect x="33" y="20" width="6" height="10" fill="${C.green}"/>` +
      `<rect x="6" y="28" width="36" height="12" rx="2" fill="${C.kraft}"/><rect x="6" y="32" width="36" height="2" fill="#fff" opacity=".75"/>` +
      sparkle(40, 12, 4, '#fff'),
  ],
};

export const itemSvg = (c, l) => svg(ART[c][l - 1]());

export const tileHTML = (it, extra = '') =>
  `<div class="tile ${extra}" data-c="${it.c}" style="--bg:${CHAINS[it.c].bg}">${itemSvg(it.c, it.l)}<i class="lv">${it.l}</i></div>`;

export const genHTML = (extra = '') =>
  `<div class="tile gen ${extra}">${svg(
    `<rect x="14" y="6" width="20" height="25" rx="1.5" fill="#fff" opacity=".35" transform="rotate(-8 24 18)"/>` +
      `<rect x="14" y="7" width="20" height="25" rx="1.5" fill="#fff"/><path d="M24 13v13M17.5 19.5h13" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/>` +
      t(24, 43, 7, 'BRIEF', { fill: '#fff', font: MONO, w: 400, ls: 0.6 }),
  )}</div>`;

// Daphi: the mark with a face, phone in hand. Always on her phone.
export const daphiSvg = svg(
  markPaths(20, 20, 18, C.blue, C.lblue) +
    `<circle cx="13.5" cy="13.5" r="2.2" fill="#fff"/><circle cx="26.5" cy="13.5" r="2.2" fill="#fff"/>` +
    `<path d="M14.5 25.5q5.5 4.5 11 0" fill="none" stroke="${C.ink}" stroke-width="1.7" stroke-linecap="round"/>` +
    `<rect x="28" y="23" width="9" height="14" rx="2" fill="${C.ink}"/><rect x="29.4" y="24.8" width="6.2" height="9" rx=".8" fill="${C.greenL}"/>`,
  '0 0 40 40',
);

export const markSvg = svg(markPaths(12, 12, 11, C.blue, C.lblue), '0 0 24 24');

export const balloonSvg = svg(
  `<path d="M45 4c22 0 40 18 40 42 0 26-22 50-40 54C27 96 5 72 5 46 5 22 23 4 45 4z" fill="${C.pink}"/>` +
    `<ellipse cx="30" cy="30" rx="6" ry="11" fill="#fff" opacity=".55" transform="rotate(20 30 30)"/>` +
    `<path d="M40 99h10l-5 7z" fill="#e9b796"/><path d="M45 106c-7 12 7 20 0 32s5 13 0 20" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`,
  '0 0 90 160',
);

export const catSvg = svg(
  `<path d="M10 30L13 4l18 15q9-4 18 0L67 4l3 26q6 32-30 36Q4 62 10 30z" fill="${C.ink}"/>` +
    `<circle cx="28" cy="36" r="5.5" fill="${C.greenL}"/><circle cx="52" cy="36" r="5.5" fill="${C.greenL}"/>` +
    `<ellipse cx="28" cy="36" rx="1.6" ry="4" fill="${C.ink}"/><ellipse cx="52" cy="36" rx="1.6" ry="4" fill="${C.ink}"/>` +
    `<path d="M37 47h6l-3 3.4z" fill="${C.pink}"/>`,
  '0 0 80 70',
);
