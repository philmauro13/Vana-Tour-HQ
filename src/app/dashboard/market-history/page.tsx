'use client'

export default function MarketHistoryPage() {
  const rows = [
    { market: 'Denver, CO', tickets: '1,240', gross: '$37,200', avg: '$30' },
    { market: 'Salt Lake City, UT', tickets: '890', gross: '$26,700', avg: '$30' },
    { market: 'Las Vegas, NV', tickets: '1,100', gross: '$33,000', avg: '$30' },
    { market: 'Los Angeles, CA', tickets: '2,100', gross: '$73,500', avg: '$35' },
    { market: 'San Francisco, CA', tickets: '1,540', gross: '$53,900', avg: '$35' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#07070c', color: '#f0f0f5', fontFamily: 'Inter, sans-serif', paddingBottom: 80 }}>
      <div style={{ padding: '1.25rem 1.5rem', textAlign: 'center', borderBottom: '1px solid #1f1f2e' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Market History</div>
        <div style={{ color: '#8888a0', fontSize: '0.85rem' }}>Ticket sales by market</div>
      </div>

      <div style={{ padding: '1rem' }}>
        <div style={{ background: '#101018', border: '1px solid #1f1f2e', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ background: '#181822', padding: '0.875rem 1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8888a0', borderBottom: '1px solid #1f1f2e' }}>
            Sales by Market
          </div>
          {rows.map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: i < rows.length - 1 ? '1px solid #1f1f2e' : 'none' }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 3 }}>{row.market}</div>
                <div style={{ fontSize: '0.75rem', color: '#8888a0' }}>{row.tickets} tickets @ {row.avg}</div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '1rem', color: '#d90429' }}>{row.gross}</div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav active="more" />
    </div>
  )
}

function BottomNav({ active }: { active: string }) {
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#101018', borderTop: '1px solid #1f1f2e', display: 'flex', justifyContent: 'space-around', padding: '0.75rem 1rem', maxWidth: 480, margin: '0 auto', zIndex: 100 }}>
      {[
        { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
        { key: 'dates', label: 'Dates', href: '/dashboard/dates' },
        { key: 'schedule', label: 'Schedule', href: '/dashboard/schedule' },
        { key: 'more', label: 'More', href: '/dashboard/more' },
      ].map(item => (
        <a key={item.key} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: '1.3rem', opacity: active === item.key ? 1 : 0.4, textDecoration: 'none', color: 'inherit' }}>
          <span style={{ fontSize: '1.1rem' }}>{item.key === 'dashboard' ? '[=]' : item.key === 'dates' ? '[#]' : item.key === 'schedule' ? '[T]' : '[...]'}</span>
          <span style={{ fontSize: '0.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: active === item.key ? '#d90429' : 'inherit' }}>{item.label}</span>
        </a>
      ))}
    </nav>
  )
}
