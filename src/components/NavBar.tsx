'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard', key: 'schedule' },
  { href: '/dashboard/dates', icon: '📅', label: 'Dates', key: 'dates' },
  { href: '/dashboard/schedule', icon: '⏱️', label: 'Schedule', key: 'schedule' },
  { href: '/dashboard/more', icon: '⋯', label: 'More', key: 'more' },
]

export default function NavBar() {
  const pathname = usePathname()
  const [tab, setTab] = useState('schedule')

  useEffect(() => {
    if (pathname === '/dashboard' || pathname === '/dashboard/') setTab('schedule')
    else if (pathname.includes('/dates')) setTab('dates')
    else if (pathname.includes('/schedule')) setTab('schedule')
    else if (pathname.includes('/more')) setTab('more')
  }, [pathname])

  return (
    <nav className="nav-bar">
      {NAV_ITEMS.map(item => (
        <a
          key={item.key}
          href={item.href}
          className={`nav-item ${tab === item.key ? 'active' : ''}`}
          onClick={() => setTab(item.key)}
        >
          {item.icon}
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  )
}
