'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

/* ── Data ── */
const stats = [
  { value: '67%', label: 'of Tour Managers still use spreadsheets and email for core tour operations' },
  { value: '3hrs', label: 'average daily time spent on manual data entry per Tour Manager' },
  { value: '$1K+', label: 'average cost of a single communication failure on tour (fines, rebookings)' },
]

const features = [
  {
    icon: '📱',
    title: 'Mobile-First Day Sheets',
    desc: 'Update your schedule from your phone on show day. No laptop required. Real-time sync across all crew devices.',
  },
  {
    icon: '🔒',
    title: 'Secure Document Vault',
    desc: 'Contracts, riders, tech specs, and settlement sheets — all encrypted and organized. Upload once, access everywhere.',
  },
  {
    icon: '🗺️',
    title: 'Smart Tour Routing',
    desc: 'Auto-calculated drive times based on bus speed limits. Off-day planning that actually makes sense for your crew.',
  },
  {
    icon: '📋',
    title: 'One-Click Advancing',
    desc: 'Send professional advance packets to venues instantly. Track confirmation status. No more email chains.',
  },
  {
    icon: '💰',
    title: 'Settlement Tracking',
    desc: 'Calculate guarantee vs. door deals, split points, and venue fees automatically. Export for your accountant.',
  },
  {
    icon: '👥',
    title: 'Crew Coordination',
    desc: 'Assign tasks, share updates, and keep everyone on the same page. No more buried WhatsApp messages.',
  },
]

/* ── Modal props ── */
type ModalType = 'login' | 'signup'

export default function LandingPage() {
  const [modal, setModal] = useState<ModalType | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupRole, setSignupRole] = useState<'crew' | 'tour_manager'>('crew')
  const [loginError, setLoginError] = useState('')
  const [signupError, setSignupError] = useState('')
  const [signupSuccess, setSignupSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function openModal(type: ModalType) {
    setLoginError('')
    setSignupError('')
    setSignupSuccess('')
    setModal(type)
  }

  function closeModal() {
    setModal(null)
    setLoginError('')
    setSignupError('')
    setSignupSuccess('')
  }

  async function ensureProfile(user: { id: string; email?: string }, fullName?: string) {
    const usernameBase = (fullName || user.email || 'tourhq-user')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24) || 'tourhq-user'

    const { data: existing, error: existingError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (existingError && existingError.code !== 'PGRST116') throw existingError

    if (!existing) {
      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        full_name: fullName || '',
        username: usernameBase,
      })
      if (error && !String(error.message || '').toLowerCase().includes('duplicate')) throw error
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setLoginError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })
      if (error) throw error
      if (data.user) {
        const userObj = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || data.user.email,
          email: data.user.email,
          authMode: 'supabase',
        }
        localStorage.setItem('tourhq_current_user', JSON.stringify(userObj))

        // Auto-select most recent tour
        const { data: recentTours } = await supabase
          .from('tours')
          .select('*')
          .eq('user_id', data.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
        if (recentTours && recentTours.length > 0) {
          const t = recentTours[0]
          localStorage.setItem('tourhq_current_tour', JSON.stringify({
            id: t.id,
            name: t.name,
            artist_name: t.artist_name,
            start_date: t.start_date,
            end_date: t.end_date,
          }))
        }

        closeModal()
        window.location.href = '/dashboard'
      }
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSignupError('')
    setSignupSuccess('')

    if (!signupName || !signupEmail || !signupPassword || signupPassword.length < 8) {
      setSignupError('Please fill in all fields and use a password with at least 8 characters.')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: { data: { full_name: signupName, role: signupRole } },
      })
      if (error) throw error
      if (data.user) await ensureProfile(data.user, signupName)
      setSignupSuccess('Account created. Check your email to confirm your account, then log in.')
    } catch (err: unknown) {
      setSignupError(err instanceof Error ? err.message : 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0
        bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)]
        bg-[size:60px_60px]" />
      <div className="fixed rounded-full blur-[120px] pointer-events-none z-0"
        style={{ width: 600, height: 600, top: -200, right: -100, background: 'rgba(217, 4, 41, 0.08)' }} />
      <div className="fixed rounded-full blur-[120px] pointer-events-none z-0"
        style={{ width: 400, height: 400, bottom: 0, left: -100, background: 'rgba(34, 211, 238, 0.06)' }} />

      {/* ── Header ── */}
      <header>
        <div className="container">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg, var(--color-accent), #ff6b6b)' }}>
                📋
              </div>
              <div className="text-xl font-bold" style={{ letterSpacing: '-0.02em' }}>
                Tour HQ <span className="font-normal" style={{ color: 'var(--color-text-dim)' }}>by Phil Mauro</span>
              </div>
            </div>
            {/* CTA buttons */}
            <div className="flex gap-3">
              <button className="btn btn-secondary" onClick={() => openModal('login')}>Log In</button>
              <button className="btn btn-primary" onClick={() => openModal('signup')}>
                <span className="hidden sm:inline">Get Started — </span>It's Free
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="hero" aria-label="Tour HQ hero">
        <div className="container">
          {/* Badge */}
          <div className="hero-badge">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-accent)' }} />
            Now in Beta — Built for the Road
          </div>

          {/* Headline */}
          <h1>
            The tour management platform<br />
            <span className="gradient-text">built by touring professionals.</span>
          </h1>

          {/* Subtext */}
          <p>
            Stop managing tours through scattered PDFs, spreadsheets, and group chats. Tour HQ gives you mobile-first day sheets, secure document storage, and real-time crew coordination — all in one place.
          </p>

          {/* Action buttons */}
          <div className="hero-actions">
            <button className="btn btn-primary btn-large" onClick={() => openModal('signup')}>
              Start Free — No Credit Card
            </button>
            <a href="#features" className="btn btn-secondary btn-large">
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.value} className="stat-item">
                <h3>{s.value}</h3>
                <p>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features" id="features" aria-label="Features">
        <div className="container">
          <div className="features-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta">
        <div className="container">
          <div className="cta-box">
            <h2>Ready to stop managing chaos?</h2>
            <p>Join Tour HQ today. Free for independent tours. No credit card required.</p>
            <button className="btn btn-primary btn-large" onClick={() => openModal('signup')}>
              Create Your Free Account
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer>
        <div className="container">
          <p>© 2026 Tour HQ by Phil Mauro. All rights reserved. Built in Denver, CO.</p>
        </div>
      </footer>

      {/* ── Modals ── */}
      {modal && (
        <div
          className={`modal-overlay ${modal ? 'active' : ''}`}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="modal">
            <button className="modal-close" onClick={closeModal}>&times;</button>

            {modal === 'login' ? (
              <>
                <h2>Welcome back</h2>
                <p>Log in to access your tours, documents, and crew dashboard.</p>
                <div className="form-error" style={{ display: loginError ? 'block' : 'none' }}>{loginError}</div>
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label>Email address</label>
                    <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@tourname.com" required />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Enter your password" required />
                  </div>
                  <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%' }} disabled={loading}>{loading ? 'Loading...' : 'Log In'}</button>
                </form>
                <div className="form-footer">
                  Don&apos;t have an account? <a href="#" onClick={(e) => { e.preventDefault(); openModal('signup') }}>Sign up free</a>
                </div>
              </>
            ) : (
              <>
                <h2>Create your account</h2>
                <p>Free for independent tours. No credit card required.</p>
                <div className="form-error" style={{ display: signupError ? 'block' : 'none' }}>{signupError}</div>
                <div className="form-success" style={{ display: signupSuccess ? 'block' : 'none' }}>{signupSuccess}</div>
                <form onSubmit={handleSignup}>
                  <div className="form-group">
                    <label>Full name</label>
                    <input type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Phil Mauro" required />
                  </div>
                  <div className="form-group">
                    <label>Email address</label>
                    <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="you@tourname.com" required />
                  </div>
                  <div className="form-group">
                    <label>Password (min 8 characters)</label>
                    <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="Create a strong password" minLength={8} required />
                  </div>
                  <div className="form-group">
                    <label>I am a...</label>
                    <select value={signupRole} onChange={(e) => setSignupRole(e.target.value as 'crew' | 'tour_manager')}>
                      <option value="crew">Crew Member</option>
                      <option value="tour_manager">Tour Manager</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%' }} disabled={loading}>{loading ? 'Loading...' : 'Create Account'}</button>
                </form>
                <div className="form-footer">
                  Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); openModal('login') }}>Log in</a>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        /* ── Hero ── */
        .hero {
          padding: 80px 0 60px;
          text-align: center;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: rgba(217, 4, 41, 0.1);
          border: 1px solid rgba(217, 4, 41, 0.2);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          color: #ff6b6b;
          margin-bottom: 24px;
        }
        .hero h1 {
          font-size: clamp(28px, 5vw, 48px);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 16px;
        }
        .gradient-text {
          background: linear-gradient(135deg, #ffffff 0%, #c4b5fd 45%, #67e8f9 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero p {
          font-size: clamp(15px, 2vw, 17px);
          color: var(--color-text-dim);
          max-width: 540px;
          margin: 0 auto 28px;
          line-height: 1.65;
        }
        .hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* ── Stats ── */
        .stats { padding: 40px 0; }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          text-align: center;
        }
        .stat-item h3 {
          font-size: 36px;
          font-weight: 800;
          color: var(--color-accent);
          font-family: var(--font-mono);
        }
        .stat-item p {
          font-size: 14px;
          color: var(--color-text-dim);
          margin-top: 4px;
        }

        /* ── Features ── */
        .features { padding: 60px 0; }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        .feature-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 28px;
          transition: all 0.3s ease;
        }
        .feature-card:hover {
          border-color: rgba(217, 4, 41, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .feature-icon {
          width: 48px; height: 48px;
          background: var(--color-bg-elevated);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin-bottom: 16px;
        }
        .feature-card h3 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .feature-card p {
          font-size: 13px;
          color: var(--color-text-dim);
          line-height: 1.55;
        }

        /* ── CTA ── */
        .cta { padding: 60px 0 80px; text-align: center; }
        .cta-box {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: 24px;
          padding: 48px 32px;
        }
        .cta-box h2 {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 10px;
        }
        .cta-box p {
          color: var(--color-text-dim);
          margin-bottom: 24px;
        }

        /* ── Footer ── */
        footer {
          padding: 32px 0;
          border-top: 1px solid var(--color-border);
          text-align: center;
          font-size: 13px;
          color: var(--color-text-muted);
        }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .hero { padding: 48px 0 40px; }
          .features { padding: 40px 0; }
          .stats { padding: 24px 0; }
          .cta { padding: 40px 0 60px; }
          .cta-box { padding: 32px 20px; }
        }
      `}</style>
    </>
  )
}
