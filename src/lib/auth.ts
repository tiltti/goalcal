import { cookies } from 'next/headers'

const SESSION_COOKIE = 'goalcal_session'
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me'

// Simple session token: calendarId:timestamp:signature
// For production, consider using jose or iron-session

function sign(data: string): string {
  // Simple HMAC-like signature (for demo - use crypto.subtle in production)
  const encoder = new TextEncoder()
  const keyData = encoder.encode(SESSION_SECRET)
  const msgData = encoder.encode(data)

  let hash = 0
  for (let i = 0; i < msgData.length; i++) {
    hash = ((hash << 5) - hash) + msgData[i] + keyData[i % keyData.length]
    hash = hash & hash
  }

  return Math.abs(hash).toString(36)
}

export function createSessionToken(calendarId: string): string {
  const timestamp = Date.now()
  const data = `${calendarId}:${timestamp}`
  const signature = sign(data)
  return Buffer.from(`${data}:${signature}`).toString('base64')
}

export function verifySessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString()
    const [calendarId, timestamp, signature] = decoded.split(':')

    if (!calendarId || !timestamp || !signature) return null

    // Verify signature
    const data = `${calendarId}:${timestamp}`
    const expectedSig = sign(data)

    if (signature !== expectedSig) return null

    // Check expiration (30 days)
    const age = Date.now() - parseInt(timestamp)
    const maxAge = 30 * 24 * 60 * 60 * 1000

    if (age > maxAge) return null

    return calendarId
  } catch {
    return null
  }
}

export async function setSessionCookie(calendarId: string): Promise<void> {
  const token = createSessionToken(calendarId)
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/'
  })
}

export async function getSessionCalendarId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) return null

  return verifySessionToken(token)
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function isAuthenticated(calendarId: string): Promise<boolean> {
  const sessionCalendarId = await getSessionCalendarId()
  return sessionCalendarId === calendarId
}
