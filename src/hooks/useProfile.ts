import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface UseProfileReturn {
  username: string | null
  updating: boolean
  updateUsername: (newUsername: string) => Promise<{ error: string | null }>
}

export default function useProfile(session: Session | null): UseProfileReturn {
  const [username, setUsername] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!session) return
    type Row = { username: string }
    ;(supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single() as unknown as Promise<{ data: Row | null }>)
      .then(({ data }) => { if (data) setUsername(data.username) })
  }, [session])

  async function updateUsername(newUsername: string): Promise<{ error: string | null }> {
    if (!session) return { error: 'not logged in' }
    setUpdating(true)
    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', session.user.id) as { error: { message: string } | null }
    setUpdating(false)
    if (error) return { error: error.message ?? 'update failed' }
    setUsername(newUsername)
    return { error: null }
  }

  return { username, updating, updateUsername }
}
