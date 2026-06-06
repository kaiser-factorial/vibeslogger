import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import useTimeline from '../hooks/useTimeline'
import { getZone, gridColor, ZONE_META, ZONE_ORDER } from '../lib/zones'
import type { ZoneId } from '../lib/zones'
import type { TimelineEntry } from '../types'

interface Props {
  session: Session
  followingIds: Set<string>
  follow: (userId: string) => Promise<void>
  unfollow: (userId: string) => Promise<void>
}

type FeedFilter = 'everyone' | 'following'

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
  followingIds: Set<string>
  follow: (userId: string) => Promise<void>
  unfollow: (userId: string) => Promise<void>
}

interface UserData {
  counts: Partial<Record<ZoneId, number>>
  total: number
  username: string
}

function SimilarVibers({ entries, currentUserId, followingIds, follow, unfollow }: SimilarVibersProps) {
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
  const SQRT2  = Math.sqrt(2)

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
        {matches.map(m => {
          const isFollowing = followingIds.has(m.uid)
          return (
            <div key={m.uid} className="similar-row">
              <span className="similar-name">@{m.username}</span>
              <div className="similar-bar-track">
                <div className="similar-bar-fill" style={{ width: `${m.pct}%` }} />
              </div>
              <span className="similar-pct">{m.pct}%</span>
              <button
                className={`follow-btn ${isFollowing ? 'follow-btn--following' : ''}`}
                onClick={() => isFollowing ? unfollow(m.uid) : follow(m.uid)}
              >
                {isFollowing ? 'following' : 'follow'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Timeline({ session, followingIds, follow, unfollow }: Props) {
  const { entries, loading, loadingMore, hasMore, loadMore } = useTimeline(session)
  const [filter, setFilter] = useState<FeedFilter>('everyone')

  if (loading) return <div className="loading">loading timeline...</div>

  const visibleEntries = filter === 'following'
    ? entries.filter(e => e.user_id === session.user.id || followingIds.has(e.user_id))
    : entries

  return (
    <div className="timeline-wrap">
      <SimilarVibers
        entries={entries}
        currentUserId={session.user.id}
        followingIds={followingIds}
        follow={follow}
        unfollow={unfollow}
      />

      <div className="timeline-header-row">
        <div className="timeline-section-title" style={{ margin: 0 }}>timeline</div>
        <div className="timeline-filter">
          <button
            className={`timeline-filter-btn ${filter === 'everyone' ? 'timeline-filter-btn--active' : ''}`}
            onClick={() => setFilter('everyone')}
          >
            everyone
          </button>
          <button
            className={`timeline-filter-btn ${filter === 'following' ? 'timeline-filter-btn--active' : ''}`}
            onClick={() => setFilter('following')}
          >
            following{followingIds.size > 0 ? ` (${followingIds.size})` : ''}
          </button>
        </div>
      </div>
      <div className="timeline-sub">
        {filter === 'following'
          ? followingIds.size === 0
            ? 'follow someone from the similar vibers list to see their posts here'
            : 'posts from people you follow + your own'
          : 'public vibes from everyone'}
      </div>

      {visibleEntries.length === 0 ? (
        <div className="timeline-empty">
          {filter === 'following' ? 'nothing here yet' : 'no public vibes yet — be the first'}
        </div>
      ) : (
        <div className="timeline-feed">
          {visibleEntries.map(e => {
            const zone = getZone(e.valence, e.arousal)
            const meta = ZONE_META[zone]
            const isOwn = e.user_id === session.user.id
            return (
              <div key={e.id} className={`tl-entry${isOwn ? ' tl-entry--own' : ''}`}>
                <span className="tl-dot" style={{ background: gridColor(e.valence, e.arousal) }} />
                <div className="tl-body">
                  <div className="tl-top">
                    <span className="tl-zone" style={{ color: meta.color }}>{meta.label}</span>
                    <span className="tl-meta">@{e.username} · {timeAgo(e.created_at)}</span>
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

      {filter === 'everyone' && (hasMore || loadingMore) && (
        <button
          className="tl-load-more"
          onClick={loadMore}
          disabled={loadingMore}
        >
          {loadingMore ? 'loading...' : 'load more'}
        </button>
      )}
    </div>
  )
}
