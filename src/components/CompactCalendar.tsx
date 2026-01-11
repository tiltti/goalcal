'use client'

import { DayEntry, Goal, ColorThreshold, getDaysInYear, formatDate, getGoalStatus, getActiveGoals, GoalStatus } from '@/lib/types'

interface CompactCalendarProps {
  year: number
  entries: Record<string, DayEntry>
  allGoals: Goal[]
  threshold: ColorThreshold
  onDayClick: (date: Date) => void
}

const statusColors: Record<GoalStatus, string> = {
  empty: 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700',
  red: 'bg-red-500/80 text-white hover:bg-red-500',
  yellow: 'bg-yellow-500/80 text-white hover:bg-yellow-500',
  green: 'bg-emerald-500/80 text-white hover:bg-emerald-500',
  sick: 'bg-violet-500/80 text-white hover:bg-violet-500',
}

export function CompactCalendar({ year, entries, allGoals, threshold, onDayClick }: CompactCalendarProps) {
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
          const status = getGoalStatus(entry || null, threshold, allGoals, dateStr)
          const isFuture = date > today
          const isToday = date.getTime() === today.getTime()
          const dayOfYear = index + 1

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

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && onDayClick(date)}
              disabled={isFuture}
              className={`
                w-[18px] h-[18px] md:w-8 md:h-8 rounded-sm md:rounded relative
                text-[7px] md:text-[10px] font-medium
                transition-all duration-150
                ${isFuture
                  ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed'
                  : statusColors[status]
                }
                ${isToday ? 'ring-1 md:ring-2 ring-white ring-offset-1 ring-offset-zinc-950' : ''}
                ${isPerfect && !isFuture && !isSick ? 'ring-1 md:ring-2 ring-yellow-400 ring-offset-1 ring-offset-zinc-950' : ''}
              `}
            >
              {isSick ? (
                <svg className="w-2.5 h-2.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              ) : dayOfYear}
              {hasNotes && !isSick && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-400 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
