'use client'

import { useState, useEffect, useCallback } from 'react'
import { DayCircle } from './DayCircle'
import { DayModal } from './DayModal'
import { CompactCalendar } from './CompactCalendar'
import { DayData, getDaysInYear, formatDate, getGoalStatus } from '@/lib/types'

const MONTHS = [
  'Tammi', 'Helmi', 'Maalis', 'Huhti', 'Touko', 'Kesä',
  'Heinä', 'Elo', 'Syys', 'Loka', 'Marras', 'Joulu'
]

type ViewMode = 'months' | 'compact'

export function YearCalendar({ year }: { year: number }) {
  const [daysData, setDaysData] = useState<Record<string, DayData>>({})
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('months')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const allDays = getDaysInYear(year)

  // Ryhmittele kuukausittain
  const daysByMonth: Date[][] = Array.from({ length: 12 }, () => [])
  allDays.forEach((date) => {
    daysByMonth[date.getMonth()].push(date)
  })

  const fetchDays = useCallback(async () => {
    try {
      const res = await fetch(`/api/days?year=${year}`)
      const data: DayData[] = await res.json()
      const map: Record<string, DayData> = {}
      data.forEach((d) => {
        map[formatDate(new Date(d.date))] = d
      })
      setDaysData(map)
    } catch (error) {
      console.error('Failed to fetch days:', error)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    fetchDays()
  }, [fetchDays])

  const handleSave = async (data: Omit<DayData, 'id'>) => {
    try {
      const res = await fetch('/api/days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const saved = await res.json()
      setDaysData((prev) => ({
        ...prev,
        [formatDate(new Date(saved.date))]: saved,
      }))
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  // Statistiikat
  const stats = Object.values(daysData).reduce(
    (acc, d) => {
      const status = getGoalStatus(d)
      if (status === 'green') acc.green++
      else if (status === 'yellow') acc.yellow++
      else if (status === 'red') acc.red++
      return acc
    },
    { green: 0, yellow: 0, red: 0 }
  )

  // Streak - peräkkäiset vihreät päivät
  let streak = 0
  const sortedDates = Object.keys(daysData).sort().reverse()
  for (const dateStr of sortedDates) {
    const status = getGoalStatus(daysData[dateStr])
    if (status === 'green') streak++
    else break
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500">Ladataan...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      {/* Otsikko ja statistiikat */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            {year}
          </h1>

          {/* Tab switcher */}
          <div className="flex bg-zinc-900 rounded-lg p-1">
            <button
              onClick={() => setViewMode('months')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                viewMode === 'months'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Kuukaudet
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                viewMode === 'compact'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              1–365
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-zinc-400">{stats.green} vihreää</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-zinc-400">{stats.yellow} keltaista</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-zinc-400">{stats.red} punaista</span>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-emerald-400 font-medium">🔥 {streak} päivän putki</span>
            </div>
          )}
        </div>
      </div>

      {/* Näkymät */}
      {viewMode === 'months' ? (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {daysByMonth.map((days, monthIndex) => (
            <div key={monthIndex} className="bg-zinc-900/50 rounded-lg p-4">
              <h3 className="text-zinc-500 text-xs font-medium mb-3 uppercase tracking-wider">
                {MONTHS[monthIndex]}
              </h3>
              <div className="flex flex-wrap gap-1">
                {days.map((date) => {
                  const dateStr = formatDate(date)
                  const isToday = date.getTime() === today.getTime()
                  const isFuture = date > today

                  return (
                    <DayCircle
                      key={dateStr}
                      date={date}
                      data={daysData[dateStr] || null}
                      isToday={isToday}
                      isFuture={isFuture}
                      onClick={() => !isFuture && setSelectedDate(date)}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <CompactCalendar
          year={year}
          daysData={daysData}
          onDayClick={(date) => {
            const isFuture = date > today
            if (!isFuture) setSelectedDate(date)
          }}
        />
      )}

      {/* Modal */}
      {selectedDate && (
        <DayModal
          date={selectedDate}
          data={daysData[formatDate(selectedDate)] || null}
          onSave={handleSave}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}
