'use client'

import { useEffect, useRef, useState } from 'react'
import { sb } from '@/lib/supabase'
import { Drawer } from '@/components/interior/drawer'
import { FloatingLabelInput } from '@/components/interior/floating-label'
import { PasswordStrength } from '@/components/interior/password-strength'
import { LoadingButton } from '@/components/interior/loading-button'
import { HoldToConfirm } from '@/components/interior/hold-to-confirm'
import { Eye, EyeOff } from '@/components/icons'

const GRADES = [4, 5, 6, 7, 8, 9, 10, 11, 12]

type Notice = { msg: string; type: 'ok' | 'err' } | null

function Section({ title, danger, children }: { title: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <div
      className="mb-4"
      style={{
        background: 'var(--paper-raised)',
        border: `1px solid ${danger ? 'rgba(var(--brick-rgb),0.25)' : 'rgba(var(--ink-rgb),0.08)'}`,
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '0.85rem 1.2rem',
          borderBottom: `1px solid ${danger ? 'rgba(var(--brick-rgb),0.25)' : 'rgba(var(--ink-rgb),0.08)'}`,
          fontFamily: 'var(--h)',
          fontSize: '0.68rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: danger ? 'var(--brick)' : 'rgba(var(--ink-rgb),0.55)',
        }}
      >
        {title}
      </div>
      <div style={{ padding: '1.2rem' }}>{children}</div>
    </div>
  )
}

function AlertBanner({ notice }: { notice: Notice }) {
  if (!notice) return null
  return (
    <div
      className="mb-3"
      style={{
        padding: '0.65rem 0.9rem',
        borderRadius: 8,
        fontSize: '0.76rem',
        lineHeight: 1.5,
        background: notice.type === 'ok' ? 'rgba(var(--moss-rgb),0.12)' : 'rgba(var(--brick-rgb),0.1)',
        color: notice.type === 'ok' ? 'var(--moss)' : 'var(--brick)',
        border: `1px solid ${notice.type === 'ok' ? 'rgba(var(--moss-rgb),0.3)' : 'rgba(var(--brick-rgb),0.25)'}`,
      }}
    >
      {notice.msg}
    </div>
  )
}

function EyeToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      className="grid place-items-center"
      style={{ width: 32, height: 32, color: 'rgba(var(--ink-rgb),0.35)' }}
    >
      {shown ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )
}

export default function AccountDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [loading, setLoading] = useState(true)
  const userId = useRef<string | null>(null)

  const [name, setName] = useState('')
  const [grade, setGrade] = useState('')
  const [email, setEmail] = useState('')
  const [currentEmail, setCurrentEmail] = useState('')

  const [newEmail, setNewEmail] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)

  const [detailsNotice, setDetailsNotice] = useState<Notice>(null)
  const [emailNotice, setEmailNotice] = useState<Notice>(null)
  const [pwNotice, setPwNotice] = useState<Notice>(null)
  const [deleteNotice, setDeleteNotice] = useState<Notice>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)

    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled || !session?.user) { setLoading(false); return }
      userId.current = session.user.id
      const { data: profile } = await sb
        .from('profiles')
        .select('full_name, grade')
        .eq('id', session.user.id)
        .single()
      if (cancelled) return
      const fullName = profile?.full_name || session.user.user_metadata?.full_name || ''
      setName(fullName)
      setGrade(profile?.grade || '')
      setEmail(session.user.email || '')
      setCurrentEmail(session.user.email || '')
      setNewEmail(session.user.email || '')
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [open])

  const initial = (name || email || '?')[0]?.toUpperCase() || '?'

  async function saveDetails() {
    setDetailsNotice(null)
    const trimmed = name.trim()
    const { error } = await sb.auth.updateUser({ data: { full_name: trimmed, grade } })
    if (error) { setDetailsNotice({ msg: error.message, type: 'err' }); throw error }
    if (userId.current) {
      await sb.from('profiles').update({ full_name: trimmed, grade }).eq('id', userId.current)
    }
    setDetailsNotice({ msg: 'Details updated successfully!', type: 'ok' })
  }

  async function saveEmail() {
    setEmailNotice(null)
    if (!newEmail || newEmail === currentEmail) {
      const err = new Error('Please enter a new email address.')
      setEmailNotice({ msg: err.message, type: 'err' })
      throw err
    }
    const { error } = await sb.auth.updateUser({ email: newEmail })
    if (error) { setEmailNotice({ msg: error.message, type: 'err' }); throw error }
    setEmailNotice({ msg: 'Confirmation sent to your new email. Click the link to confirm the change.', type: 'ok' })
  }

  async function savePassword() {
    setPwNotice(null)
    if (!newPw || newPw.length < 6) {
      const err = new Error('Password must be at least 6 characters.')
      setPwNotice({ msg: err.message, type: 'err' })
      throw err
    }
    if (newPw !== confirmPw) {
      const err = new Error('Passwords do not match.')
      setPwNotice({ msg: err.message, type: 'err' })
      throw err
    }
    const { error } = await sb.auth.updateUser({ password: newPw })
    if (error) { setPwNotice({ msg: error.message, type: 'err' }); throw error }
    setPwNotice({ msg: 'Password updated successfully!', type: 'ok' })
    setNewPw('')
    setConfirmPw('')
  }

  function requestDelete() {
    setDeleteNotice({
      msg: 'To delete your account, email hello@curiolearning.co.za from your registered address. We’ll process your request within 30 days, as required by POPIA.',
      type: 'ok',
    })
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Account"
      description="Manage your personal details, email and password"
      width={400}
    >
      {loading ? (
        <div className="py-10 text-center" style={{ color: 'rgba(var(--ink-rgb),0.4)', fontSize: '0.8rem' }}>
          Loading your account…
        </div>
      ) : (
        <>
          <div
            className="mb-5 flex items-center gap-3"
            style={{ padding: '1rem', background: 'var(--paper-raised)', border: '1px solid rgba(var(--ink-rgb),0.08)', borderRadius: 6 }}
          >
            <div
              className="grid shrink-0 place-items-center"
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--ink)', border: 'none',
                fontFamily: 'var(--h)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--paper)',
              }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <div className="truncate" style={{ fontFamily: 'var(--h)', fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)' }}>
                {name || 'My account'}
              </div>
              <div className="truncate" style={{ fontSize: '0.7rem', color: 'rgba(var(--ink-rgb),0.4)' }}>{currentEmail}</div>
            </div>
          </div>

          <Section title="Personal details">
            <AlertBanner notice={detailsNotice} />
            <div className="mb-3">
              <FloatingLabelInput label="Full name" value={name} onChange={setName} />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block" style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(var(--ink-rgb),0.4)' }}>
                Grade
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                style={{
                  width: '100%', padding: '0.72rem 1rem', background: 'var(--paper-raised)',
                  border: '1.5px solid rgba(var(--ink-rgb),0.15)', borderRadius: 4,
                  fontFamily: 'var(--b)', fontSize: '0.85rem', color: 'var(--ink)',
                }}
              >
                <option value="">Select grade</option>
                {GRADES.map((g) => (
                  <option key={g} value={String(g)}>Grade {g}{g === 12 ? ' (Matric)' : ''}</option>
                ))}
              </select>
            </div>
            <LoadingButton onAction={saveDetails} successLabel="Saved" errorLabel="Couldn't save">
              Save changes
            </LoadingButton>
          </Section>

          <Section title="Email address">
            <AlertBanner notice={emailNotice} />
            <div className="mb-2">
              <FloatingLabelInput label="New email address" type="email" value={newEmail} onChange={setNewEmail} />
            </div>
            <p className="mb-4" style={{ fontSize: '0.68rem', color: 'rgba(var(--ink-rgb),0.4)' }}>
              A confirmation link will be sent to your new email address.
            </p>
            <LoadingButton onAction={saveEmail} successLabel="Sent" errorLabel="Couldn't update">
              Update email
            </LoadingButton>
          </Section>

          <Section title="Change password">
            <AlertBanner notice={pwNotice} />
            <div className="mb-1">
              <FloatingLabelInput
                label="New password"
                type={showPw ? 'text' : 'password'}
                value={newPw}
                onChange={setNewPw}
                trailing={<EyeToggle shown={showPw} onToggle={() => setShowPw((v) => !v)} />}
              />
            </div>
            <PasswordStrength value={newPw} showRules={false} />
            <div className="mb-4 mt-3">
              <FloatingLabelInput
                label="Confirm new password"
                type={showPw2 ? 'text' : 'password'}
                value={confirmPw}
                onChange={setConfirmPw}
                trailing={<EyeToggle shown={showPw2} onToggle={() => setShowPw2((v) => !v)} />}
              />
            </div>
            <LoadingButton onAction={savePassword} successLabel="Updated" errorLabel="Couldn't update">
              Update password
            </LoadingButton>
          </Section>

          <Section title="Danger zone" danger>
            <AlertBanner notice={deleteNotice} />
            <p className="mb-4" style={{ fontSize: '0.78rem', color: 'rgba(var(--ink-rgb),0.6)', lineHeight: 1.6 }}>
              Deleting your account is permanent and cannot be undone. All your data will be removed within 30 days.
            </p>
            <HoldToConfirm onConfirm={requestDelete} confirmLabel="Instructions sent below">
              Hold to delete account
            </HoldToConfirm>
          </Section>
        </>
      )}
    </Drawer>
  )
}
