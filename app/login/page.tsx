'use client'

import { useState, useEffect } from 'react'
import Bloom from '@/components/Bloom'

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

  async function doSignup() {
    setAlert(null); setConfirmError(false)
    if (!signupEmail || !signupPw) { setAlert({ msg: 'Please fill in your email and password.', type: 'err' }); return }
    if (signupPw.length < 6) { setAlert({ msg: 'Password must be at least 6 characters.', type: 'err' }); return }
    if (signupPw !== signupConfirm) { setAlert({ msg: 'Passwords do not match. Please check and try again.', type: 'err' }); setConfirmError(true); return }
    setLoading(true)
    try {
      await sbAuth('signup', { email: signupEmail, password: signupPw, data: { full_name: signupName, grade: signupGrade } })
      setSuccess({ title: `Welcome${signupName ? ', ' + signupName.split(' ')[0] : ''}!`, email: signupEmail })
    } catch (e: any) {
      setAlert({ msg: friendlyError(e.message), type: 'err' })
      setLoading(false)
    }
  }

  async function doForgot() {
    setAlert(null)
    if (!forgotEmail) { setAlert({ msg: 'Please enter your email address.', type: 'err' }); return }
    try {
      await sbAuth('recover', { email: forgotEmail })
      setAlert({ msg: 'Reset link sent! Check your inbox.', type: 'ok' })
    } catch (e: any) {
      setAlert({ msg: friendlyError(e.message), type: 'err' })
    }
  }

  const tabTitles: Record<Tab, { eyebrow: string; title: React.ReactNode; sub: string }> = {
    login: { eyebrow: 'Welcome back', title: <>Sign <em>in</em> to Curio</>, sub: 'Access your papers, quizzes and progress.' },
    signup: { eyebrow: 'Get started free', title: <>Create your <em>account</em></>, sub: 'Free to browse. No credit card needed.' },
    forgot: { eyebrow: 'Reset password', title: <>Forgot your <span className="cr">password?</span></>, sub: "We'll send a reset link to your email." },
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>

      {/* ── Brand panel ── */}
      <div className="brand-panel">
        <div className="bp-top">
          <a href="/" className="bp-logo">
            <Bloom size={26} />
            curio
          </a>
        </div>
        <div className="bp-mid">
          <div className="bp-eyebrow">your study friend</div>
          <h2 className="bp-tagline">
            Papers.<br />Quizzes.<br />
            <span className="cy">Deep</span> <span className="co">learning.</span>
          </h2>
          <p className="bp-sub">
            Everything you need to <strong>actually prepare</strong> for exams — free to start, always.
          </p>
          <ul className="bp-features">
            {['Exam papers & memos — free forever','AI-powered topic quizzes','Deep Learn explanations','Grades 4 – 12 · every subject'].map((f) => (
              <li key={f} className="bp-feature"><span className="bp-chk">✓</span>{f}</li>
            ))}
          </ul>
          <span className="bp-script">let&apos;s do this 🌱</span>
          <div className="bp-stats">
            <div className="bp-stat"><div className="bp-stat-val cy">30+</div><div className="bp-stat-lbl">Subjects</div></div>
            <div className="bp-stat"><div className="bp-stat-val">R0</div><div className="bp-stat-lbl">To start</div></div>
            <div className="bp-stat"><div className="bp-stat-val cy">Free</div><div className="bp-stat-lbl">Papers</div></div>
          </div>
        </div>
        <div className="bp-bottom">
          <p className="bp-note">© 2026 Curio Learning · Built for SA students</p>
        </div>
        <svg className="bp-bloom" width="400" height="400" viewBox="0 0 64 64" fill="none">
          <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" />
          <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" fillOpacity="0.7" transform="rotate(72 32 32)" />
          <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" fillOpacity="0.5" transform="rotate(144 32 32)" />
          <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" fillOpacity="0.5" transform="rotate(216 32 32)" />
          <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" fillOpacity="0.7" transform="rotate(288 32 32)" />
          <circle cx="32" cy="32" r="7" fill="#FF5E5B" />
        </svg>
      </div>

      {/* ── Form panel ── */}
      <div className="form-panel">
        <div className="form-inner">
          <a href="/" className="form-back">← Back to home</a>

          <div className="form-header">
            <div className="form-eyebrow">{tabTitles[tab].eyebrow}</div>
            <h1 className="form-title">{tabTitles[tab].title}</h1>
            <p className="form-sub">{tabTitles[tab].sub}</p>
          </div>

          {tab !== 'forgot' && !success && (
            <div className="tab-row">
              <button className={`tab-btn${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setAlert(null) }}>Sign in</button>
              <button className={`tab-btn${tab === 'signup' ? ' active' : ''}`} onClick={() => { setTab('signup'); setAlert(null) }}>Create account</button>
            </div>
          )}

          {alert && (
            <div className={`alert show ${alert.type}`} dangerouslySetInnerHTML={{ __html: alert.msg }} />
          )}

          {/* ── LOGIN ── */}
          {tab === 'login' && !success && (
            <>
              <div className="field">
                <label className="field-label">Email address</label>
                <input className="field-input" type="email" placeholder="you@email.com" value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doLogin()} />
              </div>
              <div className="field">
                <label className="field-label">Password</label>
                <div className="field-wrap">
                  <input className="field-input has-eye" type={showPw ? 'text' : 'password'}
                    placeholder="••••••••" value={loginPw}
                    onChange={(e) => setLoginPw(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && doLogin()} />
                  <button type="button" className={`eye-btn${showPw ? ' showing' : ''}`} onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                    <EyeIcon open />
                    <EyeIcon />
                  </button>
                </div>
                <button className="forgot-link" onClick={() => { setTab('forgot'); setAlert(null) }}>
                  Forgot password?
                </button>
              </div>
              <button className="btn-submit" disabled={loading} onClick={doLogin}>
                {loading ? 'Please wait…' : 'Sign in →'}
              </button>
              <div className="switch-link">
                No account yet? <a href="#" onClick={(e) => { e.preventDefault(); setTab('signup'); setAlert(null) }}>Create one free</a>
              </div>
            </>
          )}

          {/* ── SIGNUP ── */}
          {tab === 'signup' && !success && (
            <>
              <div className="field">
                <label className="field-label">Your name</label>
                <input className="field-input" type="text" placeholder="First name is fine" value={signupName} onChange={(e) => setSignupName(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Email address</label>
                <input className="field-input" type="email" placeholder="you@email.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Password</label>
                <div className="field-wrap">
                  <input className="field-input has-eye" type={showPw2 ? 'text' : 'password'}
                    placeholder="At least 6 characters" value={signupPw}
                    onChange={(e) => { setSignupPw(e.target.value); checkPwStrength(e.target.value) }} />
                  <button type="button" className={`eye-btn${showPw2 ? ' showing' : ''}`} onClick={() => setShowPw2(!showPw2)} tabIndex={-1}>
                    <EyeIcon open />
                    <EyeIcon />
                  </button>
                </div>
                {pwStrength && (
                  <div className="pw-strength show">
                    <div className="pw-bar-track">
                      <div className="pw-bar-fill" style={{ width: pwStrength.width, background: pwStrength.color }} />
                    </div>
                    <span className="pw-label" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                  </div>
                )}
              </div>
              <div className="field">
                <label className="field-label">Confirm password</label>
                <div className="field-wrap">
                  <input className={`field-input has-eye${confirmError ? ' error' : ''}`} type={showPw3 ? 'text' : 'password'}
                    placeholder="Repeat your password" value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)} />
                  <button type="button" className={`eye-btn${showPw3 ? ' showing' : ''}`} onClick={() => setShowPw3(!showPw3)} tabIndex={-1}>
                    <EyeIcon open />
                    <EyeIcon />
                  </button>
                </div>
              </div>
              <div className="field">
                <label className="field-label">Your grade</label>
                <select className="field-input" value={signupGrade} onChange={(e) => setSignupGrade(e.target.value)}>
                  <option value="">Select grade (optional)</option>
                  {[4,5,6,7,8,9,10,11,12].map((g) => (
                    <option key={g} value={String(g)}>Grade {g}{g === 12 ? ' (Matric)' : ''}</option>
                  ))}
                </select>
                <div className="field-hint">Helps us show you the most relevant content.</div>
              </div>
              <button className="btn-submit" disabled={loading} onClick={doSignup}>
                {loading ? 'Please wait…' : 'Create free account →'}
              </button>
              <div className="switch-link">
                Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setTab('login'); setAlert(null) }}>Sign in</a>
              </div>
            </>
          )}

          {/* ── FORGOT ── */}
          {tab === 'forgot' && !success && (
            <>
              <div className="field">
                <label className="field-label">Email address</label>
                <input className="field-input" type="email" placeholder="you@email.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
              </div>
              <button className="btn-submit" onClick={doForgot}>Send reset link →</button>
              <div className="switch-link">
                <a href="#" onClick={(e) => { e.preventDefault(); setTab('login'); setAlert(null) }}>← Back to sign in</a>
              </div>
            </>
          )}

          {/* ── SUCCESS ── */}
          {success && (
            <div className="success-screen show">
              <div className="success-icon">✓</div>
              <div className="success-title">{success.title}</div>
              <p className="success-sub">Your account has been created.</p>
              <div className="email-note">
                <strong>📧 Check your email.</strong><br />
                We sent a confirmation link to <strong>{success.email}</strong>.<br />
                Click the link in that email to verify your account, then come back to sign in.
              </div>
              <a href="/" className="btn-go">Go to home →</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Eye icon SVG ──────────────────────────────────────────────────────────────
function EyeIcon({ open }: { open?: boolean }) {
  return open ? (
    <svg className="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg className="eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
