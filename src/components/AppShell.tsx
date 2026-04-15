'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AppShellProps {
  children: React.ReactNode
  user?: { name: string; email: string } | null
  onLogout?: () => void
}

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/dashboard/dates', icon: '📅', label: 'Dates' },
  { href: '/dashboard/schedule', icon: '⏱️', label: 'Schedule' },
  { href: '/dashboard/route', icon: '🗺️', label: 'Route' },
  { href: '/dashboard/more', icon: '⋯', label: 'More' },
]

export default function AppShell({ children, user, onLogout }: AppShellProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/dashboard/'
    return pathname.startsWith(href)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07070c', color: '#f0f0f5', fontFamily: 'Inter, sans-serif', maxWidth: 480, margin: '0 auto', paddingBottom: 100 }}>
      {/* User Bar */}
      <div style={{ background: '#101018', borderBottom: '1px solid #1f1f2e', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #d90429, #ff6b6b)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user?.name || 'Loading...'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 500 }}>● Online</span>
          <button
            onClick={onLogout}
            style={{ background: 'none', border: '1px solid #1f1f2e', color: '#8888a0', padding: '0.4rem 0.8rem', borderRadius: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Page Content */}
      {children}

      {/* Fixed Bottom Nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#101018', borderTop: '1px solid #1f1f2e', display: 'flex', justifyContent: 'space-around', padding: '0.65rem 0.5rem', maxWidth: 480, margin: '0 auto', zIndex: 100 }}>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                fontSize: '1.2rem', opacity: active ? 1 : 0.4,
                textDecoration: 'none', color: 'inherit',
                padding: '0.25rem 0.5rem', transition: 'opacity 0.2s',
              }}>
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.55rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: active ? '#d90429' : 'inherit' }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}