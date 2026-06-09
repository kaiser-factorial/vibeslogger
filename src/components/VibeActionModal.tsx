import { useState, useRef, useEffect } from 'react'
import type { Vibe } from '../types'
import { getZone, ZONE_META, gridColor } from '../lib/zones'

interface Props {
  vibe: Vibe
  onClose: () => void
  onUpdate: (id: string, note: string | null) => Promise<{ error: Error | null }>
  onDelete: (v: Vibe) => void
  onShare: (v: Vibe) => void
}

const LOCK_AFTER_MS  = 3 * 60 * 60 * 1000

function isLocked(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() > LOCK_AFTER_MS
}

function fmtStamp(ts: string): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} · ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}

export default function VibeActionModal({ vibe, onClose, onUpdate, onDelete, onShare }: Props) {
  const [editing, setEditing] = useState(false)
  const [editNote, setEditNote] = useState(vibe.note ?? '')
  const [saving, setSaving] = useState(false)
  const [errorToast, setErrorToast] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const locked = isLocked(vibe.created_at)
  const zone = getZone(vibe.valence, vibe.arousal)
  const meta = ZONE_META[zone]
  const color = gridColor(vibe.valence, vibe.arousal)

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length)
    }
  }, [editing])

  async function handleSave() {
    setSaving(true)
    const { error } = await onUpdate(vibe.id, editNote.trim() || null)
    setSaving(false)
    if (error) {
      setErrorToast("couldn't save edit — try again")
    } else {
      setEditing(false)
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
      <div className="modal share-modal vibe-action-modal" onClick={e => e.stopPropagation()}>
        
        {/* Vibe Details Header */}
        <div className="vibe-tip-head" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
          <div style={{ fontWeight: 800, fontSize: '20px', color: meta.color, fontFamily: "'Impact', 'Franklin Gothic Heavy', 'Arial Narrow Bold', sans-serif", letterSpacing: '0.5px' }}>{meta.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8, fontSize: '14px' }}>
            <span className="share-dot" style={{ background: color, display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%' }} />
            <span>({vibe.valence.toFixed(1)}, {vibe.arousal.toFixed(1)})</span>
          </div>
        </div>

        {/* Note Content / Edit Input */}
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <textarea
              ref={textareaRef}
              className="modal-textarea"
              value={editNote}
              onChange={e => setEditNote(e.target.value)}
              disabled={saving}
              style={{ minHeight: '80px', marginBottom: 0 }}
            />
            {errorToast && <div className="modal-error">{errorToast}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
                {saving ? 'saving...' : 'save note'}
              </button>
              <button className="btn-ghost" onClick={() => setEditing(false)} disabled={saving}>
                cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            {vibe.note ? (
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                color: '#141414', 
                lineHeight: 1.4,
                background: '#f8f4ec',
                padding: '12px 16px',
                borderRadius: '8px',
                display: 'inline-block',
                textAlign: 'left',
                border: '1px solid rgba(0,0,0,0.05)'
              }}>
                "{vibe.note}"
              </div>
            ) : (
              <div style={{ fontSize: '14px', opacity: 0.5 }}>— no note —</div>
            )}
            <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '8px' }}>{fmtStamp(vibe.created_at)}</div>
          </div>
        )}

        {/* Actions */}
        {!editing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {vibe.public && (
              <button className="btn-primary" onClick={() => { onShare(vibe); onClose(); }} style={{ background: color, color: '#fff' }}>
                Share Vibe
              </button>
            )}
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {!locked ? (
                <>
                  <button className="btn-ghost" onClick={() => setEditing(true)} style={{ flex: 1, border: '1px solid rgba(0,0,0,0.1)' }}>
                    Edit Note
                  </button>
                  <button className="btn-ghost" onClick={() => { onDelete(vibe); onClose(); }} style={{ flex: 1, border: '1px solid rgba(0,0,0,0.1)', color: 'var(--danger)' }}>
                    Delete
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', width: '100%', padding: '8px', opacity: 0.6, fontSize: '13px' }}>
                  🔒 Edits locked (older than 3 hours)
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
