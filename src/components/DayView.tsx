'use client'

import { useState, useEffect } from 'react'
import { DayEntry, Goal, Trackable, ColorThreshold, formatDateFiWithWeekday, getGoalStatus } from '@/lib/types'

interface DayViewProps {
  date: Date
  entry: DayEntry | null
  goals: Goal[]
  trackables?: Trackable[]
  threshold: ColorThreshold
  onSave: (goals: Record<string, boolean>, trackables?: Record<string, boolean | number>, notes?: string, isSick?: boolean) => void
  onClose: () => void
}

export function DayView({ date, entry, goals, trackables = [], threshold, onSave, onClose }: DayViewProps) {
  const [goalStates, setGoalStates] = useState<Record<string, boolean>>({})
  const [trackableStates, setTrackableStates] = useState<Record<string, boolean | number>>({})
  const [notes, setNotes] = useState('')
  const [isSick, setIsSick] = useState(false)

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

  // Create a mock entry to get status
  const mockEntry: DayEntry = {
    calendarId: '',
    date: '',
    goals: goalStates,
    isSick,
    updatedAt: ''
  }
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
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header with safe area for notch/dynamic island */}
      <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 px-4 py-3 pt-safe z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-white">{formatDateFiWithWeekday(date)}</h1>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
          >
            Tallenna
          </button>
        </div>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="p-4 space-y-6">
          {/* Status summary */}
          <div className="bg-zinc-900/50 rounded-xl p-4">
            <p className="text-zinc-400">
              {isSick ? (
                <span className={statusColor}>Sairaspäivä - tavoitteita ei lasketa</span>
              ) : (
                <>
                  {completedCount}/{goals.length} tavoitetta
                  {statusLabel && <span className={`ml-2 ${statusColor}`}>({statusLabel})</span>}
                </>
              )}
            </p>
          </div>

          {/* Sick day toggle */}
          <section>
            <button
              onClick={() => setIsSick(!isSick)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${
                isSick
                  ? 'bg-violet-600/30 border-2 border-violet-500'
                  : 'bg-zinc-800/50 border-2 border-transparent'
              }`}
            >
              <div
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  transition-colors flex-shrink-0
                  ${isSick ? 'bg-violet-500' : 'bg-zinc-700'}
                `}
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <span className={`text-lg font-medium ${isSick ? 'text-violet-300' : 'text-zinc-300'}`}>
                  Sairaspäivä
                </span>
                <p className="text-sm text-zinc-500">
                  Ei vaikuta tavoitteisiin tai streakiin
                </p>
              </div>
            </button>
          </section>

          {/* Goals */}
          <section>
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
              Tavoitteet {isSick && <span className="text-violet-400 normal-case">(ei lasketa)</span>}
            </h3>
            <div className="space-y-2">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => handleToggle(goal.id)}
                  className={`w-full flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl active:bg-zinc-800 transition-colors ${isSick ? 'opacity-70' : ''}`}
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
          </section>

          {/* Trackables */}
          {trackables.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
                Seurattavat
              </h3>
              <div className="space-y-2">
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
                          className="w-24 px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-white text-lg text-center"
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
            </section>
          )}

          {/* Notes */}
          <section>
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
              Muistiinpanot
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Vapaamuotoiset muistiinpanot..."
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-zinc-600 resize-none min-h-[120px]"
              rows={4}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
