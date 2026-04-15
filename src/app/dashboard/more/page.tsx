'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface Tour {
  id: string
  name: string
  artist_name: string
  start_date: string
  end_date: string
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  created_at: string
}

function BottomNav({ active }: { active: string }) {
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#101018', borderTop: '1px solid #1f1f2e', display: 'flex', justifyContent: 'space-around', padding: '0.75rem 1rem', maxWidth: 480, margin: '0 auto', zIndex: 100 }}>
      {[
        { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
        { key: 'dates', label: 'Dates', href: '/dashboard/dates' },
        { key: 'schedule', label: 'Schedule', href: '/dashboard/edit-day' },
        { key: 'more', label: 'More', href: '/dashboard/more' },
      ].map(item => (
        <a key={item.key} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: '1.3rem', opacity: active === item.key ? 1 : 0.4, textDecoration: 'none', color: 'inherit' }}>
          <span style={{ fontSize: '1.1rem' }}>{item.key === 'dashboard' ? '🏠' : item.key === 'dates' ? '#' : item.key === 'schedule' ? '📋' : '•••'}</span>
          <span style={{ fontSize: '0.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: active === item.key ? '#d90429' : 'inherit' }}>{item.label}</span>
        </a>
      ))}
    </nav>
  )
}

const LINKS = [
  { label: 'Advance Tracker', href: '/dashboard/advance', icon: '📋' },
  { label: 'Settlement Calculator', href: '/dashboard/settlement', icon: '💰' },
  { label: 'Market History', href: '/dashboard/market-history', icon: '📈' },
  { label: 'Crew Board', href: '/dashboard/crew', icon: '👥' },
  { label: 'Guest List', href: '/dashboard/guest-list', icon: '🎫' },
]

export default function MorePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; id: string } | null>(null)
  const [currentTour, setCurrentTour] = useState<Tour | null>(null)
  const [invites, setInvites] = useState<Invitation[]>([])
  const [inviteModal, setInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('crew')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('tourhq_current_user')
    if (!stored) { router.push('/'); return }
    setUser(JSON.parse(stored))

    const tourStored = localStorage.getItem('tourhq_current_tour')
    if (tourStored) {
      try { setCurrentTour(JSON.parse(tourStored)) } catch {}
    }

    loadInvites()
  }, [router])

  async function loadInvites() {
    const tourStored = localStorage.getItem('tourhq_current_tour')
    if (!tourStored) return
    let tourId: string
    try { tourId = JSON.parse(tourStored).id } catch { return }

    const { data, error } = await supabase
      .from('tour_invitations')
      .select('id, email, role, status, created_at')
      .eq('tour_id', tourId)
      .order('created_at', { ascending: false })
    if (!error && data) setInvites(data)
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !currentTour) return
    if (!inviteEmail.trim()) return
    setSendingInvite(true)
    setInviteError('')

    const { error } = await supabase.from('tour_invitations').insert({
      tour_id: currentTour.id,
      invited_by: user.id,
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
    })

    setSendingInvite(false)
    if (error) {
      if (error.code === '23505') setInviteError('An invite was already sent to this email.')
      else setInviteError('Failed to send invite.')
    } else {
      setInviteSent(true)
      setInviteEmail('')
      loadInvites()
      setTimeout(() => { setInviteSent(false); setInviteModal(false) }, 2000)
    }
  }

  async function logout() {
    localStorage.removeItem('tourhq_current_user')
    localStorage.removeItem('tourhq_current_tour')
    try { await supabase.auth.signOut() } catch {}
    router.push('/')
  }

  function statusBadge(status: string) {
    if (status === 'pending') return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' }
    if (status === 'accepted') return { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' }
    if (status === 'declined') return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' }
    return { bg: 'rgba(85,85,112,0.15)', color: '#8888a0' }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07070c', color: '#f0f0f5', fontFamily: 'Inter, sans-serif', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', textAlign: 'center', borderBottom: '1px solid #1f1f2e' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>More</div>
        <div style={{ color: '#8888a0', fontSize: '0.85rem' }}>All tools and settings</div>
      </div>

      {/* Active Tour Banner */}
      {currentTour && (
        <div style={{ margin: '1rem', padding: '1rem', background: 'linear-gradient(135deg, #181822, #101018)', border: '1px solid #d90429', borderRadius: 14 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#d90429', marginBottom: '0.4rem' }}>ACTIVE TOUR</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.2rem' }}>{currentTour.name}</div>
          <div style={{ fontSize: '0.8rem', color: '#8888a0' }}>{currentTour.artist_name} • {currentTour.start_date} → {currentTour.end_date}</div>
        </div>
      )}

      {/* Invite Crew */}
      {currentTour && (
        <div style={{ margin: '0 1rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8888a0' }}>Crew Invitations</div>
            <button
              onClick={() => setInviteModal(true)}
              style={{ background: '#d90429', border: 'none', color: 'white', padding: '0.4rem 0.875rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Invite Crew
            </button>
          </div>

          {invites.length === 0 ? (
            <div style={{ padding: '0.875rem', background: '#101018', border: '1px solid #1f1f2e', borderRadius: 10, textAlign: 'center', color: '#555570', fontSize: '0.8rem' }}>
              No invites sent yet
            </div>
          ) : (
            <div style={{ background: '#101018', border: '1px solid #1f1f2e', borderRadius: 10, overflow: 'hidden' }}>
              {invites.map((inv) => {
                const badge = statusBadge(inv.status)
                return (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid #1f1f2e' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#181822', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#8888a0', flexShrink: 0 }}>@</div>
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{inv.email}</div>
                      <div style={{ fontSize: '0.7rem', color: '#8888a0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{inv.role}</div>
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.2rem 0.5rem', borderRadius: 4, background: badge.bg, color: badge.color }}>
                      {inv.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Links */}
      <div>
        {LINKS.map((link, i) => (
          <a key={i} href={link.href} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #1f1f2e', textDecoration: 'none', color: '#f0f0f5', fontSize: '0.95rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1rem' }}>{link.icon}</span>
              {link.label}
            </span>
            <span style={{ color: '#555570', fontSize: '1.2rem' }}>›</span>
          </a>
        ))}
      </div>

      {/* User info */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderTop: '1px solid #1f1f2e' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #d90429, #ff6b6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'P'}
          </div>
          <div style={{ flexGrow: 1 }}>
            <div style={{ fontWeight: 700 }}>{user.name || 'User'}</div>
            <div style={{ fontSize: '0.8rem', color: '#8888a0' }}>{user.email}</div>
          </div>
        </div>
      )}

      <div style={{ padding: '1rem' }}>
        <button onClick={logout} style={{ width: '100%', padding: '12px 20px', background: 'transparent', color: '#8888a0', border: '1px solid #1f1f2e', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Logout</button>
      </div>

      {/* Invite Modal */}
      {inviteModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }} onClick={() => setInviteModal(false)}>
          <div style={{ background: '#101018', border: '1px solid #1f1f2e', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Invite Crew Member</h3>
            <p style={{ fontSize: '0.8rem', color: '#8888a0', marginBottom: '1.25rem' }}>They'll receive an email to join this tour.</p>

            {inviteSent && (
              <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e', borderRadius: 8, padding: '0.75rem', color: '#22c55e', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', textAlign: 'center' }}>
                ✓ Invite sent successfully!
              </div>
            )}

            {inviteError && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: 8, padding: '0.75rem', color: '#ef4444', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {inviteError}
              </div>
            )}

            <form onSubmit={sendInvite}>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8888a0', marginBottom: '0.25rem' }}>Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="crew@tourhq.com"
                  required
                  style={{ width: '100%', padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 8, color: '#f0f0f5', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8888a0', marginBottom: '0.25rem' }}>Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 8, color: '#f0f0f5', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}>
                  <option value="crew">Crew</option>
                  <option value="tour_manager">Tour Manager</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setInviteModal(false)}
                  style={{ flex: 1, padding: '10px', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 8, color: '#8888a0', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  style={{ flex: 1, padding: '10px', background: sendingInvite ? '#555570' : '#d90429', border: 'none', borderRadius: 8, color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: sendingInvite ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {sendingInvite ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav active="more" />
    </div>
  )
}