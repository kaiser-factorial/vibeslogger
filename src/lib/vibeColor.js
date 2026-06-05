/**
 * Returns an HSL color for a logged vibe based on:
 *   valence (1–10) → hue:       red (0°) → yellow (60°) → green (120°)
 *   arousal (1–10) → lightness: dim (25%) → bright (65%)
 *
 * The zone backgrounds stay as-is; this only applies to plotted points.
 */
export function vibeColor(valence, arousal) {
  const hue       = ((valence - 1) / 9) * 120          // 0° → 120°
  const lightness = 25 + ((arousal - 1) / 9) * 40      // 25% → 65%
  return `hsl(${hue.toFixed(1)}, 80%, ${lightness.toFixed(1)}%)`
}
