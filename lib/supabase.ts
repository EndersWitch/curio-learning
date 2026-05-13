import { createClient } from '@supabase/supabase-js'

// ─── THE ONE AND ONLY Supabase client for the entire Next.js app ──────────────
// Every file must import { sb } from '@/lib/supabase'.
// NEVER call createClient() anywhere else.

export const SUPABASE_URL = 'https://inmrsgujgfktapjnekjs.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable__15Lhb_ZGbKC2NHJVwB_HA_Z2BW_UoU'

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'curio-auth', // single stable key — all pages share this
    detectSessionInUrl: true,
  },
})

// Aliases for backwards compat — always point to the same instance
export const supabase = sb
export function createServerClient() { return sb }
