/**
 * Days of Premium kept after a renewal fails, before access is removed.
 * Keep in step with GRACE_DAYS in api/_billing.py and the interval in
 * internal.can_read_premium() (supabase/migrations/*_lock_premium_content.sql).
 */
export const PREMIUM_GRACE_DAYS = 3

/** When Premium actually switches off for an account whose payment failed. */
export function premiumEndsAt(expiresAt: string | null | undefined): Date | null {
  if (!expiresAt) return null
  const t = Date.parse(expiresAt)
  if (Number.isNaN(t)) return null
  return new Date(t + PREMIUM_GRACE_DAYS * 24 * 60 * 60 * 1000)
}

/** "Sunday 8 November" */
export function longDay(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' }).formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('weekday')} ${get('day')} ${get('month')}`
}

/** "8 Nov" — for tight spaces like the phone banner */
export function shortDay(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short' }).formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('day')} ${get('month')}`
}
