import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, Vibe } from '../types'

const PUBLIC_VIBES_LIMIT = 50

interface UseUserProfileReturn {
  profile: Profile | null
  vibes: Vibe[]
  followerCount: number
  followingCount: number
  /** Whether this user follows the current session's user back. */
  followsYou: boolean
  loading: boolean
}

/** Fetches everything needed to render another user's profile view: their
 * username, their public vibes, follower/following counts, and whether they
 * follow the current user back (for the "follows you" badge). Requires the
 * `follows` SELECT policy to be open to all authenticated users — see
 * supabase_social_setup.sql. */
export default function useUserProfile(userId: string | null, session: Session | null): UseUserProfileReturn {
  const [profile,        setProfile]        = useState<Profile | null>(null)
  const [vibes,          setVibes]          = useState<Vibe[]>([])
  const [followerCount,  setFollowerCount]  = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [followsYou,     setFollowsYou]     = useState(false)
  const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    if (!userId || !session) return
    let cancelled = false
    setLoading(true)

    Promise.all([
      supabase.from('profiles').select('id, username').eq('id', userId).maybeSingle(),
      supabase.from('vibes').select('*').eq('user_id', userId).eq('public', true)
        .order('created_at', { ascending: false }).limit(PUBLIC_VIBES_LIMIT),
      supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('followee_id', userId),
      supabase.from('follows').select('followee_id', { count: 'exact', head: true }).eq('follower_id', userId),
      supabase.from('follows').select('follower_id').eq('follower_id', userId).eq('followee_id', session.user.id).maybeSingle(),
    ]).then(([profileRes, vibesRes, followerRes, followingRes, mutualRes]: any[]) => {
      if (cancelled) return
      setProfile(profileRes.data ?? null)
      setVibes(vibesRes.data ?? [])
      setFollowerCount(followerRes.count ?? 0)
      setFollowingCount(followingRes.count ?? 0)
      setFollowsYou(!!mutualRes.data)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [userId, session])

  return { profile, vibes, followerCount, followingCount, followsYou, loading }
}
