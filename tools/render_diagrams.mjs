// Render content/**/diagrams/*.dot to dist/diagrams/<tNN>/<name>.svg (used by anki_export --diagrams).
//
//   node tools/render_diagrams.mjs [--root .] [--out dist/diagrams]
//
// @viz-js/viz is resolved from web/node_modules (run `npm ci` in web/ first).
// Exit code 1 if a DOT file is invalid or the dependency is unavailable.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
function opt(name, dflt) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
}
const root = resolve(opt('--root', '.'));
const out = resolve(opt('--out', 'dist/diagrams'));

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const content = join(root, 'content');
const jobs = [];
if (existsSync(content)) {
  for (const file of walk(content)) {
    if (!file.endsWith('.dot')) continue;
    const parts = file.split(/[\\/]/);
    if (parts[parts.length - 2] !== 'diagrams') continue;
    const topicDir = parts[parts.length - 3];
    const m = /^(t(?:0[1-9]|1[0-3]))(?:-|$)/.exec(topicDir);
    if (!m) {
      console.error(`render_diagrams: skipping ${file} (topic dir "${topicDir}" has no tNN prefix)`);
      continue;
    }
    jobs.push({ file, tid: m[1], name: basename(file, '.dot') });
  }
}

let viz;
try {
  const entry = join(root, 'web', 'node_modules', '@viz-js', 'viz', 'dist', 'viz.js');
  const mod = await import(pathToFileURL(entry).href);
  viz = await mod.instance();
} catch (err) {
  console.error(`render_diagrams: cannot load @viz-js/viz (run "npm ci" in web/): ${err.message}`);
  process.exit(1);
}

let failed = 0;
for (const j of jobs) {
  const res = viz.render(readFileSync(j.file, 'utf8'), { format: 'svg', engine: 'dot' });
  if (res.status !== 'success') {
    failed++;
    console.error(`render_diagrams: ${j.file}: ${res.errors.map((e) => e.message.trim()).join('; ')}`);
    continue;
  }
  const dir = join(out, j.tid);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${j.name}.svg`), res.output);
}
console.log(`render_diagrams: ${jobs.length - failed}/${jobs.length} diagrams -> ${out}`);
process.exit(failed ? 1 : 0);
