import { useState, useEffect, useRef } from 'react'
import { gridColor } from '../lib/zones'
import type { Vibe } from '../types'
import ShareModal from './ShareModal'
import VibeActionModal from './VibeActionModal'

interface Props {
  vibes: Vibe[]
  onDelete: (id: string) => Promise<{ error: Error | null }>
  onUpdate: (id: string, note: string | null) => Promise<{ error: Error | null }>
}

const LOCK_AFTER_MS  = 3 * 60 * 60 * 1000
const UNDO_WINDOW_MS = 5000

function isLocked(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() > LOCK_AFTER_MS
}

function fmtDate(ts: string): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

function fmtTime(ts: string): string {
  return new Date(ts).toLocaleTimeString()
}

interface PendingDelete {
  vibe: Vibe
  timerId: ReturnType<typeof setTimeout>
  startedAt: number
}

export default function MoodTable({ vibes, onDelete, onUpdate }: Props) {
  const [editingId,     setEditingId]     = useState<string | null>(null)
  const [editNote,      setEditNote]      = useState('')
  const [saving,        setSaving]        = useState(false)
  const [sharingVibe,   setSharingVibe]   = useState<Vibe | null>(null)
  const [actionModalVibe, setActionModalVibe] = useState<Vibe | null>(null)
  const [pendingDeletes, setPendingDeletes] = useState<Map<string, PendingDelete>>(new Map())
  const [tick,          setTick]          = useState(0)
  const [errorToast,    setErrorToast]    = useState<string | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-dismiss the error toast after a few seconds
  useEffect(() => {
    if (!errorToast) return
    const t = setTimeout(() => setErrorToast(null), 4000)
    return () => clearTimeout(t)
  }, [errorToast])

  // Tick every 250ms so the countdown numbers stay live while there are pending deletes
  useEffect(() => {
    if (pendingDeletes.size > 0) {
      tickRef.current = setInterval(() => setTick(t => t + 1), 250)
    } else {
      if (tickRef.current) clearInterval(tickRef.current)
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [pendingDeletes.size])

  function startDelete(v: Vibe) {
    const timerId = setTimeout(async () => {
      const { error } = await onDelete(v.id)
      setPendingDeletes(prev => { const m = new Map(prev); m.delete(v.id); return m })
      if (error) setErrorToast("couldn't delete — entry restored")
    }, UNDO_WINDOW_MS)
    setPendingDeletes(prev => new Map(prev).set(v.id, { vibe: v, timerId, startedAt: Date.now() }))
    setEditingId(null)
  }

  function undoDelete(id: string) {
    const entry = pendingDeletes.get(id)
    if (entry) clearTimeout(entry.timerId)
    setPendingDeletes(prev => { const m = new Map(prev); m.delete(id); return m })
  }

  function startEdit(v: Vibe) {
    setEditingId(v.id)
    setEditNote(v.note ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditNote('')
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const { error } = await onUpdate(id, editNote.trim() || null)
    setSaving(false)
    setEditingId(null)
    setEditNote('')
    if (error) setErrorToast("couldn't save edit — try again")
  }

  const displayedVibes = vibes.filter(v => !pendingDeletes.has(v.id))

  if (displayedVibes.length === 0 && pendingDeletes.size === 0) return (
    <div className="table-empty-state">
      <div className="table-empty-title">no logs yet</div>
      <div className="table-empty-sub">click on the grid to log a mood</div>
    </div>
  )

  return (
    <div className="table-wrap">
      <div className="table-header">
        recorded moods <span className="table-count">{displayedVibes.length}</span>
      </div>

      {displayedVibes.length > 0 && (
        <table className="vibe-table">
          <thead>
            <tr>
              <th>date/time</th><th>mood</th><th>notes</th>
            </tr>
          </thead>
          <tbody>
            {displayedVibes.map(v => {
              const locked  = isLocked(v.created_at)
              const editing = editingId === v.id

              return (
                <tr key={v.id}>
                  <td className="td-muted">
                    <div>{fmtDate(v.created_at)}</div>
                    <div style={{ fontSize: '9px', marginTop: '2px', opacity: 0.7 }}>{fmtTime(v.created_at)}</div>
                  </td>
                  <td className="td-mono">
                    <span className="vibe-dot"
                      style={{ background: gridColor(v.valence, v.arousal) }} />
                    ({v.valence}, {v.arousal})
                  </td>
                  <td className="td-note">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontStyle: v.note ? 'normal' : 'italic', opacity: v.note ? 1 : 0.5 }}>
                        {v.note ?? '— no note —'}
                      </div>
                      <div className="row-actions" style={{ justifyContent: 'flex-start', marginTop: '6px' }}>
                        <button className="btn-edit" style={{ padding: '0px 4px', fontSize: '12px', color: '#141414', background: '#f8f4ec', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', opacity: 0.85, fontWeight: 'bold' }} onClick={() => setActionModalVibe(v)} title="More actions">
                          •••
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {sharingVibe && (
        <ShareModal vibe={sharingVibe} onClose={() => setSharingVibe(null)} />
      )}

      {actionModalVibe && (
        <VibeActionModal
          vibe={actionModalVibe}
          onClose={() => setActionModalVibe(null)}
          onUpdate={onUpdate}
          onDelete={startDelete}
          onShare={setSharingVibe}
        />
      )}

      {/* Mutation error toast */}
      {errorToast && (
        <div className="undo-toast-stack">
          <div className="undo-toast">
            <span className="undo-toast-msg" style={{ color: 'var(--danger)' }}>{errorToast}</span>
          </div>
        </div>
      )}

      {/* Undo toast */}
      {pendingDeletes.size > 0 && (
        <div className="undo-toast-stack">
          {[...pendingDeletes.entries()].map(([id, { startedAt }]) => {
            const elapsed = Date.now() - startedAt
            const remaining = Math.max(0, Math.ceil((UNDO_WINDOW_MS - elapsed) / 1000))
            void tick // force re-render via tick
            return (
              <div key={id} className="undo-toast">
                <span className="undo-toast-msg">entry deleted</span>
                <button className="undo-toast-btn" onClick={() => undoDelete(id)}>
                  undo ({remaining}s)
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
