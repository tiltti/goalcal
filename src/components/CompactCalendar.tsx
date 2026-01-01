'use client'

import { DayEntry, ColorThreshold, getDaysInYear, formatDate, getGoalStatus, GoalStatus } from '@/lib/types'

interface CompactCalendarProps {
  year: number
  entries: Record<string, DayEntry>
  threshold: ColorThreshold
  onDayClick: (date: Date) => void
}

const statusColors: Record<GoalStatus, string> = {
  empty: 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700',
  red: 'bg-red-500/80 text-white hover:bg-red-500',
  yellow: 'bg-yellow-500/80 text-white hover:bg-yellow-500',
  green: 'bg-emerald-500/80 text-white hover:bg-emerald-500',
}

export function CompactCalendar({ year, entries, threshold, onDayClick }: CompactCalendarProps) {
  const allDays = getDaysInYear(year)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap gap-1">
        {allDays.map((date, index) => {
          const dateStr = formatDate(date)
          const entry = entries[dateStr]
          const status = getGoalStatus(entry || null, threshold)
          const isFuture = date > today
          const isToday = date.getTime() === today.getTime()
          const dayOfYear = index + 1

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && onDayClick(date)}
              disabled={isFuture}
              className={`
                w-8 h-8 rounded text-[10px] font-medium
                transition-all duration-150
                ${isFuture
                  ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed'
                  : statusColors[status]
                }
                ${isToday ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950' : ''}
              `}
            >
              {dayOfYear}
            </button>
          )
        })}
      </div>
    </div>
  )
}
