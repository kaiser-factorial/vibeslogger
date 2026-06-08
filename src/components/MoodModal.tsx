import { useState, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { PendingVibe } from '../types'
import { getZone } from '../lib/zones'
import { paletteFor } from '../lib/accent'

interface Props {
  vibe: PendingVibe
  onSubmit: (note: string, isPublic: boolean, isNotePublic: boolean) => Promise<boolean>
  onClose: () => void
}

export default function MoodModal({ vibe, onSubmit, onClose }: Props) {
  const [note,        setNote]        = useState('')
  const [isPublic,    setIsPublic]    = useState(true)
  const [notePublic,  setNotePublic]  = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0
  const showHint  = wordCount > 0 && wordCount < 3

  // Preview the theme this click is about to apply: a faint wash of the zone
  // color behind the modal and a full-color submit button, while the modal's
  // own controls stay neutral cream/charcoal (overridden via these vars).
  const preview = paletteFor(getZone(vibe.x, vibe.y))
  const neutral = paletteFor(null)
  const themeStyle = {
    '--accent':        neutral.accent,
    '--accent-hover':  neutral.hover,
    '--accent-ink':    neutral.ink,
    '--accent-rgb':    neutral.rgb,
    '--accent-glow':   neutral.glow,
    '--preview-accent': preview.accent,
    '--preview-hover':  preview.hover,
    '--preview-ink':    preview.ink,
    '--preview-glow':   preview.glow,
    background: `radial-gradient(circle at 50% 50%, rgba(${preview.rgb}, 0.20) 0%, rgba(${preview.rgb}, 0.05) 45%, transparent 70%), rgba(0, 0, 0, 0.6)`,
  } as CSSProperties

  useEffect(() => {
    textareaRef.current?.focus()
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [])

  function handlePublicToggle(val: boolean) {
    setIsPublic(val)
    if (!val) setNotePublic(false)
  }

  async function handleSubmit() {
    setSaving(true)
    setError(null)
    const ok = await onSubmit(note.trim(), isPublic, notePublic && !!note.trim())
    setSaving(false)
    if (!ok) setError("couldn't save — check your connection and try again")
  }

  return (
    <div className="modal-backdrop" style={themeStyle} onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-coords">
          valence {vibe.x.toFixed(1)} · arousal {vibe.y.toFixed(1)}
        </div>
        <textarea
          ref={textareaRef}
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }}}
          placeholder="what's the vibe... (optional, Enter to save)"
          className="modal-textarea"
        />
        {showHint && (
          <div className="modal-word-hint">
            {wordCount} word{wordCount !== 1 ? 's' : ''} — add a few more to count toward word analysis
          </div>
        )}
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-toggles">
          <label className="modal-toggle-row">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={e => handlePublicToggle(e.target.checked)}
            />
            <span>post to timeline</span>
          </label>
          {isPublic && note.trim() && (
            <label className="modal-toggle-row modal-toggle-row--sub">
              <input
                type="checkbox"
                checked={notePublic}
                onChange={e => setNotePublic(e.target.checked)}
              />
              <span>include note publicly</span>
            </label>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn-primary btn-primary--preview" onClick={handleSubmit} disabled={saving}>
            {saving ? 'saving...' : 'log it'}
          </button>
          <button className="btn-ghost" onClick={onClose}>cancel</button>
        </div>
      </div>
    </div>
  )
}
