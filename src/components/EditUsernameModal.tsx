import { useState } from 'react'

interface Props {
  currentUsername: string
  onSave: (username: string) => Promise<{ error: string | null }>
  onClose: () => void
}

export default function EditUsernameModal({ currentUsername, onSave, onClose }: Props) {
  const [value,  setValue]  = useState(currentUsername)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleSave() {
    const trimmed = value.trim()
    if (!trimmed)                              { setError('username cannot be empty'); return }
    if (trimmed.length > 30)                   { setError('max 30 characters'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed))     { setError('letters, numbers, and underscores only'); return }
    if (trimmed === currentUsername)           { onClose(); return }
    setSaving(true)
    const { error } = await onSave(trimmed)
    setSaving(false)
    if (error) { setError(error); return }
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-coords">edit username</div>
        <input
          className="modal-input"
          value={value}
          onChange={e => { setValue(e.target.value); setError(null) }}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose() }}
          autoFocus
          maxLength={30}
          placeholder="your username"
          spellCheck={false}
        />
        {error && <p className="auth-error" style={{ marginTop: 8 }}>{error}</p>}
        <div className="modal-actions">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'saving...' : 'save'}
          </button>
          <button className="btn-ghost" onClick={onClose}>cancel</button>
        </div>
      </div>
    </div>
  )
}
