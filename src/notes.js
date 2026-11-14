// Client Notes: trick puzzles. Every level is a real client note, solved literally.
import { C, balloonSvg, catSvg, itemSvg, markPaths } from './art.js';

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const inside = (ev, r) => ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;

// Put an element's center at a fraction of the stage.
function place(st, el, fx, fy) {
  el.style.left = `${Math.round(st.clientWidth * fx - el.offsetWidth / 2)}px`;
  el.style.top = `${Math.round(st.clientHeight * fy - el.offsetHeight / 2)}px`;
}

// Drag by left/top inside a positioned parent. A press without movement counts as a tap.
function dragEl(el, { axis, onMove, onEnd, onTap } = {}) {
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
    let moved = false;
    try { el.setPointerCapture(e.pointerId); } catch { /* */ }
    const mv = (ev) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      moved = true;
      el.classList.add('dragging');
      if (axis !== 'y') el.style.left = `${ox + dx}px`;
      if (axis !== 'x') el.style.top = `${oy + dy}px`;
      onMove?.(ev);
    };
    const up = (ev) => {
      el.removeEventListener('pointermove', mv);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.classList.remove('dragging');
      if (moved) onEnd?.(ev);
      else if (ev.type === 'pointerup') onTap?.(ev);
    };
    el.addEventListener('pointermove', mv);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });
}

function popFx(st, el, text = 'POP') {
  const r = el.getBoundingClientRect(), s = st.getBoundingClientRect();
  const f = document.createElement('div');
  f.className = 'n-popfx';
  f.textContent = text;
  f.style.left = `${r.left - s.left + r.width / 2}px`;
  f.style.top = `${r.top - s.top + r.height * 0.3}px`;
  st.append(f);
  setTimeout(() => f.remove(), 900);
}

const logo = (cls, word = 'nube') => `<div class="${cls} n-logo"><span>${word}</span></div>`;

export const NOTES = [
  {
    id: 'pop',
    note: 'Make it pop.',
    hint: 'Not everything is on top. Look behind the logo, ¿ubicás?',
    done: 'It popped. The client is obsessed.',
    mount(st, api) {
      st.innerHTML = `<div class="n-balloon">${balloonSvg}</div>${logo('n1-logo')}`;
      const b = st.querySelector('.n-balloon'), lg = st.querySelector('.n1-logo');
      place(st, b, 0.5, 0.5);
      place(st, lg, 0.5, 0.45);
      dragEl(lg, { onTap: () => api.nope(rnd(['Still not popping.', 'Tapping harder will not help.', 'Hmm. Flat.'])) });
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (api.isDone()) return;
        b.classList.add('popped');
        popFx(st, b);
        api.sfx(900, 0.12);
        api.solve();
      });
    },
  },
  {
    id: 'bigger',
    note: 'Make the logo bigger.',
    hint: 'Who said the slider stops at 100%? Keep pulling, ¿ubicás?',
    done: "It's a billboard now. They love it.",
    mount(st, api) {
      st.innerHTML = `${logo('n2-logo')}<div class="n2-read">100%</div><div class="n2-track"><i class="n2-fill"></i><b class="n2-knob"></b></div><div class="n2-labels"><span>50%</span><span>100%</span></div>`;
      const lg = st.querySelector('.n2-logo'), read = st.querySelector('.n2-read');
      const track = st.querySelector('.n2-track'), knob = st.querySelector('.n2-knob'), fill = st.querySelector('.n2-fill');
      place(st, lg, 0.5, 0.36);
      const set = (kx, ky, v) => {
        knob.style.left = `${kx}px`;
        knob.style.top = `calc(50% + ${ky}px)`;
        fill.style.width = `${Math.min(kx, track.clientWidth)}px`;
        lg.style.transform = `scale(${v / 100})`;
        read.textContent = `${Math.round(v)}%`;
      };
      set(track.clientWidth, 0, 100);
      knob.style.touchAction = 'none';
      knob.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (api.isDone()) return;
        try { knob.setPointerCapture(e.pointerId); } catch { /* */ }
        const tr = track.getBoundingClientRect();
        let free = false, v = 100, pushed = false;
        const mv = (ev) => {
          const px = ev.clientX - tr.left, py = ev.clientY - (tr.top + tr.height / 2);
          if (px > tr.width) pushed = true;
          if (!free && px > tr.width + 22) free = true;
          if (!free) { const kx = Math.max(0, Math.min(tr.width, px)); v = 50 + (50 * kx) / tr.width; set(kx, 0, v); }
          else { v = 100 + Math.hypot(px - tr.width, py) * 4; set(px, py, v); }
          if (v >= 350 && !api.isDone()) { api.sfx(700, 0.3); api.solve(); }
        };
        const up = () => {
          knob.removeEventListener('pointermove', mv);
          knob.removeEventListener('pointerup', up);
          knob.removeEventListener('pointercancel', up);
          if (api.isDone()) return;
          if (free) { set(tr.width, 0, 100); api.nope('Bigger. Keep going.'); }
          else if (pushed) api.nope('100% is the max. Apparently.');
        };
        knob.addEventListener('pointermove', mv);
        knob.addEventListener('pointerup', up);
        knob.addEventListener('pointercancel', up);
      });
    },
  },
  {
    id: 'blue',
    note: 'Can we try it in [blue]?',
    hint: 'The blue is in the question. Drag it, ¿ubicás?',
    done: 'Blue. Specifically, Ademan blue.',
    mount(st, api) {
      const SW = ['#E5533D', C.green, C.pink, C.greenL, '#8E6CC2', C.ink];
      st.innerHTML = `${logo('n3-logo')}<div class="n3-sw">${SW.map((c) => `<button style="background:${c}" data-c="${c}" aria-label="swatch"></button>`).join('')}</div>`;
      const lg = st.querySelector('.n3-logo');
      place(st, lg, 0.5, 0.4);
      st.querySelector('.n3-sw').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b || api.isDone()) return;
        lg.style.color = b.dataset.c;
        api.nope(rnd(['Not blue.', 'Bluer.', 'That is not blue.', 'Close? No.']));
      });
      const word = api.prompt.querySelector('[data-w="blue"]');
      word.style.touchAction = 'none';
      word.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (api.isDone()) return;
        try { word.setPointerCapture(e.pointerId); } catch { /* */ }
        const g = document.createElement('span');
        g.className = 'wghost';
        g.textContent = 'blue';
        document.body.append(g);
        word.classList.add('lifted');
        const mv = (ev) => { g.style.transform = `translate(${ev.clientX}px, ${ev.clientY}px) translate(-50%, -70%)`; };
        mv(e);
        const up = (ev) => {
          word.removeEventListener('pointermove', mv);
          word.removeEventListener('pointerup', up);
          word.removeEventListener('pointercancel', up);
          g.remove();
          word.classList.remove('lifted');
          if (ev.type === 'pointerup' && inside(ev, lg.getBoundingClientRect())) {
            lg.style.color = C.blue;
            word.classList.add('used');
            api.sfx(660, 0.2);
            api.solve();
          }
        };
        word.addEventListener('pointermove', mv);
        word.addEventListener('pointerup', up);
        word.addEventListener('pointercancel', up);
      });
      return () => document.querySelectorAll('.wghost').forEach((g) => g.remove());
    },
  },
  {
    id: 'premium',
    note: 'Make it feel more premium.',
    hint: 'Premium is mostly what you take away. And that font... ¿ubicás?',
    done: 'Now it costs $90.',
    mount(st, api) {
      st.innerHTML = `<div class="n4-card">
        <div class="cl n4-new">NEW!!!</div>
        <div class="cl n4-burst"><span>50%<br>OFF!!</span></div>
        <div class="n4-title">Nube Skin</div>
        <div class="cl n4-stars">★★★★★ 4.9 (12k)</div>
        <div class="n4-jar">${itemSvg('pack', 4)}</div>
        <div class="cl n4-ship">FREE SHIPPING</div>
        <div class="cl n4-spark">✦ ✦ ✦</div>
      </div>`;
      const card = st.querySelector('.n4-card');
      place(st, card, 0.5, 0.5);
      const title = card.querySelector('.n4-title');
      const left = () => card.querySelectorAll('.cl:not(.gone)').length;
      card.addEventListener('click', (e) => {
        if (api.isDone()) return;
        const cl = e.target.closest('.cl');
        if (cl && !cl.classList.contains('gone')) {
          cl.classList.add('gone');
          api.sfx(400, 0.06);
          if (!left() && !title.classList.contains('lux')) api.nope('Better. That font, though.');
        } else if (e.target.closest('.n4-title')) {
          title.classList.add('lux');
          api.sfx(520, 0.08);
          if (left()) api.nope('Nicer font. Still looks cheap.');
        }
        if (!left() && title.classList.contains('lux')) api.solve();
      });
    },
  },
  {
    id: 'tweaks',
    note: 'Love it!! Just a few small tweaks.',
    hint: 'Read the fine print, ¿ubicás?',
    done: 'Per the contract. Invoice sent. Ahre.',
    mount(st, api) {
      const asks = ['can the logo be 2% bigger', 'try it in blue again', 'my wife liked the old one', 'can it feel more Tuesday?', 'what if no logo', 'back to v3 actually', 'one last thing', 'can we see it in person'];
      let v = 12, k = 0;
      st.innerHTML = `<div class="n5-wrap">
        <div class="n5-doc"><small>logo_v<span class="v">${v}</span>.pdf</small><svg viewBox="0 0 48 48" class="n5-mark">${markPaths(24, 24, 14, C.blue, C.lblue)}</svg></div>
        <p class="n5-req">"${asks[0]}"</p>
        <button class="pill go n5-btn">Make the tweak</button>
        <p class="n5-terms">Terms: <span class="t">2 rounds of revisions</span> included. Extra rounds billed hourly.</p>
      </div>`;
      const vEl = st.querySelector('.v'), req = st.querySelector('.n5-req'), mk = st.querySelector('.n5-mark');
      st.querySelector('.n5-btn').addEventListener('click', () => {
        if (api.isDone()) return;
        v++; k++;
        vEl.textContent = v;
        req.textContent = `"${asks[k % asks.length]}"`;
        mk.style.transform = `scale(${0.85 + Math.random() * 0.3}) rotate(${(Math.random() - 0.5) * 30}deg)`;
        api.sfx(300 + (k % 5) * 40, 0.05);
        if (k >= 5) api.nope(k >= 9 ? `v${v}. Ahre.` : 'This could go on forever. ¿Ubicás?');
      });
      st.querySelector('.t').addEventListener('click', () => {
        if (api.isDone()) return;
        req.textContent = 'Extra rounds are billed. Invoice attached.';
        api.sfx(880, 0.2);
        api.solve();
      });
    },
  },
  {
    id: 'kern',
    note: 'Can you kern this?',
    hint: 'Same space between every letter. Drag them, ¿ubicás?',
    done: 'Optically perfect. Nobody will notice. You will.',
    mount(st, api) {
      st.innerHTML = `<div class="n6-row">${'KERN'.split('').map((ch) => `<span>${ch}</span>`).join('')}</div><p class="n6-tip">Drag the letters</p>`;
      const row = st.querySelector('.n6-row');
      const L = [...row.querySelectorAll('span')];
      const ws = L.map((s) => s.offsetWidth);
      const gaps0 = [2, 34, 12];
      let x = (row.clientWidth - (ws.reduce((a, b) => a + b, 0) + gaps0.reduce((a, b) => a + b, 0))) / 2;
      L.forEach((s, i) => { s.style.left = `${x}px`; x += ws[i] + (gaps0[i] || 0); });
      const labels = [0, 1, 2].map(() => { const g = document.createElement('i'); row.append(g); return g; });
      const gaps = () => [0, 1, 2].map((i) => L[i + 1].offsetLeft - (L[i].offsetLeft + L[i].offsetWidth));
      const show = () => {
        const g = gaps();
        g.forEach((v, i) => {
          const lb = labels[i];
          lb.textContent = Math.round(v);
          lb.style.left = `${L[i].offsetLeft + L[i].offsetWidth + v / 2}px`;
          lb.style.width = `${Math.max(0, v)}px`;
        });
      };
      const check = () => {
        const g = gaps();
        const ok = Math.max(...g) - Math.min(...g) <= 3 && Math.min(...g) >= 3 && Math.max(...g) <= 40;
        if (ok && !api.isDone()) { row.classList.add('kerned'); api.sfx(700, 0.2); api.solve(); }
      };
      L.forEach((s) => dragEl(s, { axis: 'x', onMove: show, onEnd: () => { show(); check(); } }));
      show();
    },
  },
  {
    id: 'viral',
    note: 'Make it go viral.',
    hint: 'What does the internet always want? ¿Ubicás?',
    done: '1.2M likes. Zero sales. Viral.',
    mount(st, api) {
      st.innerHTML = `<div class="n7-post">
          <div class="n7-head"><i></i><b>nube.skin</b></div>
          <div class="n7-img">${itemSvg('pack', 4)}</div>
          <div class="n7-act"><button class="n7-heart" aria-label="like">♡</button><span class="n7-likes">3 likes</span></div>
          <p class="n7-cap"><b>nube.skin</b> new jar, who dis</p>
        </div>
        <div class="n7-cat">${catSvg}</div>`;
      const post = st.querySelector('.n7-post'), img = st.querySelector('.n7-img'), cat = st.querySelector('.n7-cat');
      const likesEl = st.querySelector('.n7-likes');
      place(st, post, 0.46, 0.48);
      let likes = 3;
      st.querySelector('.n7-heart').addEventListener('click', (e) => {
        if (api.isDone()) return;
        likes++;
        e.currentTarget.textContent = '♥';
        likesEl.textContent = `${likes} likes`;
        if (likes % 4 === 0) api.nope('At this rate: viral by 2047.');
      });
      dragEl(cat, {
        onEnd: (ev) => {
          if (api.isDone() || !inside(ev, img.getBoundingClientRect())) return;
          img.classList.add('cat');
          img.innerHTML = catSvg;
          cat.remove();
          const t0 = performance.now();
          const tick = (t) => {
            const p = Math.min(1, (t - t0) / 1100);
            likesEl.textContent = `${Math.round(3 + (1204331 - 3) * p ** 2).toLocaleString('en-US')} likes`;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          api.sfx(880, 0.3);
          api.solve();
        },
      });
    },
  },
  {
    id: 'whiter',
    note: 'The white needs to be whiter.',
    hint: "You can't change the white. Change what's around it, ¿ubicás?",
    done: 'Same white. Looks whiter. Design.',
    mount(st, api) {
      const steps = ['#f3f3f3', '#dddddd', '#ababab', '#5a5a5a', '#111111'];
      let k = -1;
      st.innerHTML = `<div class="n8-sq"></div><div class="n8-sl"><small>Brightness</small><div class="n8-track"><i></i></div><small>100%</small></div>`;
      const sq = st.querySelector('.n8-sq');
      place(st, sq, 0.5, 0.42);
      const onTap = (e) => {
        if (api.isDone()) return;
        if (e.target.closest('.n8-sq')) { api.nope('It is already white. Very white.'); return; }
        if (e.target.closest('.n8-sl')) { api.nope("It's already at 100%."); return; }
        k = Math.min(steps.length - 1, k + 1);
        st.style.background = steps[k];
        st.classList.toggle('dark', k >= 3);
        api.sfx(300 + k * 60, 0.06);
        if (k === steps.length - 1) { sq.classList.add('glow'); api.solve(); }
      };
      st.addEventListener('click', onTap);
      return () => { st.removeEventListener('click', onTap); st.style.background = ''; st.classList.remove('dark'); };
    },
  },
  {
    id: 'call',
    note: 'Quick call?',
    hint: 'What time does the studio close? ¿Ubicás?',
    done: '19:00. Out of office. Ahre.',
    mount(st, api) {
      st.classList.add('dark');
      st.innerHTML = `<div class="n9-status"><button class="n9-time">18:59</button><span>5G ▮▮▮</span></div>
        <div class="n9-who"><b>Client</b><small>calling…</small></div>
        <button class="n9-btn dec" aria-label="Decline">✕</button>
        <button class="n9-btn acc" aria-label="Accept">✓</button>`;
      const dec = st.querySelector('.dec'), acc = st.querySelector('.acc');
      place(st, dec, 0.28, 0.8);
      place(st, acc, 0.72, 0.8);
      const lines = ['Nice try.', 'The client always calls back.', 'Declining is not an option.', 'Answering is worse. ¿Ubicás?', 'It keeps ringing.'];
      const dodge = (e) => {
        e.preventDefault();
        if (api.isDone()) return;
        const b = e.currentTarget;
        b.style.left = `${Math.round(Math.random() * (st.clientWidth - b.offsetWidth))}px`;
        b.style.top = `${Math.round(st.clientHeight * 0.3 + Math.random() * (st.clientHeight * 0.6 - b.offsetHeight))}px`;
        api.nope(rnd(lines));
      };
      dec.addEventListener('pointerdown', dodge);
      acc.addEventListener('pointerdown', dodge);
      st.querySelector('.n9-time').addEventListener('click', (e) => {
        if (api.isDone()) return;
        e.currentTarget.textContent = '19:00';
        st.querySelector('.n9-who').innerHTML = '<b>Call ended</b><small>Out of office</small>';
        dec.remove();
        acc.remove();
        api.sfx(440, 0.3);
        api.solve();
      });
      return () => st.classList.remove('dark');
    },
  },
  {
    id: 'subtle',
    note: 'Make it pop. But subtle.',
    hint: 'Subtle takes patience. Press and hold, ¿ubicás?',
    done: 'Popped, subtly. Approved on round one. This never happens.',
    mount(st, api) {
      st.innerHTML = `<div class="n-balloon n10">${balloonSvg}</div>`;
      const b = st.querySelector('.n-balloon');
      place(st, b, 0.5, 0.48);
      b.style.touchAction = 'none';
      let t0 = 0, timer = 0;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (api.isDone()) return;
        try { b.setPointerCapture(e.pointerId); } catch { /* */ }
        t0 = performance.now();
        b.classList.add('deflate');
        timer = setTimeout(() => {
          b.classList.add('gone');
          popFx(st, b, 'pff');
          api.sfx(180, 0.5);
          api.solve();
        }, 1800);
      });
      const up = () => {
        if (!t0 || api.isDone()) return;
        clearTimeout(timer);
        const held = performance.now() - t0;
        t0 = 0;
        b.classList.remove('deflate');
        if (held < 300) {
          b.classList.add('popped');
          popFx(st, b, 'POP!!');
          api.sfx(900, 0.15);
          api.nope('Too much. Subtle.');
          setTimeout(() => b.classList.remove('popped'), 700);
        } else api.nope('Almost. Keep holding.');
      };
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
    },
  },
];

// ---------- the Notes screen ----------
let cur = null;
let cleanup = null;

const markup = (s) => s.replace(/\[(\w+)\]/g, '<span class="w" data-w="$1">$1</span>');

export function renderNotes(root, ctx) {
  const solved = ctx.solved;
  const unlocked = (i) => i === 0 || solved.includes(NOTES[i - 1].id);
  if (cur === null || !unlocked(cur)) {
    const f = NOTES.findIndex((n, i) => unlocked(i) && !solved.includes(n.id));
    cur = f >= 0 ? f : NOTES.length - 1;
  }
  cleanup?.();
  cleanup = null;
  const n = NOTES[cur];
  root.innerHTML = `<div class="notes">
    <div class="nhead"><h2>Client notes</h2><p>Do exactly what the client says. Literally.</p></div>
    <div class="nlevels">${NOTES.map((x, i) => `<button class="lvl${solved.includes(x.id) ? ' done' : ''}${i === cur ? ' on' : ''}" data-n="${i}" ${unlocked(i) ? '' : 'disabled'}>${i + 1}</button>`).join('')}</div>
    <div class="ncard">
      <div class="nfrom">From: client · Note ${cur + 1} of ${NOTES.length}</div>
      <div class="nprompt">${markup(n.note)}</div>
      <div class="nstage"></div>
      <div class="nmsg" aria-live="polite"></div>
      <div class="nbtns"><button class="pill sm" data-act="hint">¿Ubicás?</button><button class="pill sm" data-act="reset">Start over</button></div>
      <div class="nwin" hidden></div>
    </div>
  </div>`;
  const card = root.querySelector('.ncard'), stage = root.querySelector('.nstage');
  const msg = root.querySelector('.nmsg'), win = root.querySelector('.nwin');
  let done = false;
  const api = {
    prompt: root.querySelector('.nprompt'),
    isDone: () => done,
    sfx: ctx.sfx,
    nope(text) {
      msg.textContent = text;
      msg.className = 'nmsg';
      card.classList.remove('nope');
      void card.offsetWidth;
      card.classList.add('nope');
      ctx.buzz(10);
    },
    solve() {
      if (done) return;
      done = true;
      const first = !solved.includes(n.id);
      ctx.solve(n.id);
      ctx.buzz(25);
      const next = cur + 1 < NOTES.length;
      setTimeout(() => {
        win.innerHTML = `<b>Solved.</b><p>${n.done}</p>${first ? '<small>+10 mate · +$40 · +1 AHRE</small>' : ''}
          ${next ? '<button class="pill go" data-act="next">Next note</button>' : "<p class=\"fin\">That's every note. More when clients send more. Ahre.</p>"}`;
        win.hidden = false;
        root.querySelectorAll('.lvl').forEach((b, i) => {
          b.classList.toggle('done', solved.includes(NOTES[i].id));
          b.disabled = !unlocked(i);
        });
      }, 650);
    },
  };
  root.onclick = (e) => {
    const lv = e.target.closest('.lvl');
    if (lv && !lv.disabled) { cur = +lv.dataset.n; renderNotes(root, ctx); return; }
    const a = e.target.closest('[data-act]');
    if (!a) return;
    if (a.dataset.act === 'hint') { msg.textContent = `Daphi: ${n.hint}`; msg.className = 'nmsg hint'; }
    if (a.dataset.act === 'reset') renderNotes(root, ctx);
    if (a.dataset.act === 'next') { cur = Math.min(NOTES.length - 1, cur + 1); renderNotes(root, ctx); }
  };
  stage.className = `nstage n-${n.id}`;
  stage.style.background = '';
  cleanup = n.mount(stage, api) || null;
}
