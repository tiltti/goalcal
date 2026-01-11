'use client'

import { forwardRef } from 'react'
import { DayEntry, Goal, ColorThreshold, getGoalStatus, getActiveGoals, GoalStatus } from '@/lib/types'

interface DayCircleProps {
  date: Date
  dateStr: string
  entry: DayEntry | null
  allGoals: Goal[]
  threshold: ColorThreshold
  isToday: boolean
  isFuture: boolean
  onClick: () => void
}

const statusColors: Record<GoalStatus, string> = {
  empty: 'bg-transparent border-zinc-700',
  red: 'bg-red-500/80 border-red-500',
  yellow: 'bg-yellow-500/80 border-yellow-500',
  green: 'bg-emerald-500/80 border-emerald-500',
  sick: 'bg-violet-500/80 border-violet-500',
}

export const DayCircle = forwardRef<HTMLButtonElement, DayCircleProps>(
  function DayCircle({ date, dateStr, entry, allGoals, threshold, isToday, isFuture, onClick }, ref) {
    const status = getGoalStatus(entry, threshold, allGoals, dateStr)
    const dayNum = date.getDate()

    // Check if ALL active goals are completed (perfect day)
    const activeGoals = getActiveGoals(allGoals, dateStr)
    const activeGoalIds = new Set(activeGoals.map(g => g.id))
    const completedCount = entry
      ? Object.entries(entry.goals).filter(([id, done]) => done && activeGoalIds.has(id)).length
      : 0
    const isPerfect = completedCount === activeGoals.length && activeGoals.length > 0

    // Check if entry has notes
    const hasNotes = entry?.notes && entry.notes.trim().length > 0

    // Check if sick day
    const isSick = entry?.isSick === true

    // Future days: disabled
    if (isFuture) {
      return (
        <button
          ref={ref}
          className={`
            w-8 h-8 rounded-full border border-zinc-700
            flex items-center justify-center text-[10px] text-zinc-600
            cursor-not-allowed opacity-50
          `}
          disabled
        >
          {dayNum}
        </button>
      )
    }

    return (
      <button
        ref={ref}
        onClick={onClick}
        className={`
          w-8 h-8 rounded-full border-2 relative
          flex items-center justify-center text-[10px]
          transition-all duration-200 hover:scale-110
          ${statusColors[status]}
          ${status === 'empty' ? 'text-zinc-500 hover:border-zinc-500' : 'text-white'}
          ${isToday ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950' : ''}
          ${isPerfect && !isSick ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-zinc-950' : ''}
        `}
      >
        {isSick ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        ) : dayNum}
        {hasNotes && !isSick && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-400 rounded-full" />
        )}
      </button>
    )
  }
)

