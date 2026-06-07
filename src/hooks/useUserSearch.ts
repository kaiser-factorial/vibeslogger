import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

const DEBOUNCE_MS = 300
const RESULT_LIMIT = 20

interface UseUserSearchReturn {
  results: Profile[]
  loading: boolean
}

/** Debounced username search against `profiles` (case-insensitive substring match). */
export default function useUserSearch(term: string, excludeId?: string): UseUserSearchReturn {
  const [results, setResults] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const trimmed = term.trim()
    if (!trimmed) { setResults([]); setLoading(false); return }

    setLoading(true)
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${trimmed}%`)
        .limit(RESULT_LIMIT) as { data: Profile[] | null }
      setResults((data ?? []).filter(p => p.id !== excludeId))
      setLoading(false)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [term, excludeId])

  return { results, loading }
}
