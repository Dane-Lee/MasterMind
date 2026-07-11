/**
 * Ecosystem design tokens — the single visual language for all programs
 * (milestone eco-design-tokens; Control Center ratification 2026-07-11).
 *
 * TypeScript is the SOURCE OF TRUTH; scripts/generate-css.mjs derives
 * dist/tokens.css from these objects, so the CSS and TS views can never
 * drift. Dark glass is the signature identity (ratified decision 4); the
 * light variant ships for hosts that want it.
 *
 * Consumption:
 *  - CSS: import dist/tokens.css once; use var(--eco-*) everywhere.
 *  - TS:  import { ecoTokens } from this file for programmatic use
 *         (canvas particles, chart scales, motion springs).
 */

export const ecoColorDark = {
  /** App-behind-glass backdrop. */
  bg: '#0B0E14',
  /** First resting surface (cards, drawers). */
  surface1: '#11151F',
  /** Raised surface (popovers, expanded rows). */
  surface2: '#161B28',
  /** The signature glass: layered over any host app with backdrop blur. */
  glass: 'rgba(17, 21, 31, 0.62)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  /** Hairlines and dividers on surfaces. */
  border: 'rgba(255, 255, 255, 0.06)',

  textPrimary: '#E8ECF4',
  textSecondary: '#9AA3B5',
  textTertiary: '#5C6577',
  textOnAccent: '#0B0E14',

  /** Ecosystem accent — the connective-tissue blue. */
  accent: '#5B8CFF',
  accentSoft: 'rgba(91, 140, 255, 0.16)',

  /** Status semantics — shared meaning across every program. */
  statusHealthy: '#34D399',
  statusHealthySoft: 'rgba(52, 211, 153, 0.16)',
  statusWarn: '#FBBF24',
  statusWarnSoft: 'rgba(251, 191, 36, 0.16)',
  statusError: '#F87171',
  statusErrorSoft: 'rgba(248, 113, 113, 0.16)',
  statusPaused: '#A78BFA',
  statusPausedSoft: 'rgba(167, 139, 250, 0.16)',
  /** Data-in-motion (edge particles, live counters). */
  flow: '#22D3EE',
} as const;

export const ecoColorLight = {
  bg: '#F5F7FB',
  surface1: '#FFFFFF',
  surface2: '#EEF1F8',
  glass: 'rgba(255, 255, 255, 0.72)',
  glassBorder: 'rgba(11, 14, 20, 0.08)',
  border: 'rgba(11, 14, 20, 0.08)',

  textPrimary: '#171C26',
  textSecondary: '#4A5468',
  textTertiary: '#8B94A6',
  textOnAccent: '#FFFFFF',

  accent: '#3D6FE8',
  accentSoft: 'rgba(61, 111, 232, 0.12)',

  statusHealthy: '#0FA976',
  statusHealthySoft: 'rgba(15, 169, 118, 0.12)',
  statusWarn: '#C98A04',
  statusWarnSoft: 'rgba(201, 138, 4, 0.12)',
  statusError: '#DC4C4C',
  statusErrorSoft: 'rgba(220, 76, 76, 0.12)',
  statusPaused: '#7C5CD6',
  statusPausedSoft: 'rgba(124, 92, 214, 0.12)',
  flow: '#0C9EBF',
} as const;

export const ecoType = {
  /** UI text. System-first so every program renders identically with zero font loading. */
  fontSans:
    "'Inter', 'Segoe UI Variable', 'Segoe UI', system-ui, -apple-system, sans-serif",
  /** Numbers, ids, latencies — anything that should align in columns. */
  fontMono: "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",

  size2xs: '11px',
  sizeXs: '12px',
  sizeSm: '13px',
  sizeMd: '14px',
  sizeLg: '16px',
  sizeXl: '19px',
  size2xl: '24px',
  size3xl: '30px',

  weightRegular: '450',
  weightMedium: '550',
  weightSemibold: '650',

  leadingTight: '1.2',
  leadingNormal: '1.5',
  trackingWide: '0.08em',
} as const;

export const ecoSpace = {
  s2: '2px',
  s4: '4px',
  s8: '8px',
  s12: '12px',
  s16: '16px',
  s20: '20px',
  s24: '24px',
  s32: '32px',
  s40: '40px',
  s48: '48px',
  s64: '64px',
} as const;

export const ecoRadius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  full: '999px',
} as const;

export const ecoElevation = {
  /** Resting card on a surface. */
  e1: '0 1px 2px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.04)',
  /** Floating: popovers, expanded pair drawers. */
  e2: '0 8px 24px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(255, 255, 255, 0.05)',
  /** The overlay itself. */
  e3: '0 24px 64px rgba(0, 0, 0, 0.55)',
  /** Accent glow for live/selected nodes and edges. */
  glowAccent: '0 0 20px rgba(91, 140, 255, 0.35)',
  glowHealthy: '0 0 16px rgba(52, 211, 153, 0.35)',
  glowError: '0 0 16px rgba(248, 113, 113, 0.4)',
} as const;

export const ecoBlur = {
  /** Behind popovers. */
  soft: '12px',
  /** Behind the signature glass overlay. */
  glass: '24px',
} as const;

export const ecoMotion = {
  /** Micro feedback: hover states, toggle knobs. */
  fast: '120ms',
  /** Standard transitions: fades, color shifts. */
  base: '200ms',
  /** Structural: drawers, expanding pairs. */
  slow: '320ms',
  /** Grand entrances: the overlay descending, constellation stagger. */
  grand: '560ms',

  /** Default: fast out, settled in. */
  easeStandard: 'cubic-bezier(0.2, 0, 0, 1)',
  /** Entrances with life: slight overshoot. */
  easeSpring: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
  /** Exits: accelerate away. */
  easeExit: 'cubic-bezier(0.4, 0, 1, 1)',

  /** Per-node delay for the constellation entrance stagger. */
  staggerStep: '40ms',
} as const;

export const ecoZ = {
  header: '100',
  popover: '600',
  /** The Control Center overlay sits above everything in any host app. */
  overlay: '1000',
} as const;

export const ecoTokens = {
  colorDark: ecoColorDark,
  colorLight: ecoColorLight,
  type: ecoType,
  space: ecoSpace,
  radius: ecoRadius,
  elevation: ecoElevation,
  blur: ecoBlur,
  motion: ecoMotion,
  z: ecoZ,
} as const;

export type EcoTheme = 'dark' | 'light';

/** Programmatic color lookup for canvas/SVG code (particles, charts). */
export function ecoColors(theme: EcoTheme = 'dark') {
  return theme === 'dark' ? ecoColorDark : ecoColorLight;
}
