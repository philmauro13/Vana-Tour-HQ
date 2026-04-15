'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Advance {
  id: number
  venue: string
  city: string
  date: string
  promoter: string
  promoterEmail: string
  status: 'sent' | 'confirmed' | 'responded' | 'complete'
  checks: Record<string, boolean>
  notes: string
}

const CHECKLIST_LABELS: Record<string, string> = {
  contractSigned: 'Contract signed',
  riderSent: 'Rider sent to venue',
  riderConfirmed: 'Rider confirmed by venue',
  loadinConfirmed: 'Load-in time confirmed',
  parkingConfirmed: 'Parking / load-in location confirmed',
  hospitalityConfirmed: 'Hospitality rider confirmed',
  soundcheckBooked: 'Soundcheck time booked',
  contactExchanged: 'Promoter contact exchanged',
}

const SAMPLE_ADVANCES: Advance[] = [
  {
    id: 1,
    venue: 'Hell at The Masquerade',
    city: 'Atlanta, GA',
    date: '2026-04-17',
    promoter: 'Masquerade Booking',
    promoterEmail: 'booking@masqueradeatlanta.com',
    status: 'complete',
    checks: {
      contractSigned: true, riderSent: true, riderConfirmed: true,
      loadinConfirmed: true, parkingConfirmed: true, hospitalityConfirmed: true,
      soundcheckBooked: true, contactExchanged: true,
    },
    notes: 'All good. Green room available. Load-in at noon.',
  },
  {
    id: 2,
    venue: 'Conduit',
    city: 'Orlando, FL',
    date: '2026-04-18',
    promoter: 'Conduit Booking',
    promoterEmail: 'booking@conduitfl.com',
    status: 'responded',
    checks: {
      contractSigned: true, riderSent: true, riderConfirmed: true,
      loadinConfirmed: false, parkingConfirmed: false, hospitalityConfirmed: false,
      soundcheckBooked: false, contactExchanged: true,
    },
    notes: 'Contract and rider confirmed. Need to finalize load-in time.',
  },
  {
    id: 3,
    venue: 'The Orpheum',
    city: 'Tampa, FL',
    date: '2026-04-19',
    promoter: 'Live Nation Tampa',
    promoterEmail: '',
    status: 'confirmed',
    checks: {
      contractSigned: true, riderSent: true, riderConfirmed: false,
      loadinConfirmed: false, parkingConfirmed: false, hospitalityConfirmed: false,
      soundcheckBooked: false, contactExchanged: false,
    },
    notes: 'Contract signed. Waiting on rider confirmation.',
  },
  {
    id: 4,
    venue: 'Greensboro Coliseum',
    city: 'Greensboro, NC',
    date: '2026-04-21',
    promoter: 'Piedmont Entertainment',
    promoterEmail: '',
    status: 'sent',
    checks: {
      contractSigned: false, riderSent: true, riderConfirmed: false,
      loadinConfirmed: false, parkingConfirmed: false, hospitalityConfirmed: false,
      soundcheckBooked: false, contactExchanged: false,
    },
    notes: 'Advance packet sent. Awaiting response.',
  },
]

function statusColor(s: string) {
  if (s === 'complete') return '#22c55e'
  if (s === 'responded') return '#22d3ee'
  if (s === 'confirmed') return '#f59e0b'
  return '#555570'
}

export default function AdvancePage() {
  const [advances, setAdvances] = useState<Advance[]>([])
  const [showModal, setShowModal] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('tourhq_advances')
    if (stored) {
      try { setAdvances(JSON.parse(stored)) } catch { setAdvances(SAMPLE_ADVANCES) }
    } else {
      setAdvances(SAMPLE_ADVANCES)
      localStorage.setItem('tourhq_advances', JSON.stringify(SAMPLE_ADVANCES))
    }
  }, [])

  function toggleCheck(id: number, key: string) {
    const updated = advances.map(a => {
      if (a.id !== id) return a
      const checks = { ...a.checks, [key]: !a.checks[key] }
      const completed = Object.values(checks).filter(Boolean).length
      let status: Advance['status'] = 'sent'
      if (completed === Object.keys(checks).length) status = 'complete'
      else if (completed >= 4) status = 'responded'
      else if (a.checks.contractSigned || a.checks.riderSent) status = 'confirmed'
      return { ...a, checks, status }
    })
    setAdvances(updated)
    localStorage.setItem('tourhq_advances', JSON.stringify(updated))
  }

  function toggleDetail(id: number) {
    setOpenId(openId === id ? null : id)
  }

  function addAdvance(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const newAdv: Advance = {
      id: Date.now(),
      venue: formData.get('venue') as string,
      city: formData.get('city') as string,
      date: formData.get('date') as string,
      promoter: formData.get('promoter') as string,
      promoterEmail: formData.get('email') as string,
      status: 'sent',
      checks: {
        contractSigned: false, riderSent: false, riderConfirmed: false,
        loadinConfirmed: false, parkingConfirmed: false, hospitalityConfirmed: false,
        soundcheckBooked: false, contactExchanged: false,
      },
      notes: '',
    }
    const updated = [...advances, newAdv]
    setAdvances(updated)
    localStorage.setItem('tourhq_advances', JSON.stringify(updated))
    setShowModal(false)
    form.reset()
  }

  const stats = {
    sent: advances.filter(a => a.status === 'sent').length,
    confirmed: advances.filter(a => a.status === 'confirmed').length,
    responded: advances.filter(a => a.status === 'responded').length,
    complete: advances.filter(a => a.status === 'complete').length,
  }

  return (
    <div style={{ paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1f1f2e' }}>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#8888a0', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          ← Back
        </Link>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Advance Tracker</div>
        <div style={{ color: '#8888a0', fontSize: '0.85rem' }}>Track venue advances from sent to confirmed</div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', padding: '1rem 1.5rem', borderBottom: '1px solid #1f1f2e' }}>
        {[
          { key: 'sent', num: stats.sent, color: '#555570', label: 'Sent' },
          { key: 'confirmed', num: stats.confirmed, color: '#f59e0b', label: 'Confirmed' },
          { key: 'responded', num: stats.responded, color: '#22d3ee', label: 'Responded' },
          { key: 'complete', num: stats.complete, color: '#22c55e', label: 'Complete' },
        ].map(s => (
          <div key={s.key} style={{ background: '#181822', borderRadius: 10, padding: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.2rem', fontWeight: 700, color: s.color }}>{s.num}</div>
            <div style={{ fontSize: '0.6rem', color: '#8888a0', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Advance List */}
      {advances.map(adv => {
        const completedChecks = Object.values(adv.checks).filter(Boolean).length
        const totalChecks = Object.keys(adv.checks).length
        const sc = statusColor(adv.status)
        const isOpen = openId === adv.id

        return (
          <div key={adv.id} style={{ margin: '0.75rem 1rem', background: '#101018', border: '1px solid #1f1f2e', borderRadius: 14, overflow: 'hidden' }}>
            {/* Card Header */}
            <div
              onClick={() => toggleDetail(adv.id)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', cursor: 'pointer', borderBottom: isOpen ? '1px solid #1f1f2e' : 'none' }}
            >
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#22d3ee' }}>{adv.date}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: 2 }}>{adv.venue}</div>
                <div style={{ fontSize: '0.8rem', color: '#8888a0', marginTop: 2 }}>{adv.city} • {completedChecks}/{totalChecks} complete</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: sc }}>{adv.status}</span>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: sc }} />
              </div>
            </div>

            {/* Expandable Detail */}
            {isOpen && (
              <div style={{ padding: '1rem', borderTop: '1px solid #1f1f2e' }}>
                {/* Checklist */}
                {Object.entries(CHECKLIST_LABELS).map(([key, label]) => {
                  const checked = adv.checks[key]
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                      <div
                        onClick={() => toggleCheck(adv.id, key)}
                        style={{
                          width: 22, height: 22, border: '2px solid #1f1f2e', borderRadius: 6,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0, fontSize: '0.8rem',
                          background: checked ? '#22c55e' : 'transparent',
                          borderColor: checked ? '#22c55e' : '#1f1f2e',
                          color: checked ? 'white' : 'transparent',
                        }}>
                        {checked ? '✓' : ''}
                      </div>
                      <span style={{ fontSize: '0.85rem', flexGrow: 1, color: checked ? '#8888a0' : '#f0f0f5', textDecoration: checked ? 'line-through' : 'none' }}>
                        {label}
                      </span>
                    </div>
                  )
                })}

                {/* Notes */}
                <textarea
                  defaultValue={adv.notes}
                  placeholder="Add notes..."
                  onChange={(e) => {
                    const updated = advances.map(a => a.id === adv.id ? { ...a, notes: e.target.value } : a)
                    setAdvances(updated)
                    localStorage.setItem('tourhq_advances', JSON.stringify(updated))
                  }}
                  style={{ width: '100%', padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 8, color: '#f0f0f5', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical', minHeight: 60, marginTop: '0.75rem' }}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Add Button */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          width: 'calc(100% - 2rem)', margin: '1rem',
          padding: '1rem', background: 'none', border: '2px dashed #1f1f2e',
          borderRadius: 12, color: '#555570', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer',
        }}>
        + Add Venue to Advance
      </button>

      {/* Add Advance Modal */}
      {showModal && (
        <div
          style={{
            display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', zIndex: 1000, alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{
            background: '#101018', border: '1px solid #1f1f2e',
            borderRadius: '20px 20px 0 0', padding: '1.5rem',
            width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto',
          }}>
            <div style={{ width: 36, height: 4, background: '#555570', borderRadius: 2, margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Add Venue Advance</h2>
            <form onSubmit={addAdvance}>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#8888a0', marginBottom: '0.4rem' }}>Venue Name *</label>
                <input name="venue" type="text" required placeholder="The Masquerade" style={{ width: '100%', padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#8888a0', marginBottom: '0.4rem' }}>City *</label>
                <input name="city" type="text" required placeholder="Atlanta, GA" style={{ width: '100%', padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.875rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#8888a0', marginBottom: '0.4rem' }}>Show Date *</label>
                  <input name="date" type="date" required style={{ width: '100%', padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#8888a0', marginBottom: '0.4rem' }}>Promoter</label>
                  <input name="promoter" type="text" placeholder="Name or agency" style={{ width: '100%', padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }} />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#8888a0', marginBottom: '0.4rem' }}>Promoter Email</label>
                <input name="email" type="email" placeholder="promoter@venue.com" style={{ width: '100%', padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }} />
              </div>
              <button type="submit" style={{ width: '100%', padding: '0.875rem', background: '#d90429', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>
                Add to Advance List
              </button>
              <button type="button" onClick={() => setShowModal(false)} style={{ width: '100%', padding: '0.875rem', background: '#181822', color: '#f0f0f5', border: '1px solid #1f1f2e', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' }}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}