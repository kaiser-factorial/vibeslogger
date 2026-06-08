import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ZONE_META, gridColor, getZone } from '../lib/zones'
import type { SharePayload } from './ShareModal'
import type { Vibe } from '../types'

interface Props {
  token: string
}

export default function PublicShareView({ token }: Props) {
  // undefined = not checked yet, null = no longer available / not public
  const [live, setLive] = useState<Vibe | null | undefined>(undefined)

  let payload: SharePayload | null = null
  try {
    payload = JSON.parse(atob(token)) as SharePayload
  } catch {
    // malformed token
  }

  useEffect(() => {
    if (!payload?.id) return
    let cancelled = false
    supabase
      .from('vibes')
      .select('*')
      .eq('id', payload.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setLive((data as Vibe | null) ?? null)
      })
    return () => { cancelled = true }
  }, [payload?.id])

  if (!payload) {
    return (
      <div className="share-view">
        <div className="share-view-error">invalid share link</div>
        <a className="share-view-cta" href="/">open vibelogger</a>
      </div>
    )
  }

  // Links carrying an id are re-validated against the DB before rendering —
  // the encoded data alone could be stale (vibe deleted or made private since).
  if (payload.id && live === undefined) {
    return (
      <div className="share-view">
        <div className="share-view-error">loading…</div>
      </div>
    )
  }
  if (payload.id && (!live || !live.public)) {
    return (
      <div className="share-view">
        <div className="share-view-error">this vibe is no longer shared</div>
        <a className="share-view-cta" href="/">open vibelogger</a>
      </div>
    )
  }

  const valence = live ? live.valence : payload.v
  const arousal = live ? live.arousal : payload.a
  const zoneId  = live ? getZone(live.valence, live.arousal) : payload.z
  const note    = live ? (live.note_public ? live.note : null) : (payload.n ?? null)
  const created = live ? live.created_at : payload.t

  const meta  = ZONE_META[zoneId as keyof typeof ZONE_META] ?? ZONE_META['whatitis']
  const color = gridColor(valence, arousal)
  const date  = new Date(created).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <div className="share-view">
      <div className="share-view-card" style={{ borderLeftColor: meta.color }}>
        <div className="share-view-zone" style={{ color: meta.color }}>{meta.label}</div>
        <div className="share-view-coords">
          <span className="share-dot" style={{ background: color }} />
          v {valence.toFixed(1)} · a {arousal.toFixed(1)}
        </div>
        {note && (
          <div className="share-view-note">"{note}"</div>
        )}
        <div className="share-view-date">{date}</div>
        <div className="share-card-brand">vibelogger</div>
      </div>
      <a className="share-view-cta" href="/">log your own vibes</a>
    </div>
  )
}
