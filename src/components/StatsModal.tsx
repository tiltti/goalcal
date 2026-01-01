'use client'

import { useState, useEffect } from 'react'
import { formatDateFi, parseDate } from '@/lib/types'

interface GoalStat {
  id: string
  name: string
  completed: number
  total: number
  percentage: number
}

interface WeekdayStat {
  day: number
  name: string
  green: number
  total: number
  percentage: number
}

interface SingleStreak {
  current: number
  currentStart: string | null
  longest: number
  longestStart: string | null
  longestEnd: string | null
}

interface StatsData {
  calendarName: string
  year: number
  overall: {
    total: number
    green: number
    yellow: number
    red: number
    perfect: number
  }
  streak: {
    current: number
    currentStart: string | null
    longest: number
    longestStart: string | null
    longestEnd: string | null
    activity: SingleStreak
  }
  goals: GoalStat[]
  weekdays: WeekdayStat[]
}

interface StatsModalProps {
  calendarId: string
  onClose: () => void
}

function ProgressBar({ percentage, color }: { percentage: number; color: string }) {
  return (
    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start || !end) return ''
  const startDate = parseDate(start)
  const endDate = parseDate(end)
  return `${formatDateFi(startDate)} - ${formatDateFi(endDate)}`
}

export function StatsModal({ calendarId, onClose }: StatsModalProps) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Lock body scroll when modal is open (iOS compatible)
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/stats?calendarId=${calendarId}`)
        if (!res.ok) throw new Error('Failed to fetch stats')
        const data = await res.json()
        setStats(data)
      } catch {
        setError('Tilastoja ei voitu ladata')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [calendarId])

  // Find best and worst weekday
  const bestWeekday = stats?.weekdays.reduce((best, day) =>
    day.percentage > best.percentage ? day : best
  , stats.weekdays[0])

  const worstWeekday = stats?.weekdays.reduce((worst, day) =>
    day.total > 0 && day.percentage < worst.percentage ? day : worst
  , stats.weekdays[0])

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Tilastot</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {loading && (
            <div className="text-center py-8 text-zinc-500">Ladataan...</div>
          )}

          {error && (
            <div className="text-center py-8 text-red-400">{error}</div>
          )}

          {stats && (
            <>
              {/* Overall summary */}
              <section>
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
                  Yhteenveto
                </h3>
                <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
                  <div className="text-zinc-300">
                    <span className="text-2xl font-bold text-white">{stats.overall.total}</span>
                    {' '}päivää merkitty
                  </div>

                  {stats.overall.total > 0 && (
                    <>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          <span className="text-zinc-300">
                            {stats.overall.green} ({Math.round(stats.overall.green / stats.overall.total * 100)}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <span className="text-zinc-300">
                            {stats.overall.yellow} ({Math.round(stats.overall.yellow / stats.overall.total * 100)}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-zinc-300">
                            {stats.overall.red} ({Math.round(stats.overall.red / stats.overall.total * 100)}%)
                          </span>
                        </div>
                      </div>

                      {stats.overall.perfect > 0 && (
                        <div className="flex items-center gap-2 text-yellow-400">
                          <div className="w-3 h-3 rounded-full bg-yellow-400 ring-1 ring-yellow-300" />
                          <span>{stats.overall.perfect} täydellistä päivää</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>

              {/* Streak info */}
              <section>
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
                  Streakit
                </h3>
                <div className="space-y-3">
                  {/* Activity streak */}
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm text-zinc-400">Merkinnät</span>
                    </div>
                    {stats.streak.activity.current > 0 ? (
                      <div className="text-blue-400">
                        <span className="text-xl font-bold">{stats.streak.activity.current}</span>
                        {' '}päivää käynnissä!
                      </div>
                    ) : (
                      <div className="text-zinc-500">Ei aktiivista streakkia</div>
                    )}
                    {stats.streak.activity.longest > 0 && (
                      <div className="text-zinc-300 text-sm mt-1">
                        Pisin:{' '}
                        <span className="font-medium text-white">{stats.streak.activity.longest} päivää</span>
                        {stats.streak.activity.longestStart && stats.streak.activity.longestEnd && (
                          <span className="text-zinc-500 ml-1">
                            ({formatDateRange(stats.streak.activity.longestStart, stats.streak.activity.longestEnd)})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Green streak */}
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm text-zinc-400">Vihreät päivät</span>
                    </div>
                    {stats.streak.current > 0 ? (
                      <div className="text-emerald-400">
                        <span className="text-xl font-bold">{stats.streak.current}</span>
                        {' '}päivää käynnissä!
                      </div>
                    ) : (
                      <div className="text-zinc-500">Ei aktiivista streakkia</div>
                    )}
                    {stats.streak.longest > 0 && (
                      <div className="text-zinc-300 text-sm mt-1">
                        Pisin:{' '}
                        <span className="font-medium text-white">{stats.streak.longest} päivää</span>
                        {stats.streak.longestStart && stats.streak.longestEnd && (
                          <span className="text-zinc-500 ml-1">
                            ({formatDateRange(stats.streak.longestStart, stats.streak.longestEnd)})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Per-goal stats */}
              <section>
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
                  Tavoitteet
                </h3>
                <div className="space-y-3">
                  {stats.goals.map(goal => (
                    <div key={goal.id} className="bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-zinc-200">{goal.name}</span>
                        <span className="text-sm">
                          <span className={goal.percentage >= 70 ? 'text-emerald-400' : goal.percentage >= 40 ? 'text-yellow-400' : 'text-red-400'}>
                            {goal.percentage}%
                          </span>
                          <span className="text-zinc-500 ml-2">
                            ({goal.completed}/{goal.total})
                          </span>
                        </span>
                      </div>
                      <ProgressBar
                        percentage={goal.percentage}
                        color={goal.percentage >= 70 ? 'bg-emerald-500' : goal.percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Weekday analysis */}
              {stats.overall.total > 0 && (
                <section>
                  <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
                    Viikonpäivät
                  </h3>
                  <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
                    {stats.weekdays.map(day => (
                      <div key={day.day} className="flex items-center gap-3">
                        <span className={`w-6 text-sm font-medium ${
                          day === bestWeekday ? 'text-emerald-400' :
                          day === worstWeekday && day.total > 0 ? 'text-red-400' :
                          'text-zinc-400'
                        }`}>
                          {day.name}
                        </span>
                        <div className="flex-1">
                          <ProgressBar
                            percentage={day.percentage}
                            color={day.percentage >= 70 ? 'bg-emerald-500' : day.percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}
                          />
                        </div>
                        <span className="text-sm text-zinc-400 w-12 text-right">
                          {day.percentage}%
                        </span>
                      </div>
                    ))}

                    <div className="pt-2 border-t border-zinc-700 mt-3 text-sm text-zinc-500">
                      {bestWeekday && bestWeekday.total > 0 && (
                        <div>Paras: <span className="text-emerald-400">{bestWeekday.name}</span></div>
                      )}
                      {worstWeekday && worstWeekday.total > 0 && worstWeekday !== bestWeekday && (
                        <div>Heikoin: <span className="text-red-400">{worstWeekday.name}</span></div>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
