'use client'

import { useState, useEffect } from 'react'
import { DayEntry, Goal, ColorThreshold, formatDateFi, getGoalStatus } from '@/lib/types'

interface DayModalProps {
  date: Date
  entry: DayEntry | null
  goals: Goal[]
  threshold: ColorThreshold
  onSave: (goals: Record<string, boolean>) => void
  onClose: () => void
}

export function DayModal({ date, entry, goals, threshold, onSave, onClose }: DayModalProps) {
  const [goalStates, setGoalStates] = useState<Record<string, boolean>>({})

  // Lock body scroll when modal is open (iOS compatible)
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  useEffect(() => {
    const initial: Record<string, boolean> = {}
    goals.forEach((g) => {
      initial[g.id] = entry?.goals?.[g.id] ?? false
    })
    setGoalStates(initial)
  }, [entry, goals])

  const handleToggle = (goalId: string) => {
    setGoalStates((prev) => ({
      ...prev,
      [goalId]: !prev[goalId]
    }))
  }

  const handleSave = () => {
    onSave(goalStates)
    onClose()
  }

  const completedCount = Object.values(goalStates).filter(Boolean).length
  const status = getGoalStatus({ calendarId: '', date: '', goals: goalStates, updatedAt: '' }, threshold)

  const statusLabel = status === 'green' ? 'Vihreä' : status === 'yellow' ? 'Keltainen' : status === 'red' ? 'Punainen' : ''
  const statusColor = status === 'green' ? 'text-emerald-400' : status === 'yellow' ? 'text-yellow-400' : status === 'red' ? 'text-red-400' : 'text-zinc-400'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-white mb-1">{formatDateFi(date)}</h2>
        <p className="text-zinc-500 text-sm mb-4">
          {completedCount}/{goals.length} tavoitetta
          {statusLabel && <span className={`ml-2 ${statusColor}`}>({statusLabel})</span>}
        </p>

        <div className="space-y-3 mb-6">
          {goals.map((goal) => (
            <label
              key={goal.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                className={`
                  w-6 h-6 rounded-md border-2 flex items-center justify-center
                  transition-colors
                  ${goalStates[goal.id]
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-zinc-600 group-hover:border-zinc-400'
                  }
                `}
                onClick={() => handleToggle(goal.id)}
              >
                {goalStates[goal.id] && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${goalStates[goal.id] ? 'text-white' : 'text-zinc-400'}`}>
                {goal.name}
              </span>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Peruuta
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-sm bg-white text-black rounded-md hover:bg-zinc-200 transition-colors font-medium"
          >
            Tallenna
          </button>
        </div>
      </div>
    </div>
  )
}
