'use client'

import { useState, useEffect } from 'react'
import { DayEntry, Goal, Trackable, ColorThreshold, formatDateFi, getGoalStatus } from '@/lib/types'

interface DayModalProps {
  date: Date
  entry: DayEntry | null
  goals: Goal[]
  trackables?: Trackable[]
  threshold: ColorThreshold
  onSave: (goals: Record<string, boolean>, trackables?: Record<string, boolean | number>, notes?: string, isSick?: boolean) => void
  onClose: () => void
}

export function DayModal({ date, entry, goals, trackables = [], threshold, onSave, onClose }: DayModalProps) {
  const [goalStates, setGoalStates] = useState<Record<string, boolean>>({})
  const [trackableStates, setTrackableStates] = useState<Record<string, boolean | number>>({})
  const [notes, setNotes] = useState('')
  const [isSick, setIsSick] = useState(false)

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

    // Initialize trackables
    const initialTrackables: Record<string, boolean | number> = {}
    trackables.forEach((t) => {
      const existingValue = entry?.trackables?.[t.id]
      initialTrackables[t.id] = existingValue ?? (t.type === 'boolean' ? false : 0)
    })
    setTrackableStates(initialTrackables)

    // Initialize notes
    setNotes(entry?.notes || '')

    // Initialize sick day
    setIsSick(entry?.isSick || false)
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
    const trimmedNotes = notes.trim()
    onSave(
      goalStates,
      trackables.length > 0 ? trackableStates : undefined,
      trimmedNotes || undefined,
      isSick || undefined
    )
    onClose()
  }

  const completedCount = Object.values(goalStates).filter(Boolean).length
  const mockEntry = { calendarId: '', date: '', goals: goalStates, isSick, updatedAt: '' }
  const status = getGoalStatus(mockEntry, threshold)

  const statusLabel = isSick ? 'Sairaspäivä' :
    status === 'green' ? 'Vihreä' :
    status === 'yellow' ? 'Keltainen' :
    status === 'red' ? 'Punainen' : ''
  const statusColor = isSick ? 'text-violet-400' :
    status === 'green' ? 'text-emerald-400' :
    status === 'yellow' ? 'text-yellow-400' :
    status === 'red' ? 'text-red-400' : 'text-zinc-400'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-white mb-1">{formatDateFi(date)}</h2>
        <p className="text-zinc-500 text-sm mb-4">
          {isSick ? (
            <span className={statusColor}>Sairaspäivä - tavoitteita ei lasketa</span>
          ) : (
            <>
              {completedCount}/{goals.length} tavoitetta
              {statusLabel && <span className={`ml-2 ${statusColor}`}>({statusLabel})</span>}
            </>
          )}
        </p>

        {/* Sick day toggle */}
        <button
          onClick={() => setIsSick(!isSick)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg mb-4 transition-colors ${
            isSick
              ? 'bg-violet-600/30 border border-violet-500'
              : 'bg-zinc-800/50 border border-transparent hover:bg-zinc-800'
          }`}
        >
          <div
            className={`
              w-6 h-6 rounded-md flex items-center justify-center
              transition-colors flex-shrink-0
              ${isSick ? 'bg-violet-500' : 'bg-zinc-700'}
            `}
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <span className={`text-sm font-medium ${isSick ? 'text-violet-300' : 'text-zinc-300'}`}>
              Sairaspäivä
            </span>
          </div>
        </button>

        {/* Goals */}
        {!isSick && <div className="space-y-3 mb-6">
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
        </div>}

        {/* Trackables */}
        {!isSick && trackables.length > 0 && (
          <div className="border-t border-zinc-700 pt-4 mb-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Seurattavat</p>
            <div className="space-y-3">
              {trackables.map((trackable) => (
                <div key={trackable.id} className="flex items-center gap-3">
                  {trackable.type === 'boolean' ? (
                    <label className="flex items-center gap-3 cursor-pointer group flex-1">
                      <div
                        className={`
                          w-6 h-6 rounded-md border-2 flex items-center justify-center
                          transition-colors
                          ${trackableStates[trackable.id]
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-zinc-600 group-hover:border-zinc-400'
                          }
                        `}
                        onClick={() => handleTrackableToggle(trackable.id)}
                      >
                        {trackableStates[trackable.id] && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${trackableStates[trackable.id] ? 'text-white' : 'text-zinc-400'}`}>
                        {trackable.name}
                      </span>
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="number"
                        value={trackableStates[trackable.id] as number || 0}
                        onChange={(e) => handleTrackableNumber(trackable.id, parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-white text-sm text-center"
                      />
                      <span className="text-sm text-zinc-400">
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

        {/* Notes */}
        <div className="border-t border-zinc-700 pt-4 mb-6">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Muistiinpanot</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Vapaamuotoiset muistiinpanot..."
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500 resize-none"
            rows={3}
          />
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
