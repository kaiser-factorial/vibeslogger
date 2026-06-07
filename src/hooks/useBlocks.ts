import { useState, useEffect, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type BlockRow = { blocked_id: string }

interface UseBlocksReturn {
  blockedIds: Set<string>
  loading: boolean
  block: (userId: string) => Promise<void>
  unblock: (userId: string) => Promise<void>
}

export default function useBlocks(session: Session | null): UseBlocksReturn {
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set())
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    if (!session) { setLoading(false); return }
    fetchBlocks()
  }, [session])

  async function fetchBlocks() {
    setLoading(true)
    const { data } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', session!.user.id) as { data: BlockRow[] | null }
    if (data) setBlockedIds(new Set(data.map(b => b.blocked_id)))
    setLoading(false)
  }

  const block = useCallback(async (userId: string) => {
    setBlockedIds(prev => new Set([...prev, userId]))
    const { error } = await supabase
      .from('blocks')
      .insert({ blocker_id: session!.user.id, blocked_id: userId })
    if (error) {
      setBlockedIds(prev => { const s = new Set(prev); s.delete(userId); return s })
    }
  }, [session])

  const unblock = useCallback(async (userId: string) => {
    setBlockedIds(prev => { const s = new Set(prev); s.delete(userId); return s })
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', session!.user.id)
      .eq('blocked_id', userId)
    if (error) {
      setBlockedIds(prev => new Set([...prev, userId]))
    }
  }, [session])

  return { blockedIds, loading, block, unblock }
}
