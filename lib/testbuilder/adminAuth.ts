import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseConfig'
import { serviceClient } from '@/lib/testbuilder/admin'

/**
 * True only for a signed-in user whose profile has is_admin = true.
 * The flag is read with the service role, so a user cannot grant it to themselves.
 */
export async function isAdminRequest(req: Request): Promise<boolean> {
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  const svc = serviceClient()
  if (!token || !svc) return false
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return false
  const { data } = await svc.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  return data?.is_admin === true
}
