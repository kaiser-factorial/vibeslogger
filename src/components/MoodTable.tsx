import { useState } from 'react'
import { vibeColor } from '../lib/vibeColor'
import type { Vibe } from '../types'

interface Props {
  vibes: Vibe[]
  onDelete: (id: string) => Promise<{ error: Error | null }>
  onUpdate: (id: string, note: string | null) => Promise<{ error: Error | null }>
}

const LOCK_AFTER_MS = 3 * 60 * 60 * 1000

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

export default function MoodTable({ vibes, onDelete, onUpdate }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNote,  setEditNote]  = useState('')
  const [saving,    setSaving]    = useState(false)

  function handleDelete(id: string) {
    if (confirmId === id) { onDelete(id); setConfirmId(null) }
    else { setConfirmId(id); setEditingId(null) }
  }

  function startEdit(v: Vibe) {
    setEditingId(v.id)
    setEditNote(v.note ?? '')
    setConfirmId(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditNote('')
  }

  async function saveEdit(id: string) {
    setSaving(true)
    await onUpdate(id, editNote.trim() || null)
    setSaving(false)
    setEditingId(null)
    setEditNote('')
  }

  if (vibes.length === 0) return (
    <div className="table-empty">no vibes logged yet</div>
  )

  return (
    <div className="table-wrap">
      <div className="table-header">
        recorded moods <span className="table-count">{vibes.length}</span>
      </div>
      <table className="vibe-table">
        <thead>
          <tr>
            <th>date</th>
            <th>time</th>
            <th>mood</th>
            <th>notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {vibes.map(v => {
            const locked  = isLocked(v.created_at)
            const editing = editingId === v.id

            return (
              <tr key={v.id}>
                <td className="td-muted">{fmtDate(v.created_at)}</td>
                <td className="td-muted">{fmtTime(v.created_at)}</td>
                <td className="td-mono">
                  <span
                    className="vibe-dot"
                    style={{ background: vibeColor(v.valence, v.arousal) }}
                  />
                  ({v.valence}, {v.arousal})
                </td>

                <td className="td-note">
                  {editing ? (
                    <input
                      className="note-edit-input"
                      value={editNote}
                      onChange={e => setEditNote(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  saveEdit(v.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      autoFocus
                      disabled={saving}
                    />
                  ) : (
                    v.note ?? <span className="td-empty">—</span>
                  )}
                </td>

                <td className="td-actions">
                  {locked ? (
                    <span className="entry-locked" title="locked after 3 hours">·</span>
                  ) : editing ? (
                    <div className="row-actions">
                      <button
                        className="btn-save"
                        onClick={() => saveEdit(v.id)}
                        disabled={saving}
                      >
                        {saving ? '...' : 'save'}
                      </button>
                      <button className="btn-cancel-edit" onClick={cancelEdit}>×</button>
                    </div>
                  ) : (
                    <div className="row-actions">
                      <button className="btn-edit" onClick={() => startEdit(v)}>
                        edit
                      </button>
                      <button
                        className={`btn-delete ${confirmId === v.id ? 'btn-delete-confirm' : ''}`}
                        onClick={() => handleDelete(v.id)}
                        title={confirmId === v.id ? 'click again to confirm' : 'delete'}
                      >
                        {confirmId === v.id ? '?' : '×'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
