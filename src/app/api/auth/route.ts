import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/dynamodb'
import { setSessionCookie, clearSession, createSessionToken, verifySessionToken, setSessionCookieFromToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { calendarId, password } = await request.json()

    if (!calendarId || !password) {
      return NextResponse.json(
        { error: 'Kalenterin nimi ja salasana vaaditaan' },
        { status: 400 }
      )
    }

    const isValid = await verifyPassword(calendarId.toLowerCase(), password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Väärä kalenterin nimi tai salasana' },
        { status: 401 }
      )
    }

    const token = await setSessionCookie(calendarId.toLowerCase())

    // Return token for localStorage backup (for iOS Safari which clears cookies)
    return NextResponse.json({
      success: true,
      calendarId: calendarId.toLowerCase(),
      sessionToken: token  // Client stores this in localStorage as backup
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Kirjautuminen epäonnistui' },
      { status: 500 }
    )
  }
}

// PUT: Restore session from localStorage token
export async function PUT(request: NextRequest) {
  try {
    const { sessionToken } = await request.json()

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token required' },
        { status: 400 }
      )
    }

    // Verify the token is valid
    const calendarId = verifySessionToken(sessionToken)

    if (!calendarId) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Restore the cookie
    await setSessionCookieFromToken(sessionToken)

    return NextResponse.json({ success: true, calendarId })
  } catch (error) {
    console.error('Session restore error:', error)
    return NextResponse.json(
      { error: 'Session restore failed' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    await clearSession()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Uloskirjautuminen epäonnistui' },
      { status: 500 }
    )
  }
}
