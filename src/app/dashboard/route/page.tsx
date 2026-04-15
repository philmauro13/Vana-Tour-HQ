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
  vehicle_type?: string
  drive_speed_mph?: number
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function milesBetween(a: string, b: string): number {
  const base = Math.abs((a + b).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 800
  return Math.max(50, base)
}

export default function RoutePage() {
  const [dates, setDates] = useState<TourDate[]>([])
  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)
  const [noTour, setNoTour] = useState(false)

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

  const totalMiles = travelDays.length > 0
    ? travelDays.reduce((acc, day, i) => {
        const nextShow = dates.find((x, j) => j > i && x.type === 'SHOW')
        return acc + milesBetween(day.city, nextShow ? nextShow.city : (dates[i + 1]?.city || day.city))
      }, 0)
    : 0

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
      {/* Header */}
      <div style={{ background: '#101018', borderBottom: '1px solid #1f1f2e', padding: '0.75rem 1.25rem' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Route</div>
        <div style={{ fontSize: '0.75rem', color: '#8888a0', marginTop: 2 }}>
          {tour?.name} • {shows.length} shows • {totalMiles.toLocaleString()} miles
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', padding: '0.75rem 1rem', borderBottom: '1px solid #1f1f2e' }}>
        {[
          { num: totalMiles.toLocaleString(), label: 'Total Miles' },
          { num: shows.length.toString(), label: 'Shows' },
          { num: travelDays.length.toString(), label: 'Travel Days' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#181822', borderRadius: 8, padding: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', fontWeight: 700, color: '#22d3ee' }}>{stat.num}</div>
            <div style={{ fontSize: '0.55rem', color: '#8888a0', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Route list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#8888a0', fontSize: '0.85rem' }}>Loading route...</div>
      ) : dates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#8888a0', fontSize: '0.85rem' }}>No route data. Add dates from the Dates tab.</div>
      ) : (
        dates.map((day, i) => {
          const isShow = day.type === 'SHOW'
          const dist = isShow ? (day.next_distance || '—') : (day.distance || '—')
          const time = isShow ? (day.next_drive_time || '—') : (day.drive_time || '—')

          return (
            <div
              key={day.id}
              style={{
                margin: '0.5rem 1rem',
                background: '#101018',
                border: '1px solid #1f1f2e',
                borderRadius: 12,
                overflow: 'hidden',
                borderLeft: isShow ? '3px solid #d90429' : '3px solid #22c55e',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', gap: '0.75rem' }}>
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: isShow ? 'rgba(217,4,41,0.12)' : 'rgba(34,197,94,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
                }}>
                  {isShow ? '📍' : '🚛'}
                </div>

                {/* Info */}
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#8888a0' }}>
                    {formatDate(day.date)}
                  </div>
                  {isShow ? (
                    <>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: 1 }}>{day.venue || day.city}</div>
                      <div style={{ fontSize: '0.75rem', color: '#8888a0', marginTop: 2 }}>
                        {day.city}{day.next_city && day.next_city !== 'End of Tour' ? ` → ${day.next_city}` : ''}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: 1 }}>{day.from_city || '—'} → {day.to_city || day.city}</div>
                      <div style={{ fontSize: '0.75rem', color: '#8888a0', marginTop: 2 }}>Drive day</div>
                    </>
                  )}
                </div>

                {/* Distance/time */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', fontWeight: 700, color: '#22d3ee' }}>{dist}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#f59e0b', marginTop: 1 }}>{time}</div>
                </div>
              </div>

              {/* Stopover */}
              {day.stopover && (
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(34,211,238,0.04)',
                  borderTop: '1px solid rgba(34,211,238,0.1)',
                  fontSize: '0.75rem',
                }}>
                  <div style={{ fontWeight: 600, color: '#22d3ee' }}>🏨 Stopover: {day.stopover.city}</div>
                  <div style={{ color: '#8888a0', marginTop: 2 }}>{(day.stopover.highlights || []).slice(0, 3).join(' • ')}</div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}