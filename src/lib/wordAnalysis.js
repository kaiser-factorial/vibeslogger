import { getZone } from './zones'

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','was','are','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','can',
  'shall','i','me','my','myself','we','our','ours','ourselves','you','your',
  'yours','yourself','he','him','his','himself','she','her','hers','herself',
  'it','its','itself','they','them','their','theirs','themselves',
  'this','that','these','those','what','which','who','whom','when','where',
  'why','how','all','each','every','both','few','more','most','other','some',
  'such','no','not','only','same','so','than','too','very','just','also',
  'as','up','out','if','about','into','through','then','once','here','there',
  'now','get','got','like','feel','feeling','felt','im','ive','its',
  'dont','cant','didnt','thats','youre','wasnt','isnt','wont','havent',
  'really','bit','much','well','still','back','even','again','after','before',
  'today','yesterday','tonight','day','time','little','going','one','two',
  'think','know','want','need','said','just','things','thing','way','make',
])

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
}

// Returns top N {word, count} pairs from vibes whose notes have >= 3 words.
export function topWords(vibes, n = 5) {
  const counts = {}
  for (const v of vibes) {
    if (!v.note) continue
    const raw = v.note.trim()
    if (!raw || raw.split(/\s+/).length < 3) continue
    for (const w of tokenize(raw)) {
      counts[w] = (counts[w] || 0) + 1
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([word, count]) => ({ word, count }))
}

// Returns { zoneId: [{word, count}] } for all zones that have qualifying notes.
export function topWordsByZone(vibes, n = 5) {
  const byZone = {}
  for (const v of vibes) {
    if (!v.note) continue
    const raw = v.note.trim()
    if (!raw || raw.split(/\s+/).length < 3) continue
    const zone = getZone(v.valence, v.arousal)
    if (!byZone[zone]) byZone[zone] = []
    byZone[zone].push(v)
  }
  const result = {}
  for (const [zone, zVibes] of Object.entries(byZone)) {
    const words = topWords(zVibes, n)
    if (words.length > 0) result[zone] = words
  }
  return result
}
