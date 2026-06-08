import { useState, useEffect, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface StreakStats {
  currentStreak: number
  longestStreak: number
}

export default function useStreaks(session: Session | null) {
  const [streaks, setStreaks] = useState<StreakStats>({ currentStreak: 0, longestStreak: 0 })

  const refresh = useCallback(async () => {
    if (!session) return
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const { data, error } = await supabase.rpc('get_streak_stats', { tz })
    if (!error && data?.[0]) {
      setStreaks({
        currentStreak: data[0].current_streak,
        longestStreak: data[0].longest_streak,
      })
    }
  }, [session])

  useEffect(() => { refresh() }, [refresh])

  return { ...streaks, refreshStreaks: refresh }
}
