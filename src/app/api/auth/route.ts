import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/dynamodb'
import { setSessionCookie, clearSession } from '@/lib/auth'

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

    await setSessionCookie(calendarId.toLowerCase())

    return NextResponse.json({ success: true, calendarId: calendarId.toLowerCase() })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Kirjautuminen epäonnistui' },
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
