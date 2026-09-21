// Generates Pinterest pin images (1000x1500) from each article's hero photo and a
// bulk-upload CSV in Pinterest's format. Usage:
//   node scripts/make-pins.mjs [--start 2026-09-22] [--only slug]
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import os from 'node:os';

const root = resolve(import.meta.dirname, '..');
const blogDir = join(root, 'src/content/blog');
const publicDir = join(root, 'public');
const outDir = join(publicDir, 'pins');
const csvPath = join(root, 'pinterest', 'pins.csv');
const site = 'https://thebudgethomefixes.com';

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = arg('--only');
const startDate = new Date((arg('--start') ?? new Date(Date.now() + 86400000).toISOString().slice(0, 10)) + 'T00:00:00Z');

const boards = {
  Painting: 'Painting Costs and Tips',
  Wallpaper: 'Removable Wallpaper and Decor',
  Kitchen: 'Budget Kitchen Updates',
  Storage: 'Small Space Storage Ideas',
  Guides: 'Renter Tips and Deposit Guides',
};

const fontCandidates = ['C:/Windows/Fonts/georgiab.ttf', 'C:/Windows/Fonts/arialbd.ttf'];
const font = fontCandidates.find((f) => existsSync(f));
if (!font) throw new Error('No bold font found for drawtext');

function frontmatter(file) {
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const get = (key) => {
    const r = m[1].match(new RegExp('^' + key + ':\\s*(.+)$', 'm'));
    return r ? r[1].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1') : '';
  };
  return { title: get('title'), description: get('description'), category: get('category'), image: get('image') };
}

function wrap(text, max) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max && line) {
      lines.push(line);
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

const csvEscape = (s) => '"' + String(s).replace(/"/g, '""') + '"';

mkdirSync(outDir, { recursive: true });
mkdirSync(join(root, 'pinterest'), { recursive: true });

const files = readdirSync(blogDir).filter((f) => /\.mdx?$/.test(f)).sort();
const rows = [['Title', 'Media URL', 'Pinterest board', 'Description', 'Link', 'Publish date']];
const times = ['T14:00:00', 'T23:00:00'];
let n = 0;

for (const file of files) {
  const slug = file.replace(/\.mdx?$/, '');
  if (only && slug !== only) continue;
  const fm = frontmatter(join(blogDir, file));
  if (!fm || !fm.title || !fm.image) continue;

  const imgPath = join(publicDir, fm.image);
  if (!existsSync(imgPath)) {
    console.warn('skip (missing image):', slug, fm.image);
    continue;
  }

  let maxChars = 22;
  let fontSize = 68;
  let lines = wrap(fm.title, maxChars);
  if (lines.length > 4) {
    maxChars = 26;
    fontSize = 58;
    lines = wrap(fm.title, maxChars);
  }
  const bandH = 110 + lines.length * (fontSize + 16) + 130;
  const bandY = 1500 - bandH - 80;

  const tmp = mkdtempSync(join(os.tmpdir(), 'pin-'));
  copyFileSync(font, join(tmp, 'f.ttf'));
  writeFileSync(join(tmp, 'cat.txt'), (fm.category || 'Guide').toUpperCase());
  writeFileSync(join(tmp, 'title.txt'), lines.join('\n'));
  writeFileSync(join(tmp, 'site.txt'), 'thebudgethomefixes.com');

  const vf = [
    'scale=1000:1500:force_original_aspect_ratio=increase',
    'crop=1000:1500',
    'drawbox=x=0:y=0:w=1000:h=1500:color=0x140f0a@0.15:t=fill',
    `drawbox=x=0:y=${bandY}:w=1000:h=${bandH}:color=0x1c1611@0.88:t=fill`,
    `drawbox=x=0:y=${bandY}:w=16:h=${bandH}:color=0xc1571f@1:t=fill`,
    `drawtext=fontfile=f.ttf:textfile=cat.txt:fontcolor=0xf0b48a:fontsize=30:x=72:y=${bandY + 48}`,
    `drawtext=fontfile=f.ttf:textfile=title.txt:fontcolor=white:fontsize=${fontSize}:line_spacing=16:x=72:y=${bandY + 112}`,
    `drawtext=fontfile=f.ttf:textfile=site.txt:fontcolor=white@0.8:fontsize=30:x=72:y=${bandY + bandH - 72}`,
  ].join(',');

  const out = join(outDir, slug + '.jpg');
  const res = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', imgPath, '-vf', vf, '-frames:v', '1', '-q:v', '3', out], {
    cwd: tmp,
    encoding: 'utf8',
  });
  rmSync(tmp, { recursive: true, force: true });
  if (res.status !== 0) {
    console.error('ffmpeg failed for', slug, res.stderr);
    continue;
  }

  const day = new Date(startDate.getTime() + Math.floor(n / 2) * 86400000).toISOString().slice(0, 10);
  const desc = `${fm.description} Full breakdown with sources at thebudgethomefixes.com.`.slice(0, 500);
  rows.push([fm.title.slice(0, 100), `${site}/pins/${slug}.jpg`, boards[fm.category] ?? 'Home Budget Tips', desc, `${site}/blog/${slug}/`, day + times[n % 2]]);
  n++;
}

if (!only) {
  writeFileSync(csvPath, rows.map((r) => r.map(csvEscape).join(',')).join('\r\n') + '\r\n', 'utf8');
  console.log(`Wrote ${n} pins to public/pins and pinterest/pins.csv`);
} else {
  console.log(`Wrote pin for ${only}`);
}
