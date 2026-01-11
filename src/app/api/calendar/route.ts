import { NextRequest, NextResponse } from 'next/server'
import { getCalendarConfig, updateCalendarConfig } from '@/lib/dynamodb'
import { getSessionCalendarId } from '@/lib/auth'
import { Goal, Trackable, YearlyGoal, ColorThreshold } from '@/lib/types'

// Get calendar config (authenticated)
export async function GET(request: NextRequest) {
  try {
    const sessionCalendarId = await getSessionCalendarId()
    const { searchParams } = new URL(request.url)
    const calendarId = searchParams.get('calendarId')

    if (!calendarId) {
      return NextResponse.json({ error: 'calendarId vaaditaan' }, { status: 400 })
    }

    if (sessionCalendarId !== calendarId) {
      return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
    }

    const config = await getCalendarConfig(calendarId)
    if (!config) {
      return NextResponse.json({ error: 'Kalenteria ei löydy' }, { status: 404 })
    }

    // Don't return passwordHash
    return NextResponse.json({
      calendarId: config.calendarId,
      name: config.name,
      goals: config.goals,
      trackables: config.trackables || [],
      yearlyGoals: config.yearlyGoals || [],
      colorThreshold: config.colorThreshold,
      year: config.year
    })
  } catch (error) {
    console.error('GET calendar error:', error)
    return NextResponse.json({ error: 'Virhe haettaessa kalenteria' }, { status: 500 })
  }
}

// Update calendar settings (authenticated)
export async function PUT(request: NextRequest) {
  try {
    const sessionCalendarId = await getSessionCalendarId()
    const { calendarId, name, goals, trackables, yearlyGoals, colorThreshold } = await request.json() as {
      calendarId: string
      name?: string
      goals?: Goal[]
      trackables?: Trackable[]
      yearlyGoals?: YearlyGoal[]
      colorThreshold?: ColorThreshold
    }

    if (!calendarId) {
      return NextResponse.json({ error: 'calendarId vaaditaan' }, { status: 400 })
    }

    if (sessionCalendarId !== calendarId) {
      return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 })
    }

    // Validate goals if provided
    if (goals) {
      if (!Array.isArray(goals) || goals.length === 0 || goals.length > 10) {
        return NextResponse.json(
          { error: 'Tavoitteita pitää olla 1-10' },
          { status: 400 }
        )
      }

      for (const goal of goals) {
        if (!goal.id || !goal.name) {
          return NextResponse.json(
            { error: 'Jokaisella tavoitteella pitää olla id ja nimi' },
            { status: 400 }
          )
        }
      }
    }

    // Validate trackables if provided
    if (trackables) {
      if (!Array.isArray(trackables) || trackables.length > 10) {
        return NextResponse.json(
          { error: 'Seurattavia voi olla korkeintaan 10' },
          { status: 400 }
        )
      }

      for (const trackable of trackables) {
        if (!trackable.id || !trackable.name || !trackable.type) {
          return NextResponse.json(
            { error: 'Jokaisella seurattavalla pitää olla id, nimi ja tyyppi' },
            { status: 400 }
          )
        }
        if (trackable.type !== 'boolean' && trackable.type !== 'number') {
          return NextResponse.json(
            { error: 'Seurattavan tyyppi pitää olla boolean tai number' },
            { status: 400 }
          )
        }
      }
    }

    // Validate yearlyGoals if provided
    if (yearlyGoals) {
      if (!Array.isArray(yearlyGoals) || yearlyGoals.length > 20) {
        return NextResponse.json(
          { error: 'Vuositavoitteita voi olla korkeintaan 20' },
          { status: 400 }
        )
      }

      for (const yg of yearlyGoals) {
        if (!yg.id || !yg.name || !yg.type) {
          return NextResponse.json(
            { error: 'Jokaisella vuositavoitteella pitää olla id, nimi ja tyyppi' },
            { status: 400 }
          )
        }
        if (yg.type !== 'boolean' && yg.type !== 'count') {
          return NextResponse.json(
            { error: 'Vuositavoitteen tyyppi pitää olla boolean tai count' },
            { status: 400 }
          )
        }
      }
    }

    // Validate colorThreshold if provided
    if (colorThreshold) {
      if (typeof colorThreshold.green !== 'number' || typeof colorThreshold.yellow !== 'number') {
        return NextResponse.json(
          { error: 'Värirajat pitää olla numeroita' },
          { status: 400 }
        )
      }

      if (colorThreshold.yellow > colorThreshold.green) {
        return NextResponse.json(
          { error: 'Keltainen raja ei voi olla suurempi kuin vihreä' },
          { status: 400 }
        )
      }
    }

    await updateCalendarConfig(calendarId, {
      ...(name && { name }),
      ...(goals && { goals }),
      ...(trackables !== undefined && { trackables }),
      ...(yearlyGoals !== undefined && { yearlyGoals }),
      ...(colorThreshold && { colorThreshold })
    })

    const updated = await getCalendarConfig(calendarId)

    return NextResponse.json({
      calendarId: updated!.calendarId,
      name: updated!.name,
      goals: updated!.goals,
      trackables: updated!.trackables || [],
      yearlyGoals: updated!.yearlyGoals || [],
      colorThreshold: updated!.colorThreshold,
      year: updated!.year
    })
  } catch (error) {
    console.error('PUT calendar error:', error)
    return NextResponse.json({ error: 'Virhe päivitettäessä kalenteria' }, { status: 500 })
  }
}
