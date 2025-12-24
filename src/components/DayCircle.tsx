'use client'

import { DayData, getGoalStatus, GoalStatus } from '@/lib/types'

interface DayCircleProps {
  date: Date
  data: DayData | null
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

export function DayCircle({ date, data, isToday, isFuture, onClick }: DayCircleProps) {
  const status = getGoalStatus(data)
  const dayNum = date.getDate()

  // Tulevat päivät: vain reunat
  if (isFuture) {
    return (
      <button
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
      onClick={onClick}
      className={`
        w-8 h-8 rounded-full border-2
        flex items-center justify-center text-[10px]
        transition-all duration-200 hover:scale-110
        ${statusColors[status]}
        ${status === 'empty' ? 'text-zinc-500 hover:border-zinc-500' : 'text-white'}
        ${isToday ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950' : ''}
      `}
    >
      {dayNum}
    </button>
  )
}
