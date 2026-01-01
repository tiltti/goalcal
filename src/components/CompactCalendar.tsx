'use client'

import { DayEntry, ColorThreshold, getDaysInYear, formatDate, getGoalStatus, GoalStatus } from '@/lib/types'

interface CompactCalendarProps {
  year: number
  entries: Record<string, DayEntry>
  threshold: ColorThreshold
  totalGoals: number
  onDayClick: (date: Date) => void
}

const statusColors: Record<GoalStatus, string> = {
  empty: 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700',
  red: 'bg-red-500/80 text-white hover:bg-red-500',
  yellow: 'bg-yellow-500/80 text-white hover:bg-yellow-500',
  green: 'bg-emerald-500/80 text-white hover:bg-emerald-500',
}

export function CompactCalendar({ year, entries, threshold, totalGoals, onDayClick }: CompactCalendarProps) {
  const allDays = getDaysInYear(year)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="max-w-6xl mx-auto">
      {/* gap-0.5 and smaller buttons on mobile, normal on md+ */}
      <div className="flex flex-wrap gap-[3px] md:gap-1">
        {allDays.map((date, index) => {
          const dateStr = formatDate(date)
          const entry = entries[dateStr]
          const status = getGoalStatus(entry || null, threshold)
          const isFuture = date > today
          const isToday = date.getTime() === today.getTime()
          const dayOfYear = index + 1

          // Check if ALL goals are completed (perfect day)
          const completedCount = entry ? Object.values(entry.goals).filter(Boolean).length : 0
          const isPerfect = completedCount === totalGoals && totalGoals > 0

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && onDayClick(date)}
              disabled={isFuture}
              className={`
                w-[18px] h-[18px] md:w-8 md:h-8 rounded-sm md:rounded
                text-[7px] md:text-[10px] font-medium
                transition-all duration-150
                ${isFuture
                  ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed'
                  : statusColors[status]
                }
                ${isToday ? 'ring-1 md:ring-2 ring-white ring-offset-1 ring-offset-zinc-950' : ''}
                ${isPerfect && !isFuture ? 'ring-1 md:ring-2 ring-yellow-400 ring-offset-1 ring-offset-zinc-950' : ''}
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
