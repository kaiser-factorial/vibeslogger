import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { TimelineEntry } from '../types'

interface UseTimelineReturn {
  entries: TimelineEntry[]
  loading: boolean
  refresh: () => Promise<void>
}

export default function useTimeline(session: Session | null): UseTimelineReturn {
  const [entries,  setEntries]  = useState<TimelineEntry[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!session) return
    fetchTimeline()
  }, [session])

  async function fetchTimeline() {
    setLoading(true)

    const { data: vibesData, error } = await supabase
      .from('vibes')
      .select('*')
      .eq('public', true)
      .order('created_at', { ascending: false })
      .limit(200) as { data: import('../types').Vibe[] | null; error: unknown }

    if (error || !vibesData) { setLoading(false); return }

    const userIds = [...new Set(vibesData.map(v => v.user_id))]

    type Profile = { id: string; username: string }
    const { data: profilesData } = userIds.length
      ? (await supabase.from('profiles').select('id, username').in('id', userIds)) as { data: Profile[] | null }
      : { data: [] as Profile[] }

    const pm: Record<string, string> = Object.fromEntries(
      (profilesData ?? []).map(p => [p.id, p.username])
    )

    setEntries(vibesData.map(v => ({ ...v, username: pm[v.user_id] ?? 'anon' })))
    setLoading(false)
  }

  return { entries, loading, refresh: fetchTimeline }
}
