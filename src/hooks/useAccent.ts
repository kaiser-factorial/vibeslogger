import { useState, useEffect, useRef, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getZone, type ZoneId } from '../lib/zones'
import { applyAccent, loadStoredZone, storeZone, clearStoredZone } from '../lib/accent'

/**
 * Drives the dynamic UI accent. Defaults to the neutral cream/charcoal scheme;
 * once a vibe is logged this session the accent adopts that vibe's zone color.
 * The choice persists across reloads (sessionStorage) but resets to cream on
 * sign-out, or when a different user signs in.
 */
export default function useAccent(session: Session | null) {
  const [zone, setZone] = useState<ZoneId | null>(() => loadStoredZone())
  const prevUserId = useRef<string | null>(null)

  // Repaint whenever the active zone changes (and on first mount).
  useEffect(() => { applyAccent(zone) }, [zone])

  // Reset to cream on sign-out or user switch — but not on the initial null
  // session that precedes auth loading, nor on a reload of the same user.
  useEffect(() => {
    const uid = session?.user.id ?? null
    const prev = prevUserId.current
    if (prev && uid !== prev) {
      clearStoredZone()
      setZone(null)
    }
    prevUserId.current = uid
  }, [session])

  const setAccentFromVibe = useCallback((valence: number, arousal: number) => {
    const z = getZone(valence, arousal)
    storeZone(z)
    setZone(z)
  }, [])

  return { setAccentFromVibe }
}
