'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Task {
  id: number
  title: string
  assignee: string
  priority: string
  due: string
  status: string
  notes: string
}

export default function CrewPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showModal, setShowModal] = useState(false)

  const SAMPLE_TASKS: Task[] = [
    { id: 1, title: 'Confirm load-in time with venue', assignee: 'Phil (TM)', priority: 'high', due: 'today', status: 'todo', notes: 'Call Masquerade production office before noon' },
    { id: 2, title: 'Send hospitality rider to promoter', assignee: 'Phil (TM)', priority: 'high', due: 'today', status: 'todo', notes: 'Email updated rider with water/food requests' },
    { id: 3, title: 'Confirm parking for trailer', assignee: 'Driver', priority: 'medium', due: 'showday', status: 'todo', notes: 'Need confirmed spot for 53ft trailer' },
    { id: 4, title: 'Set up merch table layout', assignee: 'Merch', priority: 'medium', due: 'showday', status: 'todo', notes: 'Check inventory counts before doors' },
    { id: 5, title: 'Soundcheck schedule confirmed', assignee: 'Phil (TM)', priority: 'low', due: 'done', status: 'done', notes: '4pm for support, 6pm for headliner' },
    { id: 6, title: 'Hotel rooms booked for crew', assignee: 'Phil (TM)', priority: 'low', due: 'done', status: 'done', notes: 'Marriott Downtown, 4 rooms, checkout 2pm' },
    { id: 7, title: 'Advance packet sent to venue', assignee: 'Phil (TM)', priority: 'high', due: 'done', status: 'done', notes: 'Contract, rider, stage plot, input list all sent' },
  ]

  useEffect(() => {
    const stored = localStorage.getItem('tourhq_tasks')
    if (stored) {
      try { setTasks(JSON.parse(stored)) } catch { setTasks(SAMPLE_TASKS) }
    } else {
      setTasks(SAMPLE_TASKS)
      localStorage.setItem('tourhq_tasks', JSON.stringify(SAMPLE_TASKS))
    }
  }, [])

  function toggleTask(id: number) {
    const updated = tasks.map(t => t.id === id ? { ...t, status: t.status === 'todo' ? 'done' : 'todo' } : t)
    setTasks(updated)
    localStorage.setItem('tourhq_tasks', JSON.stringify(updated))
  }

  function addTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const newTask: Task = {
      id: Date.now(),
      title: formData.get('title') as string,
      assignee: formData.get('assignee') as string || 'Unassigned',
      priority: formData.get('priority') as string,
      due: formData.get('due') as string,
      status: 'todo',
      notes: formData.get('notes') as string,
    }
    const updated = [...tasks, newTask]
    setTasks(updated)
    localStorage.setItem('tourhq_tasks', JSON.stringify(updated))
    setShowModal(false)
    form.reset()
  }

  const todoTasks = tasks.filter(t => t.status === 'todo')
  const doneTasks = tasks.filter(t => t.status === 'done')

  const dueLabels: Record<string, string> = { today: 'Today', tomorrow: 'Tomorrow', showday: 'Show Day', flexible: 'Flexible' }

  function renderTaskCard(task: Task) {
    return (
      <div
        key={task.id}
        onClick={() => toggleTask(task.id)}
        style={{
          background: '#101018', border: '1px solid #1f1f2e', borderRadius: 10,
          padding: '0.75rem', marginBottom: '0.5rem', cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>{task.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#8888a0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{
              width: 18, height: 18, background: '#181822', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.55rem', fontWeight: 700, border: '1px solid #1f1f2e',
            }}>
              {task.assignee ? task.assignee.charAt(0) : '?'}
            </div>
            {task.assignee || 'Unassigned'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{dueLabels[task.due] || task.due}</span>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: task.priority === 'high' ? '#d90429' : task.priority === 'medium' ? '#f59e0b' : '#22c55e',
            }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background: '#101018', borderBottom: '1px solid #1f1f2e', padding: '0.75rem 1.25rem' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Crew Board</div>
        <div style={{ fontSize: '0.75rem', color: '#8888a0', marginTop: 2 }}>Tasks and coordination for your crew</div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', padding: '0.75rem 1rem', borderBottom: '1px solid #1f1f2e' }}>
        {[
          { num: tasks.length, label: 'Total Tasks', color: '#22d3ee' },
          { num: todoTasks.length, label: 'Pending', color: '#f59e0b' },
          { num: doneTasks.length, label: 'Done', color: '#22c55e' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#181822', borderRadius: 10, padding: '0.75rem 0.5rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.2rem', fontWeight: 700, color: stat.color }}>{stat.num}</div>
            <div style={{ fontSize: '0.6rem', color: '#8888a0', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Task Board - 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.75rem 1rem' }}>
        {/* To Do Column */}
        <div style={{ background: '#181822', borderRadius: 12, padding: '0.75rem', minHeight: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #1f1f2e' }}>
            <span style={{ fontSize: '1rem' }}>📋</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8888a0' }}>To Do</span>
            <span style={{ marginLeft: 'auto', background: '#101018', borderRadius: 100, padding: '0.15rem 0.5rem', fontSize: '0.65rem', fontWeight: 600, color: '#555570' }}>
              {todoTasks.length}
            </span>
          </div>
          {todoTasks.map(t => renderTaskCard(t))}
          <button
            onClick={() => setShowModal(true)}
            style={{
              width: '100%', padding: '0.5rem', background: 'none',
              border: '1px dashed #1f1f2e', borderRadius: 8,
              color: '#555570', fontSize: '0.75rem', cursor: 'pointer', marginTop: '0.5rem',
            }}>
            + Add Task
          </button>
        </div>

        {/* Done Column */}
        <div style={{ background: '#181822', borderRadius: 12, padding: '0.75rem', minHeight: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #1f1f2e' }}>
            <span style={{ fontSize: '1rem' }}>✅</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8888a0' }}>Done</span>
            <span style={{ marginLeft: 'auto', background: '#101018', borderRadius: 100, padding: '0.15rem 0.5rem', fontSize: '0.65rem', fontWeight: 600, color: '#555570' }}>
              {doneTasks.length}
            </span>
          </div>
          {doneTasks.map(t => renderTaskCard(t))}
          {doneTasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#555570', fontSize: '0.8rem' }}>No completed tasks</div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showModal && (
        <div
          style={{
            display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', zIndex: 1000, alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{
            background: '#101018', border: '1px solid #1f1f2e',
            borderRadius: '20px 20px 0 0', padding: '1.5rem',
            width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto',
          }}>
            <div style={{ width: 36, height: 4, background: '#555570', borderRadius: 2, margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Add Task</h2>
            <form onSubmit={addTask}>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#8888a0', marginBottom: '0.4rem' }}>Task Title *</label>
                <input name="title" type="text" required placeholder="e.g., Confirm load-in time" style={{ width: '100%', padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#8888a0', marginBottom: '0.4rem' }}>Assigned To</label>
                <input name="assignee" type="text" placeholder="e.g., Phil (TM)" style={{ width: '100%', padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.875rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#8888a0', marginBottom: '0.4rem' }}>Priority</label>
                  <select name="priority" style={{ width: '100%', padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }}>
                    <option value="high">High</option>
                    <option value="medium" selected>Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#8888a0', marginBottom: '0.4rem' }}>Due</label>
                  <select name="due" style={{ width: '100%', padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.95rem', outline: 'none' }}>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="showday">Show Day</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#8888a0', marginBottom: '0.4rem' }}>Notes</label>
                <textarea name="notes" rows={2} placeholder="Additional details..." style={{ width: '100%', padding: '0.75rem', background: '#181822', border: '1px solid #1f1f2e', borderRadius: 10, color: '#f0f0f5', fontSize: '0.85rem', outline: 'none', resize: 'vertical' }} />
              </div>
              <button type="submit" style={{ width: '100%', padding: '0.875rem', background: '#d90429', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>
                Add Task
              </button>
              <button type="button" onClick={() => setShowModal(false)} style={{ width: '100%', padding: '0.875rem', background: '#181822', color: '#f0f0f5', border: '1px solid #1f1f2e', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' }}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}