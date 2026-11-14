// Plays through the game in headless Chrome at iPhone size: merges, delivers, stickies, AHRE, all ten notes.
// node test/smoke.mjs [--shots dir]
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';

const shotsAt = process.argv.indexOf('--shots');
const SHOTS = shotsAt > 0 ? process.argv[shotsAt + 1] : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = join('docs', p);
  if (!existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(4173);

const exe = ['/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' && !/fontshare|ERR_|Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
await page.route(/fontshare\.com/, (r) => r.abort());

let fails = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fails++; };
const shot = async (name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` }); };
const S = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__mip.S)));
const center = async (sel) => { const b = await page.locator(sel).first().boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
const dragFrom = async ([x1, y1], [x2, y2], steps = 12) => {
  await page.mouse.move(x1, y1); await page.mouse.down();
  await page.mouse.move(x2, y2, { steps }); await page.mouse.up();
};
const cell = (i) => `#board .cell[data-i="${i}"]`;

await page.goto('http://localhost:4173/');
await page.waitForSelector('#sheet:not([hidden])'); await page.waitForTimeout(500);
await shot('01-intro');
await page.click('#sheet .pill.go');
ok(await page.isHidden('#sheet'), 'intro closes');
await shot('02-desk');

// merge the two letters next to the brief
const GEN = 24;
await dragFrom(await center(cell(GEN - 1)), await center(cell(GEN + 1)));
let s = await S();
ok(s.board[GEN + 1]?.c === 'type' && s.board[GEN + 1]?.l === 2 && !s.board[GEN - 1], 'two letters merge into a pair');
await page.waitForSelector('#orders .deliver');
await shot('03-ready');
await page.click('#orders .deliver', { force: true });
s = await S();
ok(s.stats.launches === 1 && s.wall.length === 1 && s.coins > 20, 'first order delivers');

// briefs, stickies
for (let k = 0; k < 24; k++) { await page.click(cell(GEN), { force: true }); await page.waitForTimeout(30); }
s = await S();
ok(s.stats.spawns === 24, `24 briefs spawned (${s.stats.spawns})`);
ok(s.mate === 30 - 24 + 2, `mate spent (${s.mate})`);
ok(Object.keys(s.stickies).length >= 1, `client feedback landed (${Object.keys(s.stickies).length} stickies)`);
await shot('04-board');
// try a few merges by scanning for pairs
const tryMerges = async (n) => {
  for (let k = 0; k < n; k++) {
    const st = await S();
    const free = (i) => i !== GEN && st.board[i] && !st.stickies[i];
    let pair = null;
    for (let i = 0; i < 49 && !pair; i++) for (let j = i + 1; j < 49 && !pair; j++) {
      if (free(i) && free(j) && st.board[i].c === st.board[j].c && st.board[i].l === st.board[j].l && st.board[i].l < 5) pair = [i, j];
    }
    if (!pair) return;
    await dragFrom(await center(cell(pair[0])), await center(cell(pair[1])), 6);
  }
};
const m0 = (await S()).stats.merges;
await tryMerges(8);
s = await S();
ok(s.stats.merges > m0, `more merges (${s.stats.merges})`);
await page.click(`${cell((s.board.findIndex((it, i) => it && !s.stickies[i] && i !== GEN)))}`);
await page.waitForSelector('#archive');
await shot('05-inspect');
const coins0 = (await S()).coins;
await page.click('#archive');
ok((await S()).coins > coins0, 'archive pays');
const stick = Object.keys((await S()).stickies).length;
if (stick) {
  await page.click('#ahre', { force: true });
  s = await S();
  ok(Object.keys(s.stickies).length === 0 && s.ahre >= 0, 'AHRE clears every sticky');
}

// Notes
await page.click('#dock [data-s="notes"]');
await page.waitForSelector('.nstage .n-balloon');
await shot('10-note-pop');
const solvedCount = async () => (await S()).notes.solved.length;
const next = async () => { await page.waitForSelector('.nwin:not([hidden]) [data-act="next"]', { timeout: 3000 }); await page.click('.nwin [data-act="next"]'); };

// 1 pop: move the logo, tap the balloon
let [lx, ly] = await center('.n1-logo');
await dragFrom([lx, ly], [lx + 120, ly + 60]);
await page.mouse.click(...(await center('.n-balloon')));
ok(await solvedCount() === 1, 'note 1: pop');
await next();

// 2 bigger: pull the knob past 100%
const [kx, ky] = await center('.n2-knob');
await page.mouse.move(kx, ky); await page.mouse.down();
await page.mouse.move(kx + 40, ky, { steps: 5 }); await page.mouse.move(kx + 60, ky - 80, { steps: 8 }); await page.mouse.up();
ok(await solvedCount() === 2, 'note 2: bigger');
await shot('11-note-bigger');
await next();

// 3 blue: drag the word onto the logo
await page.click('.n3-sw button');
await dragFrom(await center('.nprompt .w'), await center('.n3-logo'));
ok(await solvedCount() === 3, 'note 3: blue');
await next();

// 4 premium
await shot('12-note-premium');
for (const q of ['.n4-new', '.n4-burst', '.n4-stars', '.n4-ship', '.n4-spark']) await page.click(q);
await page.click('.n4-title');
ok(await solvedCount() === 4, 'note 4: premium');
await next();

// 5 tweaks
for (let k = 0; k < 3; k++) await page.click('.n5-btn');
await page.click('.n5-terms .t');
ok(await solvedCount() === 5, 'note 5: read the contract');
await next();

// 6 kern
await shot('13-note-kern');
for (let i = 1; i <= 3; i++) {
  const g = await page.evaluate((i) => { const L = [...document.querySelectorAll('.n6-row span')]; return L[i].offsetLeft - (L[i - 1].offsetLeft + L[i - 1].offsetWidth); }, i);
  const [x, y] = await center(`.n6-row span:nth-child(${i + 1})`);
  await dragFrom([x, y], [x + (12 - g), y], 6);
}
ok(await solvedCount() === 6, 'note 6: kern');
await next();

// 7 viral
await dragFrom(await center('.n7-cat'), await center('.n7-img'));
ok(await solvedCount() === 7, 'note 7: viral');
await page.waitForTimeout(1200);
await shot('14-note-viral');
await next();

// 8 whiter
const box = await page.locator('.nstage').boundingBox();
for (let k = 0; k < 5; k++) await page.mouse.click(box.x + 14, box.y + 14);
ok(await solvedCount() === 8, 'note 8: whiter');
await next();

// 9 call
await page.click('.n9-time');
ok(await solvedCount() === 9, 'note 9: out of office');
await next();

// 10 subtle
const [bx, by] = await center('.n-balloon');
await page.mouse.move(bx, by); await page.mouse.down(); await page.waitForTimeout(150); await page.mouse.up();
ok(await solvedCount() === 9, 'note 10: a quick tap is too much');
await page.waitForTimeout(800);
await page.mouse.move(bx, by); await page.mouse.down(); await page.waitForTimeout(2000); await page.mouse.up();
ok(await solvedCount() === 10, 'note 10: hold for subtle');
await page.waitForTimeout(700);
await shot('15-notes-done');

await page.click('#dock [data-s="studio"]');
await shot('20-studio');
await page.click('#dock [data-s="wall"]');
await shot('21-wall');
await page.click('[data-view="list"]');
await shot('22-wall-list');
await page.click('#dock [data-s="desk"]');
await page.reload();
await page.waitForSelector('#board .cell');
s = await S();
ok(s.notes.solved.length === 10 && s.stats.launches === 1, 'progress survives a reload');

ok(errors.length === 0, `no errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
await browser.close();
server.close();
console.log(fails ? `${fails} failed` : 'all good');
process.exit(fails ? 1 : 0);
