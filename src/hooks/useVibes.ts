import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Vibe } from '../types'

interface AddVibeParams {
  x: number
  y: number
  note: string
  isPublic?: boolean
  isNotePublic?: boolean
}

interface UseVibesReturn {
  vibes: Vibe[]
  loading: boolean
  addVibe: (params: AddVibeParams) => Promise<{ error: Error | null }>
  updateVibe: (id: string, note: string | null) => Promise<{ error: Error | null }>
  deleteVibe: (id: string) => Promise<{ error: Error | null }>
}

export default function useVibes(session: Session | null): UseVibesReturn {
  const [vibes,   setVibes]   = useState<Vibe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) { setVibes([]); setLoading(false); return }
    fetchVibes()
  }, [session])

  async function fetchVibes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('vibes')
      .select('*')
      .order('created_at', { ascending: false }) as { data: Vibe[] | null; error: unknown }
    if (!error && data) setVibes(data)
    setLoading(false)
  }

  async function addVibe({ x, y, note, isPublic = true, isNotePublic = false }: AddVibeParams) {
    if (!session) return { error: new Error('not authenticated') }
    const { data, error } = await supabase
      .from('vibes')
      .insert({
        user_id:     session.user.id,
        valence:     x,
        arousal:     y,
        note:        note || null,
        public:      isPublic,
        note_public: isNotePublic,
      })
      .select()
      .single() as { data: Vibe | null; error: Error | null }
    if (!error && data) setVibes(prev => [data, ...prev])
    return { error }
  }

  async function updateVibe(id: string, note: string | null) {
    const { data, error } = await supabase
      .from('vibes')
      .update({ note: note || null })
      .eq('id', id)
      .select()
      .single() as { data: Vibe | null; error: Error | null }
    if (!error && data) setVibes(prev => prev.map(v => v.id === id ? data : v))
    return { error }
  }

  async function deleteVibe(id: string) {
    const { error } = await supabase
      .from('vibes')
      .delete()
      .eq('id', id) as { error: Error | null }
    if (!error) setVibes(prev => prev.filter(v => v.id !== id))
    return { error }
  }

  return { vibes, loading, addVibe, updateVibe, deleteVibe }
}
