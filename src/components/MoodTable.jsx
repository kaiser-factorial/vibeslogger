import { useState } from 'react'
import { vibeColor } from '../lib/vibeColor'

const LOCK_AFTER_MS = 3 * 60 * 60 * 1000

function isLocked(createdAt) {
  return Date.now() - new Date(createdAt).getTime() > LOCK_AFTER_MS
}

function fmtDate(ts) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString()
}

export default function MoodTable({ vibes, onDelete }) {
  const [confirmId, setConfirmId] = useState(null)

  function handleDelete(id) {
    if (confirmId === id) { onDelete(id); setConfirmId(null) }
    else setConfirmId(id)
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
          {vibes.map(v => (
            <tr key={v.id}>
              <td className="td-muted">{fmtDate(v.created_at)}</td>
              <td className="td-muted">{fmtTime(v.created_at)}</td>
              <td className="td-mono">
                {/* Dot color encodes valence × arousal */}
                <span
                  className="vibe-dot"
                  style={{ background: vibeColor(v.valence, v.arousal) }}
                />
                ({v.valence}, {v.arousal})
              </td>
              <td className="td-note">
                {v.note || <span className="td-empty">—</span>}
              </td>
              <td>
                {isLocked(v.created_at) ? (
                  <span className="entry-locked" title="locked after 3 hours">·</span>
                ) : (
                  <button
                    className={`btn-delete ${confirmId === v.id ? 'btn-delete-confirm' : ''}`}
                    onClick={() => handleDelete(v.id)}
                    title={confirmId === v.id ? 'click again to confirm' : 'delete'}
                  >
                    {confirmId === v.id ? '?' : '×'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
