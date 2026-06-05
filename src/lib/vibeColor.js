/**
 * Returns an HSL color for a logged vibe based on:
 *   valence (1–10) → hue:        red (0°) → yellow (60°) → green (120°)
 *   arousal (1–10) → saturation: muted (35%) → vivid (90%)
 *   arousal (1–10) → lightness:  dim (28%) → bright (50%)
 *
 * Encoding both saturation and lightness with arousal gives low-energy dots
 * a grey/flat look and high-energy dots a vivid, alive appearance.
 * Zone backgrounds are unaffected — this only applies to plotted points.
 */
export function vibeColor(valence, arousal) {
  const t          = (arousal  - 1) / 9   // 0 → 1
  const hue        = ((valence - 1) / 9) * 120   // 0° → 120°
  const saturation = 35 + t * 55                  // 35% → 90%
  const lightness  = 28 + t * 22                  // 28% → 50%
  return `hsl(${hue.toFixed(1)}, ${saturation.toFixed(1)}%, ${lightness.toFixed(1)}%)`
}
