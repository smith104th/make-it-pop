// node build.mjs → docs/ (served by GitHub Pages from main /docs)
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const OUT = 'docs';
rmSync(OUT, { recursive: true, force: true });
for (const d of [OUT, `${OUT}/fonts`, `${OUT}/icons`]) mkdirSync(d, { recursive: true });

const res = await build({
  entryPoints: ['src/main.js'], bundle: true, format: 'esm', minify: true, write: false,
  target: ['es2020', 'safari15'], logLevel: 'error',
});
const js = res.outputFiles[0].text;
const css = readFileSync('src/styles.css', 'utf8');
const version = createHash('sha1').update(js + css).digest('hex').slice(0, 8);

writeFileSync(`${OUT}/app.js`, js);
writeFileSync(`${OUT}/styles.css`, css);
writeFileSync(`${OUT}/index.html`, readFileSync('src/index.html', 'utf8').replaceAll('__VERSION__', version));
writeFileSync(`${OUT}/sw.js`, readFileSync('src/sw.js', 'utf8').replaceAll('__VERSION__', version));
copyFileSync('src/manifest.webmanifest', `${OUT}/manifest.webmanifest`);
copyFileSync('src/wordmark.png', `${OUT}/wordmark.png`);
copyFileSync('node_modules/@fontsource-variable/chivo-mono/files/chivo-mono-latin-wght-normal.woff2', `${OUT}/fonts/chivo-mono.woff2`);
writeFileSync(`${OUT}/.nojekyll`, '');

// Icon: the Ademan mark (two halves, merged) on dusty pink.
const icon = (size, markScale) => {
  const r = (size * markScale) / 2, c = size / 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#FCD5BD"/>
    <path d="M${c - r} ${c}a${r} ${r} 0 0 1 ${2 * r} 0z" fill="#2354B5"/>
    <path d="M${c - r} ${c}a${r} ${r} 0 0 0 ${2 * r} 0z" fill="#A5C8D1"/>
  </svg>`);
};
await sharp(icon(512, 0.56)).png().toFile(`${OUT}/icons/icon-512.png`);
await sharp(icon(512, 0.44)).png().toFile(`${OUT}/icons/icon-maskable-512.png`);
await sharp(icon(192, 0.56)).png().toFile(`${OUT}/icons/icon-192.png`);
await sharp(icon(180, 0.56)).png().toFile(`${OUT}/icons/apple-touch-icon.png`);
await sharp(icon(64, 0.62)).png().toFile(`${OUT}/icons/favicon-64.png`);

// Share image: pink card, the mark, the Ademan wordmark.
const W = 1200, H = 630;
const og = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#FCD5BD"/>
  <path d="M440 300a160 160 0 0 1 320 0z" fill="#2354B5"/>
  <path d="M440 300a160 160 0 0 0 320 0z" fill="#A5C8D1"/>
</svg>`);
const mark = await sharp('src/wordmark.png').resize(300).png().toBuffer();
await sharp(og).composite([{ input: mark, left: (W - 300) / 2, top: 530 }]).jpeg({ quality: 86, mozjpeg: true }).toFile(`${OUT}/og.jpg`);

console.log(`built ${OUT}/ · v${version} · app.js ${(js.length / 1024).toFixed(0)}KB`);
