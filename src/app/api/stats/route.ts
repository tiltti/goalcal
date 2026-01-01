import { NextRequest, NextResponse } from 'next/server'
import { getCalendarConfig, getYearEntries } from '@/lib/dynamodb'
import { getGoalStatus, calculateStreak, parseDate } from '@/lib/types'
import { getSessionCalendarId } from '@/lib/auth'

// Get detailed stats for a calendar
export async function GET(request: NextRequest) {
  const sessionCalendarId = await getSessionCalendarId()
  const { searchParams } = new URL(request.url)
  const calendarId = searchParams.get('calendarId')

  if (!calendarId) {
    return NextResponse.json({ error: 'calendarId vaaditaan' }, { status: 400 })
  }

  // Check authentication
  if (sessionCalendarId !== calendarId) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
  }

  try {
    const config = await getCalendarConfig(calendarId)
    if (!config) {
      return NextResponse.json({ error: 'Kalenteria ei löydy' }, { status: 404 })
    }

    const entries = await getYearEntries(calendarId, config.year)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Overall stats
    const overall = {
      total: entries.length,
      green: 0,
      yellow: 0,
      red: 0,
      perfect: 0
    }

    // Per-goal stats
    const goalStats: Record<string, { completed: number; total: number }> = {}
    for (const goal of config.goals) {
      goalStats[goal.id] = { completed: 0, total: 0 }
    }

    // Day of week stats (0 = Sunday, 1 = Monday, etc.)
    const weekdayStats: Record<number, { green: number; total: number }> = {}
    for (let i = 0; i < 7; i++) {
      weekdayStats[i] = { green: 0, total: 0 }
    }

    // Process entries
    for (const entry of entries) {
      const status = getGoalStatus(entry, config.colorThreshold)
      if (status === 'green') overall.green++
      else if (status === 'yellow') overall.yellow++
      else if (status === 'red') overall.red++

      // Perfect day check
      const completed = Object.values(entry.goals).filter(Boolean).length
      if (completed === config.goals.length) overall.perfect++

      // Per-goal tracking
      for (const goal of config.goals) {
        if (entry.goals[goal.id] !== undefined) {
          goalStats[goal.id].total++
          if (entry.goals[goal.id]) {
            goalStats[goal.id].completed++
          }
        }
      }

      // Weekday tracking
      const date = parseDate(entry.date)
      const weekday = date.getDay()
      weekdayStats[weekday].total++
      if (status === 'green') {
        weekdayStats[weekday].green++
      }
    }

    // Calculate streak info
    const streakInfo = calculateStreak(entries, config.colorThreshold, today)

    // Format goal stats with names
    const goalsWithStats = config.goals.map(goal => ({
      id: goal.id,
      name: goal.name,
      completed: goalStats[goal.id].completed,
      total: goalStats[goal.id].total,
      percentage: goalStats[goal.id].total > 0
        ? Math.round(goalStats[goal.id].completed / goalStats[goal.id].total * 100)
        : 0
    }))

    // Format weekday stats (convert to Finnish weekday order: Mon-Sun)
    const weekdayNames = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La']
    const weekdays = [1, 2, 3, 4, 5, 6, 0].map(day => ({
      day,
      name: weekdayNames[day],
      green: weekdayStats[day].green,
      total: weekdayStats[day].total,
      percentage: weekdayStats[day].total > 0
        ? Math.round(weekdayStats[day].green / weekdayStats[day].total * 100)
        : 0
    }))

    return NextResponse.json({
      calendarName: config.name,
      year: config.year,
      overall,
      streak: streakInfo,
      goals: goalsWithStats,
      weekdays
    })
  } catch (error) {
    console.error('Stats GET error:', error)
    return NextResponse.json({ error: 'Virhe haettaessa tilastoja' }, { status: 500 })
  }
}
