import { useState, useEffect, useRef } from 'react'

/**
 * MoodModal — appears after clicking the grid, lets user add a note.
 * Sits on top of the full layout (not inside the grid) for clean separation.
 */
export default function MoodModal({ vibe, onSubmit, onClose }) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef(null)

  const wordCount  = note.trim() ? note.trim().split(/\s+/).length : 0
  const showHint   = wordCount > 0 && wordCount < 3

  useEffect(() => {
    textareaRef.current?.focus()
    const onEsc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [])

  async function handleSubmit() {
    setSaving(true)
    await onSubmit(note.trim())
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
