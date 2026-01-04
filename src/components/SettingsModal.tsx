'use client'

import { useState, useEffect } from 'react'
import { Goal, Trackable, ColorThreshold } from '@/lib/types'

interface CalendarConfig {
  calendarId: string
  name: string
  goals: Goal[]
  trackables: Trackable[]
  colorThreshold: ColorThreshold
  year: number
}

interface SettingsModalProps {
  config: CalendarConfig
  onSave: (updates: { name?: string; goals?: Goal[]; trackables?: Trackable[]; colorThreshold?: ColorThreshold }) => void
  onClose: () => void
}

const MIN_GOALS = 2

export function SettingsModal({ config, onSave, onClose }: SettingsModalProps) {
  const [name, setName] = useState(config.name)
  const [goals, setGoals] = useState<Goal[]>(config.goals)
  const [trackables, setTrackables] = useState<Trackable[]>(config.trackables || [])
  const [greenThreshold, setGreenThreshold] = useState(config.colorThreshold.green)
  const [yellowThreshold, setYellowThreshold] = useState(config.colorThreshold.yellow)
  const [saving, setSaving] = useState(false)

  // Auto-adjust thresholds when goals count or green changes
  useEffect(() => {
    // Green can't exceed goal count
    if (greenThreshold > goals.length) {
      setGreenThreshold(goals.length)
    }
    // Green must be at least 1
    if (greenThreshold < 1) {
      setGreenThreshold(1)
    }
  }, [goals.length, greenThreshold])

  useEffect(() => {
    // Yellow must be less than green
    // If green = 1, yellow must be 0 (no yellow zone possible)
    const maxYellow = greenThreshold - 1
    if (yellowThreshold > maxYellow) {
      setYellowThreshold(Math.max(0, maxYellow))
    }
  }, [greenThreshold, yellowThreshold])

  // Whether yellow zone is possible (green must be > 1)
  const yellowPossible = greenThreshold > 1

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

  const handleAddGoal = () => {
    if (goals.length >= 10) return
    const newId = `g${Date.now()}`
    setGoals([...goals, { id: newId, name: '' }])
  }

  const handleRemoveGoal = (id: string) => {
    // Minimum 2 goals required
    if (goals.length <= MIN_GOALS) return
    setGoals(goals.filter((g) => g.id !== id))
  }

  const handleGoalNameChange = (id: string, newName: string) => {
    setGoals(goals.map((g) => (g.id === id ? { ...g, name: newName } : g)))
  }

  // Trackable handlers
  const handleAddTrackable = (type: 'boolean' | 'number') => {
    if (trackables.length >= 10) return
    const newId = `t${Date.now()}`
    setTrackables([...trackables, { id: newId, name: '', type }])
  }

  const handleRemoveTrackable = (id: string) => {
    setTrackables(trackables.filter((t) => t.id !== id))
  }

  const handleTrackableNameChange = (id: string, newName: string) => {
    setTrackables(trackables.map((t) => (t.id === id ? { ...t, name: newName } : t)))
  }

  const handleTrackableUnitChange = (id: string, unit: string) => {
    setTrackables(trackables.map((t) => (t.id === id ? { ...t, unit } : t)))
  }

  const handleSave = async () => {
    // Validate: need at least MIN_GOALS with names
    const validGoals = goals.filter((g) => g.name.trim())
    if (validGoals.length < MIN_GOALS) return

    const validTrackables = trackables.filter((t) => t.name.trim())

    // Ensure thresholds are valid
    const finalGreen = Math.max(1, Math.min(greenThreshold, validGoals.length))
    const finalYellow = finalGreen > 1
      ? Math.max(1, Math.min(yellowThreshold, finalGreen - 1))
      : 0 // No yellow zone when green = 1

    setSaving(true)
    await onSave({
      name: name.trim() || config.name,
      goals: validGoals,
      trackables: validTrackables,
      colorThreshold: {
        green: finalGreen,
        yellow: finalYellow
      }
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-white mb-4">Asetukset</h2>

        {/* Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Kalenterin nimi
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Goals */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Tavoitteet ({goals.length}/10, min {MIN_GOALS})
          </label>
          <div className="space-y-2">
            {goals.map((goal, index) => (
              <div key={goal.id} className="flex gap-2">
                <input
                  type="text"
                  value={goal.name}
                  onChange={(e) => handleGoalNameChange(goal.id, e.target.value)}
                  placeholder={`Tavoite ${index + 1}`}
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
                {goals.length > MIN_GOALS && (
                  <button
                    onClick={() => handleRemoveGoal(goal.id)}
                    className="px-3 py-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          {goals.length < 10 && (
            <button
              onClick={handleAddGoal}
              className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              + Lisää tavoite
            </button>
          )}
        </div>

        {/* Trackables */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Seurattavat ({trackables.length}/10)
          </label>
          <p className="text-xs text-zinc-500 mb-2">
            Eivät vaikuta päivän väriin.
          </p>
          <div className="space-y-2">
            {trackables.map((trackable, index) => (
              <div key={trackable.id} className="flex gap-2 items-center">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${trackable.type === 'boolean' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                <input
                  type="text"
                  value={trackable.name}
                  onChange={(e) => handleTrackableNameChange(trackable.id, e.target.value)}
                  placeholder={`Seurattava ${index + 1}`}
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                {trackable.type === 'number' && (
                  <input
                    type="text"
                    value={trackable.unit || ''}
                    onChange={(e) => handleTrackableUnitChange(trackable.id, e.target.value)}
                    placeholder="yks."
                    className="w-16 px-2 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                )}
                <button
                  onClick={() => handleRemoveTrackable(trackable.id)}
                  className="px-2 py-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          {trackables.length < 10 && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleAddTrackable('boolean')}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                + Kyllä/Ei
              </button>
              <span className="text-zinc-600">|</span>
              <button
                onClick={() => handleAddTrackable('number')}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                + Numero
              </button>
            </div>
          )}
        </div>

        {/* Color thresholds */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            Värirajat
          </label>
          <div className="space-y-4">
            {/* Green threshold */}
            <div className="flex items-center justify-between bg-zinc-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500" />
                <span className="text-zinc-300 text-sm">Vihreä</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGreenThreshold(Math.max(1, greenThreshold - 1))}
                  disabled={greenThreshold <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-600 transition-colors text-lg font-medium"
                >
                  −
                </button>
                <span className="w-16 text-center text-white font-medium">
                  {greenThreshold}/{goals.length}
                </span>
                <button
                  type="button"
                  onClick={() => setGreenThreshold(Math.min(goals.length, greenThreshold + 1))}
                  disabled={greenThreshold >= goals.length}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-600 transition-colors text-lg font-medium"
                >
                  +
                </button>
              </div>
            </div>

            {/* Yellow threshold */}
            <div className={`flex items-center justify-between bg-zinc-800 rounded-lg p-3 ${!yellowPossible ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${yellowPossible ? 'bg-yellow-500' : 'bg-zinc-600'}`} />
                <span className="text-zinc-300 text-sm">Keltainen</span>
              </div>
              {yellowPossible ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setYellowThreshold(Math.max(1, yellowThreshold - 1))}
                    disabled={yellowThreshold <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-600 transition-colors text-lg font-medium"
                  >
                    −
                  </button>
                  <span className="w-16 text-center text-white font-medium">
                    {yellowThreshold}/{goals.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setYellowThreshold(Math.min(greenThreshold - 1, yellowThreshold + 1))}
                    disabled={yellowThreshold >= greenThreshold - 1}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-600 transition-colors text-lg font-medium"
                  >
                    +
                  </button>
                </div>
              ) : (
                <span className="text-zinc-500 text-sm">Ei käytössä</span>
              )}
            </div>

            {/* Red explanation */}
            <div className="flex items-center gap-2 px-3">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-zinc-500 text-sm">
                Punainen: {yellowPossible ? `alle ${yellowThreshold} tavoitetta` : 'alle vihreän rajan'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Peruuta
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white rounded-md transition-colors font-medium"
          >
            {saving ? 'Tallennetaan...' : 'Tallenna'}
          </button>
        </div>
      </div>
    </div>
  )
}
