import { useState, useEffect, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type FollowRow = { followee_id: string }

interface UseFollowsReturn {
  followingIds: Set<string>
  loading: boolean
  follow: (userId: string) => Promise<void>
  unfollow: (userId: string) => Promise<void>
}

export default function useFollows(session: Session | null): UseFollowsReturn {
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    if (!session) { setLoading(false); return }
    fetchFollows()
  }, [session])

  async function fetchFollows() {
    setLoading(true)
    const { data } = await supabase
      .from('follows')
      .select('followee_id')
      .eq('follower_id', session!.user.id) as { data: FollowRow[] | null }
    if (data) setFollowingIds(new Set(data.map(f => f.followee_id)))
    setLoading(false)
  }

  const follow = useCallback(async (userId: string) => {
    setFollowingIds(prev => new Set([...prev, userId]))
    await supabase
      .from('follows')
      .insert({ follower_id: session!.user.id, followee_id: userId })
  }, [session])

  const unfollow = useCallback(async (userId: string) => {
    setFollowingIds(prev => { const s = new Set(prev); s.delete(userId); return s })
    await supabase
      .from('follows')
      .delete()
      .eq('follower_id', session!.user.id)
      .eq('followee_id', userId)
  }, [session])

  return { followingIds, loading, follow, unfollow }
}
