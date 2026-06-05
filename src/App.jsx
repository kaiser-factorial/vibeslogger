import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import MoodGrid from './components/MoodGrid'
import MoodTable from './components/MoodTable'
import MoodModal from './components/MoodModal'
import Analysis from './components/Analysis'
import SetPasswordModal from './components/SetPasswordModal'
import useVibes from './hooks/useVibes'

export default function App() {
  const [session,     setSession]     = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  // localStorage hint: skip landing flash on return visits
  const [expanded,    setExpanded]    = useState(() => localStorage.getItem('vl-has-vibes') === 'true')
  const [view,        setView]        = useState('log')   // 'log' | 'analysis'
  const [pendingVibe,     setPendingVibe]     = useState(null)
  const [settingPassword, setSettingPassword] = useState(false)

  const { vibes, loading, addVibe, deleteVibe } = useVibes(session)

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

  function handleGridClick(x, y) {
    setPendingVibe({ x, y })
    if (!expanded) setExpanded(true)
  }

  async function handleModalSubmit(note) {
    if (!pendingVibe) return
    await addVibe({ x: pendingVibe.x, y: pendingVibe.y, note })
    setPendingVibe(null)
  }

  if (authLoading) return <div className="loading">loading...</div>
  if (!session)    return <Auth />

  const layoutClass = view === 'analysis'
    ? 'app--analysis'
    : expanded ? 'app--expanded' : 'app--landing'

  return (
    <div className={`app ${layoutClass}`}>
      <header className="app-header">
        <div className="app-header-top">
          <div className="app-title-group">
            <h1 className="app-title">vibeslogger</h1>
            {view === 'log' && !expanded && (
              <p className="app-subtitle">click to log a vibe</p>
            )}
          </div>
          <div className="header-actions">
            <button className="btn-setpw" onClick={() => setSettingPassword(true)}>
              set password
            </button>
            <button className="btn-signout" onClick={() => supabase.auth.signOut()}>
              sign out
            </button>
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
              />
            </div>

            {expanded && (
              <div className="panel-table">
                {loading
                  ? <div className="loading">loading vibes...</div>
                  : <MoodTable vibes={vibes} onDelete={deleteVibe} />
                }
              </div>
            )}
          </>
        ) : (
          <div className="panel-analysis">
            <Analysis vibes={vibes} />
          </div>
        )}
      </main>

      {settingPassword && (
        <SetPasswordModal onClose={() => setSettingPassword(false)} />
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
