import { useRef, useState, useEffect } from 'react'
import { vibeColor } from '../lib/vibeColor'

// Background zone definitions (percentages of grid dimensions)
const ZONES = [
  { l: 0,  t: 0,  w: 47, h: 48, bg: '#6E1818' },
  { l: 44, t: 0,  w: 56, h: 53, bg: '#384D12' },
  { l: 82, t: 1,  w: 17, h: 17, bg: '#B8AA00', z: 3 },
  { l: 0,  t: 41, w: 55, h: 22, bg: '#916018', z: 2 },
  { l: 0,  t: 52, w: 46, h: 48, bg: '#407A96' },
  { l: 46, t: 53, w: 54, h: 47, bg: '#4896A8' },
  { l: 0,  t: 84, w: 14, h: 15, bg: '#383898', z: 3 },
]

const LABELS = [
  { text: 'Fuck it\nwe ball',         x: '4%',   y: '5%',  sz: 28, fw: 900 },
  { text: 'We are so\nfucking back',  x: '47%',  y: '4%',  sz: 24, fw: 900, rot: -11, ital: true },
  { text: 'LETS FUCKING\nGOOOOOOOO', x: '83%',  y: '2%',  sz: 10, fw: 700, c: '#111' },
  { text: 'It is',                    x: '6%',   y: '42%', sz: 24, fw: 700 },
  { text: 'what\nit is',              x: '33%',  y: '41%', sz: 24, fw: 700, rot: -9,  ital: true },
  { text: "It's so\nover",            x: '3%',   y: '62%', sz: 28, fw: 900 },
  { text: 'We\nvibing',               x: '60%',  y: '60%', sz: 32, fw: 900 },
  { text: 'Mom would\nbe sad',        x: '0.5%', y: '85%', sz: 9,  fw: 500 },
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

export default function MoodGrid({ vibes, onGridClick, pendingVibe }) {
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

          {/* Background zones — territorial colors stay fixed */}
          {ZONES.map((z, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${z.l}%`, top: `${z.t}%`,
              width: `${z.w}%`, height: `${z.h}%`,
              background: z.bg, zIndex: z.z || 1, pointerEvents: 'none',
            }} />
          ))}

          {/* Zone labels */}
          {LABELS.map((l, i) => (
            <div key={i} style={{
              position: 'absolute', left: l.x, top: l.y,
              fontSize: l.sz * labelScale,
              fontWeight: l.fw,
              color: l.c || '#fff',
              transform: l.rot ? `rotate(${l.rot}deg)` : undefined,
              fontStyle: l.ital ? 'italic' : undefined,
              lineHeight: 1.1, whiteSpace: 'pre-line',
              zIndex: 5, pointerEvents: 'none',
              fontFamily: "'Impact', 'Franklin Gothic Heavy', sans-serif",
            }} />
          ))}

          {/* Plotted vibes — color encodes valence (hue) × arousal (lightness) */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
            {vibes.map(v => {
              const { rx, ry } = toRel(v.valence, v.arousal)
              return (
                <circle key={v.id}
                  cx={`${rx * 100}%`} cy={`${ry * 100}%`}
                  r={isMobile ? 5 : 6}
                  fill={vibeColor(v.valence, v.arousal)}
                  stroke="rgba(0,0,0,0.35)"
                  strokeWidth={1}
                />
              )
            })}

            {/* Pending preview — neutral yellow pulse */}
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

        <div className="x-axis">← Unpleasant to Pleasant →</div>
      </div>
    </div>
  )
}
