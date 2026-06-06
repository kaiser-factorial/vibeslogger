// Dynamic UI accent. The site's accent color tracks the most recent vibe logged
// this session: clicking the yellow "LFG" zone tints buttons yellow, "it is what
// it is" tints them orange, and so on. Before any vibe is logged (and on the auth
// screen) the accent is a neutral cream/charcoal scheme.
//
// applyAccent() sets the same CSS custom properties declared in index.css :root,
// so a single call repaints every button, focus ring, glow, and highlight.

import { ZONE_META, type ZoneId } from './zones'

const STORAGE_KEY = 'vl-accent-zone'

// Neutral default. Mirrors the :root values in index.css so JS and first paint agree.
const CREAM = {
  accent: '#e7decb',
  hover:  '#f3ecdb',
  ink:    '#1a1a1a',
  rgb:    '231, 222, 203',
}

export interface Palette {
  accent: string
  hover: string
  ink: string
  rgb: string
  glow: string
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

// Mix a color toward white by `amount` (0–1) for a lighter hover shade.
function lighten([r, g, b]: [number, number, number], amount: number): string {
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

// Perceptual luminance (0–1), used to pick readable ink (button text) on the accent.
function luminance([r, g, b]: [number, number, number]): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

// Exported so the log modal can preview a zone's accent (and the neutral cream
// default via `paletteFor(null)`) without applying it globally.
export function paletteFor(zone: ZoneId | null): Palette {
  if (!zone) return { ...CREAM, glow: `rgba(${CREAM.rgb}, 0.45)` }
  const rgb = hexToRgb(ZONE_META[zone].color)
  return {
    accent: ZONE_META[zone].color,
    hover:  lighten(rgb, 0.14),
    // Dark text on light accents (e.g. the yellow LFG zone), light text otherwise.
    ink:    luminance(rgb) > 0.58 ? '#1a1a1a' : '#fdfdfa',
    rgb:    rgb.join(', '),
    glow:   `rgba(${rgb.join(', ')}, 0.45)`,
  }
}

/** Paint the accent CSS variables on :root for the given zone (or cream when null). */
export function applyAccent(zone: ZoneId | null): void {
  const p = paletteFor(zone)
  const root = document.documentElement.style
  root.setProperty('--accent', p.accent)
  root.setProperty('--accent-hover', p.hover)
  root.setProperty('--accent-ink', p.ink)
  root.setProperty('--accent-rgb', p.rgb)
  root.setProperty('--accent-glow', p.glow)
}

/** The zone accent remembered for this browser session, if any. */
export function loadStoredZone(): ZoneId | null {
  const z = sessionStorage.getItem(STORAGE_KEY)
  return z && z in ZONE_META ? (z as ZoneId) : null
}

export function storeZone(zone: ZoneId): void {
  sessionStorage.setItem(STORAGE_KEY, zone)
}

export function clearStoredZone(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
