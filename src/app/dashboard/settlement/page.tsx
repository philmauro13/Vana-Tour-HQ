'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SettlementPage() {
  const [dealType, setDealType] = useState<'guarantee_door' | 'door_split' | 'flat'>('guarantee_door')

  const [ticketSales, setTicketSales] = useState(5000)
  const [guarantee, setGuarantee] = useState(2500)
  const [artistSplit, setArtistSplit] = useState(80)
  const [venueFee, setVenueFee] = useState(500)
  const [soundFee, setSoundFee] = useState(300)
  const [securityFee, setSecurityFee] = useState(200)
  const [otherExpenses, setOtherExpenses] = useState(0)
  const [merchSales, setMerchSales] = useState(1200)
  const [merchSplit, setMerchSplit] = useState(15)

  function calc() {
    const totalExpenses = venueFee + soundFee + securityFee + otherExpenses
    const netBeforeSplit = ticketSales - totalExpenses
    const guaranteeVal = dealType === 'flat' ? guarantee : (dealType === 'guarantee_door' ? guarantee : netBeforeSplit * (artistSplit / 100))
    const artistShare = netBeforeSplit * (artistSplit / 100)
    const venueShare = netBeforeSplit - artistShare
    const merchVenueCut = merchSales * (merchSplit / 100)
    const merchArtistPayout = merchSales - merchVenueCut
    const artistPayout = dealType === 'flat' ? guarantee : Math.max(guarantee, artistShare)
    const grandTotal = artistPayout + merchArtistPayout

    return { totalExpenses, netBeforeSplit, artistShare, venueShare, merchVenueCut, merchArtistPayout, artistPayout, grandTotal }
  }

  function fmt(n: number) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const c = calc()

  return (
    <div style={{ paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1f1f2e' }}>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#8888a0', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          ← Back
        </Link>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Settlement Calculator</div>
        <div style={{ color: '#8888a0', fontSize: '0.85rem' }}>Auto-calculate deal structures</div>
      </div>

      {/* Deal Type Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem 1.5rem' }}>
        {[
          { key: 'guarantee_door', label: 'Guarantee vs Door' },
          { key: 'door_split', label: 'Door Split' },
          { key: 'flat', label: 'Flat Fee' },
        ].map(opt => (
          <div
            key={opt.key}
            onClick={() => setDealType(opt.key as typeof dealType)}
            style={{
              flex: 1, padding: '0.75rem 0.5rem',
              background: dealType === opt.key ? 'rgba(217,4,41,0.1)' : '#181822',
              border: `1px solid ${dealType === opt.key ? '#d90429' : '#1f1f2e'}`,
              borderRadius: 10, fontSize: '0.75rem', fontWeight: 600,
              color: dealType === opt.key ? '#d90429' : '#8888a0',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
            }}>
            {opt.label}
          </div>
        ))}
      </div>

      {/* Income */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1f1f2e' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8888a0', marginBottom: '1rem' }}>💰 Income</div>
        <div style={{ marginBottom: '0.875rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#8888a0', marginBottom: '0.35rem' }}>Gross Ticket Sales</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#555570' }}>$</span>
            <input type="number" value={ticketSales} onChange={e => setTicketSales(Number(e.target.value))} style={{ flex: 1, padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 8, color: '#f0f0f5', fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', outline: 'none', textAlign: 'right' }} />
          </div>
        </div>
        {dealType !== 'flat' && (
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#8888a0', marginBottom: '0.35rem' }}>{dealType === 'guarantee_door' ? 'Guarantee Amount' : 'Artist Door Split'}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {dealType === 'guarantee_door' && <span style={{ fontSize: '0.9rem', color: '#555570' }}>$</span>}
              <input type="number" value={dealType === 'guarantee_door' ? guarantee : artistSplit} onChange={e => dealType === 'guarantee_door' ? setGuarantee(Number(e.target.value)) : setArtistSplit(Number(e.target.value))} style={{ flex: 1, padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 8, color: '#f0f0f5', fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', outline: 'none', textAlign: 'right' }} />
              {dealType !== 'guarantee_door' && <span style={{ fontSize: '0.8rem', color: '#555570', width: 40 }}>%</span>}
            </div>
          </div>
        )}
      </div>

      {/* Expenses */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1f1f2e' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8888a0', marginBottom: '1rem' }}>📋 Expenses</div>
        {[
          { label: 'Venue Rental / House Fee', val: venueFee, set: setVenueFee },
          { label: 'Sound / Production', val: soundFee, set: setSoundFee },
          { label: 'Door Staff / Security', val: securityFee, set: setSecurityFee },
          { label: 'Other Expenses', val: otherExpenses, set: setOtherExpenses },
        ].map(row => (
          <div key={row.label} style={{ marginBottom: '0.875rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#8888a0', marginBottom: '0.35rem' }}>{row.label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#555570' }}>$</span>
              <input type="number" value={row.val} onChange={e => row.set(Number(e.target.value))} style={{ flex: 1, padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 8, color: '#f0f0f5', fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', outline: 'none', textAlign: 'right' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Merch */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1f1f2e' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8888a0', marginBottom: '1rem' }}>👕 Merch</div>
        <div style={{ marginBottom: '0.875rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#8888a0', marginBottom: '0.35rem' }}>Gross Merch Sales</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#555570' }}>$</span>
            <input type="number" value={merchSales} onChange={e => setMerchSales(Number(e.target.value))} style={{ flex: 1, padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 8, color: '#f0f0f5', fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', outline: 'none', textAlign: 'right' }} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#8888a0', marginBottom: '0.35rem' }}>Venue Merch Cut</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="number" value={merchSplit} onChange={e => setMerchSplit(Number(e.target.value))} style={{ flex: 1, padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 8, color: '#f0f0f5', fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', outline: 'none', textAlign: 'right' }} />
            <span style={{ fontSize: '0.8rem', color: '#555570', width: 40 }}>%</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ margin: '0 1rem 1rem', background: '#101018', border: '1px solid #1f1f2e', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ background: '#181822', padding: '0.875rem 1rem', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8888a0', borderBottom: '1px solid #1f1f2e' }}>📊 Settlement Breakdown</div>
        {[
          { label: 'Gross Ticket Sales', val: fmt(ticketSales) },
          { label: 'Total Expenses', val: '-' + fmt(c.totalExpenses), negative: true },
          { label: 'Net Before Split', val: fmt(c.netBeforeSplit) },
          { label: `Artist Share (${artistSplit}%)`, val: fmt(c.artistShare), positive: true },
          { label: 'Venue Share', val: fmt(c.venueShare) },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem 1rem', borderBottom: '1px solid #1f1f2e', fontSize: '0.9rem' }}>
            <span style={{ color: '#8888a0' }}>{row.label}</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: row.negative ? '#d90429' : row.positive ? '#22c55e' : 'inherit' }}>{row.val}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'rgba(217,4,41,0.08)', borderTop: '1px solid #d90429', fontSize: '0.9rem' }}>
          <span style={{ fontWeight: 600 }}>💰 Artist Payout (Tickets)</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#22d3ee', fontSize: '1.1rem' }}>{fmt(c.artistPayout)}</span>
        </div>
      </div>

      {/* Merch Results */}
      <div style={{ margin: '0 1rem 1rem', background: '#101018', border: '1px solid #1f1f2e', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ background: '#181822', padding: '0.875rem 1rem', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8888a0', borderBottom: '1px solid #1f1f2e' }}>👕 Merch Settlement</div>
        {[
          { label: 'Gross Merch Sales', val: fmt(merchSales) },
          { label: `Venue Cut (${merchSplit}%)`, val: '-' + fmt(c.merchVenueCut), negative: true },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem 1rem', borderBottom: '1px solid #1f1f2e', fontSize: '0.9rem' }}>
            <span style={{ color: '#8888a0' }}>{row.label}</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: row.negative ? '#d90429' : 'inherit' }}>{row.val}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'rgba(217,4,41,0.08)', borderTop: '1px solid #d90429', fontSize: '0.9rem' }}>
          <span style={{ fontWeight: 600 }}>💰 Artist Payout (Merch)</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#22d3ee', fontSize: '1.1rem' }}>{fmt(c.merchArtistPayout)}</span>
        </div>
      </div>

      {/* Grand Total */}
      <div style={{ margin: '0 1rem 1rem', background: '#101018', border: '1px solid #22c55e', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ background: 'rgba(34,197,94,0.08)', padding: '0.875rem 1rem', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#22c55e', borderBottom: '1px solid #22c55e' }}>✅ Grand Total Payout</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'rgba(34,197,94,0.08)' }}>
          <span style={{ fontWeight: 600 }}>Total to Artist</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#22c55e', fontSize: '1.3rem' }}>{fmt(c.grandTotal)}</span>
        </div>
      </div>
    </div>
  )
}