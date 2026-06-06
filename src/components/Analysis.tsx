import { useMemo, useState } from 'react'
import { getZone, ZONE_META, ZONE_ORDER } from '../lib/zones'
import { topWordsByZone } from '../lib/wordAnalysis'
import type { Vibe } from '../types'

export const UNLOCK_THRESHOLD = 10

// ── helpers ───────────────────────────────────────────────────────────────────

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0
}

function filterByDate(vibes: Vibe[], from: string, to: string): Vibe[] {
  return vibes.filter(v => {
    const d = new Date(v.created_at)
    if (from && d < new Date(from)) return false
    if (to) {
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      if (d > end) return false
    }
    return true
  })
}

function buildHeatmap(vibes: Vibe[]): number[][] {
  const grid: number[][] = Array.from({ length: 10 }, () => Array(10).fill(0))
  for (const v of vibes) {
    const col = Math.min(9, Math.max(0, Math.floor(v.valence - 1)))
    const row = Math.min(9, Math.max(0, Math.floor(v.arousal - 1)))
    grid[row][col]++
  }
  return grid
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatsStrip({ vibes }: { vibes: Vibe[] }) {
  const avgV = avg(vibes.map(v => v.valence))
  const avgA = avg(vibes.map(v => v.arousal))
  const withNotes = vibes.filter(v => v.note && v.note.trim().split(/\s+/).length >= 3).length

  return (
    <div className="stats-strip">
      <div className="stat-pill">
        <span className="stat-value">{vibes.length}</span>
        <span className="stat-label">entries</span>
      </div>
      <div className="stat-pill">
        <span className="stat-value">{avgV.toFixed(1)}</span>
        <span className="stat-label">avg valence</span>
      </div>
      <div className="stat-pill">
        <span className="stat-value">{avgA.toFixed(1)}</span>
        <span className="stat-label">avg arousal</span>
      </div>
      <div className="stat-pill">
        <span className="stat-value">{withNotes}</span>
        <span className="stat-label">notes ≥3w</span>
      </div>
    </div>
  )
}

function Heatmap({ vibes }: { vibes: Vibe[] }) {
  const grid   = useMemo(() => buildHeatmap(vibes), [vibes])
  const maxVal = useMemo(() => Math.max(1, ...grid.flat()), [grid])

  return (
    <div className="analysis-section">
      <div className="analysis-section-title">vibe density</div>
      <div className="analysis-section-sub">where on the map you spend most time</div>
      <div className="heatmap-wrap">
        <div className="heatmap-y-axis">
          <span>high energy ↑</span>
          <span>low energy ↓</span>
        </div>
        <div className="heatmap-col">
          <div className="heatmap-grid">
            {Array.from({ length: 100 }, (_, i) => {
              const displayRow    = Math.floor(i / 10)
              const displayCol    = i % 10
              const arousalBucket = 9 - displayRow
              const count   = grid[arousalBucket][displayCol]
              const opacity = count === 0
                ? 0
                : 0.12 + (count / maxVal) * 0.88
              return (
                <div
                  key={i}
                  className="heatmap-cell"
                  style={{ background: `rgba(255, 190, 0, ${opacity.toFixed(3)})` }}
                  title={`v:${displayCol + 1}–${displayCol + 2}  a:${arousalBucket + 1}–${arousalBucket + 2}  ×${count}`}
                />
              )
            })}
          </div>
          <div className="heatmap-x-axis">← unpleasant · pleasant →</div>
        </div>
      </div>
      <div className="heatmap-legend">
        <span className="legend-none">none</span>
        <div className="legend-gradient" />
        <span className="legend-max">most</span>
      </div>
    </div>
  )
}

function ZoneBreakdown({ vibes }: { vibes: Vibe[] }) {
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const v of vibes) {
      const z = getZone(v.valence, v.arousal)
      c[z] = (c[z] ?? 0) + 1
    }
    return c
  }, [vibes])

  const total  = vibes.length || 1
  const sorted = ZONE_ORDER
    .filter(z => counts[z])
    .sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))

  if (!sorted.length) return null

  return (
    <div className="analysis-section">
      <div className="analysis-section-title">zone time</div>
      <div className="analysis-section-sub">how you're distributed across the map</div>
      <div className="zone-bars">
        {sorted.map(zoneId => {
          const pct = Math.round((counts[zoneId] / total) * 100)
          const { label, color } = ZONE_META[zoneId]
          return (
            <div key={zoneId} className="zone-bar-row">
              <div className="zone-bar-label">{label}</div>
              <div className="zone-bar-track">
                <div
                  className="zone-bar-fill"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <div className="zone-bar-pct">{pct}%</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WordAnalysis({ vibes }: { vibes: Vibe[] }) {
  const byZone = useMemo(() => topWordsByZone(vibes, 5), [vibes])
  const populated = ZONE_ORDER.filter(z => (byZone[z]?.length ?? 0) > 0)

  const qualifyingNotes = vibes.filter(
    v => v.note && v.note.trim().split(/\s+/).length >= 3
  ).length

  if (qualifyingNotes < 3) {
    return (
      <div className="analysis-section">
        <div className="analysis-section-title">word patterns</div>
        <div className="analysis-empty">
          add notes with 3+ words to at least 3 entries to see patterns
        </div>
      </div>
    )
  }

  if (!populated.length) {
    return (
      <div className="analysis-section">
        <div className="analysis-section-title">word patterns</div>
        <div className="analysis-empty">no qualifying notes in this date range</div>
      </div>
    )
  }

  return (
    <div className="analysis-section">
      <div className="analysis-section-title">word patterns</div>
      <div className="analysis-section-sub">top words in your notes, by zone (stop words removed)</div>
      <div className="word-zone-grid">
        {populated.map(zoneId => {
          const { label, color } = ZONE_META[zoneId]
          return (
            <div
              key={zoneId}
              className="word-zone-card"
              style={{ borderColor: color + '55' }}
            >
              <div className="word-zone-name" style={{ color }}>{label}</div>
              <div className="word-chips">
                {byZone[zoneId]!.map(({ word, count }) => (
                  <span key={word} className="word-chip">
                    {word}
                    {count > 1 && <span className="word-chip-count">×{count}</span>}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── main export ───────────────────────────────────────────────────────────────

export default function Analysis({ vibes }: { vibes: Vibe[] }) {
  const [from, setFrom] = useState('')
  const [to,   setTo]   = useState('')

  const filtered  = useMemo(() => filterByDate(vibes, from, to), [vibes, from, to])
  const hasFilter = from || to

  if (vibes.length < UNLOCK_THRESHOLD) {
    const needed = UNLOCK_THRESHOLD - vibes.length
    const pct    = Math.round((vibes.length / UNLOCK_THRESHOLD) * 100)
    return (
      <div className="analysis-lock">
        <div className="analysis-lock-inner">
          <div className="analysis-lock-title">analysis unlocks at {UNLOCK_THRESHOLD} entries</div>
          <div className="analysis-lock-bar">
            <div className="analysis-lock-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="analysis-lock-count">{vibes.length} / {UNLOCK_THRESHOLD}</div>
          <div className="analysis-lock-sub">
            log {needed} more vibe{needed !== 1 ? 's' : ''} to unlock
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="analysis-wrap">
      <div className="analysis-filter">
        <label className="filter-label">from</label>
        <input
          type="date"
          className="filter-input"
          value={from}
          onChange={e => setFrom(e.target.value)}
        />
        <label className="filter-label">to</label>
        <input
          type="date"
          className="filter-input"
          value={to}
          onChange={e => setTo(e.target.value)}
        />
        {hasFilter && (
          <button
            className="btn-ghost filter-clear"
            onClick={() => { setFrom(''); setTo('') }}
          >
            clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="analysis-empty-state">no entries in this date range</div>
      ) : (
        <>
          <StatsStrip vibes={filtered} />
          <Heatmap vibes={filtered} />
          <ZoneBreakdown vibes={filtered} />
          <WordAnalysis vibes={filtered} />
        </>
      )}
    </div>
  )
}
