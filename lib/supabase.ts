import { createClient } from '@supabase/supabase-js'

// Single shared instance — all pages must import from here
// so they all read/write the same localStorage session key
const supabaseUrl = 'https://inmrsgujgfktapjnekjs.supabase.co'
const supabaseAnonKey = 'sb_publishable__15Lhb_ZGbKC2NHJVwB_HA_Z2BW_UoU'

export const sb = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'curio-supabase-auth', // explicit stable key
  },
})

// Keep legacy export name working
export const supabase = sb
export function createServerClient() { return sb }
