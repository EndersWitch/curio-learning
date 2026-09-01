'use client'

import { useRef, useState, useEffect } from 'react'
import Bloom from '@/components/Bloom'
import { sb } from '@/lib/supabase'
import { Check, Eye, EyeOff } from '@/components/icons'
import { SegmentedControl } from '@/components/interior/segmented-control'
import { FloatingLabelInput } from '@/components/interior/floating-label'
import { PasswordStrength } from '@/components/interior/password-strength'
import { LoadingButton } from '@/components/interior/loading-button'

function friendlyError(msg: string) {
  if (!msg) return 'Something went wrong. Please try again.'
  const m = msg.toLowerCase()
  if (m.includes('invalid login') || m.includes('invalid credentials') || m.includes('wrong'))
    return 'Incorrect email or password. Please try again.'
  if (m.includes('already registered') || m.includes('already exists'))
    return 'An account with this email already exists. Try signing in instead.'
  if (m.includes('email not confirmed') || m.includes('not confirmed'))
    return 'Check your inbox. Click the verification link we sent you before signing in.'
  if (m.includes('email')) return 'Please enter a valid email address.'
  if (m.includes('password')) return 'Password must be at least 6 characters.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Too many attempts. Please wait a moment and try again.'
  return msg
}

type Tab = 'login' | 'signup' | 'forgot'

function EyeToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} tabIndex={-1} className="grid place-items-center" style={{ width: 32, height: 32, color: 'rgba(var(--ink-rgb),0.35)' }}>
      {shown ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )
}

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login')
  const [alert, setAlert] = useState<{ msg: string; type: string } | null>(null)
  const [success, setSuccess] = useState<{ title: string; email: string } | null>(null)
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [showPw3, setShowPw3] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPw, setLoginPw] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPw, setSignupPw] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [signupGrade, setSignupGrade] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [confirmError, setConfirmError] = useState(false)

  const loginBtnRef = useRef<HTMLButtonElement>(null)
  const signupBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = '/'
    })
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'signup') setTab('signup')
  }, [])

  async function doLogin() {
    setAlert(null)
    if (!loginEmail || !loginPw) {
      setAlert({ msg: 'Please fill in your email and password.', type: 'err' })
      throw new Error('Missing fields')
    }
    const { error } = await sb.auth.signInWithPassword({ email: loginEmail, password: loginPw })
    if (error) {
      const msg = error.message || ''
      if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('not confirmed')) {
        setAlert({ msg: '<strong>Email not verified yet.</strong><br/>Check your inbox for the confirmation email we sent when you signed up, and click the link to verify your account before signing in.', type: 'warn' })
      } else {
        setAlert({ msg: friendlyError(msg), type: 'err' })
      }
      throw error
    }
    window.location.href = '/'
  }

  async function doSignup() {
    setAlert(null); setConfirmError(false)
    if (!signupEmail || !signupPw) {
      setAlert({ msg: 'Please fill in your email and password.', type: 'err' })
      throw new Error('Missing fields')
    }
    if (signupPw.length < 6) {
      setAlert({ msg: 'Password must be at least 6 characters.', type: 'err' })
      throw new Error('Weak password')
    }
    if (signupPw !== signupConfirm) {
      setAlert({ msg: 'Passwords do not match. Please check and try again.', type: 'err' })
      setConfirmError(true)
      throw new Error('Password mismatch')
    }
    const { error } = await sb.auth.signUp({
      email: signupEmail,
      password: signupPw,
      options: { data: { full_name: signupName, grade: signupGrade } },
    })
    if (error) {
      setAlert({ msg: friendlyError(error.message), type: 'err' })
      throw error
    }
    setSuccess({ title: `Welcome${signupName ? ', ' + signupName.split(' ')[0] : ''}!`, email: signupEmail })
  }

  async function doForgot() {
    setAlert(null)
    if (!forgotEmail) {
      setAlert({ msg: 'Please enter your email address.', type: 'err' })
      throw new Error('Missing email')
    }
    const { error } = await sb.auth.resetPasswordForEmail(forgotEmail)
    if (error) {
      setAlert({ msg: friendlyError(error.message), type: 'err' })
      throw error
    }
    setAlert({ msg: 'Reset link sent! Check your inbox.', type: 'ok' })
  }

  const tabTitles: Record<Tab, { eyebrow: string; title: React.ReactNode; sub: string }> = {
    login: { eyebrow: 'Welcome back', title: <>Sign <em>in</em> to Curio</>, sub: 'Access your papers, quizzes and progress.' },
    signup: { eyebrow: 'Get started free', title: <>Create your <em>account</em></>, sub: 'Free to browse. No credit card needed.' },
    forgot: { eyebrow: 'Reset password', title: <>Forgot your <span className="cr">password?</span></>, sub: "We'll send a reset link to your email." },
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>

      {/* Brand panel */}
      <div className="brand-panel">
        <div className="spread-deco o1" style={{ top: '-40px', left: '-40px' }}>
          <Bloom size={200} />
        </div>
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
            Everything you need to <strong>actually prepare</strong> for exams, free to start, always.
          </p>
          <ul className="bp-features">
            {['Exam papers & memos, free forever','AI-powered topic quizzes','Deep Learn explanations','Grades 4 – 12 · every subject'].map((f) => (
              <li key={f} className="bp-feature"><span className="bp-chk"><Check size={11} /></span>{f}</li>
            ))}
          </ul>
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
          <path d="M32,32 C20,30 20,12 32,4 C44,12 44,30 32,32 Z" fill="var(--rust)" transform="rotate(0 32 32)" />
          <path d="M32,32 C20,30 20,12 32,4 C44,12 44,30 32,32 Z" fill="var(--rust)" transform="rotate(72 32 32)" />
          <path d="M32,32 C20,30 20,12 32,4 C44,12 44,30 32,32 Z" fill="var(--rust)" transform="rotate(144 32 32)" />
          <path d="M32,32 C20,30 20,12 32,4 C44,12 44,30 32,32 Z" fill="var(--rust)" transform="rotate(216 32 32)" />
          <path d="M32,32 C20,30 20,12 32,4 C44,12 44,30 32,32 Z" fill="var(--rust)" transform="rotate(288 32 32)" />
          <circle cx="32" cy="32" r="4.5" fill="var(--paper)" />
        </svg>
      </div>

      {/* Form panel */}
      <div className="form-panel">
        <div className="form-inner">
          <a href="/" className="form-back">← Back to home</a>

          <div className="form-header">
            <div className="form-eyebrow">{tabTitles[tab].eyebrow}</div>
            <h1 className="form-title">{tabTitles[tab].title}</h1>
            <p className="form-sub">{tabTitles[tab].sub}</p>
          </div>

          {tab !== 'forgot' && !success && (
            <div style={{ marginBottom: '1.6rem' }}>
              <SegmentedControl
                label="Sign in or create an account"
                value={tab}
                onValueChange={(v) => { setTab(v as Tab); setAlert(null) }}
                options={[
                  { value: 'login', label: 'Sign in' },
                  { value: 'signup', label: 'Create account' },
                ]}
              />
            </div>
          )}

          {alert && (
            <div className={`alert show ${alert.type}`} dangerouslySetInnerHTML={{ __html: alert.msg }} />
          )}

          {/* LOGIN */}
          {tab === 'login' && !success && (
            <>
              <div className="field">
                <FloatingLabelInput
                  label="Email address"
                  type="email"
                  value={loginEmail}
                  onChange={setLoginEmail}
                  onKeyDown={(e) => e.key === 'Enter' && loginBtnRef.current?.click()}
                />
              </div>
              <div className="field">
                <FloatingLabelInput
                  label="Password"
                  type={showPw ? 'text' : 'password'}
                  value={loginPw}
                  onChange={setLoginPw}
                  onKeyDown={(e) => e.key === 'Enter' && loginBtnRef.current?.click()}
                  trailing={<EyeToggle shown={showPw} onToggle={() => setShowPw(!showPw)} />}
                />
                <button className="forgot-link" onClick={() => { setTab('forgot'); setAlert(null) }}>
                  Forgot password?
                </button>
              </div>
              <LoadingButton ref={loginBtnRef} onAction={doLogin} pendingLabel="Signing in…" successLabel="Welcome back" errorLabel="Try again">
                Sign in
              </LoadingButton>
              <div className="switch-link">
                No account yet? <a href="#" onClick={(e) => { e.preventDefault(); setTab('signup'); setAlert(null) }}>Create one free</a>
              </div>
            </>
          )}

          {/* SIGNUP */}
          {tab === 'signup' && !success && (
            <>
              <div className="field">
                <FloatingLabelInput label="Your name" value={signupName} onChange={setSignupName} />
              </div>
              <div className="field">
                <FloatingLabelInput label="Email address" type="email" value={signupEmail} onChange={setSignupEmail} />
              </div>
              <div className="field">
                <FloatingLabelInput
                  label="Password"
                  type={showPw2 ? 'text' : 'password'}
                  value={signupPw}
                  onChange={setSignupPw}
                  trailing={<EyeToggle shown={showPw2} onToggle={() => setShowPw2(!showPw2)} />}
                />
                <PasswordStrength value={signupPw} showRules={false} />
              </div>
              <div className="field">
                <FloatingLabelInput
                  label="Confirm password"
                  type={showPw3 ? 'text' : 'password'}
                  value={signupConfirm}
                  onChange={setSignupConfirm}
                  invalid={confirmError}
                  trailing={<EyeToggle shown={showPw3} onToggle={() => setShowPw3(!showPw3)} />}
                />
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
              <LoadingButton ref={signupBtnRef} onAction={doSignup} pendingLabel="Creating account…" successLabel="Account created" errorLabel="Try again">
                Create free account
              </LoadingButton>
              <div className="switch-link">
                Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setTab('login'); setAlert(null) }}>Sign in</a>
              </div>
            </>
          )}

          {/* FORGOT */}
          {tab === 'forgot' && !success && (
            <>
              <div className="field">
                <FloatingLabelInput label="Email address" type="email" value={forgotEmail} onChange={setForgotEmail} />
              </div>
              <LoadingButton onAction={doForgot} pendingLabel="Sending…" successLabel="Link sent" errorLabel="Try again">
                Send reset link
              </LoadingButton>
              <div className="switch-link">
                <a href="#" onClick={(e) => { e.preventDefault(); setTab('login'); setAlert(null) }}>← Back to sign in</a>
              </div>
            </>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="success-screen show">
              <div className="success-icon"><Check size={24} /></div>
              <div className="success-title">{success.title}</div>
              <p className="success-sub">Your account has been created.</p>
              <div className="email-note">
                <strong>Check your email.</strong><br />
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
