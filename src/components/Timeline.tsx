import type { Session } from '@supabase/supabase-js'
import useTimeline from '../hooks/useTimeline'
import { getZone, ZONE_META, ZONE_ORDER } from '../lib/zones'
import type { ZoneId } from '../lib/zones'
import { vibeColor } from '../lib/vibeColor'
import type { TimelineEntry } from '../types'

interface Props {
  session: Session
}

function timeAgo(ts: string): string {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface SimilarVibersProps {
  entries: TimelineEntry[]
  currentUserId: string
}

interface UserData {
  counts: Partial<Record<ZoneId, number>>
  total: number
  username: string
}

function SimilarVibers({ entries, currentUserId }: SimilarVibersProps) {
  const byUser: Record<string, UserData> = {}
  entries.forEach(e => {
    if (!byUser[e.user_id]) byUser[e.user_id] = { counts: {}, total: 0, username: e.username }
    const z = getZone(e.valence, e.arousal)
    byUser[e.user_id].counts[z] = (byUser[e.user_id].counts[z] ?? 0) + 1
    byUser[e.user_id].total++
  })

  const toVec = (d: UserData) => ZONE_ORDER.map(z => (d.counts[z] ?? 0) / d.total)
  const myData = byUser[currentUserId]
  if (!myData || myData.total < 5) return null

  const myVec = toVec(myData)
  const SQRT2 = Math.sqrt(2)

  const matches = Object.entries(byUser)
    .filter(([uid, d]) => uid !== currentUserId && d.total >= 3)
    .map(([uid, d]) => {
      const theirVec = toVec(d)
      const dist = Math.sqrt(myVec.reduce((s, v, i) => s + (v - theirVec[i]) ** 2, 0))
      return { uid, username: d.username, pct: Math.round((1 - dist / SQRT2) * 100) }
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5)

  if (!matches.length) return null

  return (
    <div className="similar-vibers">
      <div className="timeline-section-title">similar vibers</div>
      <div className="similar-sub">based on zone distribution across all public entries</div>
      <div className="similar-list">
        {matches.map(m => (
          <div key={m.uid} className="similar-row">
            <span className="similar-name">@{m.username}</span>
            <div className="similar-bar-track">
              <div className="similar-bar-fill" style={{ width: `${m.pct}%` }} />
            </div>
            <span className="similar-pct">{m.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Timeline({ session }: Props) {
  const { entries, loading } = useTimeline(session)

  if (loading) return <div className="loading">loading timeline...</div>

  return (
    <div className="timeline-wrap">
      <SimilarVibers entries={entries} currentUserId={session.user.id} />

      <div className="timeline-section-title">global timeline</div>
      <div className="timeline-sub">public vibes from everyone</div>

      {entries.length === 0 ? (
        <div className="timeline-empty">no public vibes yet — be the first</div>
      ) : (
        <div className="timeline-feed">
          {entries.map(e => {
            const zone = getZone(e.valence, e.arousal)
            const meta = ZONE_META[zone]
            const isOwn = e.user_id === session.user.id
            return (
              <div key={e.id} className={`tl-entry${isOwn ? ' tl-entry--own' : ''}`}>
                <span className="tl-dot" style={{ background: vibeColor(e.valence, e.arousal) }} />
                <div className="tl-body">
                  <div className="tl-top">
                    <span className="tl-zone" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="tl-meta">
                      @{e.username} · {timeAgo(e.created_at)}
                    </span>
                  </div>
                  {e.note_public && e.note && (
                    <div className="tl-note">{e.note}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
