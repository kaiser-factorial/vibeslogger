export interface Database {
  public: {
    Tables: {
      vibes: {
        Row: {
          id: string
          user_id: string
          valence: number
          arousal: number
          note: string | null
          public: boolean
          note_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          valence: number
          arousal: number
          note?: string | null
          public?: boolean
          note_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          valence?: number
          arousal?: number
          note?: string | null
          public?: boolean
          note_public?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
        }
        Insert: {
          id: string
          username: string
        }
        Update: {
          id?: string
          username?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
