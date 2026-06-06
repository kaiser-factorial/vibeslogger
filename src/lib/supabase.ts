import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — copy .env.example to .env and fill in your keys'
  )
}

// Plain client — table row types are asserted explicitly in hooks via our
// own Vibe / Profile interfaces rather than the supabase-js Database generic
// (which has compatibility issues with TypeScript 6).
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
