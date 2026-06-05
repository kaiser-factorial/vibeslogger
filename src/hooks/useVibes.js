import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * useVibes — manages vibe entries for the current user.
 * Optimistic updates: mutations update local state immediately.
 */
export default function useVibes(session) {
  const [vibes, setVibes] = useState([])
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
      .order('created_at', { ascending: false })
    if (!error && data) setVibes(data)
    setLoading(false)
  }

  async function addVibe({ x, y, note }) {
    const { data, error } = await supabase
      .from('vibes')
      .insert({ user_id: session.user.id, valence: x, arousal: y, note: note || null })
      .select()
      .single()
    if (!error && data) setVibes(prev => [data, ...prev])
    return { error }
  }

  async function deleteVibe(id) {
    const { error } = await supabase.from('vibes').delete().eq('id', id)
    if (!error) setVibes(prev => prev.filter(v => v.id !== id))
    return { error }
  }

  return { vibes, loading, addVibe, deleteVibe }
}
