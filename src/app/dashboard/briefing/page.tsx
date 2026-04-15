'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Tour {
  id: string
  name: string
  artist_name: string
  start_date: string
  end_date: string
}

interface TourDate {
  date: string
  city: string
  venue: string
  type: 'show' | 'travel'
  distance?: string
  drive_time?: string
  from_city?: string
  to_city?: string
  stopover?: string
}

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
  promoter?: string
  hotel?: string
  entries: DaySheetEntry[]
}

interface DayOverride {
  venue?: string
  address?: string
  promoter?: string
  hotel?: string
  notes?: string
  entries?: DaySheetEntry[]
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatChipDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return `${WEEKDAYS[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function getDefaultEntries(): DaySheetEntry[] {
  return [
    { time: '12:00 PM', label: 'Load In', icon: '🚛', type: 'logistics' },
    { time: '04:00 PM', label: 'Sound Check', icon: '🎛️', type: 'support' },
    { time: '06:00 PM', label: 'Doors Open', icon: '🚪', type: 'logistics' },
    { time: '09:00 PM', label: 'Headliner Set', icon: '🎸', type: 'vana' },
    { time: '11:00 PM', label: 'Curfew / Hard Stop', icon: '⏹️', type: 'logistics' },
    { time: '01:30 AM', label: 'Bus Call / Wheels Up', icon: '🚌', type: 'travel' },
  ]
}

export default function BriefingPage() {
  const [tour, setTour] = useState<Tour | null>(null)
  const [tourDates, setTourDates] = useState<TourDate[]>([])
  const [daySheets, setDaySheets] = useState<Record<string, DaySheet>>({})
  const [dayOverrides, setDayOverrides] = useState<Record<string, DayOverride>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tourStored = localStorage.getItem('tourhq_current_tour')
    if (tourStored) {
      try { setTour(JSON.parse(tourStored)) } catch {}
    }

    const daysStored = localStorage.getItem('tourhq_days')
    if (daysStored) {
      try { setDayOverrides(JSON.parse(daysStored)) } catch {}
    }
  }, [])

  useEffect(() => {
    if (!tour) return
    async function loadData() {
      setLoading(true)

      const [datesRes, sheetsRes] = await Promise.all([
        supabase
          .from('tour_dates')
          .select('date, city, venue, type, distance, drive_time, from_city, to_city, stopover')
          .eq('tour_id', tour.id)
          .order('date', { ascending: true }),
        supabase
          .from('day_sheets')
          .select('id, tour_id, day_date, city, venue_name, is_show, promoter, hotel, entries')
          .eq('tour_id', tour.id),
      ])

      if (!datesRes.error && datesRes.data) {
        const dates: TourDate[] = datesRes.data.map((d: Record<string, unknown>) => ({
          date: d.date as string,
          city: d.city as string,
          venue: d.venue as string,
          type: d.type as 'show' | 'travel',
          distance: d.distance as string | undefined,
          drive_time: d.drive_time as string | undefined,
          from_city: d.from_city as string | undefined,
          to_city: d.to_city as string | undefined,
          stopover: d.stopover as string | undefined,
        }))
        setTourDates(dates)

        // Default selection: first upcoming date (today or next future)
        const today = new Date().toISOString().split('T')[0]
        const upcoming = dates.find(d => d.date >= today)
        setSelectedDate(upcoming?.date ?? (dates.length > 0 ? dates[0].date : null))
      }

      if (!sheetsRes.error && sheetsRes.data) {
        const sheets: Record<string, DaySheet> = {}
        for (const s of sheetsRes.data) {
          sheets[s.day_date] = s as DaySheet
        }
        setDaySheets(sheets)
      }

      setLoading(false)
    }
    loadData()
  }, [tour])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }, [])

  function buildBriefingText(dateStr: string): string {
    if (!tour) return ''
    const td = tourDates.find(d => d.date === dateStr)
    if (!td) return ''

    const sheet = daySheets[dateStr]
    const override = dayOverrides[dateStr]

    const venue = override?.venue || sheet?.venue_name || td.venue || ''
    const city = override?.address || sheet?.city || td.city || ''
    const promoter = override?.promoter || sheet?.promoter || ''
    const hotel = override?.hotel || sheet?.hotel || ''
    const entries: DaySheetEntry[] = override?.entries || sheet?.entries || getDefaultEntries()

    const fullDate = formatFullDate(dateStr)

    if (td.type === 'travel') {
      const lines: string[] = []
      lines.push(`📋 ${tour.name}`)
      lines.push(`📅 ${fullDate}`)
      lines.push('')
      lines.push(`🚛 TRAVEL DAY`)
      if (td.from_city && td.to_city) {
        lines.push(`   ${td.from_city} → ${td.to_city}`)
      }
      if (td.distance || td.drive_time) {
        const parts: string[] = []
        if (td.distance) parts.push(td.distance)
        if (td.drive_time) parts.push(td.drive_time)
        lines.push(`   ${parts.join(' • ')}`)
      }
      if (td.stopover) {
        lines.push(`🏨 STOPOVER: ${td.stopover}`)
      }
      return lines.join('\n')
    }

    // SHOW day
    const lines: string[] = []
    lines.push(`📋 ${tour.name}`)
    lines.push(`📅 ${fullDate}`)
    lines.push('')
    if (venue) {
      lines.push(`📍 VENUE: ${venue}`)
      if (city) lines.push(`   ${city}`)
    }
    if (promoter) lines.push(`   Promoter: ${promoter}`)
    if (hotel) lines.push(`🏨 Hotel: ${hotel}`)
    lines.push('')
    lines.push(`⏰ SCHEDULE:`)

    const showEntry = entries.find(e => e.type === 'vana' || e.label.toLowerCase().includes('headliner') || e.label.toLowerCase().includes('set'))
    const supportEntry = entries.find(e => e.type === 'support' || e.label.toLowerCase().includes('soundcheck'))
    const doorsEntry = entries.find(e => e.label.toLowerCase().includes('door'))
    const curfewEntry = entries.find(e => e.label.toLowerCase().includes('curfew') || e.label.toLowerCase().includes('hard stop') || e.label.toLowerCase().includes('stop'))
    const busEntry = entries.find(e => e.type === 'travel' || e.label.toLowerCase().includes('bus') || e.label.toLowerCase().includes('wheels'))

    if (supportEntry) {
      lines.push(`  🎛️ ${supportEntry.time} — Soundcheck: Support`)
    }
    if (doorsEntry) {
      lines.push(`  • ${doorsEntry.time} — Doors Open`)
    }
    if (showEntry) {
      lines.push(`  🎸 ${showEntry.time} — Headliner Set`)
    }
    if (curfewEntry) {
      lines.push(`  • ${curfewEntry.time} — Curfew / Hard Stop`)
    }
    if (busEntry) {
      lines.push(`  🚌 ${busEntry.time} — Bus Call / Wheels Up`)
    }

    // NEXT LEG
    const todayIdx = tourDates.findIndex(d => d.date === dateStr)
    if (todayIdx >= 0 && todayIdx < tourDates.length - 1) {
      const next = tourDates[todayIdx + 1]
      if (next.type === 'travel' && next.to_city) {
        lines.push('')
        lines.push(`🚛 NEXT LEG: ${next.to_city}`)
        const parts: string[] = []
        if (next.distance) parts.push(next.distance)
        if (next.drive_time) parts.push(next.drive_time)
        if (parts.length) lines.push(`   ${parts.join(' • ')}`)
      } else if (next.type === 'show' && next.venue) {
        lines.push('')
        lines.push(`🎤 NEXT: ${next.venue} — ${next.city}`)
      }
    }

    return lines.join('\n')
  }

  function getShareText(): string {
    const briefing = buildBriefingText(selectedDate!)
    const msg = customMessage.trim()
    if (!msg) return briefing
    return `${msg}\n\n${briefing}`
  }

  async function handleCopy() {
    const text = getShareText()
    try {
      await navigator.clipboard.writeText(text)
      showToast('Copied to clipboard!')
    } catch {
      showToast('Failed to copy')
    }
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(getShareText())
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  function handleSMS() {
    const text = encodeURIComponent(getShareText())
    window.open(`sms:?body=${text}`, '_blank')
  }

  function handleEmail() {
    if (!tour) return
    const subject = encodeURIComponent(`${tour.name} — Daily Briefing`)
    const body = encodeURIComponent(getShareText())
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
  }

  async function handleShare() {
    const text = getShareText()
    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch {
        // user cancelled or error — do nothing
      }
    } else {
      handleCopy()
    }
  }

  const selectedTD = tourDates.find(d => d.date === selectedDate)
  const selectedSheet = selectedDate ? daySheets[selectedDate] : null
  const selectedOverride = selectedDate ? dayOverrides[selectedDate] : null
  const briefingText = selectedDate ? buildBriefingText(selectedDate) : ''
  const isShow = selectedTD?.type === 'show'

  return (
    <div style={{ minHeight: '100vh', background: '#07070c', color: '#f0f0f5', fontFamily: 'Inter, sans-serif', paddingBottom: 100 }}>
      {/* HEADER */}
      <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #1f1f2e' }}>
        <a href="/dashboard/more" style={{ display: 'inline-block', color: '#8888a0', fontSize: '0.85rem', textDecoration: 'none', marginBottom: '0.75rem' }}>
          ← Back to More
        </a>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>📋 Daily Briefing</div>
        <div style={{ fontSize: '0.85rem', color: '#8888a0' }}>One-tap daily summary for your crew</div>
      </div>

      {/* DAY SELECTOR */}
      {!loading && tourDates.length > 0 && (
        <div style={{ borderBottom: '1px solid #1f1f2e', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem 1rem', gap: '0.5rem', minWidth: 'max-content' }}>
            {tourDates.map(td => {
              const isActive = td.date === selectedDate
              const isShowChip = td.type === 'show'
              const isTravelChip = td.type === 'travel'
              const borderLeft = isShowChip
                ? '3px solid rgba(217,4,41,0.35)'
                : isTravelChip
                ? '3px solid rgba(34,197,94,0.35)'
                : '3px solid transparent'
              return (
                <button
                  key={td.date}
                  onClick={() => setSelectedDate(td.date)}
                  style={{
                    background: isActive ? '#d90429' : '#181822',
                    border: `1px solid ${isActive ? '#d90429' : '#1f1f2e'}`,
                    borderLeft,
                    color: isActive ? '#fff' : '#8888a0',
                    fontSize: '0.65rem',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                >
                  {formatChipDate(td.date)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#8888a0', fontSize: '0.85rem' }}>
          Loading...
        </div>
      )}

      {/* NO DATES */}
      {!loading && tourDates.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#8888a0', fontSize: '0.85rem' }}>
          No tour dates found. Select a tour in Tour HQ.
        </div>
      )}

      {/* BRIEFING CARD */}
      {!loading && selectedDate && briefingText && (
        <>
          <div style={{ margin: '1rem', background: '#101018', borderRadius: 14, border: '1px solid #1f1f2e', overflow: 'hidden' }}>
            {/* Card header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1f1f2e', textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace, monospace', fontSize: '0.75rem', color: '#d90429', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                {formatFullDate(selectedDate).toUpperCase()}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {isShow
                  ? (selectedOverride?.venue || selectedSheet?.venue_name || selectedTD?.venue || 'Show Day')
                  : 'Travel Day'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#8888a0', marginTop: '0.125rem' }}>
                {isShow
                  ? (selectedOverride?.address || selectedSheet?.city || selectedTD?.city || '')
                  : (selectedTD?.from_city && selectedTD?.to_city ? `${selectedTD.from_city} → ${selectedTD.to_city}` : selectedTD?.city || '')}
              </div>
            </div>
            {/* Card body */}
            <div style={{ padding: '1rem 1.25rem', fontFamily: 'JetBrains Mono, monospace, monospace', fontSize: '0.75rem', lineHeight: 1.8, color: '#8888a0', whiteSpace: 'pre-wrap' }}>
              {briefingText}
            </div>
          </div>

          {/* ACTION BAR */}
          <div style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleCopy}
              style={{ flex: 1, background: '#d90429', color: '#fff', border: 'none', borderRadius: 10, padding: '0.85rem', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', fontWeight: 600, cursor: 'pointer' }}
            >
              📋 Copy Briefing
            </button>
            <button
              onClick={handleWhatsApp}
              style={{ flex: 1, background: '#181822', color: '#f0f0f5', border: '1px solid #1f1f2e', borderRadius: 10, padding: '0.85rem', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', fontWeight: 600, cursor: 'pointer' }}
            >
              💬 WhatsApp
            </button>
          </div>

          {/* CUSTOM MESSAGE */}
          <div style={{ padding: '0 1rem 1rem' }}>
            <textarea
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              placeholder="e.g. Great show last night! Let's keep the energy going."
              style={{
                width: '100%',
                minHeight: 80,
                background: '#181822',
                border: '1px solid #1f1f2e',
                borderRadius: 10,
                color: '#f0f0f5',
                fontSize: '0.85rem',
                fontFamily: 'Inter, sans-serif',
                padding: '0.75rem',
                resize: 'vertical',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* QUICK SHARE GRID */}
          <div style={{ padding: '0 1rem 1rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <button
              onClick={handleSMS}
              style={{ background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, padding: '0.75rem', color: '#f0f0f5', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}
            >
              <span style={{ fontSize: '1.1rem' }}>💬</span>
              <span>SMS</span>
            </button>
            <button
              onClick={handleEmail}
              style={{ background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, padding: '0.75rem', color: '#f0f0f5', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}
            >
              <span style={{ fontSize: '1.1rem' }}>📧</span>
              <span>Email</span>
            </button>
            <button
              onClick={handleShare}
              style={{ background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, padding: '0.75rem', color: '#f0f0f5', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}
            >
              <span style={{ fontSize: '1.1rem' }}>📤</span>
              <span>Share...</span>
            </button>
          </div>
        </>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#181822',
          border: '1px solid #22c55e',
          color: '#22c55e',
          padding: '0.6rem 1.25rem',
          borderRadius: 10,
          fontSize: '0.85rem',
          fontFamily: 'Inter, sans-serif',
          zIndex: 9999,
          whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
