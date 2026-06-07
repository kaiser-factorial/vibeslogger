import type { Session } from '@supabase/supabase-js'
import useUserProfile from '../hooks/useUserProfile'
import { getZone, gridColor, ZONE_META } from '../lib/zones'

interface Props {
  userId: string
  session: Session
  followingIds: Set<string>
  blockedIds: Set<string>
  follow: (userId: string) => Promise<void>
  unfollow: (userId: string) => Promise<void>
  block: (userId: string) => Promise<void>
  unblock: (userId: string) => Promise<void>
  onClose: () => void
}

function timeAgo(ts: string): string {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function UserProfileModal({
  userId, session, followingIds, blockedIds, follow, unfollow, block, unblock, onClose,
}: Props) {
  const { profile, vibes, followerCount, followingCount, followsYou, loading } = useUserProfile(userId, session)

  const isOwn       = userId === session.user.id
  const isFollowing = followingIds.has(userId)
  const isBlocked   = blockedIds.has(userId)

  async function handleBlockToggle() {
    if (isBlocked) { await unblock(userId); return }
    if (isFollowing) await unfollow(userId)
    await block(userId)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal profile-modal" onClick={e => e.stopPropagation()}>
        {loading ? (
          <div className="loading">loading profile...</div>
        ) : !profile ? (
          <>
            <div className="modal-coords">user not found</div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={onClose}>close</button>
            </div>
          </>
        ) : (
          <>
            <div className="profile-header">
              <div className="profile-name-row">
                <span className="profile-username">@{profile.username}</span>
                {!isOwn && followsYou && <span className="profile-badge">follows you</span>}
              </div>
              {!isOwn && (
                <div className="profile-actions">
                  <button
                    className={`follow-btn ${isFollowing ? 'follow-btn--following' : ''}`}
                    onClick={() => isFollowing ? unfollow(userId) : follow(userId)}
                    disabled={isBlocked}
                  >
                    {isFollowing ? 'following' : 'follow'}
                  </button>
                  <button className="profile-block-btn" onClick={handleBlockToggle}>
                    {isBlocked ? 'unblock' : 'block'}
                  </button>
                </div>
              )}
            </div>

            <div className="profile-stats">
              <span><strong>{followerCount}</strong> follower{followerCount !== 1 ? 's' : ''}</span>
              <span><strong>{followingCount}</strong> following</span>
            </div>

            {isBlocked ? (
              <div className="profile-blocked-note">you've blocked this user — their vibes are hidden from your timeline</div>
            ) : (
              <div className="profile-vibes">
                <div className="timeline-section-title" style={{ marginTop: 0 }}>public vibes</div>
                {vibes.length === 0 ? (
                  <div className="timeline-empty">no public vibes yet</div>
                ) : (
                  <div className="timeline-feed profile-feed">
                    {vibes.map(v => {
                      const zone = getZone(v.valence, v.arousal)
                      const meta = ZONE_META[zone]
                      return (
                        <div key={v.id} className="tl-entry">
                          <span className="tl-dot" style={{ background: gridColor(v.valence, v.arousal) }} />
                          <div className="tl-body">
                            <div className="tl-top">
                              <span className="tl-zone" style={{ color: meta.color }}>{meta.label}</span>
                              <span className="tl-meta">{timeAgo(v.created_at)}</span>
                            </div>
                            {v.note_public && v.note && <div className="tl-note">{v.note}</div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-ghost" onClick={onClose}>close</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
