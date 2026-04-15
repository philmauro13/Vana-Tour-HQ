'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface TourDate {
  id: string
  tour_id: string
  date: string
  venue: string
  city: string
  type: string
  status: string
  notes: string | null
}

interface Tour {
  id: string
  name: string
  artist_name: string
  start_date: string
  end_date: string
}

interface User {
  name: string
  email: string
}

type TemplateType = 'initial' | 'followup' | 'dayof'
type EmailStatus = 'ready' | 'sent' | 'complete'

interface EmailContent {
  to: string
  subject: string
  body: string
}

const TEMPLATES: { key: TemplateType; label: string }[] = [
  { key: 'initial', label: '📨 Initial Advance' },
  { key: 'followup', label: '🔔 Follow-Up' },
  { key: 'dayof', label: '📋 Day-Of Confirm' },
]

export default function AdvanceEmailPage() {
  const [tourDates, setTourDates] = useState<TourDate[]>([])
  const [tour, setTour] = useState<Tour | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [noTour, setNoTour] = useState(false)
  const [template, setTemplate] = useState<TemplateType>('initial')
  const [openDate, setOpenDate] = useState<string | null>(null)
  const [emailStatuses, setEmailStatuses] = useState<Record<string, EmailStatus>>({})
  const [toasts, setToasts] = useState<string[]>([])

  useEffect(() => {
    const tourStored = localStorage.getItem('tourhq_current_tour')
    if (!tourStored) { setNoTour(true); setLoading(false); return }
    let parsedTour: Tour
    try { parsedTour = JSON.parse(tourStored) } catch { setNoTour(true); setLoading(false); return }
    setTour(parsedTour)

    const userStored = localStorage.getItem('tourhq_current_user')
    if (userStored) {
      try { setUser(JSON.parse(userStored)) } catch {}
    }

    const emailStatusesStored = localStorage.getItem('tourhq_email_statuses')
    if (emailStatusesStored) {
      try { setEmailStatuses(JSON.parse(emailStatusesStored)) } catch {}
    }

    loadDates(parsedTour.id)
  }, [])

  async function loadDates(tourId: string) {
    setLoading(true)
    const { data, error } = await supabase
      .from('tour_dates')
      .select('*')
      .eq('tour_id', tourId)
      .eq('type', 'SHOW')
      .order('date', { ascending: true })

    if (!error && data) setTourDates(data)
    setLoading(false)
  }

  function getStatus(date: string): EmailStatus {
    return emailStatuses[date] || 'ready'
  }

  function statusBadge(status: EmailStatus) {
    if (status === 'sent') return { bg: 'rgba(34,211,238,0.15)', color: '#22d3ee', text: 'SENT' }
    if (status === 'complete') return { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', text: 'DONE' }
    return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', text: 'READY' }
  }

  function getStats() {
    let ready = 0, sent = 0, done = 0
    for (const d of tourDates) {
      const s = getStatus(d.date)
      if (s === 'sent') sent++
      else if (s === 'complete') done++
      else ready++
    }
    return { ready, sent, done }
  }

  function showToast(msg: string) {
    setToasts(prev => [...prev, msg])
    setTimeout(() => setToasts(prev => prev.slice(1)), 2000)
  }

  function generateEmail(day: TourDate, tmpl: TemplateType): EmailContent {
    const shortDate = day.date
    const venue = day.venue
    const tourName = tour?.name || 'Tour'
    const artistName = tour?.artist_name || 'Artist'
    const tmName = user?.name || ''
    const tmEmail = user?.email || ''

    if (tmpl === 'initial') {
      return {
        to: '',
        subject: `${tourName} — Advance for ${venue} | ${shortDate}`,
        body: `${tourName}
c/o ${artistName}

 Tour: ${tourName}
 Artist: ${artistName}
 Date: ${day.date}
 Venue: ${venue}
 City: ${day.city}

 Dear ${venue} Team,

 Please find below the advance information for our upcoming show. Kindly review and confirm each item.

 1. CONTRACT
 2. TECHNICAL RIDER
 3. HOSPITALITY RIDER
 4. LOAD-IN
 5. SOUNDCHECK
 6. DOORS & SET TIME
 7. CURFEW
 8. SETTLEMENT (method & timing)
 9. PARKING
 10. GUEST LIST
 11. HOTEL
 12. LOCAL CONTACT

 Please do not hesitate to reach out with any questions or concerns.

 Best regards,
 ${tmName}
 Tour Manager
 ${tmEmail}
`,
      }
    }

    if (tmpl === 'followup') {
      const showDate = new Date(day.date + 'T12:00:00')
      const now = new Date()
      const daysUntil = Math.ceil((showDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      return {
        to: '',
        subject: `RE: ${tourName} — Advance for ${venue} | ${shortDate}`,
        body: `Hi ${venue} Team,

 Just following up on our upcoming show on ${day.date} — that's ${daysUntil} day${daysUntil === 1 ? '' : 's'} away.

 Could you please confirm the following:

 - Load-in time
 - Status of technical & hospitality rider
 - Settlement method & timing
 - Guest list allocation
 - Day-of contact name & number

 Thanks!
 ${tmName}
 Tour Manager
 ${tmEmail}
`,
      }
    }

    // dayof
    return {
      to: '',
      subject: `DAY-OF: ${artistName} @ ${venue} | ${shortDate}`,
      body: `${artistName} — DAY-OF CHECKLIST
 ${day.date} | ${venue} | ${day.city}

 LOAD-IN: __:__
 SOUNDCHECK: __:__
 DOORS: __:__
 SET: __:__
 CURFEW: __:__

 Please confirm:
 - Parking details?
 - Load-in door location?
 - Green room accessible?
 - Guest list allocation confirmed?
 - Settlement ready?

 Day-of contact: ${tmName} | ${tmEmail}

 See you soon!
`,
    }
  }

  function handleOpenEmail(to: string, subject: string, body: string, date: string) {
    window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
    const updated = { ...emailStatuses, [date]: 'sent' }
    setEmailStatuses(updated)
    localStorage.setItem('tourhq_email_statuses', JSON.stringify(updated))
    setOpenDate(null)
  }

  function handleCopy(subject: string, body: string) {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`).then(() => {
      showToast('Copied to clipboard!')
    })
  }

  function handleMarkSent(date: string) {
    const updated = { ...emailStatuses, [date]: 'sent' }
    setEmailStatuses(updated)
    localStorage.setItem('tourhq_email_statuses', JSON.stringify(updated))
    setOpenDate(null)
  }

  function handleMarkComplete(date: string) {
    const updated = { ...emailStatuses, [date]: 'complete' }
    setEmailStatuses(updated)
    localStorage.setItem('tourhq_email_statuses', JSON.stringify(updated))
    setOpenDate(null)
  }

  const stats = getStats()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#07070c', color: '#f0f0f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ color: '#8888a0', fontSize: '0.9rem' }}>Loading shows…</div>
      </div>
    )
  }

  if (noTour) {
    return (
      <div style={{ minHeight: '100vh', background: '#07070c', color: '#f0f0f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '2rem', gap: '1rem' }}>
        <div style={{ fontSize: '1.1rem', color: '#8888a0' }}>No active tour</div>
        <a href="/" style={{ color: '#d90429', fontSize: '0.9rem' }}>Go home</a>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07070c', color: '#f0f0f5', fontFamily: 'Inter, sans-serif', paddingBottom: 100, maxWidth: 480, margin: '0 auto' }}>

      {/* Page Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #1f1f2e' }}>
        <a href="/dashboard/more" style={{ color: '#8888a0', fontSize: '0.85rem', textDecoration: 'none', display: 'block', marginBottom: '0.75rem' }}>← Back to More</a>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>📧 Advance Emails</div>
        <div style={{ color: '#8888a0', fontSize: '0.85rem' }}>Generate & send venue advances in seconds</div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1f1f2e' }}>
        <div style={{ flex: 1, padding: '0.875rem', textAlign: 'center', borderRight: '1px solid #1f1f2e' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>{stats.ready}</div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8888a0' }}>Ready</div>
        </div>
        <div style={{ flex: 1, padding: '0.875rem', textAlign: 'center', borderRight: '1px solid #1f1f2e' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#22d3ee' }}>{stats.sent}</div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8888a0' }}>Sent</div>
        </div>
        <div style={{ flex: 1, padding: '0.875rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#22c55e' }}>{stats.done}</div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8888a0' }}>Done</div>
        </div>
      </div>

      {/* Template Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem 1.5rem', borderBottom: '1px solid #1f1f2e', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {TEMPLATES.map(t => (
          <button
            key={t.key}
            onClick={() => setTemplate(t.key)}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: 20,
              border: `1px solid ${template === t.key ? '#d90429' : '#1f1f2e'}`,
              background: template === t.key ? 'rgba(217,4,41,0.1)' : '#181822',
              color: template === t.key ? '#d90429' : '#8888a0',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Venue Cards */}
      {tourDates.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#555570', fontSize: '0.9rem' }}>No shows found for this tour.</div>
      ) : (
        tourDates.map(day => {
          const email = generateEmail(day, template)
          const isOpen = openDate === day.date
          const badge = statusBadge(getStatus(day.date))

          return (
            <div key={day.id} style={{ margin: '0.75rem 1rem', background: '#101018', border: '1px solid #1f1f2e', borderRadius: 14, overflow: 'hidden' }}>
              {/* Card Header */}
              <div
                onClick={() => setOpenDate(isOpen ? null : day.date)}
                style={{ padding: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#22d3ee', marginBottom: '0.2rem' }}>{day.date}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{day.venue}</div>
                  <div style={{ fontSize: '0.8rem', color: '#8888a0' }}>{day.city}</div>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0.6rem', borderRadius: 4, background: badge.bg, color: badge.color }}>
                  {badge.text}
                </span>
              </div>

              {/* Email Preview */}
              <div style={{ maxHeight: isOpen ? 800 : 0, overflow: 'hidden', borderTop: `1px solid ${isOpen ? '#1f1f2e' : 'transparent'}`, transition: 'max-height 0.3s ease, border-color 0.3s ease' }}>
                <div style={{ padding: '0 1rem 1rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8888a0', marginBottom: '0.25rem' }}>To</label>
                    <input
                      type="email"
                      placeholder="venue@email.com"
                      style={{ width: '100%', padding: '0.6rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 8, color: '#f0f0f5', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      onChange={e => {}}
                      id={`to-${day.id}`}
                    />
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8888a0', marginBottom: '0.25rem' }}>Subject</label>
                    <input
                      type="text"
                      defaultValue={email.subject}
                      style={{ width: '100%', padding: '0.6rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 8, color: '#f0f0f5', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      id={`subject-${day.id}`}
                    />
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8888a0', marginBottom: '0.25rem' }}>Body</label>
                    <textarea
                      defaultValue={email.body}
                      style={{ width: '100%', minHeight: 200, padding: '0.6rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 8, color: '#f0f0f5', fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
                      id={`body-${day.id}`}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <button
                      style={{ flex: 1, padding: '0.65rem', background: '#d90429', border: 'none', borderRadius: 8, color: 'white', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        const toEl = document.getElementById(`to-${day.id}`) as HTMLInputElement
                        const subEl = document.getElementById(`subject-${day.id}`) as HTMLInputElement
                        const bodyEl = document.getElementById(`body-${day.id}`) as HTMLTextAreaElement
                        handleOpenEmail(toEl?.value || '', subEl?.value || '', bodyEl?.value || '', day.date)
                      }}>
                      📨 Open in Email
                    </button>
                    <button
                      style={{ flex: 1, padding: '0.65rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 8, color: '#8888a0', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        const subEl = document.getElementById(`subject-${day.id}`) as HTMLInputElement
                        const bodyEl = document.getElementById(`body-${day.id}`) as HTMLTextAreaElement
                        handleCopy(subEl?.value || '', bodyEl?.value || '')
                      }}>
                      📋 Copy
                    </button>
                  </div>

                  <button
                    style={{ width: '100%', padding: '0.6rem', background: 'transparent', border: '1px dashed #555570', borderRadius: 8, color: '#8888a0', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '0.4rem' }}
                    onClick={(e) => { e.stopPropagation(); handleMarkSent(day.date) }}>
                    ✓ Mark as Sent
                  </button>
                  <button
                    style={{ width: '100%', padding: '0.4rem', background: 'transparent', border: 'none', borderRadius: 8, color: '#22c55e', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}
                    onClick={(e) => { e.stopPropagation(); handleMarkComplete(day.date) }}>
                    ✓ Mark Complete
                  </button>
                </div>
              </div>
            </div>
          )
        })
      )}

      {/* Toast */}
      {toasts.map((t, i) => (
        <div key={i} style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', background: '#181822', border: '1px solid #22c55e', color: '#22c55e', padding: '0.6rem 1.25rem', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600, zIndex: 300, whiteSpace: 'nowrap' }}>
          {t}
        </div>
      ))}
    </div>
  )
}
