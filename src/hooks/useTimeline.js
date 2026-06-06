import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function useTimeline(session) {
  const [entries,  setEntries]  = useState([])
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
      .limit(200)

    if (error || !vibesData) { setLoading(false); return }

    const userIds = [...new Set(vibesData.map(v => v.user_id))]

    const { data: profilesData } = userIds.length
      ? await supabase.from('profiles').select('id, username').in('id', userIds)
      : { data: [] }

    const pm = Object.fromEntries((profilesData || []).map(p => [p.id, p.username]))
    setEntries(vibesData.map(v => ({ ...v, username: pm[v.user_id] || 'anon' })))
    setLoading(false)
  }

  return { entries, loading, refresh: fetchTimeline }
}
