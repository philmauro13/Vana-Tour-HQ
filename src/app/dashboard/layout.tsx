'use client'

import AppShell from '@/components/AppShell'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('tourhq_current_user')
    if (!stored) { router.push('/'); return }
    try { setUser(JSON.parse(stored)) } catch { router.push('/') }
  }, [router])

  async function handleLogout() {
    localStorage.removeItem('tourhq_current_user')
    localStorage.removeItem('tourhq_current_tour')
    try { await supabase.auth.signOut() } catch {}
    router.push('/')
  }

  if (!user) return null

  return <AppShell user={user} onLogout={handleLogout}>{children}</AppShell>
}