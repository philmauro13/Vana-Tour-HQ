'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function CreateTourPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', artist: '', startDate: '', endDate: '', tmName: '', tmEmail: '',
    bookingAgent: '', vehicleType: 'bus', driveSpeed: '55',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const user = JSON.parse(localStorage.getItem('tourhq_current_user') || 'null')
    if (!user) { router.push('/'); return }

    const { data, error: insertError } = await supabase.from('tours').insert({
      name: form.name,
      artist_name: form.artist,
      start_date: form.startDate,
      end_date: form.endDate,
      tm_name: form.tmName,
      tm_email: form.tmEmail,
      booking_agent: form.bookingAgent,
      vehicle_type: form.vehicleType,
      drive_speed_mph: parseInt(form.driveSpeed) || 55,
      user_id: user.id,
    }).select().single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    if (data) {
      const saved = {
        id: data.id,
        name: data.name,
        artist_name: data.artist_name,
        start_date: data.start_date,
        end_date: data.end_date,
      }
      localStorage.setItem('tourhq_current_tour', JSON.stringify(saved))
    }

    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07070c', color: '#f0f0f5', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ padding: '1.25rem 1.5rem', textAlign: 'center', borderBottom: '1px solid #1f1f2e' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Create New Tour</div>
        <div style={{ color: '#8888a0', fontSize: '0.85rem' }}>Fill in the details to get started</div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '1.5rem', maxWidth: 480, margin: '0 auto' }}>
        {error && <div style={{ background: 'rgba(217,4,41,0.1)', border: '1px solid rgba(217,4,41,0.2)', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#ff6b6b' }}>{error}</div>}

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8888a0', marginBottom: '0.4rem' }}>Tour Name *</label>
          <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="VANA — Spring 2026 Tour" required style={{ width: '100%', padding: '0.875rem 1rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8888a0', marginBottom: '0.4rem' }}>Artist / Band Name *</label>
          <input type="text" value={form.artist} onChange={e => update('artist', e.target.value)} placeholder="VANA" required style={{ width: '100%', padding: '0.875rem 1rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8888a0', marginBottom: '0.4rem' }}>Start Date *</label>
            <input type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} required style={{ width: '100%', padding: '0.875rem 1rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8888a0', marginBottom: '0.4rem' }}>End Date *</label>
            <input type="date" value={form.endDate} onChange={e => update('endDate', e.target.value)} required style={{ width: '100%', padding: '0.875rem 1rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8888a0', marginBottom: '0.4rem' }}>Tour Manager Name</label>
            <input type="text" value={form.tmName} onChange={e => update('tmName', e.target.value)} placeholder="Phil Mauro" style={{ width: '100%', padding: '0.875rem 1rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8888a0', marginBottom: '0.4rem' }}>Tour Manager Email</label>
            <input type="email" value={form.tmEmail} onChange={e => update('tmEmail', e.target.value)} placeholder="tm@tourname.com" style={{ width: '100%', padding: '0.875rem 1rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }} />
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8888a0', marginBottom: '0.4rem' }}>Booking Agent</label>
          <input type="text" value={form.bookingAgent} onChange={e => update('bookingAgent', e.target.value)} placeholder="Agency name" style={{ width: '100%', padding: '0.875rem 1rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8888a0', marginBottom: '0.4rem' }}>Vehicle Type</label>
            <select value={form.vehicleType} onChange={e => update('vehicleType', e.target.value)} style={{ width: '100%', padding: '0.875rem 1rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }}>
              <option value="bus">Tour Bus</option>
              <option value="van">Van</option>
              <option value="flown">Flown (Flying)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8888a0', marginBottom: '0.4rem' }}>Drive Speed (mph)</label>
            <input type="number" value={form.driveSpeed} onChange={e => update('driveSpeed', e.target.value)} min="30" max="80" style={{ width: '100%', padding: '0.875rem 1rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }} />
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px 20px', background: '#d90429', color: 'white', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' }}>
          {loading ? 'Creating...' : 'Create Tour'}
        </button>
      </form>
    </div>
  )
}
