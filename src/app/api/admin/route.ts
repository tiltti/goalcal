import { NextRequest, NextResponse } from 'next/server'
import { createCalendar, listCalendars, getCalendarConfig, updateCalendarConfig } from '@/lib/dynamodb'
import bcrypt from 'bcryptjs'
import { Goal, ColorThreshold } from '@/lib/types'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false

  const token = authHeader.slice(7)
  return token === ADMIN_PASSWORD
}

// List all calendars (admin only)
export async function GET(request: NextRequest) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 401 })
  }

  try {
    const calendars = await listCalendars()

    // Don't return password hashes
    return NextResponse.json(
      calendars.map((c) => ({
        calendarId: c.calendarId,
        name: c.name,
        goals: c.goals,
        colorThreshold: c.colorThreshold,
        year: c.year,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }))
    )
  } catch (error) {
    console.error('Admin GET error:', error)
    return NextResponse.json({ error: 'Virhe haettaessa kalentereita' }, { status: 500 })
  }
}

// Create new calendar (admin only)
export async function POST(request: NextRequest) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 401 })
  }

  try {
    const { calendarId, name, password, goals, colorThreshold } = await request.json() as {
      calendarId: string
      name: string
      password: string
      goals?: Goal[]
      colorThreshold?: ColorThreshold
    }

    if (!calendarId || !name || !password) {
      return NextResponse.json(
        { error: 'calendarId, name ja password vaaditaan' },
        { status: 400 }
      )
    }

    // Validate calendarId format
    if (!/^[a-z0-9-]+$/.test(calendarId.toLowerCase())) {
      return NextResponse.json(
        { error: 'calendarId saa sisältää vain pieniä kirjaimia, numeroita ja viivoja' },
        { status: 400 }
      )
    }

    // Check if calendar already exists
    const existing = await getCalendarConfig(calendarId.toLowerCase())
    if (existing) {
      return NextResponse.json(
        { error: 'Kalenteri on jo olemassa' },
        { status: 409 }
      )
    }

    const calendar = await createCalendar(
      calendarId.toLowerCase(),
      name,
      password,
      goals,
      colorThreshold
    )

    return NextResponse.json({
      calendarId: calendar.calendarId,
      name: calendar.name,
      goals: calendar.goals,
      colorThreshold: calendar.colorThreshold,
      year: calendar.year,
      createdAt: calendar.createdAt
    })
  } catch (error) {
    console.error('Admin POST error:', error)
    return NextResponse.json({ error: 'Virhe luotaessa kalenteria' }, { status: 500 })
  }
}

// Update calendar (admin only) - including password reset
export async function PUT(request: NextRequest) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 401 })
  }

  try {
    const { calendarId, name, password, goals, colorThreshold } = await request.json() as {
      calendarId: string
      name?: string
      password?: string
      goals?: Goal[]
      colorThreshold?: ColorThreshold
    }

    if (!calendarId) {
      return NextResponse.json({ error: 'calendarId vaaditaan' }, { status: 400 })
    }

    const existing = await getCalendarConfig(calendarId)
    if (!existing) {
      return NextResponse.json({ error: 'Kalenteria ei löydy' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}
    if (name) updates.name = name
    if (goals) updates.goals = goals
    if (colorThreshold) updates.colorThreshold = colorThreshold
    if (password) updates.passwordHash = await bcrypt.hash(password, 10)

    await updateCalendarConfig(calendarId, updates)

    const updated = await getCalendarConfig(calendarId)

    return NextResponse.json({
      calendarId: updated!.calendarId,
      name: updated!.name,
      goals: updated!.goals,
      colorThreshold: updated!.colorThreshold,
      year: updated!.year,
      updatedAt: updated!.updatedAt
    })
  } catch (error) {
    console.error('Admin PUT error:', error)
    return NextResponse.json({ error: 'Virhe päivitettäessä kalenteria' }, { status: 500 })
  }
}
