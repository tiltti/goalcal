import { cookies } from 'next/headers'
import versionData from '@/version.json'

const SESSION_COOKIE = 'goalcal_session'
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me'

// Get major.minor version (e.g., "0.3" from "0.3.1")
function getMajorMinorVersion(): string {
  const parts = versionData.version.split('.')
  return `${parts[0]}.${parts[1]}`
}

// Simple session token: calendarId:timestamp:version:signature
// Session persists for 1 year, only invalidates on major.minor version change

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
  const version = getMajorMinorVersion()
  const data = `${calendarId}:${timestamp}:${version}`
  const signature = sign(data)
  return Buffer.from(`${data}:${signature}`).toString('base64')
}

export function verifySessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString()
    const parts = decoded.split(':')

    // Support both old format (calendarId:timestamp:signature) and new (calendarId:timestamp:version:signature)
    let calendarId: string, timestamp: string, version: string | null, signature: string

    if (parts.length === 3) {
      // Old format - no version, will be invalidated
      [calendarId, timestamp, signature] = parts
      version = null
    } else if (parts.length === 4) {
      // New format with version
      [calendarId, timestamp, version, signature] = parts
    } else {
      return null
    }

    if (!calendarId || !timestamp || !signature) return null

    // Verify signature
    const data = version
      ? `${calendarId}:${timestamp}:${version}`
      : `${calendarId}:${timestamp}`
    const expectedSig = sign(data)

    if (signature !== expectedSig) return null

    // Check expiration (1 year)
    const age = Date.now() - parseInt(timestamp)
    const maxAge = 365 * 24 * 60 * 60 * 1000

    if (age > maxAge) return null

    // Check version - invalidate if major.minor changed
    const currentVersion = getMajorMinorVersion()
    if (version !== currentVersion) return null

    return calendarId
  } catch {
    return null
  }
}

export async function setSessionCookie(calendarId: string): Promise<string> {
  const token = createSessionToken(calendarId)
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 365 * 24 * 60 * 60, // 1 year
    path: '/'
  })

  return token  // Return token for localStorage backup
}

export async function setSessionCookieFromToken(token: string): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 365 * 24 * 60 * 60, // 1 year
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
