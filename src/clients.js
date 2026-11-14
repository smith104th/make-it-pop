// Made-up clients. Any resemblance to a real brand is the brand's fault.
import { CHAINS, maxLevel } from './art.js';

export const SECTORS = {
  fashion: {
    types: ['Fashion label', 'Swimwear brand', 'Knitwear line', 'Shoe brand', 'Denim brand'],
    names: ['Maison Lúa', 'Atelier Nube', 'Casa Bruma', 'Studio Ferro', 'Hilo Negro', 'Oda Swim', 'Línea Sur', 'Talle Único'],
  },
  beauty: {
    types: ['Skincare brand', 'Fragrance house', 'Hair care line', 'Nail studio', 'Makeup brand'],
    names: ['Sal y Piel', 'Oro Skin', 'Petal Lab', 'Agua Clara', 'Lumen Hair', 'Bruma Beauty', 'Rubor'],
  },
  hospitality: {
    types: ['Boutique hotel', 'Cocktail bar', 'Café', 'Restaurant', 'Winery', 'Beach club'],
    names: ['Hotel Ombú', 'Bar Sereno', 'Café Tilo', 'Posada Ámbar', 'Casa Jacarandá', 'Fuego Lento', 'Bodega Alta', 'Club Marea'],
  },
  lifestyle: {
    types: ['Home goods brand', 'Ceramics studio', 'Candle brand', 'Wellness club', 'Stationery brand'],
    names: ['Hilo Home', 'Barro Ceramics', 'Pampa Goods', 'Tierra Candles', 'Club Siesta', 'Papel Lento', 'Mimbre'],
  },
};

const PLACES = [
  'Palermo', 'José Ignacio', 'Tulum', 'Brooklyn', 'Medellín', 'Mykonos', 'Lisbon', 'Mexico City',
  'Cartagena', 'Ibiza', 'SoHo', 'Punta del Este', 'Mendoza', 'Bogotá', 'Silver Lake', 'Copenhagen',
];

const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function unlockedChains(level) {
  return Object.keys(CHAINS).filter((k) => CHAINS[k].unlock <= level);
}

export const xpNeed = (level) => 20 + (level - 1) * 15;

export function firstOrder() {
  return {
    client: { name: 'Café Tilo', type: 'Café', sector: 'hospitality', place: 'Palermo' },
    needs: [{ c: 'type', l: 2 }],
    coins: 15,
    xp: 8,
  };
}

export function makeOrder(S) {
  const L = S.level;
  const taken = new Set(S.orders.map((o) => o && o.client.name));
  const sector = pick(Object.keys(SECTORS));
  let name = pick(SECTORS[sector].names);
  for (let k = 0; k < 8 && taken.has(name); k++) name = pick(SECTORS[sector].names);
  const client = { name, type: pick(SECTORS[sector].types), sector, place: pick(PLACES) };

  const r = Math.random();
  const count = L < 2 ? 1 : L < 4 ? (r < 0.6 ? 1 : 2) : r < 0.3 ? 1 : r < 0.75 ? 2 : 3;
  const chains = unlockedChains(L);
  // Spread the asks across chains: a chain other clients already want is less likely.
  const used = {};
  S.orders.forEach((o) => o && o.needs.forEach((n) => { used[n.c] = (used[n.c] || 0) + 1; }));
  const pickChain = () => {
    const w = chains.map((c) => 1 / (1 + (used[c] || 0)));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < chains.length; i++) { r -= w[i]; if (r <= 0) return chains[i]; }
    return chains[0];
  };
  const needs = [];
  for (let i = 0; i < count; i++) {
    const c = pickChain();
    used[c] = (used[c] || 0) + 1;
    const top = Math.min(maxLevel(c), 1 + Math.ceil(L * 0.8));
    const low = Math.max(2, top - 2);
    const l = Math.min(top, low + Math.floor(Math.random() ** 1.6 * (top - low + 1)));
    needs.push({ c, l });
  }
  needs.sort((a, b) => b.l - a.l);
  const base = needs.reduce((a, n) => a + 5 * 2 ** (n.l - 1), 0) + 5;
  const coins = Math.round(base * (S.rooms.lab ? 1.25 : 1));
  const xp = needs.reduce((a, n) => a + n.l * 3, 0) + 2;
  return { client, needs, coins, xp };
}
