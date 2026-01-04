'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DayCircle } from './DayCircle'
import { DayModal } from './DayModal'
import { DaySheet } from './DaySheet'
import { CompactCalendar } from './CompactCalendar'
import { SettingsModal } from './SettingsModal'
import { StatsModal } from './StatsModal'
import { StatsView } from './StatsView'
import { SettingsView } from './SettingsView'
import { BottomNav } from './BottomNav'
import { Confetti } from './Confetti'
import { useIsMobile } from '@/hooks/useIsMobile'
import { clearSessionBackup } from '@/hooks/useSessionBackup'
import {
  DayEntry,
  Goal,
  ColorThreshold,
  getDaysInYear,
  formatDate,
  getGoalStatus,
  calculateStreak
} from '@/lib/types'
import versionData from '@/version.json'

const MONTHS = [
  'Tammi', 'Helmi', 'Maalis', 'Huhti', 'Touko', 'Kesä',
  'Heinä', 'Elo', 'Syys', 'Loka', 'Marras', 'Joulu'
]

type ViewMode = 'months' | 'compact'
type MobileView = 'calendar' | 'stats' | 'settings'

interface CalendarConfig {
  calendarId: string
  name: string
  goals: Goal[]
  colorThreshold: ColorThreshold
  year: number
}

interface YearCalendarProps {
  calendarId: string
}

const isDev = process.env.NODE_ENV === 'development'

export function YearCalendar({ calendarId }: YearCalendarProps) {
  const isMobile = useIsMobile()
  const [config, setConfig] = useState<CalendarConfig | null>(null)
  const [entries, setEntries] = useState<Record<string, DayEntry>>({})
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('months')
  const [mobileView, setMobileView] = useState<MobileView>('calendar')
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const todayRef = useRef<HTMLButtonElement>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const year = config?.year || 2026
  const allDays = getDaysInYear(year)

  // Group by month
  const daysByMonth: Date[][] = Array.from({ length: 12 }, () => [])
  allDays.forEach((date) => {
    daysByMonth[date.getMonth()].push(date)
  })

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/days?calendarId=${calendarId}`)
      if (!res.ok) {
        if (res.status === 403) {
          window.location.href = '/'
          return
        }
        throw new Error('Failed to fetch')
      }

      const data = await res.json()
      setConfig(data.config)

      const map: Record<string, DayEntry> = {}
      data.entries.forEach((e: DayEntry) => {
        map[e.date] = e
      })
      setEntries(map)
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }, [calendarId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Scroll to today on load
  useEffect(() => {
    if (!loading && todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [loading])

  const handleSave = async (date: string, goals: Record<string, boolean>) => {
    if (!config) return

    try {
      // Check old status before save
      const oldEntry = entries[date]
      const currentThreshold = config.colorThreshold
      const oldStatus = oldEntry ? getGoalStatus(oldEntry, currentThreshold) : null

      const res = await fetch('/api/days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId, date, goals }),
      })

      if (!res.ok) throw new Error('Failed to save')

      const saved = await res.json()

      // Check new status
      const newStatus = getGoalStatus(saved, currentThreshold)

      // Trigger confetti if became green!
      if (newStatus === 'green' && oldStatus !== 'green') {
        setShowConfetti(true)
      }

      setEntries((prev) => ({
        ...prev,
        [saved.date]: saved,
      }))
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  const handleSettingsSave = async (updates: {
    name?: string
    goals?: Goal[]
    colorThreshold?: ColorThreshold
  }) => {
    try {
      const res = await fetch('/api/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId, ...updates }),
      })

      if (!res.ok) throw new Error('Failed to save settings')

      const updated = await res.json()
      setConfig(updated)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const handleLogout = async () => {
    try {
      // Clear localStorage session backup
      clearSessionBackup()
      await fetch('/api/auth', { method: 'DELETE' })
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading || !config) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500">Ladataan...</div>
      </div>
    )
  }

  const threshold = config.colorThreshold

  // Statistics
  const stats = Object.values(entries).reduce(
    (acc, e) => {
      const status = getGoalStatus(e, threshold)
      if (status === 'green') acc.green++
      else if (status === 'yellow') acc.yellow++
      else if (status === 'red') acc.red++
      return acc
    },
    { green: 0, yellow: 0, red: 0 }
  )

  // Streak
  const streakInfo = calculateStreak(Object.values(entries), threshold, today)

  // Mobile: Show full-screen views based on mobileView
  if (isMobile && mobileView === 'stats') {
    return (
      <div className="min-h-screen bg-zinc-950 pb-20">
        <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 px-4 py-3 z-10">
          <h1 className="text-xl font-bold text-white">Tilastot</h1>
        </div>
        <StatsView calendarId={calendarId} />
        <BottomNav currentView={mobileView} onViewChange={setMobileView} />
        <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      </div>
    )
  }

  if (isMobile && mobileView === 'settings') {
    return (
      <div className="min-h-screen bg-zinc-950 pb-20">
        <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 px-4 py-3 z-10">
          <h1 className="text-xl font-bold text-white">Asetukset</h1>
        </div>
        <SettingsView config={config} onSave={handleSettingsSave} onLogout={handleLogout} />
        <BottomNav currentView={mobileView} onViewChange={setMobileView} />
        <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-zinc-950 p-4 md:p-8 ${isMobile ? 'pb-24' : ''}`}>
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
              {year}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">{config.name}</p>
          </div>

          {/* Desktop controls - hidden on mobile */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              {/* View switcher */}
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

              {/* Stats */}
              <button
                onClick={() => setShowStats(true)}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
                title="Tilastot"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
                title="Asetukset"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                title="Kirjaudu ulos"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}

          {/* Mobile view switcher */}
          {isMobile && (
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
          )}
        </div>

        {/* Stats summary */}
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
          {/* Streaks */}
          {(streakInfo.activity.current > 0 || streakInfo.current > 0) && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-zinc-500">Streakit:</span>
              {streakInfo.activity.current > 0 && (
                <span className="text-blue-400">
                  {streakInfo.activity.current} merkintää
                </span>
              )}
              {streakInfo.activity.current > 0 && streakInfo.current > 0 && (
                <span className="text-zinc-600">|</span>
              )}
              {streakInfo.current > 0 && (
                <span className="text-emerald-400">
                  {streakInfo.current} vihreää
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Views */}
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
                      ref={isToday ? todayRef : undefined}
                      date={date}
                      entry={entries[dateStr] || null}
                      threshold={threshold}
                      totalGoals={config.goals.length}
                      isToday={isToday}
                      isFuture={isFuture}
                      onClick={() => (!isFuture || isDev) && setSelectedDate(date)}
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
          entries={entries}
          threshold={threshold}
          totalGoals={config.goals.length}
          onDayClick={(date) => {
            const isFuture = date > today
            if (!isFuture || isDev) setSelectedDate(date)
          }}
        />
      )}

      {/* Version */}
      <div className="max-w-6xl mx-auto mt-8 pb-8 text-center">
        <span className="text-zinc-700 text-xs">v{versionData.version}</span>
      </div>

      {/* Day Modal/Sheet - use DaySheet on mobile, DayModal on desktop */}
      {selectedDate && (
        isMobile ? (
          <DaySheet
            date={selectedDate}
            entry={entries[formatDate(selectedDate)] || null}
            goals={config.goals}
            threshold={threshold}
            onSave={(goals) => handleSave(formatDate(selectedDate), goals)}
            onClose={() => setSelectedDate(null)}
          />
        ) : (
          <DayModal
            date={selectedDate}
            entry={entries[formatDate(selectedDate)] || null}
            goals={config.goals}
            threshold={threshold}
            onSave={(goals) => handleSave(formatDate(selectedDate), goals)}
            onClose={() => setSelectedDate(null)}
          />
        )
      )}

      {/* Desktop-only modals */}
      {!isMobile && showSettings && (
        <SettingsModal
          config={config}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
        />
      )}

      {!isMobile && showStats && (
        <StatsModal
          calendarId={calendarId}
          onClose={() => setShowStats(false)}
        />
      )}

      {/* Mobile bottom navigation */}
      {isMobile && (
        <BottomNav currentView={mobileView} onViewChange={setMobileView} />
      )}

      {/* Confetti celebration */}
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  )
}
