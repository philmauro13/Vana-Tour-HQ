'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface TourDate {
  id: string
  tour_id: string
  date: string
  venue: string
  city: string
  type: string
  status: string
  notes: string | null
  from_city?: string
  to_city?: string
  distance?: string
  drive_time?: string
  next_city?: string
  next_distance?: string
  next_drive_time?: string
  stopover?: { city: string; highlights: string[] }
}

interface Tour {
  id: string
  name: string
  artist_name: string
  start_date: string
  end_date: string
}

function formatDayNum(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.getDate()
}

function formatDayAbbr(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
}

function typeBadgeColor(type: string) {
  if (type === 'SHOW') return { bg: 'rgba(217,4,41,0.15)', text: '#d90429' }
  if (type === 'TRAVEL') return { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' }
  return { bg: 'rgba(85,85,112,0.15)', text: '#8888a0' }
}

export default function DatesPage() {
  const [dates, setDates] = useState<TourDate[]>([])
  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)
  const [noTour, setNoTour] = useState(false)
  const [openDate, setOpenDate] = useState<string | null>(null)

  useEffect(() => {
    const tourStored = localStorage.getItem('tourhq_current_tour')
    if (!tourStored) { setNoTour(true); setLoading(false); return }
    let parsedTour: Tour
    try { parsedTour = JSON.parse(tourStored) as Tour } catch { setNoTour(true); setLoading(false); return }
    if (!parsedTour.id) { setNoTour(true); setLoading(false); return }

    setTour(parsedTour)

    async function loadDates() {
      try {
        const { data, error } = await supabase
          .from('tour_dates')
          .select('*')
          .eq('tour_id', parsedTour.id)
          .order('date', { ascending: true })
        if (!error && data) setDates(data)
      } catch {}
      setLoading(false)
    }
    loadDates()
  }, [])

  const shows = dates.filter(d => d.type === 'SHOW')
  const travelDays = dates.filter(d => d.type === 'TRAVEL')
  const today = new Date().toISOString().split('T')[0]

  function renderDateCard(date: TourDate, isShow: boolean) {
    const bc = typeBadgeColor(date.type)
    const isOpen = openDate === date.id
    const isToday = date.date === today

    return (
      <div key={date.id} style={{ margin: '0 1rem 2px', background: '#101018', border: '1px solid #1f1f2e', borderRadius: 12, overflow: 'hidden', borderLeft: isShow ? '3px solid #d90429' : '3px solid #22c55e' }}>
        <div onClick={() => setOpenDate(isOpen ? null : date.id)} style={{ display: 'flex', alignItems: 'center', padding: '0.875rem 1rem', gap: '0.75rem', cursor: 'pointer' }}>
          <div style={{ width: 44, height: 44, flexShrink: 0, background: isShow ? 'rgba(217,4,41,0.12)' : 'rgba(34,197,94,0.12)', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1, color: isShow ? '#d90429' : '#22c55e' }}>{formatDayNum(date.date)}</div>
            <div style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1, color: isShow ? '#d90429' : '#22c55e' }}>{formatDayAbbr(date.date)}</div>
          </div>
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            {isShow ? (
              <>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{date.venue || date.city}</div>
                <div style={{ fontSize: '0.8rem', color: '#8888a0', marginTop: 1 }}>{date.city}</div>
                {date.next_city && date.next_city !== 'End of Tour' && (
                  <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: 2, fontWeight: 500 }}>→ {date.next_city} • {date.next_distance} / {date.next_drive_time}</div>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{date.from_city || '—'} → {date.to_city || date.city}</div>
                <div style={{ fontSize: '0.8rem', color: '#8888a0', marginTop: 1 }}>{date.distance} • {date.drive_time}</div>
              </>
            )}
          </div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.2rem 0.5rem', borderRadius: 4, background: bc.bg, color: bc.text, flexShrink: 0 }}>{date.type}</div>
          {isToday && <div style={{ width: 6, height: 6, background: '#d90429', borderRadius: '50%', flexShrink: 0, animation: 'pulse 2s infinite' }} />}
          <div style={{ fontSize: '0.7rem', color: '#555570', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</div>
        </div>

        {isOpen && (
          <div style={{ borderTop: '1px solid #1f1f2e' }}>
            {isShow ? (
              <>
                <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #1f1f2e' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555570', marginBottom: '0.5rem' }}>Venue Info</div>
                  {[{ label: 'Venue', val: date.venue || '—' }, { label: 'City', val: date.city }, { label: 'Load In', val: '12:00 PM', highlight: true }, { label: 'Doors', val: '07:00 PM', highlight: true }, { label: 'Show', val: '09:00 PM', accent: true }, { label: 'Curfew', val: '11:00 PM' }].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.85rem' }}>
                      <span style={{ color: '#8888a0' }}>{r.label}</span>
                      <span style={{ fontWeight: 600, color: (r as any).highlight ? '#22d3ee' : (r as any).accent ? '#d90429' : 'inherit' }}>{r.val}</span>
                    </div>
                  ))}
                </div>
                {date.next_city && date.next_city !== 'End of Tour' && (
                  <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #1f1f2e' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555570', marginBottom: '0.5rem' }}>Next Leg</div>
                    {[{ label: 'Next Show', val: date.next_city }, { label: 'Distance', val: date.next_distance }, { label: 'Drive Time', val: date.next_drive_time }].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.85rem' }}>
                        <span style={{ color: '#8888a0' }}>{r.label}</span>
                        <span style={{ fontWeight: 600 }}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #1f1f2e' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555570', marginBottom: '0.5rem' }}>Travel</div>
                {[{ label: 'From', val: date.from_city || '—' }, { label: 'To', val: date.to_city || '—' }, { label: 'Distance', val: date.distance }, { label: 'Drive Time', val: date.drive_time }].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.85rem' }}>
                    <span style={{ color: '#8888a0' }}>{r.label}</span>
                    <span style={{ fontWeight: 600 }}>{r.val}</span>
                  </div>
                ))}
              </div>
            )}

            {date.stopover && (
              <div style={{ margin: '0.5rem 1rem', background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#22d3ee', marginBottom: '0.25rem' }}>🏨 Stopover: {date.stopover.city}</div>
                <div style={{ fontSize: '0.75rem', color: '#8888a0', lineHeight: 1.5 }}>{(date.stopover.highlights || []).slice(0, 3).join(' • ')}</div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.75rem 1rem', borderTop: '1px solid #1f1f2e' }}>
              <Link href={`/dashboard/edit-day?date=${date.date}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', border: '1px solid #1f1f2e', borderRadius: 8, background: '#181822', color: '#f0f0f5', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none' }}>✏️ Edit</Link>
              <Link href={`/dashboard`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', border: 'none', borderRadius: 8, background: '#d90429', color: 'white', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>📋 View Day</Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', padding: '0 1rem 0.75rem' }}>
              {[{ label: '🗺️ Maps', href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(isShow ? (date.venue + ', ' + date.city) : (date.to_city || ''))}` }, { label: '🍎 Apple', href: `https://maps.apple.com/?daddr=${encodeURIComponent(isShow ? (date.venue + ', ' + date.city) : (date.to_city || ''))}` }, { label: '🚗 Uber', href: `https://m.uber.com/go?pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(isShow ? (date.venue + ', ' + date.city) : (date.to_city || ''))}` }].map(link => (
                <a key={link.label} href={link.href} target="_blank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', border: '1px solid #1f1f2e', borderRadius: 8, background: '#181822', color: '#f0f0f5', fontSize: '0.75rem', fontWeight: 500, textDecoration: 'none' }}>{link.label}</a>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (noTour) {
    return (
      <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>No tour selected</div>
        <div style={{ fontSize: '0.85rem', color: '#8888a0', marginBottom: '1rem' }}>Select a tour from the Dashboard first</div>
        <Link href="/dashboard" style={{ display: 'inline-block', padding: '10px 20px', background: '#d90429', color: 'white', borderRadius: 10, fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>Go to Dashboard</Link>
      </div>
    )
  }

  return (
    <div>
      <div style={{ background: '#101018', borderBottom: '1px solid #1f1f2e', padding: '0.75rem 1.25rem' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Dates</div>
        <div style={{ fontSize: '0.75rem', color: '#8888a0', marginTop: 2 }}>{shows.length} shows • {travelDays.length} travel days • {dates.length} total</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#8888a0', fontSize: '0.85rem' }}>Loading dates...</div>
      ) : dates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#8888a0', fontSize: '0.85rem' }}>No dates yet. Create a tour and add dates.</div>
      ) : (
        <div style={{ paddingTop: '0.5rem' }}>
          {(() => {
            let lastMonth = ''
            return dates.map(date => {
              const d = new Date(date.date + 'T12:00:00')
              const monthKey = d.getFullYear() + '-' + d.getMonth()
              const isShow = date.type === 'SHOW'
              let monthLabel = ''
              if (monthKey !== lastMonth) { lastMonth = monthKey; monthLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
              return (
                <div key={date.id}>
                  {monthLabel && <div style={{ padding: '1rem 1.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8888a0' }}>{monthLabel}</div>}
                  {renderDateCard(date, isShow)}
                </div>
              )
            })
          })()}
        </div>
      )}
    </div>
  )
}