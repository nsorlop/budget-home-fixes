// Pinterest pins for the standalone calculator pages. Usage: node scripts/make-tool-pins.mjs [--start 2026-12-11]
import { writeFileSync, mkdirSync, copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import os from 'node:os';

const root = resolve(import.meta.dirname, '..');
const publicDir = join(root, 'public');
const outDir = join(publicDir, 'pins');
const site = 'https://thebudgethomefixes.com';
const args = process.argv.slice(2);
const si = args.indexOf('--start');
const start = new Date((si >= 0 ? args[si + 1] : '2026-12-11') + 'T00:00:00Z');
const font = ['C:/Windows/Fonts/georgiab.ttf', 'C:/Windows/Fonts/arialbd.ttf'].find((f) => existsSync(f));

const pins = [
  {
    slug: 'tool-paint-calculator', category: 'Free calculator', variant: 'c',
    title: 'How many gallons of paint do I need? Free room calculator',
    photo: '/images/paint-roller-woman-grey-wall.jpg', board: 'Painting Costs and Tips',
    link: `${site}/tools/paint-calculator/`,
    desc: 'Enter your room size, doors, windows and coats to get gallons to buy, DIY cost and a rough pro price. Free, no sign-up, runs in your browser. Formula and sources at thebudgethomefixes.com.',
  },
  {
    slug: 'tool-wallpaper-calculator', category: 'Free calculator', variant: 'b',
    title: 'How many wallpaper rolls do I need? Free calculator with pattern repeat',
    photo: '/images/wallpaper-woman-rolls-ladder.jpg', board: 'Removable Wallpaper and Decor',
    link: `${site}/tools/wallpaper-calculator/`,
    desc: 'Enter wall size, roll size and pattern repeat to see how many rolls to buy and what they cost, including pattern waste. Free, no sign-up. More at thebudgethomefixes.com.',
  },
];

function wrap(text, max) {
  const lines = []; let line = '';
  for (const w of text.split(/\s+/)) {
    if ((line + ' ' + w).trim().length > max && line) { lines.push(line); line = w; } else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  return lines;
}

function render({ imgPath, out, category, title, variant }) {
  let size = 64; let lines = wrap(title, 22);
  if (lines.length > 5) { size = 54; lines = wrap(title, 27); }
  const textH = lines.length * (size + 14);
  const tmp = mkdtempSync(join(os.tmpdir(), 'pin3-'));
  copyFileSync(font, join(tmp, 'f.ttf'));
  writeFileSync(join(tmp, 'cat.txt'), category.toUpperCase());
  writeFileSync(join(tmp, 'title.txt'), lines.join('\n'));
  writeFileSync(join(tmp, 'site.txt'), 'thebudgethomefixes.com');
  const dt = (file, color, fs, x, y, extra = '') => `drawtext=fontfile=f.ttf:textfile=${file}:expansion=none:fontcolor=${color}:fontsize=${fs}${extra}:x=${x}:y=${y}`;
  const base = ['scale=1000:1500:force_original_aspect_ratio=increase', 'crop=1000:1500'];
  let filters;
  if (variant === 'b') {
    const h = 70 + 50 + textH + 110;
    filters = [...base, `drawbox=x=0:y=0:w=1000:h=${h}:color=0xfbf8f2@0.97:t=fill`, `drawbox=x=0:y=${h}:w=1000:h=10:color=0xc1571f@1:t=fill`,
      dt('cat.txt', '0xc1571f', 30, 64, 60), dt('title.txt', '0x241f18', size, 64, 118, ':line_spacing=14'), dt('site.txt', '0x6b6459', 28, 64, h - 62)];
  } else {
    const h = 70 + 50 + textH + 120; const y = 1500 - h - 110;
    filters = [...base, `drawbox=x=60:y=${y}:w=880:h=${h}:color=0xc1571f@0.94:t=fill`, dt('cat.txt', '0xffe3cc', 30, 104, y + 52),
      dt('title.txt', 'white', size, 104, y + 110, ':line_spacing=14'), dt('site.txt', 'white@0.85', 28, 104, y + h - 66)];
  }
  const res = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', imgPath, '-vf', filters.join(','), '-frames:v', '1', '-q:v', '3', out], { cwd: tmp, encoding: 'utf8' });
  rmSync(tmp, { recursive: true, force: true });
  if (res.status !== 0) throw new Error(res.stderr);
}

const esc = (s) => '"' + String(s).replace(/"/g, '""') + '"';
mkdirSync(outDir, { recursive: true });
const rows = [['Title', 'Media URL', 'Pinterest board', 'Description', 'Link', 'Publish date']];
pins.forEach((p, i) => {
  render({ imgPath: join(publicDir, p.photo), out: join(outDir, `${p.slug}.jpg`), category: p.category, title: p.title, variant: p.variant });
  const day = new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10);
  rows.push([p.title, `${site}/pins/${p.slug}.jpg`, p.board, p.desc, p.link, day + 'T14:00:00']);
});
writeFileSync(join(root, 'pinterest', 'pins-tools.csv'), rows.map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n', 'utf8');
console.log('Wrote', pins.length, 'pins -> pinterest/pins-tools.csv');
