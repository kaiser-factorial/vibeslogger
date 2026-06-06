import { useState, useEffect, useRef } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { TimelineEntry, Vibe } from '../types'

const PAGE_SIZE = 20

interface UseTimelineReturn {
  entries: TimelineEntry[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  loadMore: () => Promise<void>
}

export default function useTimeline(session: Session | null): UseTimelineReturn {
  const [entries,     setEntries]     = useState<TimelineEntry[]>([])
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore,     setHasMore]     = useState(false)
  // Profile map kept in a ref — accumulates across pages without triggering renders
  const profileMapRef = useRef<Record<string, string>>({})

  useEffect(() => {
    if (!session) return
    profileMapRef.current = {}
    fetchPage(null)
  }, [session])

  async function fetchProfiles(userIds: string[]): Promise<void> {
    const newIds = userIds.filter(id => !profileMapRef.current[id])
    if (!newIds.length) return
    type Profile = { id: string; username: string }
    const { data } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', newIds) as { data: Profile[] | null }
    ;(data ?? []).forEach(p => { profileMapRef.current[p.id] = p.username })
  }

  async function fetchPage(cursor: string | null): Promise<void> {
    const isFirst = cursor === null
    if (isFirst) setLoading(true)
    else setLoadingMore(true)

    let query = (supabase
      .from('vibes')
      .select('*')
      .eq('public', true)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1) as any)

    if (cursor) query = query.lt('created_at', cursor)

    const { data: vibesData } = await query as { data: Vibe[] | null }

    if (!vibesData) {
      if (isFirst) setLoading(false)
      else setLoadingMore(false)
      return
    }

    const nextPageExists = vibesData.length > PAGE_SIZE
    const pageVibes = nextPageExists ? vibesData.slice(0, PAGE_SIZE) : vibesData

    await fetchProfiles([...new Set(pageVibes.map(v => v.user_id))])

    const newEntries = pageVibes.map(v => ({
      ...v,
      username: profileMapRef.current[v.user_id] ?? 'anon',
    }))

    setEntries(prev => isFirst ? newEntries : [...prev, ...newEntries])
    setHasMore(nextPageExists)
    if (isFirst) setLoading(false)
    else setLoadingMore(false)
  }

  function loadMore(): Promise<void> {
    const last = entries[entries.length - 1]
    if (!last || !hasMore || loadingMore) return Promise.resolve()
    return fetchPage(last.created_at)
  }

  return { entries, loading, loadingMore, hasMore, loadMore }
}
