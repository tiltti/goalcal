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

interface TrackableStat {
  id: string
  name: string
  type: 'boolean' | 'number'
  unit?: string
  recorded: number
  activeDays: number
  sum: number
  percentage: number
}

interface YearlyGoalStat {
  id: string
  name: string
  type: 'boolean' | 'count'
  target?: number
  current: number
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
    sick: number
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
  trackables: TrackableStat[]
  yearlyGoals: YearlyGoalStat[]
  weekdays: WeekdayStat[]
}

interface StatsViewProps {
  calendarId: string
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

export function StatsView({ calendarId }: StatsViewProps) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const bestWeekday = stats?.weekdays.reduce((best, day) =>
    day.percentage > best.percentage ? day : best
  , stats.weekdays[0])

  const worstWeekday = stats?.weekdays.reduce((worst, day) =>
    day.total > 0 && day.percentage < worst.percentage ? day : worst
  , stats.weekdays[0])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-500">Ladataan...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-400">{error}</div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="p-4 space-y-6 pb-8">
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
              {stats.overall.sick > 0 && (
                <div className="flex items-center gap-2 text-violet-400">
                  <div className="w-3 h-3 rounded-full bg-violet-500" />
                  <span>{stats.overall.sick} sairaspäivää</span>
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

      {/* Trackables stats */}
      {stats.trackables && stats.trackables.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
            Seurattavat
          </h3>
          <div className="space-y-3">
            {stats.trackables.map(trackable => (
              <div key={trackable.id} className="bg-zinc-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${trackable.type === 'boolean' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                    <span className="text-zinc-200">{trackable.name}</span>
                  </div>
                  <span className="text-sm">
                    {trackable.type === 'boolean' ? (
                      <>
                        <span className={trackable.percentage >= 70 ? 'text-blue-400' : trackable.percentage >= 40 ? 'text-yellow-400' : 'text-zinc-400'}>
                          {trackable.percentage}%
                        </span>
                        <span className="text-zinc-500 ml-2">
                          ({trackable.recorded}/{trackable.activeDays} pv)
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-purple-400 font-medium">
                          {trackable.sum}
                        </span>
                        {trackable.unit && (
                          <span className="text-zinc-500 ml-1">{trackable.unit}</span>
                        )}
                        <span className="text-zinc-500 ml-2">
                          ({trackable.recorded} kirjausta)
                        </span>
                      </>
                    )}
                  </span>
                </div>
                {trackable.type === 'boolean' && (
                  <ProgressBar
                    percentage={trackable.percentage}
                    color={trackable.percentage >= 70 ? 'bg-blue-500' : trackable.percentage >= 40 ? 'bg-blue-400' : 'bg-blue-300'}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Yearly goals */}
      {stats.yearlyGoals && stats.yearlyGoals.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
            Vuositavoitteet
          </h3>
          <div className="space-y-3">
            {stats.yearlyGoals.map(yg => {
              const isDone = yg.type === 'boolean' ? yg.current === 1 : (yg.target && yg.current >= yg.target)
              const percentage = yg.type === 'count' && yg.target
                ? Math.min(100, Math.round(yg.current / yg.target * 100))
                : (yg.current === 1 ? 100 : 0)

              return (
                <div key={yg.id} className="bg-zinc-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${yg.type === 'boolean' ? 'bg-amber-500' : 'bg-cyan-500'}`} />
                      <span className="text-zinc-200">{yg.name}</span>
                    </div>
                    <span className="text-sm">
                      {yg.type === 'boolean' ? (
                        <span className={isDone ? 'text-amber-400' : 'text-zinc-500'}>
                          {isDone ? 'Tehty!' : 'Ei vielä'}
                        </span>
                      ) : (
                        <>
                          <span className={isDone ? 'text-cyan-400' : 'text-zinc-300'}>
                            {yg.current}
                          </span>
                          {yg.target && (
                            <span className="text-zinc-500"> / {yg.target}</span>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                  {yg.type === 'count' && yg.target && (
                    <ProgressBar
                      percentage={percentage}
                      color={isDone ? 'bg-cyan-500' : 'bg-cyan-600'}
                    />
                  )}
                  {yg.type === 'boolean' && (
                    <ProgressBar
                      percentage={percentage}
                      color={isDone ? 'bg-amber-500' : 'bg-zinc-700'}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

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
    </div>
  )
}
