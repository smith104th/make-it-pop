// Plays through Ademan Games in headless Chrome at iPhone size: the menu, then every game.
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
const ls = (k) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), k);
const center = async (sel) => { const b = await page.locator(sel).first().boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
const dragFrom = async ([x1, y1], [x2, y2], steps = 12) => {
  await page.mouse.move(x1, y1); await page.mouse.down();
  await page.mouse.move(x2, y2, { steps }); await page.mouse.up();
};
const open = async (id) => { await page.click(`.band[data-g="${id}"]`); await page.waitForTimeout(520); };
const backToMenu = async () => { await page.click(`#g-${await page.evaluate(() => window.__ag.cur)} .back`); await page.waitForTimeout(520); };
const onMenu = () => page.evaluate(() => window.__ag.cur === null);

await page.goto('http://localhost:4173/');
await page.waitForSelector('.band');
ok((await page.locator('.band').count()) === 5, 'menu lists five games');
ok((await page.textContent('.hub-head h1')).includes('Ademan'), 'menu says Ademan Games');
await shot('00-menu');

// ---------- Final Final ----------
await open('final');
ok(await page.evaluate(() => window.__ag.cur === 'final'), 'Final Final opens');
await shot('10-final-start');
for (let k = 0; k < 60; k++) { await page.keyboard.press(['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowDown'][k % 4]); await page.waitForTimeout(25); }
let ff = await page.evaluate(() => window.__ag.games.final.state);
ok(ff.score > 0 && ff.tiles.length >= 2, `2048 merges and scores (${ff.score} points, ${ff.tiles.length} tiles)`);
ok(ff.tiles.every((t) => t.v >= 2 && (t.v & (t.v - 1)) === 0), 'every tile is a power of two');
const fb = await page.locator('.ffboard').boundingBox();
const before = JSON.stringify(ff.tiles);
for (const [dx, dy] of [[-120, 0], [0, 120], [120, 0], [0, -120]]) await dragFrom([fb.x + fb.width / 2, fb.y + fb.height / 2], [fb.x + fb.width / 2 + dx, fb.y + fb.height / 2 + dy], 5);
ff = await page.evaluate(() => window.__ag.games.final.state);
ok(JSON.stringify(ff.tiles) !== before, 'swipes move the board');
await page.waitForTimeout(300);
await shot('11-final-play');
await backToMenu();
ok(await onMenu(), 'Back returns to the menu');
ok((await page.textContent('.band[data-g="final"] .band-pill')).startsWith('Best'), 'menu shows the Final Final best');

// ---------- Feedback ----------
await open('feedback');
await page.waitForSelector('.nstage .n-balloon');
await shot('20-feedback');
const solved = async () => ((await ls('ag:feedback'))?.solved || []).length;
const next = async () => { await page.waitForSelector('.nwin:not([hidden]) [data-act="next"]', { timeout: 3000 }); await page.click('.nwin [data-act="next"]'); };
const [lx, ly] = await center('.n1-logo');
await dragFrom([lx, ly], [lx + 120, ly + 60]);
await page.mouse.click(...(await center('.n-balloon')));
ok(await solved() === 1, 'note 1: pop');
await next();
const [kx, ky] = await center('.n2-knob');
await page.mouse.move(kx, ky); await page.mouse.down();
await page.mouse.move(kx + 40, ky, { steps: 5 }); await page.mouse.move(kx + 60, ky - 80, { steps: 8 }); await page.mouse.up();
ok(await solved() === 2, 'note 2: bigger');
await next();
await page.click('.n3-sw button');
await dragFrom(await center('.nprompt .w'), await center('.n3-logo'));
ok(await solved() === 3, 'note 3: blue');
await next();
for (const q of ['.n4-new', '.n4-burst', '.n4-stars', '.n4-ship', '.n4-spark']) await page.click(q);
await page.click('.n4-title');
ok(await solved() === 4, 'note 4: premium');
await next();
for (let k = 0; k < 3; k++) await page.click('.n5-btn');
await page.click('.n5-terms .t');
ok(await solved() === 5, 'note 5: read the contract');
await next();
for (let i = 1; i <= 3; i++) {
  const g = await page.evaluate((i) => { const L = [...document.querySelectorAll('.n6-row span')]; return L[i].offsetLeft - (L[i - 1].offsetLeft + L[i - 1].offsetWidth); }, i);
  const [x, y] = await center(`.n6-row span:nth-child(${i + 1})`);
  await dragFrom([x, y], [x + (12 - g), y], 6);
}
ok(await solved() === 6, 'note 6: kern');
await next();
await dragFrom(await center('.n7-cat'), await center('.n7-img'));
ok(await solved() === 7, 'note 7: viral');
await next();
const box = await page.locator('.nstage').boundingBox();
for (let k = 0; k < 5; k++) await page.mouse.click(box.x + 30, box.y + 14);
ok(await solved() === 8, 'note 8: whiter');
await next();
await page.click('.n9-time');
ok(await solved() === 9, 'note 9: out of office');
await next();
const [bx, by] = await center('.n-balloon');
await page.mouse.move(bx, by); await page.mouse.down(); await page.waitForTimeout(150); await page.mouse.up();
ok(await solved() === 9, 'note 10: a quick tap is too much');
await page.waitForTimeout(800);
await page.mouse.move(bx, by); await page.mouse.down(); await page.waitForTimeout(2000); await page.mouse.up();
ok(await solved() === 10, 'note 10: hold for subtle');
await page.waitForTimeout(700);
await shot('21-feedback-done');
ok((await ls('make-it-pop:v1')).mate > 30, 'Feedback pays out mate in Make It Pop');
await backToMenu();
ok((await page.textContent('.band[data-g="feedback"] .band-pill')).trim() === 'Done', 'menu shows Feedback done');

// ---------- Scope Creep ----------
await open('scope');
await shot('30-scope-ready');
await page.click('.sc-over [data-a="go"]');
await page.waitForTimeout(400);
let sc = await page.evaluate(() => window.__ag.games.scope.state);
ok(sc.state === 'play' && sc.len === 4, 'Scope Creep starts');
await page.keyboard.press('ArrowUp');
await page.waitForTimeout(400);
sc = await page.evaluate(() => window.__ag.games.scope.state);
ok(sc.dir === 'up', `steering works (heading ${sc.dir})`);
await shot('31-scope-play');
await page.waitForFunction(() => window.__ag.games.scope.state.state === 'over', null, { timeout: 15000 });
await page.waitForTimeout(300);
await shot('32-scope-over');
ok(await page.isVisible('.sc-over [data-a="go"]'), 'hitting the deadline ends the run');
await backToMenu();

// ---------- Swatch ----------
await open('swatch');
await shot('40-swatch-intro');
await page.click('[data-a="daily"]');
await page.waitForTimeout(400);
await shot('41-swatch-look');
for (let r = 0; r < 5; r++) {
  await page.waitForSelector('.sw-pick', { timeout: 5000 });
  // aim right at the target on round 1, guess on the rest
  await page.evaluate((exact) => {
    const st = window.__ag.games.swatch.state;
    const t = st.rounds[st.i].t;
    document.querySelectorAll('.sw-sl input').forEach((inp, k) => { inp.value = exact ? t[k] : [(t[0] + 40) % 360, 50, 60][k]; inp.dispatchEvent(new Event('input', { bubbles: true })); });
  }, r === 0);
  if (r === 1) await shot('42-swatch-pick');
  await page.click('[data-a="send"]');
  if (r === 0) ok((await page.textContent('.sw-score')).trim() === '10.0', 'a perfect match scores 10');
  if (r === 1) await shot('43-swatch-result');
  await page.click('[data-a="next"]');
}
await page.waitForSelector('.sw-end');
await shot('44-swatch-end');
const swd = await ls('ag:swatch');
ok(swd.daily && swd.daily.rounds.length === 5 && swd.daily.score > 10, `daily score saved (${swd.daily?.score})`);
await backToMenu();
ok((await page.textContent('.band[data-g="swatch"] .band-pill')).startsWith('Today'), "menu shows today's Swatch");

// ---------- Make It Pop ----------
await open('pop');
await page.waitForSelector('#sheet:not([hidden])');
await page.waitForTimeout(400);
await shot('50-pop-intro');
await page.click('#sheet .pill.go');
const S = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__mip.S)));
const cell = (i) => `#board .cell[data-i="${i}"]`;
const GEN = 24;
await dragFrom(await center(cell(GEN - 1)), await center(cell(GEN + 1)));
let s = await S();
ok(s.board[GEN + 1]?.c === 'type' && s.board[GEN + 1]?.l === 2, 'desk: two letters merge');
await page.waitForSelector('#orders .deliver');
await page.click('#orders .deliver', { force: true });
s = await S();
ok(s.stats.launches === 1, 'desk: first order delivers');
for (let k = 0; k < 20; k++) { await page.click(cell(GEN), { force: true }); await page.waitForTimeout(25); }
s = await S();
ok(s.stats.spawns === 20 && Object.keys(s.stickies).length >= 1, `desk: briefs and stickies (${Object.keys(s.stickies).length})`);
await shot('51-pop-desk');
await page.click('#ahre', { force: true });
ok(Object.keys((await S()).stickies).length === 0, 'desk: AHRE clears stickies');
await page.click('#pop-dock [data-t="studio"]');
await shot('52-pop-studio');
ok((await page.textContent('#pop-studio')).includes('10/10'), 'Studio counts Feedback solved');
await page.click('#pop-dock [data-t="wall"]');
await shot('53-pop-wall');
await page.click('#pop-dock [data-t="desk"]');

// swipe in from the left edge to go back
await dragFrom([3, 400], [300, 400], 10);
await page.waitForTimeout(550);
ok(await onMenu(), 'edge swipe returns to the menu');
await shot('60-menu-after');

// a shared link opens straight into a game, and Back still works
await page.goto('http://localhost:4173/#swatch');
await page.waitForTimeout(600);
ok(await page.evaluate(() => window.__ag.cur === 'swatch'), 'a #swatch link opens Swatch');
await backToMenu();
ok(await onMenu(), 'Back from a shared link lands on the menu');

ok(errors.length === 0, `no errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
await browser.close();
server.close();
console.log(fails ? `${fails} failed` : 'all good');
process.exit(fails ? 1 : 0);
