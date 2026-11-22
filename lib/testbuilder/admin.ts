// Server-only. A Supabase client that bypasses RLS, used by the test-builder
// routes for the few writes a learner must never make themselves: moving a
// session through generating/marked, and saving the hidden memo and answer
// keys. Never import this from a client component, and always check the
// learner owns the session (via their own RLS client) before using it.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from '@/lib/supabaseConfig'

let client: SupabaseClient | null = null

export function serviceClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!key) return null
  client ??= createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return client
}
