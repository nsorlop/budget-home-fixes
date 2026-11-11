// Second Pinterest batch: 2 fresh designs per article (different photo + layout),
// titled with a real FAQ question from the article and described with its answer.
// Usage: node scripts/make-pins-batch2.mjs [--start 2026-11-12]
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import os from 'node:os';

const root = resolve(import.meta.dirname, '..');
const blogDir = join(root, 'src/content/blog');
const publicDir = join(root, 'public');
const outDir = join(publicDir, 'pins');
const csvPath = join(root, 'pinterest', 'pins-batch2.csv');
const site = 'https://thebudgethomefixes.com';

const args = process.argv.slice(2);
const startArg = args.indexOf('--start');
const startDate = new Date((startArg >= 0 ? args[startArg + 1] : new Date(Date.now() + 86400000).toISOString().slice(0, 10)) + 'T00:00:00Z');

const boards = {
  Painting: 'Painting Costs and Tips',
  Wallpaper: 'Removable Wallpaper and Decor',
  Kitchen: 'Budget Kitchen Updates',
  Storage: 'Small Space Storage Ideas',
  Guides: 'Renter Tips and Deposit Guides',
};

const font = ['C:/Windows/Fonts/georgiab.ttf', 'C:/Windows/Fonts/arialbd.ttf'].find((f) => existsSync(f));
if (!font) throw new Error('No bold font found');

const clean = (s) =>
  s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function wrap(text, max) {
  const lines = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    if ((line + ' ' + w).trim().length > max && line) {
      lines.push(line);
      line = w;
    } else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  return lines;
}

function parse(file) {
  const raw = readFileSync(file, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1];
  const g = (k) => {
    const m = fm.match(new RegExp('^' + k + ':\\s*(.+)$', 'm'));
    return m ? m[1].trim().replace(/^"|"$/g, '') : '';
  };
  const body = raw.replace(/^---[\s\S]*?---/, '');
  const images = [...new Set([g('image'), ...[...body.matchAll(/\/images\/[\w-]+\.jpg/g)].map((m) => m[0])])].filter(Boolean);

  const lines = body.split(/\r?\n/);
  const faqStart = lines.findIndex((l) => /^## .*FAQ/i.test(l));
  const faq = [];
  if (faqStart >= 0) {
    let i = faqStart + 1;
    while (i < lines.length && !/^## /.test(lines[i])) {
      if (/^### /.test(lines[i])) {
        const q = clean(lines[i].replace(/^### /, ''));
        const ans = [];
        i++;
        while (i < lines.length && !/^#{2,3} /.test(lines[i])) {
          if (lines[i].trim()) ans.push(lines[i]);
          i++;
        }
        faq.push({ q, a: clean(ans.join(' ')) });
      } else i++;
    }
  }
  return { title: g('title'), category: g('category'), images, faq };
}

function shorten(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '));
  return end > 120 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + '...';
}

function render({ imgPath, out, category, title, variant }) {
  let size = 64;
  let lines = wrap(title, 22);
  if (lines.length > 5) {
    size = 54;
    lines = wrap(title, 27);
  }
  const textH = lines.length * (size + 14);
  const tmp = mkdtempSync(join(os.tmpdir(), 'pin2-'));
  copyFileSync(font, join(tmp, 'f.ttf'));
  writeFileSync(join(tmp, 'cat.txt'), category.toUpperCase());
  writeFileSync(join(tmp, 'title.txt'), lines.join('\n'));
  writeFileSync(join(tmp, 'site.txt'), 'thebudgethomefixes.com');

  const dt = (file, color, fs, x, y, extra = '') =>
    `drawtext=fontfile=f.ttf:textfile=${file}:expansion=none:fontcolor=${color}:fontsize=${fs}${extra}:x=${x}:y=${y}`;

  const base = ['scale=1000:1500:force_original_aspect_ratio=increase', 'crop=1000:1500'];
  let filters;
  if (variant === 'b') {
    // cream card at the top, dark text
    const h = 70 + 50 + textH + 110;
    filters = [
      ...base,
      `drawbox=x=0:y=0:w=1000:h=${h}:color=0xfbf8f2@0.97:t=fill`,
      `drawbox=x=0:y=${h}:w=1000:h=10:color=0xc1571f@1:t=fill`,
      dt('cat.txt', '0xc1571f', 30, 64, 60),
      dt('title.txt', '0x241f18', size, 64, 118, ':line_spacing=14'),
      dt('site.txt', '0x6b6459', 28, 64, h - 62),
    ];
  } else {
    // terracotta block in the lower third, white text
    const h = 70 + 50 + textH + 120;
    const y = 1500 - h - 110;
    filters = [
      ...base,
      `drawbox=x=60:y=${y}:w=880:h=${h}:color=0xc1571f@0.94:t=fill`,
      dt('cat.txt', '0xffe3cc', 30, 104, y + 52),
      dt('title.txt', 'white', size, 104, y + 110, ':line_spacing=14'),
      dt('site.txt', 'white@0.85', 28, 104, y + h - 66),
    ];
  }
  const res = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', imgPath, '-vf', filters.join(','), '-frames:v', '1', '-q:v', '3', out], {
    cwd: tmp,
    encoding: 'utf8',
  });
  rmSync(tmp, { recursive: true, force: true });
  if (res.status !== 0) throw new Error(res.stderr);
}

const csvEscape = (s) => '"' + String(s).replace(/"/g, '""') + '"';
mkdirSync(outDir, { recursive: true });
mkdirSync(join(root, 'pinterest'), { recursive: true });

const articles = readdirSync(blogDir)
  .filter((f) => /\.mdx?$/.test(f))
  .sort()
  .map((f) => ({ slug: f.replace(/\.mdx?$/, ''), ...parse(join(blogDir, f)) }));

// variant-major order so pins for the same article are ~10 days apart
const jobs = [];
for (const variant of ['b', 'c']) {
  articles.forEach((a) => {
    const faq = a.faq.filter((f) => f.q.length <= 100 && f.a.length > 40 && !/\b(they|them|these|those)\b/i.test(f.q));
    const q = variant === 'b' ? faq[0] : faq[1] ?? faq[0];
    if (!q) return;
    const photo = variant === 'b' ? a.images[1] ?? a.images[0] : a.images[2] ?? a.images[1] ?? a.images[0];
    jobs.push({ a, variant, q, photo });
  });
}

const rows = [['Title', 'Media URL', 'Pinterest board', 'Description', 'Link', 'Publish date']];
const slots = ['T14:00:00', 'T23:00:00'];
let n = 0;
for (const { a, variant, q, photo } of jobs) {
  const imgPath = join(publicDir, photo);
  if (!existsSync(imgPath)) {
    console.warn('missing image', photo, a.slug);
    continue;
  }
  const out = join(outDir, `${a.slug}-${variant}.jpg`);
  render({ imgPath, out, category: a.category, title: q.q, variant });
  const day = new Date(startDate.getTime() + Math.floor(n / 2) * 86400000).toISOString().slice(0, 10);
  const desc = shorten(q.a, 380) + ' Full guide with sources at thebudgethomefixes.com.';
  rows.push([q.q, `${site}/pins/${a.slug}-${variant}.jpg`, boards[a.category] ?? 'Home Budget Tips', desc, `${site}/blog/${a.slug}/`, day + slots[n % 2]]);
  n++;
}
writeFileSync(csvPath, rows.map((r) => r.map(csvEscape).join(',')).join('\r\n') + '\r\n', 'utf8');
console.log(`Wrote ${n} pins -> public/pins and pinterest/pins-batch2.csv (last publish ${rows[rows.length - 1][5]})`);
