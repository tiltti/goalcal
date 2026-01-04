import { NextRequest, NextResponse } from 'next/server'
import { getYearEntries, saveDayEntry, getCalendarConfig } from '@/lib/dynamodb'
import { getSessionCalendarId } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
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

    const config = await getCalendarConfig(calendarId)
    if (!config) {
      return NextResponse.json({ error: 'Kalenteria ei löydy' }, { status: 404 })
    }

    const entries = await getYearEntries(calendarId, config.year)

    return NextResponse.json({
      config: {
        calendarId: config.calendarId,
        name: config.name,
        goals: config.goals,
        trackables: config.trackables || [],
        colorThreshold: config.colorThreshold,
        year: config.year
      },
      entries
    })
  } catch (error) {
    console.error('GET days error:', error)
    return NextResponse.json({ error: 'Virhe haettaessa päiviä' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionCalendarId = await getSessionCalendarId()
    const { calendarId, date, goals, trackables } = await request.json()

    if (!calendarId || !date) {
      return NextResponse.json(
        { error: 'calendarId ja date vaaditaan' },
        { status: 400 }
      )
    }

    // Check authentication
    if (sessionCalendarId !== calendarId) {
      return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
    }

    // Verify calendar exists
    const config = await getCalendarConfig(calendarId)
    if (!config) {
      return NextResponse.json({ error: 'Kalenteria ei löydy' }, { status: 404 })
    }

    // Validate date is not in the future
    const today = new Date()
    const entryDate = new Date(date)
    if (entryDate > today) {
      return NextResponse.json(
        { error: 'Tulevaisuuden päiviä ei voi merkitä' },
        { status: 400 }
      )
    }

    // Validate date is in the correct year
    if (entryDate.getFullYear() !== config.year) {
      return NextResponse.json(
        { error: `Päivämäärän pitää olla vuonna ${config.year}` },
        { status: 400 }
      )
    }

    const entry = await saveDayEntry(calendarId, date, goals || {}, trackables)

    return NextResponse.json(entry)
  } catch (error) {
    console.error('POST days error:', error)
    return NextResponse.json({ error: 'Virhe tallennettaessa' }, { status: 500 })
  }
}
