'use client'

import { DayData, getDaysInYear, formatDate, getGoalStatus, GoalStatus } from '@/lib/types'

interface CompactCalendarProps {
  year: number
  daysData: Record<string, DayData>
  onDayClick: (date: Date) => void
}

const statusColors: Record<GoalStatus, string> = {
  empty: 'bg-transparent border-zinc-700 text-zinc-500 hover:border-zinc-500',
  red: 'bg-red-500/80 border-red-500 text-white',
  yellow: 'bg-yellow-500/80 border-yellow-500 text-white',
  green: 'bg-emerald-500/80 border-emerald-500 text-white',
}

export function CompactCalendar({ year, daysData, onDayClick }: CompactCalendarProps) {
  const allDays = getDaysInYear(year)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="flex flex-wrap gap-2 justify-center max-w-6xl mx-auto">
      {allDays.map((date, index) => {
        const dateStr = formatDate(date)
        const data = daysData[dateStr] || null
        const status = getGoalStatus(data)
        const dayNumber = index + 1
        const isToday = date.getTime() === today.getTime()
        const isFuture = date > today

        if (isFuture) {
          return (
            <button
              key={dateStr}
              className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-xs text-zinc-700 cursor-not-allowed"
              disabled
            >
              {dayNumber}
            </button>
          )
        }

        return (
          <button
            key={dateStr}
            onClick={() => onDayClick(date)}
            className={`
              w-10 h-10 rounded-full border-2
              flex items-center justify-center text-xs font-medium
              transition-all duration-200 hover:scale-110
              ${statusColors[status]}
              ${isToday ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950' : ''}
            `}
          >
            {dayNumber}
          </button>
        )
      })}
    </div>
  )
}
