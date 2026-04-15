'use client'

import React, { useState, useEffect, useRef } from 'react'

interface Expense {
  id: string
  category: 'fuel' | 'food' | 'lodging' | 'perdiem' | 'production' | 'misc'
  description: string
  amount: number
  date: string
  notes?: string
  hasReceipt?: boolean
}

const STORAGE_KEY = 'tourhq_expenses'

const CATEGORY_EMOJI: Record<string, string> = {
  fuel: '⛽',
  food: '🍔',
  lodging: '🏨',
  perdiem: '💵',
  production: '🎛️',
  misc: '📦',
}

const CATEGORIES = [
  { key: 'fuel', label: 'Fuel', emoji: '⛽' },
  { key: 'food', label: 'Food', emoji: '🍔' },
  { key: 'lodging', label: 'Lodging', emoji: '🏨' },
  { key: 'perdiem', label: 'Per Diem', emoji: '💵' },
  { key: 'production', label: 'Production', emoji: '🎛️' },
  { key: 'misc', label: 'Misc', emoji: '📦' },
]

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showScanModal, setShowScanModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [scanPreview, setScanPreview] = useState<string | null>(null)
  const [scanResults, setScanResults] = useState<{ amount: string; description: string; date: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scanFileInputRef = useRef<HTMLInputElement>(null)

  // Form state for add modal
  const [formCategory, setFormCategory] = useState<string>('fuel')
  const [formDescription, setFormDescription] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formDate, setFormDate] = useState(getToday())
  const [formNotes, setFormNotes] = useState('')

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setExpenses(JSON.parse(stored))
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  // Save to localStorage
  const saveExpenses = (updated: Expense[]) => {
    setExpenses(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  // Unique dates for filter
  const uniqueDates = React.useMemo(() => {
    const dates = [...new Set(expenses.map(e => e.date))].sort((a, b) => b.localeCompare(a))
    return dates
  }, [expenses])

  // Filtered expenses
  const filteredExpenses = React.useMemo(() => {
    if (selectedDate === 'all') return expenses
    return expenses.filter(e => e.date === selectedDate)
  }, [expenses, selectedDate])

  // Group by date
  const groupedExpenses = React.useMemo(() => {
    const groups: Record<string, Expense[]> = {}
    const sorted = [...filteredExpenses].sort((a, b) => b.date.localeCompare(a.date))
    for (const expense of sorted) {
      if (!groups[expense.date]) groups[expense.date] = []
      groups[expense.date].push(expense)
    }
    return groups
  }, [filteredExpenses])

  // Stats
  const todayStr = getToday()
  const todayTotal = expenses.filter(e => e.date === todayStr).reduce((sum, e) => sum + e.amount, 0)
  const tourTotal = expenses.reduce((sum, e) => sum + e.amount, 0)

  // Toast helper
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  // Quick add
  const quickAdd = (category: string, description: string, amount: number) => {
    setFormCategory(category)
    setFormDescription(description)
    setFormAmount(amount.toString())
    setFormDate(getToday())
    setFormNotes('')
    setShowAddModal(true)
  }

  // Open scan modal
  const openScanModal = () => {
    setScanStatus('idle')
    setScanPreview(null)
    setScanResults(null)
    setShowScanModal(true)
  }

  // Handle file selection for scan
  const handleScanFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setScanPreview(dataUrl)
      runOCR(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  // OCR with Tesseract.js
  const runOCR = async (dataUrl: string) => {
    setScanStatus('scanning')
    try {
      const Tesseract = await import('tesseract.js')
      const result = await Tesseract.recognize(dataUrl, 'eng', {
        logger: () => {},
      })
      const text = result.data.text

      // Parse amount - look for $ patterns
      const amountMatch = text.match(/\$\s*(\d+\.?\d*)/)
      const amount = amountMatch ? amountMatch[1] : ''

      // Parse description - first line usually
      const lines = text.split('\n').filter(l => l.trim())
      const description = lines[0]?.replace(/\s+/g, ' ').trim() || ''

      // Parse date - look for common date patterns
      const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/)
      let date = getToday()
      if (dateMatch) {
        try {
          const parsed = new Date(dateMatch[1])
          if (!isNaN(parsed.getTime())) {
            date = parsed.toISOString().split('T')[0]
          }
        } catch {
          // use today
        }
      }

      // Try to detect category from text
      let detectedCategory = 'misc'
      const lowerText = text.toLowerCase()
      if (lowerText.includes('gas') || lowerText.includes('fuel') || lowerText.includes('shell') || lowerText.includes('chevron')) {
        detectedCategory = 'fuel'
      } else if (lowerText.includes('restaurant') || lowerText.includes('cafe') || lowerText.includes('food') || lowerText.includes('pizza')) {
        detectedCategory = 'food'
      } else if (lowerText.includes('hotel') || lowerText.includes('marriott') || lowerText.includes('hilton')) {
        detectedCategory = 'lodging'
      }

      setScanResults({ amount, description, date })
      setScanStatus('success')
    } catch {
      setScanStatus('error')
    }
  }

  // Use scan results
  const useScanResults = () => {
    if (!scanResults) return
    setFormCategory('misc')
    setFormDescription(scanResults.description)
    setFormAmount(scanResults.amount)
    setFormDate(scanResults.date)
    setFormNotes('')
    setShowScanModal(false)
    setShowAddModal(true)
  }

  // Delete expense
  const deleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id)
    saveExpenses(updated)
    showToast('Expense deleted')
  }

  // Submit expense
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formDescription.trim() || !formAmount) return

    const newExpense: Expense = {
      id: generateId(),
      category: formCategory as Expense['category'],
      description: formDescription.trim(),
      amount: parseFloat(parseFloat(formAmount).toFixed(2)),
      date: formDate,
      notes: formNotes.trim() || undefined,
    }

    const updated = [...expenses, newExpense]
    saveExpenses(updated)
    setShowAddModal(false)
    setFormCategory('fuel')
    setFormDescription('')
    setFormAmount('')
    setFormDate(getToday())
    setFormNotes('')
    showToast('Expense added!')
  }

  // Export CSV
  const exportCSV = () => {
    const headers = 'Date,Category,Description,Amount,Notes\n'
    const rows = expenses
      .map(e => `"${e.date}","${e.category}","${e.description.replace(/"/g, '""')}",${e.amount},"${e.notes || ''}"`)
      .join('\n')
    const csv = headers + rows
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${getToday()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('CSV exported!')
  }

  // FAB position: since max-width 480px is centered, right = calc(50% - 240px + 16px)
  // On desktop, the container is centered with left: 50%, transform: translateX(-50%)
  // So right edge of the content area is at: 50% + 240px
  // We want the FAB 16px from the right edge of the content area
  // FAB right = (50% + 240px) + (480px - 240px - 16px) from right... actually simpler:
  // The content is max-width 480px and centered, so its right edge is at 50% + 240px from left
  // But in CSS, we position from the right... the content center is at 50%
  // The right edge of content is at 50% + 240px
  // FAB should be 16px from that edge, so right = (100% - (50% + 240px)) + 16px = 50% - 240px + 16px
  // So right = calc(50% - 240px + 16px)
  // But on mobile (full width), we want it 16px from right edge, so:
  // right = max(1rem, calc(50% - 240px + 16px))

  return (
    <>
      {/* Page Header */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid #1f1f2e',
      }}>
        <a href="/dashboard/more" style={{
          color: '#8888a0',
          fontSize: '0.85rem',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '0.5rem',
        }}>← Back to More</a>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>🧾 Expense Tracker</h1>
        <p style={{ color: '#8888a0', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Log daily tour expenses</p>
      </div>

      {/* Day Selector */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        overflowX: 'auto',
        borderBottom: '1px solid #1f1f2e',
        scrollbarWidth: 'none',
      }}>
        <button
          onClick={() => setSelectedDate('all')}
          style={{
            fontSize: '0.65rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '100px',
            border: '1px solid',
            borderColor: selectedDate === 'all' ? '#d90429' : '#1f1f2e',
            background: selectedDate === 'all' ? '#d90429' : '#181822',
            color: selectedDate === 'all' ? 'white' : '#8888a0',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          All Days
        </button>
        {uniqueDates.map(date => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            style={{
              fontSize: '0.65rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '100px',
              border: '1px solid',
              borderColor: selectedDate === date ? '#d90429' : '#1f1f2e',
              background: selectedDate === date ? '#d90429' : '#181822',
              color: selectedDate === date ? 'white' : '#8888a0',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {formatDateShort(date)}
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #1f1f2e',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: '#8888a0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Today</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', fontWeight: 700, color: '#d90429' }}>
            ${todayTotal.toFixed(2)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: '#8888a0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Tour Total</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', fontWeight: 700, color: '#22d3ee' }}>
            ${tourTotal.toFixed(2)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: '#8888a0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Entries</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', fontWeight: 700, color: '#8888a0' }}>
            {expenses.length}
          </div>
        </div>
      </div>

      {/* Quick Add Bar */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #1f1f2e',
      }}>
        <button
          onClick={openScanModal}
          style={{
            flex: 1,
            padding: '0.6rem 0.15rem',
            background: '#181822',
            border: '1px solid #22d3ee',
            borderRadius: '8px',
            color: '#22d3ee',
            fontSize: '0.55rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem',
          }}
        >
          <span>📷</span>
          <span>Scan</span>
        </button>
        <button onClick={() => quickAdd('fuel', 'Gas', 60)} style={{ flex: 1, padding: '0.6rem 0.15rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: '8px', color: '#8888a0', fontSize: '0.55rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
          <span>⛽</span>
          <span>Fuel</span>
        </button>
        <button onClick={() => quickAdd('food', 'Meal', 15)} style={{ flex: 1, padding: '0.6rem 0.15rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: '8px', color: '#8888a0', fontSize: '0.55rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
          <span>🍔</span>
          <span>Food</span>
        </button>
        <button onClick={() => quickAdd('lodging', 'Hotel', 120)} style={{ flex: 1, padding: '0.6rem 0.15rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: '8px', color: '#8888a0', fontSize: '0.55rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
          <span>🏨</span>
          <span>Hotel</span>
        </button>
        <button onClick={() => quickAdd('misc', 'Misc', 10)} style={{ flex: 1, padding: '0.6rem 0.15rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: '8px', color: '#8888a0', fontSize: '0.55rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
          <span>📦</span>
          <span>Misc</span>
        </button>
      </div>

      {/* Expense List */}
      <div style={{ paddingBottom: '7rem' }}>
        {expenses.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <p style={{ color: '#f0f0f5', fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem' }}>No expenses logged yet</p>
            <p style={{ color: '#8888a0', fontSize: '0.85rem', margin: 0 }}>Tap + to add your first expense</p>
          </div>
        ) : (
          Object.entries(groupedExpenses).map(([date, dayExpenses]) => {
            const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0)
            return (
              <div key={date}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.25rem 0.5rem',
                }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#8888a0',
                  }}>
                    {formatDate(date)}
                  </span>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem',
                    color: '#d90429',
                  }}>
                    ${dayTotal.toFixed(2)}
                  </span>
                </div>
                {dayExpenses.map(expense => (
                  <div
                    key={expense.id}
                    style={{
                      margin: '0.4rem 1rem',
                      background: '#101018',
                      border: '1px solid #1f1f2e',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      position: 'relative',
                    }}
                  >
                    {expense.hasReceipt && (
                      <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'rgba(34, 211, 238, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                      }}>
                        🧾
                      </div>
                    )}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      background: '#181822',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}>
                      {CATEGORY_EMOJI[expense.category]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.15rem' }}>{expense.description}</div>
                      <div style={{ fontSize: '0.7rem', color: '#8888a0' }}>{formatDateShort(expense.date)}</div>
                    </div>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#d90429',
                    }}>
                      ${expense.amount.toFixed(2)}
                    </div>
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: expense.hasReceipt ? '2rem' : '0.5rem',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'rgba(217, 4, 41, 0.1)',
                        border: 'none',
                        color: '#d90429',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>

      {/* Export Bar */}
      <div style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        padding: '0.75rem 1rem',
        borderTop: '1px solid #1f1f2e',
        background: '#07070c',
        display: 'flex',
        gap: '0.5rem',
      }}>
        <button
          onClick={exportCSV}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: '#181822',
            border: '1px solid #1f1f2e',
            borderRadius: '8px',
            color: '#f0f0f5',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Export CSV
        </button>
        <a
          href="/dashboard/budget"
          style={{
            flex: 1,
            padding: '0.75rem',
            background: '#181822',
            border: '1px solid #1f1f2e',
            borderRadius: '8px',
            color: '#f0f0f5',
            fontSize: '0.8rem',
            textAlign: 'center',
            textDecoration: 'none',
          }}
        >
          View Budget
        </a>
      </div>

      {/* FAB Button */}
      <button
        onClick={() => {
          setFormCategory('fuel')
          setFormDescription('')
          setFormAmount('')
          setFormDate(getToday())
          setFormNotes('')
          setShowAddModal(true)
        }}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: 'max(1rem, calc(50% - 240px + 16px))',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#d90429',
          color: 'white',
          fontSize: '1.5rem',
          border: 'none',
          cursor: 'pointer',
          zIndex: 50,
          boxShadow: '0 4px 20px rgba(217, 4, 41, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        +
      </button>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#181822',
          border: '1px solid #22c55e',
          color: '#22c55e',
          padding: '0.75rem 1.5rem',
          borderRadius: '10px',
          fontSize: '0.85rem',
          fontWeight: 600,
          zIndex: 200,
        }}>
          {toast}
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false) }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div style={{
            background: '#101018',
            border: '1px solid #1f1f2e',
            borderRadius: '16px',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{
              width: '36px',
              height: '4px',
              background: '#8888a0',
              borderRadius: '2px',
              margin: '0 auto 1.5rem',
            }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.25rem' }}>Add Expense</h2>
            <form onSubmit={handleSubmit}>
              {/* Category Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setFormCategory(cat.key)}
                    style={{
                      padding: '0.75rem 0.25rem',
                      background: formCategory === cat.key ? 'rgba(217, 4, 41, 0.1)' : '#181822',
                      border: '1px solid',
                      borderColor: formCategory === cat.key ? '#d90429' : '#1f1f2e',
                      borderRadius: '8px',
                      color: formCategory === cat.key ? '#d90429' : '#8888a0',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
              {/* Description */}
              <div style={{ marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Gas fill-up"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    background: '#181822',
                    border: '1px solid #1f1f2e',
                    borderRadius: '8px',
                    color: '#f0f0f5',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              {/* Amount + Date Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginBottom: '0.75rem',
              }}>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  required
                  style={{
                    padding: '0.875rem 1rem',
                    background: '#181822',
                    border: '1px solid #1f1f2e',
                    borderRadius: '8px',
                    color: '#f0f0f5',
                    fontSize: '0.9rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                  }}
                />
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  style={{
                    padding: '0.875rem 1rem',
                    background: '#181822',
                    border: '1px solid #1f1f2e',
                    borderRadius: '8px',
                    color: '#f0f0f5',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              {/* Notes */}
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Optional notes"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    background: '#181822',
                    border: '1px solid #1f1f2e',
                    borderRadius: '8px',
                    color: '#f0f0f5',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              {/* Submit */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: '#d90429',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Add Expense
              </button>
              {/* Cancel */}
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  marginTop: '0.5rem',
                  background: '#181822',
                  border: '1px solid #1f1f2e',
                  borderRadius: '10px',
                  color: '#f0f0f5',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Scan Receipt Modal */}
      {showScanModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowScanModal(false) }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div style={{
            background: '#101018',
            border: '1px solid #1f1f2e',
            borderRadius: '16px',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{
              width: '36px',
              height: '4px',
              background: '#8888a0',
              borderRadius: '2px',
              margin: '0 auto 1.5rem',
            }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.25rem' }}>📷 Scan Receipt</h2>

            {!scanPreview ? (
              <div
                onClick={() => scanFileInputRef.current?.click()}
                style={{
                  border: '2px dashed #1f1f2e',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📸</div>
                <div style={{ color: '#22d3ee', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Tap to capture or upload</div>
                <div style={{ color: '#8888a0', fontSize: '0.7rem' }}>Take a photo of your receipt</div>
              </div>
            ) : (
              <div style={{ marginBottom: '1rem' }}>
                <img
                  src={scanPreview}
                  alt="Receipt preview"
                  style={{
                    width: '100%',
                    maxHeight: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                  }}
                />
                {/* Status bar */}
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: scanStatus === 'scanning' ? '#22d3ee' : scanStatus === 'success' ? '#22c55e' : scanStatus === 'error' ? '#d90429' : '#1f1f2e',
                  color: scanStatus === 'scanning' ? '#22d3ee' : scanStatus === 'success' ? '#22c55e' : scanStatus === 'error' ? '#d90429' : '#8888a0',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}>
                  {scanStatus === 'scanning' && (
                    <span>Scanning... ⏳</span>
                  )}
                  {scanStatus === 'success' && (
                    <span>Scan complete! ✓</span>
                  )}
                  {scanStatus === 'error' && (
                    <span>Scan failed. Try again.</span>
                  )}
                  {scanStatus === 'idle' && (
                    <span>Processing image...</span>
                  )}
                </div>
                {scanStatus === 'success' && scanResults && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#8888a0', marginBottom: '0.5rem' }}>
                      Detected: {scanResults.description || 'Unknown'} — ${scanResults.amount || '0.00'}
                    </div>
                    <button
                      onClick={useScanResults}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        background: '#22c55e',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Use This Scan
                    </button>
                  </div>
                )}
              </div>
            )}

            <input
              ref={scanFileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleScanFile}
              style={{ display: 'none' }}
            />

            <button
              onClick={() => setShowScanModal(false)}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: '#181822',
                border: '1px solid #1f1f2e',
                borderRadius: '10px',
                color: '#f0f0f5',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}