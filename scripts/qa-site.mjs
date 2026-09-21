// Post-build audit: broken internal links/assets and article metadata.
// Usage: npm run build && node scripts/qa-site.mjs
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BS = String.fromCharCode(92);
const norm = (p) => p.split(BS).join('/');
const dist = 'dist';
const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const htmls = walk(dist).filter((f) => f.endsWith('.html'));
const broken = [];
const missingAssets = [];
for (const f of htmls) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)[^"]*"/g)) {
    const p = m[1];
    if (p.startsWith('//')) continue;
    const target = join(dist, p);
    const ok =
      (existsSync(target) && statSync(target).isFile()) ||
      existsSync(join(target, 'index.html')) ||
      existsSync(target + '.html');
    if (!ok) (/\.(jpg|png|svg|ico|css|js)$/.test(p) ? missingAssets : broken).push(`${norm(f)} -> ${p}`);
  }
}
console.log('HTML files:', htmls.length);
console.log('Broken internal links:', broken.length);
broken.slice(0, 30).forEach((x) => console.log('  ', x));
console.log('Missing assets:', missingAssets.length);
missingAssets.slice(0, 30).forEach((x) => console.log('  ', x));

const blog = 'src/content/blog';
const rows = [];
for (const f of readdirSync(blog)) {
  const raw = readFileSync(join(blog, f), 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1];
  const g = (k) => {
    const m = fm.match(new RegExp('^' + k + ':\\s*(.+)$', 'm'));
    return m ? m[1].replace(/^"|"$/g, '') : '';
  };
  const body = raw.replace(/^---[\s\S]*?---/, '').replace(/^import .*$/gm, '');
  const parts = body.split(/^## Sources/m);
  const words = parts[0].replace(/<[^>]+>/g, ' ').split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
  const sources = (parts[1] || '').split(/\r?\n/).filter((l) => l.startsWith('- [')).length;
  rows.push({
    slug: f.replace(/\.mdx?$/, ''),
    title: g('title').length,
    desc: g('description').length,
    words,
    sources,
    hero: existsSync('public' + g('image')),
  });
}
console.log('\nslug | title chars | desc chars | words | sources | hero exists');
rows.forEach((r) => console.log(`${r.slug} | ${r.title} | ${r.desc} | ${r.words} | ${r.sources} | ${r.hero}`));
