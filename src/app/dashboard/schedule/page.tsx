'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface DaySheetEntry {
  time: string
  label: string
  icon: string
  type: string
}

interface DaySheet {
  id: string
  tour_id: string
  day_date: string
  city: string
  venue_name: string
  is_show: boolean
  entries: DaySheetEntry[]
}

const FALLBACK_ENTRIES: DaySheetEntry[] = [
  { time: '12:00 PM', label: 'Load In', icon: '[truck]', type: 'logistics' },
  { time: '04:00 PM', label: 'Sound Check', icon: '[knob]', type: 'support' },
  { time: '06:00 PM', label: 'Doors', icon: '[door]', type: 'logistics' },
  { time: '09:00 PM', label: 'Show', icon: '[guitar]', type: 'vana' },
  { time: '11:00 PM', label: 'Curfew', icon: '[stop]', type: 'logistics' },
  { time: '01:30 AM', label: 'Bus Call', icon: '[bus]', type: 'travel' },
]

export default function SchedulePage() {
  const [daySheet, setDaySheet] = useState<DaySheet | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDaySheet() {
      setLoading(true)
      const tourStored = localStorage.getItem('tourhq_current_tour')
      if (!tourStored) {
        setLoading(false)
        return
      }
      let tourId: string
      try {
        const t = JSON.parse(tourStored)
        tourId = t.id
      } catch {
        setLoading(false)
        return
      }

      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('day_sheets')
        .select('id, tour_id, day_date, city, venue_name, is_show, entries')
        .eq('tour_id', tourId)
        .order('day_date', { ascending: true })
        .limit(1)

      if (!error && data && data.length > 0) {
        setDaySheet(data[0])
      }
      setLoading(false)
    }
    loadDaySheet()
  }, [])

  const entries = daySheet?.entries || FALLBACK_ENTRIES
  const headerVenue = daySheet?.venue_name || 'The Bluebird Theater'
  const headerCity = daySheet?.city || 'Denver, CO'
  const headerDate = daySheet?.day_date
    ? new Date(daySheet.day_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'MARCH 27, 2026'

  return (
    <div style={{ minHeight: '100vh', background: '#07070c', color: '#f0f0f5', fontFamily: 'Inter, sans-serif', paddingBottom: 80 }}>
      <div style={{ padding: '1.25rem 1.5rem', textAlign: 'center', borderBottom: '1px solid #1f1f2e' }}>
        <div style={{ background: '#d90429', color: 'white', fontFamily: 'JetBrains Mono, monospace', padding: '0.4rem 1rem', borderRadius: 100, display: 'inline-block', marginBottom: '0.5rem', fontSize: '0.75rem', letterSpacing: '0.1em' }}>{headerDate}</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>{headerVenue}</div>
        <div style={{ color: '#8888a0', fontSize: '0.85rem' }}>{headerCity}{daySheet?.is_show ? ' • SHOW DAY' : ''}</div>
      </div>

      <div style={{ height: 4, background: '#181822', borderRadius: 2, margin: '1rem 1.5rem' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, #d90429, #ff6b6b)', width: '72%', borderRadius: 2 }} />
      </div>

      {loading && (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#8888a0', fontSize: '0.85rem' }}>Loading schedule...</div>
      )}

      {!loading && !daySheet && (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#8888a0', fontSize: '0.8rem', marginBottom: '0.5rem' }}>No day sheet found. Showing default schedule.</div>
      )}

      <div>
        {entries.map((e, i) => (
          <div key={i} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1f1f2e', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, background: '#181822', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: '1px solid #1f1f2e', flexShrink: 0 }}>{e.icon}</div>
            <div style={{ flexGrow: 1 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#22d3ee', marginBottom: '0.15rem', fontWeight: 500 }}>{e.time}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{e.label}</div>
            </div>
            <div style={{
              fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase',
              background: e.type === 'vana' ? 'rgba(217,4,41,0.15)' : e.type === 'support' ? 'rgba(0,119,182,0.15)' : e.type === 'travel' ? 'rgba(34,197,94,0.15)' : 'rgba(108,117,125,0.15)',
              color: e.type === 'vana' ? '#d90429' : e.type === 'support' ? '#0077b6' : e.type === 'travel' ? '#22c55e' : '#8888a0',
            }}>{e.type.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '1rem' }}>
        <a href="/dashboard/edit-day" style={{ display: 'block', padding: '12px 20px', background: 'transparent', color: '#f0f0f5', border: '1px solid #1f1f2e', borderRadius: 10, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>Edit Day Sheet</a>
      </div>

    </div>
  )
}
