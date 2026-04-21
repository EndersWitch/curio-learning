'use client'

import { useState, useEffect } from 'react'
import Bloom from '@/components/Bloom'
import { sb } from '@/lib/supabase'

const SUPABASE_URL = 'https://inmrsgujgfktapjnekjs.supabase.co'
const SUPABASE_KEY = 'sb_publishable__15Lhb_ZGbKC2NHJVwB_HA_Z2BW_UoU'

async function sbAuth(endpoint: string, body: object) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || data.msg || data.message || 'Something went wrong')
  return data
}

function friendlyError(msg: string) {
  if (!msg) return 'Something went wrong. Please try again.'
  const m = msg.toLowerCase()
  if (m.includes('invalid login') || m.includes('invalid credentials') || m.includes('wrong'))
    return 'Incorrect email or password. Please try again.'
  if (m.includes('already registered') || m.includes('already exists'))
    return 'An account with this email already exists. Try signing in instead.'
  if (m.includes('email not confirmed') || m.includes('not confirmed'))
    return '📧 Check your inbox — click the verification link we sent you before signing in.'
  if (m.includes('email')) return 'Please enter a valid email address.'
  if (m.includes('password')) return 'Password must be at least 6 characters.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Too many attempts. Please wait a moment and try again.'
  return msg
}

type Tab = 'login' | 'signup' | 'forgot'

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login')
  const [alert, setAlert] = useState<{ msg: string; type: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ title: string; email: string } | null>(null)
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [showPw3, setShowPw3] = useState(false)
  const [pwStrength, setPwStrength] = useState<{ width: string; color: string; label: string } | null>(null)

  // Form values
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPw, setLoginPw] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPw, setSignupPw] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [signupGrade, setSignupGrade] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [confirmError, setConfirmError] = useState(false)

  useEffect(() => {
    // Redirect if already logged in
    try {
      const raw = localStorage.getItem('curio_session')
      if (raw) {
        const s = JSON.parse(raw)
        if (s?.access_token && s?.expires_at > Date.now() / 1000) {
          window.location.href = '/'
        }
      }
    } catch {}

    // ?tab=signup
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'signup') setTab('signup')
  }, [])

  function checkPwStrength(pw: string) {
    if (!pw) { setPwStrength(null); return }
    let score = 0
    if (pw.length >= 6) score++
    if (pw.length >= 10) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^a-zA-Z0-9]/.test(pw)) score++
    const levels = [
      { width: '20%', color: 'var(--coral)', label: 'Too short' },
      { width: '40%', color: '#c47c1a', label: 'Weak' },
      { width: '60%', color: '#c47c1a', label: 'Fair' },
      { width: '80%', color: 'var(--cyan)', label: 'Good' },
      { width: '100%', color: '#2a9a5a', label: 'Strong' },
    ]
    setPwStrength(levels[Math.max(0, score - 1)])
  }

  async function doLogin() {
    setAlert(null)
    if (!loginEmail || !loginPw) { setAlert({ msg: 'Please fill in your email and password.', type: 'err' }); return }
    setLoading(true)
    try {
      const data = await sbAuth('token?grant_type=password', { email: loginEmail, password: loginPw })
      localStorage.setItem('curio_session', JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
        user: data.user,
      }))
      window.location.href = '/'
    } catch (e: any) {
      const msg = e.message || ''
      if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('not confirmed')) {
        setAlert({ msg: '📧 <strong>Email not verified yet.</strong><br/>Check your inbox for the confirmation email we sent when you signed up, and click the link to verify your account before signing in.', type: 'warn' })
      } else {
        setAlert({ msg: friendlyError(msg), type: 'err' })
      }
      setLoading(false)
    }
  }
