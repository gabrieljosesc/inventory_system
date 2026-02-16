/**
 * Creates a zip of the project excluding node_modules, build outputs, and secrets.
 * Run from repo root: node scripts/create-zip.js
 * Output: inventory_system.zip in the parent folder (or current dir).
 */
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'inventory_system.zip');

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', '.cursor', 'coverage', '.idea', '.vscode']);
const SKIP_FILES = new Set(['.env', '.env.local', 'inventory_system.zip']);
const SKIP_PATTERNS = [/\.log$/];

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function shouldSkip(relativePath) {
  const parts = relativePath.split(path.sep);
  if (parts.some((p) => SKIP_DIRS.has(p))) return true;
  const base = path.basename(relativePath);
  if (SKIP_FILES.has(base)) return true;
  if (SKIP_PATTERNS.some((re) => re.test(base))) return true;
  return false;
}

function addDir(archive, dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const rel = prefix ? `${prefix}${path.sep}${ent.name}` : ent.name;
    if (shouldSkip(rel)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      addDir(archive, full, rel);
    } else {
      archive.file(full, { name: `inventory_system/${toPosix(rel)}` });
    }
  }
}

const output = fs.createWriteStream(OUT);
const archive = archiver('zip', { zlib: { level: 9 } });

archive.pipe(output);
addDir(archive, ROOT);

output.on('close', () => {
  console.log('Created:', OUT);
  console.log('Size (MB):', (archive.pointer() / 1024 / 1024).toFixed(2));
});

archive.finalize();

archive.on('error', (err) => {
  console.error(err);
  process.exit(1);
});
