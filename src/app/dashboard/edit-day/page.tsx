'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface DayEntry {
  id?: string
  time: string
  event: string
  type: string
}

interface DaySheet {
  id: string
  tour_id: string
  day_date: string
  city: string | null
  venue_name: string | null
  venue_address: string | null
  promoter_contact: string | null
  hotel_info: string | null
  notes: string | null
  is_show: boolean
  entries: DayEntry[]
}

function typeColors(type: string) {
  if (type === 'vana') return { bg: 'rgba(217,4,41,0.15)', color: '#d90429' }
  if (type === 'support') return { bg: 'rgba(0,119,182,0.15)', color: '#0077b6' }
  if (type === 'travel') return { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' }
  return { bg: 'rgba(85,85,112,0.15)', color: '#8888a0' }
}

function typeOptions() {
  return ['logistics', 'vana', 'support', 'travel']
}

function BottomNav({ active }: { active: string }) {
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#101018', borderTop: '1px solid #1f1f2e', display: 'flex', justifyContent: 'space-around', padding: '0.75rem 1rem', maxWidth: 480, margin: '0 auto', zIndex: 100 }}>
      {[
        { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
        { key: 'dates', label: 'Dates', href: '/dashboard/dates' },
        { key: 'edit-day', label: 'Day Sheet', href: '/dashboard/edit-day' },
        { key: 'more', label: 'More', href: '/dashboard/more' },
      ].map(item => (
        <a key={item.key} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: '1.3rem', opacity: active === item.key ? 1 : 0.4, textDecoration: 'none', color: 'inherit' }}>
          <span style={{ fontSize: '1.1rem' }}>{item.key === 'dashboard' ? '🏠' : item.key === 'dates' ? '#' : item.key === 'edit-day' ? '📋' : '•••'}</span>
          <span style={{ fontSize: '0.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: active === item.key ? '#d90429' : 'inherit' }}>{item.label}</span>
        </a>
      ))}
    </nav>
  )
}

export default function EditDayPage() {
  const [daySheet, setDaySheet] = useState<DaySheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [noTour, setNoTour] = useState(false)
  const [editDate, setEditDate] = useState<string>('')
  const [editModal, setEditModal] = useState<{ index: number; entry: DayEntry } | null>(null)
  const [metaModal, setMetaModal] = useState<Partial<DaySheet> | null>(null)

  useEffect(() => {
    loadDaySheet()
  }, [])

  async function loadDaySheet() {
    setLoading(true)
    const tourStored = localStorage.getItem('tourhq_current_tour')
    if (!tourStored) {
      setNoTour(true)
      setLoading(false)
      return
    }
    let tourId: string
    try {
      tourId = JSON.parse(tourStored).id
    } catch {
      setNoTour(true)
      setLoading(false)
      return
    }

    // Try to load today's sheet or the most recent
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('day_sheets')
      .select('*')
      .eq('tour_id', tourId)
      .order('day_date', { ascending: false })
      .limit(1)

    if (!error && data && data.length > 0) {
      const ds = data[0]
      setDaySheet({
        ...ds,
        entries: Array.isArray(ds.entries) ? ds.entries : [],
      })
      setEditDate(ds.day_date)
    } else {
      // No day sheet yet — start with defaults
      const defaults: DaySheet = {
        id: '',
        tour_id: tourId,
        day_date: today,
        city: null,
        venue_name: null,
        venue_address: null,
        promoter_contact: null,
        hotel_info: null,
        notes: null,
        is_show: true,
        entries: [
          { time: '12:00 PM', event: 'Load-In', type: 'logistics' },
          { time: '04:00 PM', event: 'Sound Check', type: 'support' },
          { time: '06:00 PM', event: 'Doors Open', type: 'logistics' },
          { time: '09:00 PM', event: 'Showtime', type: 'vana' },
          { time: '11:00 PM', event: 'Curfew', type: 'logistics' },
          { time: '01:30 AM', event: 'Bus Call', type: 'travel' },
        ],
      }
      setDaySheet(defaults)
      setEditDate(today)
    }
    setLoading(false)
  }

  function updateEntry(index: number, field: keyof DayEntry, value: string) {
    if (!daySheet) return
    const updated = [...daySheet.entries]
    updated[index] = { ...updated[index], [field]: value }
    setDaySheet({ ...daySheet, entries: updated })
    setSaved(false)
  }

  function addEntry() {
    if (!daySheet) return
    const newEntry: DayEntry = { time: '06:00 PM', event: 'New Event', type: 'logistics' }
    setDaySheet({ ...daySheet, entries: [...daySheet.entries, newEntry] })
    setSaved(false)
  }

  function removeEntry(index: number) {
    if (!daySheet) return
    const updated = daySheet.entries.filter((_, i) => i !== index)
    setDaySheet({ ...daySheet, entries: updated })
    setSaved(false)
  }

  async function saveDaySheet() {
    if (!daySheet || !daySheet.tour_id) return
    setSaving(true)

    const { data: existing } = await supabase
      .from('day_sheets')
      .select('id')
      .eq('tour_id', daySheet.tour_id)
      .eq('day_date', editDate)
      .limit(1)

    if (existing && existing.length > 0) {
      // Update
      const { error } = await supabase
        .from('day_sheets')
        .update({
          entries: daySheet.entries,
          city: metaModal?.city ?? daySheet.city,
          venue_name: metaModal?.venue_name ?? daySheet.venue_name,
          venue_address: metaModal?.venue_address ?? daySheet.venue_address,
          promoter_contact: metaModal?.promoter_contact ?? daySheet.promoter_contact,
          hotel_info: metaModal?.hotel_info ?? daySheet.hotel_info,
          notes: metaModal?.notes ?? daySheet.notes,
          is_show: metaModal?.is_show ?? daySheet.is_show,
        })
        .eq('id', existing[0].id)
      if (error) console.error('Save error:', error)
    } else {
      // Insert
      const { error } = await supabase.from('day_sheets').insert({
        tour_id: daySheet.tour_id,
        day_date: editDate,
        entries: daySheet.entries,
        city: metaModal?.city ?? daySheet.city,
        venue_name: metaModal?.venue_name ?? daySheet.venue_name,
        venue_address: metaModal?.venue_address ?? daySheet.venue_address,
        promoter_contact: metaModal?.promoter_contact ?? daySheet.promoter_contact,
        hotel_info: metaModal?.hotel_info ?? daySheet.hotel_info,
        notes: metaModal?.notes ?? daySheet.notes,
        is_show: metaModal?.is_show ?? daySheet.is_show,
      })
      if (error) console.error('Insert error:', error)
    }

    setSaving(false)
    setSaved(true)
    setMetaModal(null)
    setTimeout(() => setSaved(false), 3000)
  }

  function formatDateDisplay(dateStr: string) {
    if (!dateStr) return 'No date'
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  if (noTour) {
    return (
      <div style={{ minHeight: '100vh', background: '#07070c', color: '#f0f0f5', fontFamily: 'Inter, sans-serif', paddingBottom: 80 }}>
        <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>No tour selected</div>
          <a href="/dashboard" style={{ display: 'inline-block', padding: '10px 20px', background: '#d90429', color: 'white', borderRadius: 10, fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>Go to Dashboard</a>
        </div>
        <BottomNav active="edit-day" />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07070c', color: '#f0f0f5', fontFamily: 'Inter, sans-serif', paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', textAlign: 'center', borderBottom: '1px solid #1f1f2e' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input
            type="date"
            value={editDate}
            onChange={e => { setEditDate(e.target.value); setSaved(false) }}
            style={{ background: '#181822', border: '1px solid #1f1f2e', color: 'white', borderRadius: 8, padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', colorScheme: 'dark' }}
          />
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Edit Day Sheet</div>
        <div style={{ color: '#8888a0', fontSize: '0.85rem' }}>{daySheet ? daySheet.entries.length + ' entries' : 'Loading...'}</div>
        {saved && (
          <div style={{ marginTop: '0.5rem', color: '#22c55e', fontSize: '0.8rem', fontWeight: 600 }}>✓ Saved to Supabase</div>
        )}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '1.5rem', color: '#8888a0', fontSize: '0.85rem' }}>Loading day sheet...</div>}

      {!loading && daySheet && (
        <>
          {/* Day meta bar */}
          <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', borderBottom: '1px solid #1f1f2e' }}>
            {[
              { label: 'Show Day', field: 'is_show', value: daySheet.is_show, icon: '🎤' },
              { label: 'Venue', field: 'venue_name', value: daySheet.venue_name, icon: '📍' },
              { label: 'City', field: 'city', value: daySheet.city, icon: '🏙️' },
              { label: 'Hotel', field: 'hotel_info', value: daySheet.hotel_info, icon: '🏨' },
            ].map((m, i) => (
              <button key={i}
                onClick={() => setMetaModal({ ...daySheet, [m.field]: m.value })}
                style={{
                  flexShrink: 0, background: '#101018', border: '1px solid #1f1f2e', borderRadius: 8, padding: '0.4rem 0.75rem',
                  fontSize: '0.7rem', color: m.value ? '#f0f0f5' : '#555570', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'inherit',
                }}>
                <span>{m.icon}</span>
                <span>{m.label}:</span>
                <span style={{ fontWeight: 600, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.value || 'Set'}</span>
              </button>
            ))}
          </div>

          {/* Entries */}
          <div style={{ padding: '1rem' }}>
            {daySheet.entries.map((entry, i) => {
              const tc = typeColors(entry.type)
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  background: '#101018', border: '1px solid #1f1f2e', borderRadius: 12,
                  padding: '0.875rem 1rem', marginBottom: '0.5rem',
                  borderLeft: `3px solid ${tc.color}`,
                }}>
                  {/* Drag handle area */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', cursor: 'grab' }}>
                    <div style={{ width: 16, height: 2, background: '#555570', borderRadius: 1 }} />
                    <div style={{ width: 16, height: 2, background: '#555570', borderRadius: 1 }} />
                    <div style={{ width: 16, height: 2, background: '#555570', borderRadius: 1 }} />
                  </div>

                  {/* Time input */}
                  <input
                    type="text"
                    value={entry.time}
                    onChange={e => updateEntry(i, 'time', e.target.value)}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', fontWeight: 600, color: '#22d3ee',
                      background: 'transparent', border: 'none', outline: 'none', width: 72,
                    }}
                  />

                  {/* Event input */}
                  <input
                    type="text"
                    value={entry.event}
                    onChange={e => updateEntry(i, 'event', e.target.value)}
                    style={{
                      flexGrow: 1, fontSize: '0.9rem', fontWeight: 600, color: '#f0f0f5',
                      background: 'transparent', border: 'none', outline: 'none',
                    }}
                  />

                  {/* Type selector */}
                  <select
                    value={entry.type}
                    onChange={e => updateEntry(i, 'type', e.target.value)}
                    style={{
                      fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                      padding: '0.2rem 0.4rem', borderRadius: 4, border: 'none', cursor: 'pointer',
                      background: tc.bg, color: tc.color, fontFamily: 'inherit',
                    }}>
                    {typeOptions().map(t => <option key={t} value={t}>{t}</option>)}
                  </select>

                  {/* Delete */}
                  <button
                    onClick={() => removeEntry(i)}
                    style={{ background: 'none', border: 'none', color: '#555570', cursor: 'pointer', fontSize: '0.8rem', padding: '0.25rem' }}>
                    ✕
                  </button>
                </div>
              )
            })}

            {/* Add entry */}
            <button
              onClick={addEntry}
              style={{
                width: '100%', padding: '0.875rem', background: '#181822', border: '1px dashed #1f1f2e',
                borderRadius: 12, color: '#8888a0', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', marginTop: '0.25rem',
              }}>
              + Add Entry
            </button>
          </div>

          {/* Save button */}
          <div style={{ padding: '1rem', position: 'fixed', bottom: 64, left: 0, right: 0, maxWidth: 480, margin: '0 auto' }}>
            <button
              onClick={saveDaySheet}
              disabled={saving}
              style={{
                width: '100%', padding: '12px', background: saving ? '#555570' : '#d90429',
                color: 'white', border: 'none', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
              {saving ? 'Saving...' : '💾 Save Day Sheet'}
            </button>
          </div>
        </>
      )}

      {/* Meta edit modal */}
      {metaModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }} onClick={() => setMetaModal(null)}>
          <div style={{ background: '#101018', border: '1px solid #1f1f2e', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Edit Day Details</h3>
            {[
              { key: 'venue_name', label: 'Venue Name', placeholder: 'The Fillmore' },
              { key: 'city', label: 'City', placeholder: 'Philadelphia, PA' },
              { key: 'venue_address', label: 'Venue Address', placeholder: '123 Main St' },
              { key: 'promoter_contact', label: 'Promoter Contact', placeholder: 'promoter@venue.com' },
              { key: 'hotel_info', label: 'Hotel Info', placeholder: 'Marriott • 555-0100' },
              { key: 'notes', label: 'Notes', placeholder: 'Load-in via stage door...' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '0.875rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8888a0', marginBottom: '0.25rem' }}>{field.label}</label>
                <input
                  type="text"
                  value={(metaModal as any)[field.key] || ''}
                  onChange={e => setMetaModal({ ...metaModal, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  style={{ width: '100%', padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 8, color: '#f0f0f5', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="checkbox"
                id="is_show"
                checked={metaModal.is_show ?? true}
                onChange={e => setMetaModal({ ...metaModal, is_show: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: '#d90429' }}
              />
              <label htmlFor="is_show" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Show Day</label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setMetaModal(null)}
                style={{ flex: 1, padding: '10px', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 8, color: '#8888a0', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button
                onClick={() => { setDaySheet(prev => prev ? { ...prev, ...metaModal } : prev); setMetaModal(null); setSaved(false) }}
                style={{ flex: 1, padding: '10px', background: '#d90429', border: 'none', borderRadius: 8, color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="edit-day" />
    </div>
  )
}