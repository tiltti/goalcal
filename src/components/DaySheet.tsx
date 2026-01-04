'use client'

import { useState, useEffect } from 'react'
import { DayEntry, Goal, Trackable, ColorThreshold, formatDateFi, getGoalStatus } from '@/lib/types'

interface DaySheetProps {
  date: Date
  entry: DayEntry | null
  goals: Goal[]
  trackables?: Trackable[]
  threshold: ColorThreshold
  onSave: (goals: Record<string, boolean>, trackables?: Record<string, boolean | number>) => void
  onClose: () => void
}

export function DaySheet({ date, entry, goals, trackables = [], threshold, onSave, onClose }: DaySheetProps) {
  const [goalStates, setGoalStates] = useState<Record<string, boolean>>({})
  const [trackableStates, setTrackableStates] = useState<Record<string, boolean | number>>({})
  const [isClosing, setIsClosing] = useState(false)

  // Lock body scroll
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

    // Initialize trackables
    const initialTrackables: Record<string, boolean | number> = {}
    trackables.forEach((t) => {
      const existingValue = entry?.trackables?.[t.id]
      initialTrackables[t.id] = existingValue ?? (t.type === 'boolean' ? false : 0)
    })
    setTrackableStates(initialTrackables)
  }, [entry, goals, trackables])

  const handleToggle = (goalId: string) => {
    setGoalStates((prev) => ({
      ...prev,
      [goalId]: !prev[goalId]
    }))
  }

  const handleTrackableToggle = (trackableId: string) => {
    setTrackableStates((prev) => ({
      ...prev,
      [trackableId]: !prev[trackableId]
    }))
  }

  const handleTrackableNumber = (trackableId: string, value: number) => {
    setTrackableStates((prev) => ({
      ...prev,
      [trackableId]: value
    }))
  }

  const handleSave = () => {
    onSave(goalStates, trackables.length > 0 ? trackableStates : undefined)
    handleClose()
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(onClose, 300)
  }

  const completedCount = Object.values(goalStates).filter(Boolean).length
  const status = getGoalStatus({ calendarId: '', date: '', goals: goalStates, updatedAt: '' }, threshold)

  const statusLabel = status === 'green' ? 'Vihreä' : status === 'yellow' ? 'Keltainen' : status === 'red' ? 'Punainen' : ''
  const statusColor = status === 'green' ? 'text-emerald-400' : status === 'yellow' ? 'text-yellow-400' : status === 'red' ? 'text-red-400' : 'text-zinc-400'

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl transition-transform duration-300 ${
          isClosing ? 'translate-y-full' : 'translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        <div className="px-6 pb-safe">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">{formatDateFi(date)}</h2>
            <p className="text-zinc-400 mt-1">
              {completedCount}/{goals.length} tavoitetta
              {statusLabel && <span className={`ml-2 ${statusColor}`}>• {statusLabel}</span>}
            </p>
          </div>

          {/* Goals */}
          <div className="space-y-3 mb-6">
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => handleToggle(goal.id)}
                className="w-full flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl active:bg-zinc-800 transition-colors"
              >
                <div
                  className={`
                    w-7 h-7 rounded-lg border-2 flex items-center justify-center
                    transition-colors flex-shrink-0
                    ${goalStates[goal.id]
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-zinc-600'
                    }
                  `}
                >
                  {goalStates[goal.id] && (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-lg ${goalStates[goal.id] ? 'text-white' : 'text-zinc-400'}`}>
                  {goal.name}
                </span>
              </button>
            ))}
          </div>

          {/* Trackables */}
          {trackables.length > 0 && (
            <div className="border-t border-zinc-700 pt-4 mb-6">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Seurattavat</p>
              <div className="space-y-3">
                {trackables.map((trackable) => (
                  <div key={trackable.id}>
                    {trackable.type === 'boolean' ? (
                      <button
                        onClick={() => handleTrackableToggle(trackable.id)}
                        className="w-full flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl active:bg-zinc-800 transition-colors"
                      >
                        <div
                          className={`
                            w-7 h-7 rounded-lg border-2 flex items-center justify-center
                            transition-colors flex-shrink-0
                            ${trackableStates[trackable.id]
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-zinc-600'
                            }
                          `}
                        >
                          {trackableStates[trackable.id] && (
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-lg ${trackableStates[trackable.id] ? 'text-white' : 'text-zinc-400'}`}>
                          {trackable.name}
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
                        <input
                          type="number"
                          inputMode="decimal"
                          value={trackableStates[trackable.id] as number || 0}
                          onChange={(e) => handleTrackableNumber(trackable.id, parseFloat(e.target.value) || 0)}
                          className="w-20 px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-white text-lg text-center"
                        />
                        <span className="text-lg text-zinc-400">
                          {trackable.name}
                          {trackable.unit && <span className="text-zinc-500 ml-1">({trackable.unit})</span>}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pb-6">
            <button
              onClick={handleClose}
              className="flex-1 py-4 text-lg text-zinc-400 hover:text-white transition-colors"
            >
              Peruuta
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-4 text-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors"
            >
              Tallenna
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
