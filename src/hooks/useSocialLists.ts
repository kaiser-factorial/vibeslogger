import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface UseSocialListsReturn {
  followers: Profile[]
  following: Profile[]
  loading: boolean
}

/** Fetches the current user's followers and following as {id, username} lists,
 * for the account settings modal. Two queries against `follows` (which side of
 * the relationship), then a single batched `profiles` lookup for usernames —
 * same join-in-JS strategy as `useTimeline` (PostgREST can't traverse the
 * vibes/follows → auth.users → profiles FK chain automatically). Requires the
 * open `follows` SELECT policy from supabase_social_setup.sql (to see rows
 * where you're the followee, not just the follower). */
export default function useSocialLists(session: Session | null): UseSocialListsReturn {
  const [followers, setFollowers] = useState<Profile[]>([])
  const [following, setFollowing] = useState<Profile[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!session) { setLoading(false); return }
    let cancelled = false
    setLoading(true)

    Promise.all([
      supabase.from('follows').select('follower_id').eq('followee_id', session.user.id),
      supabase.from('follows').select('followee_id').eq('follower_id', session.user.id),
    ]).then(async ([followerRows, followingRows]: any[]) => {
      const followerIds:  string[] = (followerRows.data  ?? []).map((r: any) => r.follower_id)
      const followingIds: string[] = (followingRows.data ?? []).map((r: any) => r.followee_id)
      const allIds = [...new Set([...followerIds, ...followingIds])]

      if (!allIds.length) {
        if (!cancelled) { setFollowers([]); setFollowing([]); setLoading(false) }
        return
      }

      const { data: profiles } = await supabase
        .from('profiles').select('id, username').in('id', allIds) as { data: Profile[] | null }
      const usernameOf = new Map((profiles ?? []).map(p => [p.id, p.username]))

      if (cancelled) return
      setFollowers(followerIds.map(id  => ({ id, username: usernameOf.get(id) ?? 'anon' })))
      setFollowing(followingIds.map(id => ({ id, username: usernameOf.get(id) ?? 'anon' })))
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [session])

  return { followers, following, loading }
}
