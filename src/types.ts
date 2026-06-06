// ── Shared domain types ──────────────────────────────────────────────────────

/** One row from the `vibes` table. */
export interface Vibe {
  id: string
  user_id: string
  valence: number
  arousal: number
  note: string | null
  public: boolean
  note_public: boolean
  created_at: string
}

/** Vibe augmented with display username for timeline rendering. */
export interface TimelineEntry extends Vibe {
  username: string
}

/** A grid click that hasn't been saved yet (shows as a pending dot). */
export interface PendingVibe {
  x: number
  y: number
}
