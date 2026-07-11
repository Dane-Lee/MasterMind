/**
 * Derives dist/tokens.css from src/tokens.ts (the source of truth), so the
 * CSS variables and TS constants can never drift. Also emits the base rules
 * every consumer gets for free: theme switching, reduced-motion respect, and
 * the signature glass utility classes.
 *
 * Usage: node scripts/generate-css.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Compile-free import via Node's type stripping — run with:
//   node --experimental-strip-types scripts/generate-css.mjs
// (the package scripts pass the flag).
const { ecoColorDark, ecoColorLight, ecoType, ecoSpace, ecoRadius, ecoElevation, ecoBlur, ecoMotion, ecoZ } =
  await import('../src/tokens.ts');

const kebab = (key) => key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const vars = (obj, prefix) =>
  Object.entries(obj)
    .map(([key, value]) => `  --eco-${prefix}-${kebab(key)}: ${value};`)
    .join('\n');

const colorVars = (palette) => vars(palette, 'color');

const css = `/* GENERATED from src/tokens.ts — do not edit by hand. */
/* @ecosystem/design-tokens — dark glass is the signature (ratified 2026-07-11). */

:root,
[data-eco-theme='dark'] {
${colorVars(ecoColorDark)}
${vars(ecoType, 'type')}
${vars(ecoSpace, 'space')}
${vars(ecoRadius, 'radius')}
${vars(ecoElevation, 'elevation')}
${vars(ecoBlur, 'blur')}
${vars(ecoMotion, 'motion')}
${vars(ecoZ, 'z')}
}

[data-eco-theme='light'] {
${colorVars(ecoColorLight)}
}

/* --- Base utilities every program shares ---------------------------------- */

.eco-glass {
  background: var(--eco-color-glass);
  border: 1px solid var(--eco-color-glass-border);
  backdrop-filter: blur(var(--eco-blur-glass));
  -webkit-backdrop-filter: blur(var(--eco-blur-glass));
  border-radius: var(--eco-radius-xl);
  box-shadow: var(--eco-elevation-e3);
}

.eco-surface {
  background: var(--eco-color-surface1);
  border: 1px solid var(--eco-color-border);
  border-radius: var(--eco-radius-lg);
  box-shadow: var(--eco-elevation-e1);
}

.eco-text {
  color: var(--eco-color-text-primary);
  font-family: var(--eco-type-font-sans);
  font-size: var(--eco-type-size-md);
  line-height: var(--eco-type-leading-normal);
}

.eco-mono {
  font-family: var(--eco-type-font-mono);
  font-variant-numeric: tabular-nums;
}

.eco-focus-ring:focus-visible {
  outline: 2px solid var(--eco-color-accent);
  outline-offset: 2px;
}

/* Motion discipline: one transition vocabulary, and it disappears entirely
   for users who ask for reduced motion. */
.eco-transition {
  transition-duration: var(--eco-motion-base);
  transition-timing-function: var(--eco-motion-ease-standard);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --eco-motion-fast: 0ms;
    --eco-motion-base: 0ms;
    --eco-motion-slow: 0ms;
    --eco-motion-grand: 0ms;
    --eco-motion-stagger-step: 0ms;
  }
}
`;

const out = resolve(__dirname, '..', 'dist', 'tokens.css');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, css, 'utf8');
console.log(`Generated ${out} (${css.length} bytes)`);
