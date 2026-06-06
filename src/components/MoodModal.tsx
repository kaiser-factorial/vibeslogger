import { useState, useEffect, useRef } from 'react'
import type { PendingVibe } from '../types'

interface Props {
  vibe: PendingVibe
  onSubmit: (note: string, isPublic: boolean, isNotePublic: boolean) => Promise<void>
  onClose: () => void
}

export default function MoodModal({ vibe, onSubmit, onClose }: Props) {
  const [note,        setNote]        = useState('')
  const [isPublic,    setIsPublic]    = useState(true)
  const [notePublic,  setNotePublic]  = useState(false)
  const [saving,      setSaving]      = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0
  const showHint  = wordCount > 0 && wordCount < 3

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
    await onSubmit(note.trim(), isPublic, notePublic && !!note.trim())
    setSaving(false)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
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
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'saving...' : 'log it'}
          </button>
          <button className="btn-ghost" onClick={onClose}>cancel</button>
        </div>
      </div>
    </div>
  )
}
