/**
 * Vendors the design tokens into a consuming app (same pattern as the
 * contracts package): copies src/tokens.ts + dist/tokens.css with a vendor
 * header. Run generate-css.mjs first (or `npm run build`).
 *
 * Usage: node scripts/vendor.mjs "<destination-dir>"
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dest = process.argv[2];
if (!dest) {
  console.error('Usage: node scripts/vendor.mjs "<destination-dir>"');
  process.exit(1);
}

const cssSource = resolve(__dirname, '..', 'dist', 'tokens.css');
if (!existsSync(cssSource)) {
  console.error('dist/tokens.css missing — run `npm run build` first.');
  process.exit(1);
}

const TS_HEADER =
  '// VENDORED from @ecosystem/design-tokens — do not edit here.\n' +
  '// Canonical source: MasterMind/packages/ecosystem-design-tokens/src/tokens.ts\n' +
  '// Re-vendor with: node scripts/vendor.mjs "<this-dir>"\n';
const CSS_HEADER =
  '/* VENDORED from @ecosystem/design-tokens — do not edit here.\n' +
  '   Canonical source: MasterMind/packages/ecosystem-design-tokens (generated file).\n' +
  '   Re-vendor with: node scripts/vendor.mjs "<this-dir>" */\n';

mkdirSync(dest, { recursive: true });
writeFileSync(join(dest, 'tokens.ts'), TS_HEADER + readFileSync(resolve(__dirname, '..', 'src', 'tokens.ts'), 'utf8'));
writeFileSync(join(dest, 'tokens.css'), CSS_HEADER + readFileSync(cssSource, 'utf8'));
console.log(`Vendored design tokens -> ${dest}`);
