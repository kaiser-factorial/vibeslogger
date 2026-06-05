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

// Maps a (valence, arousal) coordinate to a zone id.
// Special corners take priority, then quadrant split at 5/5,
// with the middle band (3.5–6.5 × 3.5–6.5) as "whatitis".
export function getZone(valence, arousal) {
  if (valence >= 8.5 && arousal >= 8.5) return 'lfg'
  if (valence <= 2   && arousal <= 2)   return 'mwbs'
  if (valence >= 3.5 && valence <= 6.5 && arousal >= 3.5 && arousal <= 6.5) return 'whatitis'
  const highArousal = arousal >= 5
  const highValence = valence >= 5
  if ( highArousal && !highValence) return 'ball'
  if ( highArousal &&  highValence) return 'back'
  if (!highArousal && !highValence) return 'over'
  return 'vibing'
}
