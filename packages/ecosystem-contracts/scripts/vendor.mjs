/**
 * Vendor the contract source into a consuming app.
 *
 * The ecosystem apps are independent repos with no shared package registry,
 * so each app gets a local, compile-in-place copy of the contract TypeScript
 * source (zero-dependency, compiles under any reasonable tsconfig). The
 * VERSIONING.md "keep representations in sync" rule governs re-vendoring.
 *
 * Usage:
 *   node scripts/vendor.mjs "<destination-dir>"
 * Example:
 *   node scripts/vendor.mjs "C:/.../AthleteOS/.../server/src/ecosystem-contracts"
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '..', 'src');
const dest = process.argv[2];

if (!dest) {
  console.error('Usage: node scripts/vendor.mjs "<destination-dir>"');
  process.exit(1);
}

const HEADER =
  '// VENDORED from @ecosystem/contracts — do not edit here.\n' +
  '// Canonical source: MasterMind/packages/ecosystem-contracts/src. See VERSIONING.md.\n' +
  `// Re-vendor with: node scripts/vendor.mjs "<this-dir>"\n`;

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const fromPath = path.join(from, entry.name);
    const toPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(fromPath, toPath);
    } else if (entry.name.endsWith('.ts')) {
      const body = fs.readFileSync(fromPath, 'utf8');
      fs.writeFileSync(toPath, HEADER + body, 'utf8');
    }
  }
}

fs.rmSync(dest, { recursive: true, force: true });
copyDir(srcDir, dest);

const count = fs
  .readdirSync(dest, { recursive: true })
  .filter((f) => String(f).endsWith('.ts')).length;
console.log(`Vendored ${count} contract files -> ${dest}`);
