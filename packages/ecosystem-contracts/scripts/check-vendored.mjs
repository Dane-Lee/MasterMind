/**
 * Contracts drift check (ECOSYSTEM_IMPROVEMENTS.md B4).
 *
 * Every consuming app gets a compile-in-place copy of src/ via vendor.mjs
 * (no shared package registry). This script hashes the canonical source
 * against each registered vendor location and fails loudly the moment any
 * copy falls behind, so drift surfaces at check-in time instead of silently
 * accumulating across sessions.
 *
 * Usage: node scripts/check-vendored.mjs
 * Add a new consumer by adding its destination path to VENDOR_LOCATIONS below
 * (the same path passed to vendor.mjs when it was first vendored there).
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '..', 'src');

// Every location vendor.mjs has been pointed at. Keep in sync with
// INTEGRATION_PLAN.md / SESSION_LOG.md's vendoring notes.
const VENDOR_LOCATIONS = [
  String.raw`C:\Users\dlee5\OneDrive\Desktop\AthleteOS\project-app-1\project\server\src\ecosystem-contracts`,
  String.raw`C:\Users\dlee5\OneDrive\Desktop\Swim State Pro\swim-state-pro-2\src\ecosystem-contracts`,
  String.raw`C:\Users\dlee5\OneDrive\Desktop\Olbrecht Energy Tracker\app\project\src\ecosystem-contracts`,
];

// Python bindings vendored as a single file (FormLab Engine). Compared
// against python/ecosystem_contracts/__init__.py minus the 3-line header.
const PYTHON_VENDOR_LOCATIONS = [
  String.raw`C:\Users\dlee5\OneDrive\Desktop\FormLab\FormLab-Engine\ecosystem_contracts\__init__.py`,
];
const PYTHON_CANONICAL = path.resolve(
  __dirname,
  '..',
  'python',
  'ecosystem_contracts',
  '__init__.py',
);
const PYTHON_HEADER_PREFIX = '# VENDORED from @ecosystem/contracts';

const HEADER_PREFIX = '// VENDORED from @ecosystem/contracts';

function collectTsFiles(dir, base = dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(full, base));
    } else if (entry.name.endsWith('.ts')) {
      results.push(path.relative(base, full).replace(/\\/g, '/'));
    }
  }
  return results;
}

function hashFile(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath, 'utf8')).digest('hex');
}

function stripVendorHeader(content) {
  if (!content.startsWith(HEADER_PREFIX)) return content;
  // The header is exactly 3 lines (see vendor.mjs); strip them before hashing.
  const lines = content.split('\n');
  return lines.slice(3).join('\n');
}

const canonicalFiles = collectTsFiles(srcDir);
let driftFound = false;

for (const dest of VENDOR_LOCATIONS) {
  let locationDrift = false;

  if (!fs.existsSync(dest)) {
    console.error(`MISSING: ${dest} does not exist (never vendored, or moved).`);
    driftFound = true;
    continue;
  }

  const vendoredFiles = collectTsFiles(dest);
  const missing = canonicalFiles.filter((f) => !vendoredFiles.includes(f));
  const extra = vendoredFiles.filter((f) => !canonicalFiles.includes(f));

  for (const file of missing) {
    console.error(`MISSING FILE: ${file} not vendored into ${dest}`);
    locationDrift = true;
  }
  for (const file of extra) {
    console.error(`STALE FILE: ${file} exists in ${dest} but not in canonical src/ (re-vendor to prune)`);
    locationDrift = true;
  }

  for (const file of canonicalFiles) {
    if (!vendoredFiles.includes(file)) continue;
    const canonicalHash = hashFile(path.join(srcDir, file));
    const vendoredContent = stripVendorHeader(fs.readFileSync(path.join(dest, file), 'utf8'));
    const vendoredHash = createHash('sha256').update(vendoredContent).digest('hex');

    if (canonicalHash !== vendoredHash) {
      console.error(`DRIFT: ${file} in ${dest} does not match canonical source.`);
      locationDrift = true;
    }
  }

  if (locationDrift) {
    driftFound = true;
  } else {
    console.log(`OK: ${dest} (${vendoredFiles.length} files, all match canonical source)`);
  }
}

for (const dest of PYTHON_VENDOR_LOCATIONS) {
  if (!fs.existsSync(dest)) {
    console.error(`MISSING: ${dest} does not exist (Python bindings never vendored, or moved).`);
    driftFound = true;
    continue;
  }
  const canonicalHash = createHash('sha256')
    .update(fs.readFileSync(PYTHON_CANONICAL, 'utf8'))
    .digest('hex');
  const vendoredContent = fs.readFileSync(dest, 'utf8');
  const stripped = vendoredContent.startsWith(PYTHON_HEADER_PREFIX)
    ? vendoredContent.split('\n').slice(3).join('\n')
    : vendoredContent;
  const vendoredHash = createHash('sha256').update(stripped).digest('hex');
  if (canonicalHash !== vendoredHash) {
    console.error(`DRIFT: Python bindings in ${dest} do not match canonical source.`);
    driftFound = true;
  } else {
    console.log(`OK: ${dest} (Python bindings match canonical source)`);
  }
}

if (driftFound) {
  console.error('\nContracts drift detected. Re-vendor with:');
  console.error('  node scripts/vendor.mjs "<destination-dir>"');
  console.error('  (Python: re-copy python/ecosystem_contracts/__init__.py with the 3-line header)');
  process.exit(1);
} else {
  console.log(
    `\nAll ${VENDOR_LOCATIONS.length + PYTHON_VENDOR_LOCATIONS.length} vendor locations match canonical source.`,
  );
}
