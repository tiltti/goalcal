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

interface SettingsViewProps {
  config: CalendarConfig
  onSave: (updates: { name?: string; goals?: Goal[]; trackables?: Trackable[]; colorThreshold?: ColorThreshold }) => Promise<void>
  onLogout: () => void
}

const MIN_GOALS = 2

export function SettingsView({ config, onSave, onLogout }: SettingsViewProps) {
  const [name, setName] = useState(config.name)
  const [goals, setGoals] = useState<Goal[]>(config.goals)
  const [trackables, setTrackables] = useState<Trackable[]>(config.trackables || [])
  const [greenThreshold, setGreenThreshold] = useState(config.colorThreshold.green)
  const [yellowThreshold, setYellowThreshold] = useState(config.colorThreshold.yellow)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Update state when config changes
  useEffect(() => {
    setName(config.name)
    setGoals(config.goals)
    setTrackables(config.trackables || [])
    setGreenThreshold(config.colorThreshold.green)
    setYellowThreshold(config.colorThreshold.yellow)
  }, [config])

  // Auto-adjust thresholds when goals count or green changes
  useEffect(() => {
    if (greenThreshold > goals.length) {
      setGreenThreshold(goals.length)
    }
    if (greenThreshold < 1) {
      setGreenThreshold(1)
    }
  }, [goals.length, greenThreshold])

  useEffect(() => {
    const maxYellow = greenThreshold - 1
    if (yellowThreshold > maxYellow) {
      setYellowThreshold(Math.max(0, maxYellow))
    }
  }, [greenThreshold, yellowThreshold])

  const yellowPossible = greenThreshold > 1

  const handleAddGoal = () => {
    if (goals.length >= 10) return
    const newId = `g${Date.now()}`
    setGoals([...goals, { id: newId, name: '' }])
  }

  const handleRemoveGoal = (id: string) => {
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
    const validGoals = goals.filter((g) => g.name.trim())
    if (validGoals.length < MIN_GOALS) return

    const validTrackables = trackables.filter((t) => t.name.trim())

    const finalGreen = Math.max(1, Math.min(greenThreshold, validGoals.length))
    const finalYellow = finalGreen > 1
      ? Math.max(1, Math.min(yellowThreshold, finalGreen - 1))
      : 0

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
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 space-y-6 pb-8">
      {/* Name */}
      <section>
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
          Kalenteri
        </h3>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <label className="block text-sm text-zinc-400 mb-2">Nimi</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </section>

      {/* Goals */}
      <section>
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
          Tavoitteet ({goals.length}/10)
        </h3>
        <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
          {goals.map((goal, index) => (
            <div key={goal.id} className="flex gap-2">
              <input
                type="text"
                value={goal.name}
                onChange={(e) => handleGoalNameChange(goal.id, e.target.value)}
                placeholder={`Tavoite ${index + 1}`}
                className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
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
          {goals.length < 10 && (
            <button
              onClick={handleAddGoal}
              className="w-full py-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors border border-dashed border-zinc-700 rounded-lg"
            >
              + Lisää tavoite
            </button>
          )}
        </div>
      </section>

      {/* Trackables */}
      <section>
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
          Seurattavat ({trackables.length}/10)
        </h3>
        <p className="text-xs text-zinc-500 mb-3">
          Asioita joita haluat kirjata, mutta jotka eivät vaikuta päivän väriin.
        </p>
        <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
          {trackables.map((trackable, index) => (
            <div key={trackable.id} className="flex gap-2 items-center">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${trackable.type === 'boolean' ? 'bg-blue-500' : 'bg-purple-500'}`} />
              <input
                type="text"
                value={trackable.name}
                onChange={(e) => handleTrackableNameChange(trackable.id, e.target.value)}
                placeholder={`Seurattava ${index + 1}`}
                className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
              {trackable.type === 'number' && (
                <input
                  type="text"
                  value={trackable.unit || ''}
                  onChange={(e) => handleTrackableUnitChange(trackable.id, e.target.value)}
                  placeholder="yksikkö"
                  className="w-20 px-2 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              )}
              <button
                onClick={() => handleRemoveTrackable(trackable.id)}
                className="px-3 py-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {trackables.length < 10 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleAddTrackable('boolean')}
                className="flex-1 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors border border-dashed border-zinc-700 rounded-lg"
              >
                + Kyllä/Ei
              </button>
              <button
                onClick={() => handleAddTrackable('number')}
                className="flex-1 py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors border border-dashed border-zinc-700 rounded-lg"
              >
                + Numero
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Color thresholds */}
      <section>
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
          Värirajat
        </h3>
        <div className="space-y-3">
          {/* Green threshold */}
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500" />
                <span className="text-zinc-300">Vihreä</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setGreenThreshold(Math.max(1, greenThreshold - 1))}
                  disabled={greenThreshold <= 1}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-600 transition-colors text-xl font-medium"
                >
                  −
                </button>
                <span className="w-16 text-center text-white font-medium text-lg">
                  {greenThreshold}/{goals.length}
                </span>
                <button
                  type="button"
                  onClick={() => setGreenThreshold(Math.min(goals.length, greenThreshold + 1))}
                  disabled={greenThreshold >= goals.length}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-600 transition-colors text-xl font-medium"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Yellow threshold */}
          <div className={`bg-zinc-800/50 rounded-lg p-4 ${!yellowPossible ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${yellowPossible ? 'bg-yellow-500' : 'bg-zinc-600'}`} />
                <span className="text-zinc-300">Keltainen</span>
              </div>
              {yellowPossible ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setYellowThreshold(Math.max(1, yellowThreshold - 1))}
                    disabled={yellowThreshold <= 1}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-600 transition-colors text-xl font-medium"
                  >
                    −
                  </button>
                  <span className="w-16 text-center text-white font-medium text-lg">
                    {yellowThreshold}/{goals.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setYellowThreshold(Math.min(greenThreshold - 1, yellowThreshold + 1))}
                    disabled={yellowThreshold >= greenThreshold - 1}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-600 transition-colors text-xl font-medium"
                  >
                    +
                  </button>
                </div>
              ) : (
                <span className="text-zinc-500 text-sm">Ei käytössä</span>
              )}
            </div>
          </div>

          {/* Red explanation */}
          <div className="flex items-center gap-2 px-4 text-sm text-zinc-500">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span>
              Punainen: {yellowPossible ? `alle ${yellowThreshold} tavoitetta` : 'alle vihreän rajan'}
            </span>
          </div>
        </div>
      </section>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-4 text-lg font-medium rounded-xl transition-colors ${
          saved
            ? 'bg-emerald-600 text-white'
            : 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white'
        }`}
      >
        {saving ? 'Tallennetaan...' : saved ? 'Tallennettu!' : 'Tallenna'}
      </button>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full py-4 text-lg font-medium text-red-400 hover:text-red-300 transition-colors border border-zinc-700 rounded-xl"
      >
        Kirjaudu ulos
      </button>
    </div>
  )
}
