import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import MoodGrid from './components/MoodGrid'
import MoodTable from './components/MoodTable'
import MoodModal from './components/MoodModal'
import Analysis from './components/Analysis'
import Timeline from './components/Timeline'
import SetPasswordModal from './components/SetPasswordModal'
import EditUsernameModal from './components/EditUsernameModal'
import AccountSettingsModal from './components/AccountSettingsModal'
import UserProfileModal from './components/UserProfileModal'
import PublicShareView from './components/PublicShareView'
import useVibes from './hooks/useVibes'
import useFollows from './hooks/useFollows'
import useBlocks from './hooks/useBlocks'
import useProfile from './hooks/useProfile'
import useAccent from './hooks/useAccent'
import useStreaks from './hooks/useStreaks'
import type { PendingVibe } from './types'

import { useAgentTelemetry } from './hooks/useAgentTelemetry'
import { collection, addDoc } from 'firebase/firestore'
import { db } from './lib/firebase_telemetry'

type View = 'log' | 'analysis' | 'timeline'

// Resolved once at module load — share links are static URLs, no reactivity needed
const SHARE_TOKEN = new URLSearchParams(window.location.search).get('share')

export default function App() {
  const [session,     setSession]     = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [expanded,    setExpanded]    = useState(() => localStorage.getItem('vl-has-vibes') === 'true')
  const [view,        setView]        = useState<View>('log')
  const [pendingVibe,     setPendingVibe]     = useState<PendingVibe | null>(null)
  const [settingPassword,  setSettingPassword]  = useState(false)
  const [editingUsername,  setEditingUsername]  = useState(false)
  const [showSettings,     setShowSettings]     = useState(false)
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null)
  const [hintDismissed,   setHintDismissed]   = useState(false)
  const [showLabels,      setShowLabels]      = useState(true)
  const [showEmotions,    setShowEmotions]    = useState(false)
  const [exploreMode,     setExploreMode]     = useState(false)

  const { vibes, loading, addVibe, updateVibe, deleteVibe } = useVibes(session)
  const { followingIds, follow, unfollow } = useFollows(session)
  const { blockedIds, block, unblock } = useBlocks(session)
  const { username, updateUsername } = useProfile(session)
  const { setAccentFromVibe } = useAccent(session)
  const { currentStreak, longestStreak, refreshStreaks } = useStreaks(session)

  // --- Telemetry Logger ---
  const { flushTrajectory } = useAgentTelemetry(async (trajectory) => {
    if (!trajectory || trajectory.length === 0) return;
    try {
      await addDoc(collection(db, "trajectories"), {
        app_name: "vibeslogger",
        timestamp: Date.now(),
        data: trajectory
      });
      console.log("[Telemetry] Flushed to Firestore");
    } catch (e) {
      console.error("[Telemetry] Error saving: ", e);
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      flushTrajectory();
    }, 30000);
    return () => clearInterval(interval);
  }, [flushTrajectory]);
  // -------------------------

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (vibes.length > 0) {
      setExpanded(true)
      localStorage.setItem('vl-has-vibes', 'true')
    }
  }, [vibes])

  useEffect(() => {
    if (view === 'log') setHintDismissed(false)
  }, [view])

  function dismissHint() {
    setHintDismissed(true)
  }

  function handleGridClick(x: number, y: number) {
    setPendingVibe({ x, y })
    if (!expanded) setExpanded(true)
  }

  async function handleModalSubmit(note: string, isPublic: boolean, isNotePublic: boolean) {
    if (!pendingVibe) return true
    const { error } = await addVibe({ x: pendingVibe.x, y: pendingVibe.y, note, isPublic, isNotePublic })
    if (error) return false
    setAccentFromVibe(pendingVibe.x, pendingVibe.y)
    setPendingVibe(null)
    refreshStreaks()
    return true
  }

  async function handleDeleteVibe(id: string) {
    const result = await deleteVibe(id)
    if (!result.error) refreshStreaks()
    return result
  }

  if (SHARE_TOKEN) return <PublicShareView token={SHARE_TOKEN} />
  if (authLoading) return <div className="loading">loading...</div>
  if (!session)    return <Auth />

  const layoutClass = (view === 'analysis' || view === 'timeline')
    ? 'app--analysis'
    : expanded ? 'app--expanded' : 'app--landing'

  return (
    <div className={`app ${layoutClass}`}>
      <header className="app-header">
        <div className="app-header-top">
          <div className="app-title-group">
            <h1 className="app-title">vibelogger</h1>
            {view === 'log' && !expanded && (
              <p className="app-subtitle">click to log a vibe</p>
            )}
          </div>
          <div className="header-actions">
            <div className="user-block">
              {username && (
                <button className="btn-username" onClick={() => setShowSettings(true)}>
                  @{username}
                </button>
              )}
              {currentStreak >= 1 && (
                <span className="streak-badge">
                  {currentStreak}d streak{longestStreak > currentStreak ? ` · best: ${longestStreak}d` : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        <nav className="app-nav">
          <button
            className={`nav-tab ${view === 'log' ? 'nav-tab--active' : ''}`}
            onClick={() => setView('log')}
          >
            log
          </button>
          <button
            className={`nav-tab ${view === 'analysis' ? 'nav-tab--active' : ''}`}
            onClick={() => setView('analysis')}
          >
            analyze
          </button>
          <button
            className={`nav-tab ${view === 'timeline' ? 'nav-tab--active' : ''}`}
            onClick={() => setView('timeline')}
          >
            timeline
          </button>
        </nav>
      </header>

      <main className="app-main">
        {view === 'log' ? (
          <>
            <div className="panel-grid">
              <MoodGrid
                vibes={vibes}
                onGridClick={handleGridClick}
                pendingVibe={pendingVibe}
                showLabels={showLabels}
                showEmotions={showEmotions}
                exploreMode={exploreMode}
                onToggleLabels={() => setShowLabels(v => !v)}
                onToggleEmotions={() => setShowEmotions(v => !v)}
                onToggleExplore={() => setExploreMode(v => !v)}
              />
            </div>

            {expanded && (
              <div className="panel-table">
                {loading
                  ? <div className="loading">loading vibes...</div>
                  : <MoodTable vibes={vibes} onDelete={handleDeleteVibe} onUpdate={updateVibe} />
                }
              </div>
            )}
          </>
        ) : view === 'analysis' ? (
          <div className="panel-analysis">
            <Analysis vibes={vibes} />
          </div>
        ) : (
          <div className="panel-analysis">
            <Timeline
              session={session}
              followingIds={followingIds}
              blockedIds={blockedIds}
              follow={follow}
              unfollow={unfollow}
              onOpenProfile={setViewingProfileId}
            />
          </div>
        )}
      </main>

      {showSettings && (
        <AccountSettingsModal
          session={session}
          username={username}
          followingIds={followingIds}
          blockedIds={blockedIds}
          unfollow={unfollow}
          unblock={unblock}
          onOpenProfile={setViewingProfileId}
          onOpenEditUsername={() => { setShowSettings(false); setEditingUsername(true) }}
          onOpenSetPassword={() => { setShowSettings(false); setSettingPassword(true) }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {viewingProfileId && (
        <UserProfileModal
          userId={viewingProfileId}
          session={session}
          followingIds={followingIds}
          blockedIds={blockedIds}
          follow={follow}
          unfollow={unfollow}
          block={block}
          unblock={unblock}
          onClose={() => setViewingProfileId(null)}
        />
      )}

      {settingPassword && (
        <SetPasswordModal onClose={() => setSettingPassword(false)} />
      )}

      {editingUsername && username && (
        <EditUsernameModal
          currentUsername={username}
          onSave={updateUsername}
          onClose={() => setEditingUsername(false)}
        />
      )}

      {view === 'log' && !loading && vibes.length === 0 && !hintDismissed && (
        <div className="hint-modal-backdrop" onClick={dismissHint}>
          <div className="hint-modal" onClick={e => e.stopPropagation()}>
            <div className="hint-modal-text">
              <div className="hint-modal-headline">click anywhere on the grid to log your vibe</div>
              <div className="hint-modal-detail">left to right is unpleasant to pleasant (valence), bottom to top is low to high energy (arousal)</div>
            </div>
            <button className="hint-modal-dismiss" onClick={dismissHint}>got it</button>
          </div>
        </div>
      )}

      {pendingVibe && (
        <MoodModal
          vibe={pendingVibe}
          onSubmit={handleModalSubmit}
          onClose={() => setPendingVibe(null)}
        />
      )}
    </div>
  )
}
