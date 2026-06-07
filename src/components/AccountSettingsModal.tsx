import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import useSocialLists from '../hooks/useSocialLists'
import type { Profile } from '../types'

interface Props {
  session: Session
  username: string | null
  followingIds: Set<string>
  blockedIds: Set<string>
  unfollow: (userId: string) => Promise<void>
  unblock: (userId: string) => Promise<void>
  onOpenProfile: (userId: string) => void
  onOpenEditUsername: () => void
  onOpenSetPassword: () => void
  onClose: () => void
}

type Tab = 'account' | 'following' | 'followers' | 'blocked'

function PersonRow({ person, action, onOpenProfile }: {
  person: Profile
  action: { label: string; onClick: () => void; variant?: 'danger' } | null
  onOpenProfile: (userId: string) => void
}) {
  return (
    <div className="settings-person-row">
      <button className="settings-person-name" onClick={() => onOpenProfile(person.id)}>
        @{person.username}
      </button>
      {action && (
        <button
          className={`btn-ghost settings-person-action ${action.variant === 'danger' ? 'settings-person-action--danger' : ''}`}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export default function AccountSettingsModal({
  session, username, followingIds, blockedIds, unfollow, unblock,
  onOpenProfile, onOpenEditUsername, onOpenSetPassword, onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>('account')
  const { followers, following, loading: listsLoading } = useSocialLists(session)
  const [blockedProfiles, setBlockedProfiles] = useState<Profile[]>([])

  const hasPassword = !!session.user.user_metadata?.has_password

  useEffect(() => {
    if (blockedIds.size === 0) { setBlockedProfiles([]); return }
    let cancelled = false
    supabase.from('profiles').select('id, username').in('id', [...blockedIds])
      .then(({ data }: { data: Profile[] | null }) => {
        if (!cancelled) setBlockedProfiles(data ?? [])
      })
    return () => { cancelled = true }
  }, [blockedIds])

  function go(userId: string) {
    onOpenProfile(userId)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-coords">account settings</div>

        <div className="settings-tabs">
          <button className={`settings-tab ${tab === 'account'   ? 'settings-tab--active' : ''}`} onClick={() => setTab('account')}>account</button>
          <button className={`settings-tab ${tab === 'following' ? 'settings-tab--active' : ''}`} onClick={() => setTab('following')}>following ({followingIds.size})</button>
          <button className={`settings-tab ${tab === 'followers' ? 'settings-tab--active' : ''}`} onClick={() => setTab('followers')}>followers ({followers.length})</button>
          <button className={`settings-tab ${tab === 'blocked'   ? 'settings-tab--active' : ''}`} onClick={() => setTab('blocked')}>blocked ({blockedIds.size})</button>
        </div>

        <div className="settings-panel">
          {tab === 'account' && (
            <div className="settings-section">
              <div className="settings-row">
                <span className="settings-row-label">username</span>
                <span className="settings-row-value">@{username ?? '...'}</span>
                <button className="btn-ghost" onClick={onOpenEditUsername}>edit</button>
              </div>
              <div className="settings-row">
                <span className="settings-row-label">email</span>
                <span className="settings-row-value">{session.user.email}</span>
              </div>
              <div className="settings-row">
                <span className="settings-row-label">password</span>
                <span className="settings-row-value">{hasPassword ? 'set' : 'not set — using magic link'}</span>
                {!hasPassword && (
                  <button className="btn-ghost" onClick={onOpenSetPassword}>set password</button>
                )}
              </div>
              <div className="settings-row settings-row--signout">
                <button className="btn-signout" onClick={() => supabase.auth.signOut()}>sign out</button>
              </div>
            </div>
          )}

          {tab === 'following' && (
            <div className="settings-section">
              {listsLoading ? (
                <div className="loading">loading...</div>
              ) : following.length === 0 ? (
                <div className="timeline-empty">not following anyone yet — find people in the timeline search</div>
              ) : (
                following.map(p => (
                  <PersonRow key={p.id} person={p} onOpenProfile={go}
                    action={{ label: 'unfollow', onClick: () => unfollow(p.id) }} />
                ))
              )}
            </div>
          )}

          {tab === 'followers' && (
            <div className="settings-section">
              {listsLoading ? (
                <div className="loading">loading...</div>
              ) : followers.length === 0 ? (
                <div className="timeline-empty">no followers yet</div>
              ) : (
                followers.map(p => (
                  <PersonRow key={p.id} person={p} onOpenProfile={go}
                    action={followingIds.has(p.id) ? null : { label: 'view', onClick: () => go(p.id) }} />
                ))
              )}
            </div>
          )}

          {tab === 'blocked' && (
            <div className="settings-section">
              {blockedProfiles.length === 0 ? (
                <div className="timeline-empty">you haven't blocked anyone</div>
              ) : (
                blockedProfiles.map(p => (
                  <PersonRow key={p.id} person={p} onOpenProfile={go}
                    action={{ label: 'unblock', onClick: () => unblock(p.id), variant: 'danger' }} />
                ))
              )}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>close</button>
        </div>
      </div>
    </div>
  )
}
