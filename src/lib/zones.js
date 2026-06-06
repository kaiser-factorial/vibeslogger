export const ZONE_META = {
  lfg:      { label: 'LETS FUCKING GOOOO',    color: '#c5b800' },
  back:     { label: 'we are so fucking back', color: '#4a7a1e' },
  ball:     { label: 'fuck it we ball',        color: '#8a2020' },
  over:     { label: "it's so over",           color: '#407A96' },
  vibing:   { label: 'we vibing',              color: '#4896A8' },
  whatitis: { label: 'it is what it is',       color: '#916018' },
  mwbs:     { label: 'log off forever',         color: '#484898' },
}

export const ZONE_ORDER = ['lfg', 'back', 'ball', 'vibing', 'over', 'whatitis', 'mwbs']

// Maps (valence, arousal) to a zone id, based on SVG mockup boundaries.
// Zone split points (converted from grid %):
//   valence: 4.8 (42%), 6.1 (57%), 8.0 (78%)
//   arousal: 4.5 (61%), 6.1 (43%), 8.4 (18% from top)
// "whatitis" is an upside-down T: horizontal band (v<6.1, 4.5≤a≤6.1)
//   plus vertical column (4.8≤v<6.1, a<4.5).
export function getZone(valence, arousal) {
  if (valence >= 8.0 && arousal >= 8.4) return 'lfg'
  if (valence <= 2.4 && arousal <= 2.2) return 'mwbs'
  if (arousal > 6.1)  return valence < 4.8 ? 'ball' : 'back'
  if (arousal >= 4.5) return valence < 6.1 ? 'whatitis' : 'back'
  if (valence < 4.8)  return 'over'
  if (valence < 6.1)  return 'whatitis'
  return 'vibing'
}
