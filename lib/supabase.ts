import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  || 'https://inmrsgujgfktapjnekjs.supabase.co'

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || 'sb_publishable__15Lhb_ZGbKC2NHJVwB_HA_Z2BW_UoU'

/**
 * Single Supabase client for data queries.
 * NOTE: Curio uses manual session management (curio_session in localStorage),
 * NOT Supabase's built-in auth. Do not call supabase.auth.getSession() —
 * use getLocalSession() from lib/session.ts instead.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Disable auto-refresh / storage management — we handle sessions ourselves
    persistSession: false,
    autoRefreshToken: false,
  },
})

/** Alias for server components — same client, no difference in this setup */
export function createServerClient() {
  return supabase
}
