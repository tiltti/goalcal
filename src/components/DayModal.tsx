'use client'

import { DayData, formatDateFi } from '@/lib/types'
import { useState, useEffect } from 'react'

interface DayModalProps {
  date: Date
  data: DayData | null
  onSave: (data: Omit<DayData, 'id'>) => void
  onClose: () => void
}

export function DayModal({ date, data, onSave, onClose }: DayModalProps) {
  const [noSubstances, setNoSubstances] = useState(data?.noSubstances ?? false)
  const [exercise, setExercise] = useState(data?.exercise ?? false)
  const [writing, setWriting] = useState(data?.writing ?? false)

  useEffect(() => {
    setNoSubstances(data?.noSubstances ?? false)
    setExercise(data?.exercise ?? false)
    setWriting(data?.writing ?? false)
  }, [data])

  const handleSave = () => {
    onSave({
      date: date.toISOString(),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      noSubstances,
      exercise,
      writing,
    })
    onClose()
  }

  const goals = [
    { key: 'noSubstances', label: 'Ei päihteitä', value: noSubstances, set: setNoSubstances },
    { key: 'exercise', label: 'Liikunta', value: exercise, set: setExercise },
    { key: 'writing', label: 'Kirjoittaminen', value: writing, set: setWriting },
  ]

  const completedCount = [noSubstances, exercise, writing].filter(Boolean).length

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-80 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-white mb-1">{formatDateFi(date)}</h2>
        <p className="text-zinc-500 text-sm mb-4">
          {completedCount}/3 tavoitetta
        </p>

        <div className="space-y-3 mb-6">
          {goals.map((goal) => (
            <label
              key={goal.key}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                className={`
                  w-6 h-6 rounded-md border-2 flex items-center justify-center
                  transition-colors
                  ${goal.value
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-zinc-600 group-hover:border-zinc-400'
                  }
                `}
                onClick={() => goal.set(!goal.value)}
              >
                {goal.value && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${goal.value ? 'text-white' : 'text-zinc-400'}`}>
                {goal.label}
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
