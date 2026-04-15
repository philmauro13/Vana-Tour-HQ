'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface Tour {
  id: string
  name: string
  artist_name: string
  start_date: string
  end_date: string
  tm_name: string
  tm_email: string
  booking_agent: string
  vehicle_type: string
  drive_speed_mph: number
}

const SCHEDULE_ENTRIES = [
  { time: '12:00 PM', event: 'Load-In / Venue Access', type: 'logistics', icon: '🚛' },
  { time: '04:00 PM', event: 'Soundcheck: Support', type: 'support', icon: '🎛️' },
  { time: '06:00 PM', event: 'Soundcheck: Headliner', type: 'vana', icon: '🎤' },
  { time: '06:30 PM', event: 'VIP Meet & Greet', type: 'vana', icon: '🤝' },
  { time: '07:00 PM', event: 'Doors Open', type: 'logistics', icon: '🚪' },
  { time: '09:00 PM', event: 'Headliner Set Time', type: 'vana', icon: '🎸' },
  { time: '11:00 PM', event: 'Curfew / Hard Stop', type: 'logistics', icon: '🛑' },
  { time: '01:30 AM', event: 'Bus Call / Wheels Up', type: 'travel', icon: '🚌' },
]

function statusColor(type: string) {
  if (type === 'vana') return { bg: 'rgba(217,4,41,0.15)', text: '#d90429' }
  if (type === 'support') return { bg: 'rgba(0,119,182,0.15)', text: '#0077b6' }
  if (type === 'travel') return { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' }
  return { bg: 'rgba(108,117,125,0.15)', text: '#8888a0' }
}

function typeLabel(type: string) {
  if (type === 'vana') return 'HEADLINER'
  if (type === 'support') return 'SUPPORT'
  if (type === 'travel') return 'TRAVEL'
  return 'LOGISTICS'
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; id?: string } | null>(null)
  const [tours, setTours] = useState<Tour[]>([])
  const [currentTour, setCurrentTour] = useState<Tour | null>(null)
  const [loadingTours, setLoadingTours] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('tourhq_current_user')
    if (!stored) { router.push('/'); return }
    const u = JSON.parse(stored)
    setUser(u)

    const tourStored = localStorage.getItem('tourhq_current_tour')
    if (tourStored) {
      try { setCurrentTour(JSON.parse(tourStored)) } catch {}
    }

    async function loadTours() {
      setLoadingTours(true)
      if (u.id) {
        const { data, error } = await supabase
          .from('tours')
          .select('*')
          .eq('user_id', u.id)
          .order('created_at', { ascending: false })
        if (!error && data) {
          setTours(data)
          // If no tours come back from DB, clear any stale tourhq_current_tour
          if (data.length === 0) {
            localStorage.removeItem('tourhq_current_tour')
            setCurrentTour(null)
          }
        }
      }
      setLoadingTours(false)
    }
    loadTours()
  }, [router])

  function selectTour(tour: Tour) {
    setCurrentTour(tour)
    const saved = { id: tour.id, name: tour.name, artist_name: tour.artist_name, start_date: tour.start_date, end_date: tour.end_date }
    localStorage.setItem('tourhq_current_tour', JSON.stringify(saved))
  }

  if (!user) return null

  return (
    <div>
      {/* Section Header */}
      <div style={{ padding: '1.25rem 1.5rem', textAlign: 'center', borderBottom: '1px solid #1f1f2e' }}>
        <div style={{ background: '#d90429', color: 'white', fontFamily: 'JetBrains Mono, monospace', padding: '0.4rem 1rem', borderRadius: 100, display: 'inline-block', marginBottom: '0.5rem', fontSize: '0.75rem', letterSpacing: '0.1em', fontWeight: 500 }}>
          {currentTour ? 'ACTIVE TOUR' : 'NO ACTIVE TOUR'}
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          {currentTour ? currentTour.name : 'Create or Select a Tour'}
        </div>
        <div style={{ color: '#8888a0', fontSize: '0.85rem' }}>
          {currentTour ? `${currentTour.artist_name} • ${currentTour.start_date} to ${currentTour.end_date}` : 'Tap below to get started'}
        </div>
      </div>

      {/* Tour Selection */}
      <div style={{ padding: '1rem 1.5rem' }}>
        <Link href="/dashboard/create-tour" style={{ display: 'block', padding: '0.75rem 1rem', background: '#d90429', color: 'white', borderRadius: 10, fontWeight: 600, textDecoration: 'none', textAlign: 'center', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
          + Create New Tour
        </Link>

        {loadingTours ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#8888a0', fontSize: '0.85rem' }}>Loading tours...</div>
        ) : tours.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#8888a0', fontSize: '0.85rem' }}>No tours yet. Create one above.</div>
        ) : tours.map(tour => {
          const isActive = currentTour?.id === tour.id
          return (
            <div
              key={tour.id}
              onClick={() => selectTour(tour)}
              style={{
                padding: '1rem',
                background: '#181822',
                border: `1px solid ${isActive ? '#d90429' : '#1f1f2e'}`,
                borderRadius: 12,
                marginBottom: '0.75rem',
                cursor: 'pointer',
                borderLeft: `3px solid ${isActive ? '#d90429' : '#1f1f2e'}`,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{tour.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#8888a0', marginTop: 2 }}>
                {tour.artist_name} • {tour.start_date} to {tour.end_date}
              </div>
              {isActive && (
                <div style={{ fontSize: '0.7rem', color: '#d90429', fontWeight: 600, marginTop: 4 }}>● ACTIVE</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Active Tour Schedule */}
      {currentTour && (
        <div>
          {/* Pulse bar */}
          <div style={{ height: 4, background: '#181822', borderRadius: 2, margin: '0 1.5rem 0.5rem' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #d90429, #ff6b6b)', width: '65%', borderRadius: 2 }} />
          </div>

          {SCHEDULE_ENTRIES.map((entry, i) => {
            const sc = statusColor(entry.type)
            return (
              <div key={i} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1f1f2e', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, background: '#181822', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0, border: '1px solid #1f1f2e' }}>
                  {entry.icon}
                </div>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#22d3ee', marginBottom: '0.15rem', fontWeight: 500 }}>{entry.time}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{entry.event}</div>
                </div>
                <div style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: sc.bg, color: sc.text }}>
                  {typeLabel(entry.type)}
                </div>
              </div>
            )
          })}

          {/* Edit Day Button */}
          <div style={{ padding: '0.75rem 1.5rem 0.5rem' }}>
            <Link href="/dashboard/edit-day" style={{ display: 'block', padding: '0.6rem', background: 'transparent', border: '1px solid #1f1f2e', borderRadius: 8, color: '#8888a0', textAlign: 'center', textDecoration: 'none', fontSize: '0.85rem' }}>
              ✏️ Edit Day Sheet
            </Link>
          </div>

          {/* Guest List Section */}
          <div style={{ padding: '1rem 1.5rem 0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8888a0' }}>🎟️ Guest List</div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#555570', padding: '0.5rem 0' }}>No guest requests for today</div>
            <button style={{ width: '100%', padding: '0.6rem', background: 'none', border: '1px dashed #1f1f2e', borderRadius: 8, color: '#555570', fontSize: '0.8rem', cursor: 'pointer' }}>
              + Request Guest Pass
            </button>
          </div>
        </div>
      )}
    </div>
  )
}