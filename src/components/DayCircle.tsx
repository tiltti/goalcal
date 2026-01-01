'use client'

import { forwardRef } from 'react'
import { DayEntry, ColorThreshold, getGoalStatus, GoalStatus } from '@/lib/types'

interface DayCircleProps {
  date: Date
  entry: DayEntry | null
  threshold: ColorThreshold
  totalGoals: number // Total number of goals in the calendar
  isToday: boolean
  isFuture: boolean
  onClick: () => void
}

const statusColors: Record<GoalStatus, string> = {
  empty: 'bg-transparent border-zinc-700',
  red: 'bg-red-500/80 border-red-500',
  yellow: 'bg-yellow-500/80 border-yellow-500',
  green: 'bg-emerald-500/80 border-emerald-500',
}

export const DayCircle = forwardRef<HTMLButtonElement, DayCircleProps>(
  function DayCircle({ date, entry, threshold, totalGoals, isToday, isFuture, onClick }, ref) {
    const status = getGoalStatus(entry, threshold)
    const dayNum = date.getDate()

    // Check if ALL goals are completed (perfect day)
    const completedCount = entry ? Object.values(entry.goals).filter(Boolean).length : 0
    const isPerfect = completedCount === totalGoals && totalGoals > 0

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
          w-8 h-8 rounded-full border-2
          flex items-center justify-center text-[10px]
          transition-all duration-200 hover:scale-110
          ${statusColors[status]}
          ${status === 'empty' ? 'text-zinc-500 hover:border-zinc-500' : 'text-white'}
          ${isToday ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950' : ''}
          ${isPerfect ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-zinc-950' : ''}
        `}
      >
        {dayNum}
      </button>
    )
  }
)
