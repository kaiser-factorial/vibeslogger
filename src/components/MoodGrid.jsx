import { useRef, useState, useEffect } from 'react'
import { vibeColor } from '../lib/vibeColor'

// ── Zone rectangles (x1/y1 = top-left %, x2/y2 = bottom-right %) ─────────────
// Left column (x: 0-45%) has 3 stacked zones; right column (x: 45-100%) has 2.
// Orange "it is what it is" band extends past the vertical midline into the olive zone.
const ZONES = [
  { x1:  0, y1:  0, x2: 45, y2: 50, bg: '#A52828' },           // red   — Fuck it we ball
  { x1: 45, y1:  0, x2:100, y2: 68, bg: '#5E6E20' },           // olive — We are so fucking back
  { x1: 83, y1:  0, x2:100, y2: 17, bg: '#D4CC20', z: 4 },    // yellow corner — LFG
  { x1:  0, y1: 49, x2: 62, y2: 69, bg: '#D08020', z: 2 },    // orange — It is what it is
  { x1:  0, y1: 68, x2: 45, y2:100, bg: '#7FB5CC' },           // blue  — It's so over
  { x1: 45, y1: 68, x2:100, y2:100, bg: '#5E9870' },           // sage  — We vibing
  { x1:  0, y1: 88, x2: 16, y2:100, bg: '#5050A8', z: 4 },    // purple corner — Mom would be sad
]

// Zone labels
const LABELS = [
  { text: 'Fuck it\nwe ball',         x: '5%',    y: '5%',    sz: 26, fw: 900 },
  { text: 'We are so\nfucking back',  x: '47%',   y: '3%',    sz: 22, fw: 900, rot: -11, ital: true },
  { text: 'LETS FUCKING\nGOOOOOOOO', x: '83.5%', y: '1.5%',  sz: 9,  fw: 700, c: '#111' },
  { text: 'It is',                    x: '5%',    y: '51%',   sz: 20, fw: 700 },
  { text: 'what\nit is',              x: '29%',   y: '50%',   sz: 20, fw: 700, rot: -9, ital: true },
  { text: "It's so\nover",            x: '4%',    y: '70%',   sz: 24, fw: 900 },
  { text: 'We\nvibing',               x: '55%',   y: '70%',   sz: 28, fw: 900 },
  { text: 'log off\nforever',          x: '0.5%',  y: '88.5%', sz: 8,  fw: 500 },
]

// Emotion wheel — standard Russell Circumplex affect labels
// vx = valence (1-10), ay = arousal (1-10)
const EMOTIONS = [
  { text: 'tense',     vx: 2.5, ay: 9.5 },
  { text: 'afraid',    vx: 1.5, ay: 8.5 },
  { text: 'angry',     vx: 2.5, ay: 8   },
  { text: 'annoyed',   vx: 3.5, ay: 6.5 },
  { text: 'stressed',  vx: 3,   ay: 9   },
  { text: 'excited',   vx: 8.5, ay: 9   },
  { text: 'delighted', vx: 9.2, ay: 7.8 },
  { text: 'happy',     vx: 8.5, ay: 7   },
  { text: 'pleased',   vx: 8,   ay: 5.8 },
  { text: 'content',   vx: 8,   ay: 4.5 },
  { text: 'serene',    vx: 7,   ay: 3   },
  { text: 'relaxed',   vx: 7.5, ay: 2   },
  { text: 'calm',      vx: 6,   ay: 3.5 },
  { text: 'bored',     vx: 3.5, ay: 3.5 },
  { text: 'sad',       vx: 2,   ay: 4.5 },
  { text: 'depressed', vx: 1.5, ay: 2.5 },
  { text: 'tired',     vx: 4,   ay: 2   },
]

function toRel(valence, arousal) {
  return { rx: (valence - 1) / 9, ry: 1 - (arousal - 1) / 9 }
}

function fromRel(rx, ry) {
  return {
    x: parseFloat((1 + rx * 9).toFixed(2)),
    y: parseFloat((10 - ry * 9).toFixed(2)),
  }
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

export default function MoodGrid({
  vibes, onGridClick, pendingVibe,
  showLabels, showEmotions,
  onToggleLabels, onToggleEmotions,
}) {
  const gridRef  = useRef(null)
  const isMobile = useIsMobile()
  const labelScale = isMobile ? 0.58 : 1

  function handleClick(e) {
    const rect = gridRef.current.getBoundingClientRect()
    const rx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const ry = Math.max(0, Math.min(1, (e.clientY - rect.top)  / rect.height))
    const { x, y } = fromRel(rx, ry)
    onGridClick(x, y)
  }

  return (
    <div className="grid-outer">
      <div className="y-axis">
        <span>High Energy ↑</span>
        <span>Low Energy ↓</span>
      </div>

      <div className="grid-col">
        <div ref={gridRef} className="grid-area" onClick={handleClick}>

          {/* Background zones — clean rectangles using left/top/right/bottom */}
          {ZONES.map((z, i) => (
            <div key={i} style={{
              position: 'absolute',
              left:   `${z.x1}%`,
              top:    `${z.y1}%`,
              right:  `${100 - z.x2}%`,
              bottom: `${100 - z.y2}%`,
              background: z.bg,
              zIndex: z.z || 1,
              pointerEvents: 'none',
            }} />
          ))}

          {/* Zone labels (toggleable) */}
          {showLabels && LABELS.map((l, i) => (
            <div key={i} style={{
              position: 'absolute', left: l.x, top: l.y,
              fontSize: l.sz * labelScale,
              fontWeight: l.fw,
              color: l.c || '#fff',
              transform: l.rot ? `rotate(${l.rot}deg)` : undefined,
              fontStyle: l.ital ? 'italic' : undefined,
              lineHeight: 1.1, whiteSpace: 'pre-line',
              zIndex: 6, pointerEvents: 'none',
              fontFamily: "'Impact', 'Franklin Gothic Heavy', sans-serif",
            }} />
          ))}

          {/* Emotion wheel overlay (toggleable) */}
          {showEmotions && EMOTIONS.map((em, i) => {
            const { rx, ry } = toRel(em.vx, em.ay)
            return (
              <div key={i} style={{
                position: 'absolute',
                left: `${rx * 100}%`,
                top:  `${ry * 100}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: isMobile ? 7 : 9,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.04em',
                textTransform: 'lowercase',
                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                zIndex: 7, pointerEvents: 'none',
                whiteSpace: 'nowrap',
                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
              }}>
                {em.text}
              </div>
            )
          })}

          {/* Plotted vibes */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
            {vibes.map(v => {
              const { rx, ry } = toRel(v.valence, v.arousal)
              return (
                <circle key={v.id}
                  cx={`${rx * 100}%`} cy={`${ry * 100}%`}
                  r={isMobile ? 5 : 6}
                  fill={vibeColor(v.valence, v.arousal)}
                  stroke="rgba(0,0,0,0.35)" strokeWidth={1}
                />
              )
            })}

            {pendingVibe && (() => {
              const { rx, ry } = toRel(pendingVibe.x, pendingVibe.y)
              return (
                <circle
                  cx={`${rx * 100}%`} cy={`${ry * 100}%`}
                  r={7} fill="rgba(255,210,0,0.9)"
                  stroke="#fff" strokeWidth={1.5} strokeDasharray="3,2"
                />
              )
            })()}
          </svg>
        </div>

        {/* Overlay toggles */}
        <div className="grid-controls">
          <button
            className={`grid-toggle ${showLabels ? 'grid-toggle--on' : ''}`}
            onClick={onToggleLabels}
          >
            labels
          </button>
          <button
            className={`grid-toggle ${showEmotions ? 'grid-toggle--on' : ''}`}
            onClick={onToggleEmotions}
          >
            emotion wheel
          </button>
        </div>

        <div className="x-axis">← Unpleasant to Pleasant →</div>
      </div>
    </div>
  )
}
