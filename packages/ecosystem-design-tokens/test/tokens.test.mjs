/**
 * Token package checks: generation runs, CSS carries both themes, motion
 * collapses under reduced-motion, and dark/light palettes stay key-parallel.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

execFileSync(
  process.execPath,
  ['--experimental-strip-types', resolve(root, 'scripts', 'generate-css.mjs')],
  { stdio: 'pipe' }
);
const css = readFileSync(resolve(root, 'dist', 'tokens.css'), 'utf8');

let passed = 0;
const test = (name, run) => {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
};

test('generated CSS declares the dark theme as root default', () => {
  assert.ok(css.includes(":root,\n[data-eco-theme='dark']"));
  assert.ok(css.includes('--eco-color-bg: #0B0E14;'));
});

test('light variant overrides colors only', () => {
  const lightBlock = css.split("[data-eco-theme='light']")[1].split('}')[0];
  assert.ok(lightBlock.includes('--eco-color-bg: #F5F7FB;'));
  assert.ok(!lightBlock.includes('--eco-space-'), 'light block must not redefine non-color tokens');
});

test('signature glass utility exists with backdrop blur', () => {
  assert.ok(css.includes('.eco-glass'));
  assert.ok(css.includes('backdrop-filter: blur(var(--eco-blur-glass))'));
});

test('reduced motion collapses every duration to zero', () => {
  const media = css.split('@media (prefers-reduced-motion: reduce)')[1];
  for (const token of ['fast', 'base', 'slow', 'grand', 'stagger-step']) {
    assert.ok(media.includes(`--eco-motion-${token}: 0ms;`), `missing ${token} reset`);
  }
});

test('dark and light palettes are key-parallel (no theme can miss a color)', async () => {
  const { ecoColorDark, ecoColorLight } = await import('../src/tokens.ts');
  assert.deepEqual(Object.keys(ecoColorDark).sort(), Object.keys(ecoColorLight).sort());
});

console.log(`\n${passed} token tests passed.`);
