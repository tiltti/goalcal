'use client'

const SESSION_KEY = 'goalcal_session_backup'

export function saveSessionBackup(token: string): void {
  try {
    localStorage.setItem(SESSION_KEY, token)
  } catch {
    // localStorage might not be available
  }
}

export function getSessionBackup(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function clearSessionBackup(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Ignore errors
  }
}

// Attempt to restore session from localStorage backup
// Returns the calendarId if successful, null if not
export async function tryRestoreSession(): Promise<string | null> {
  const token = getSessionBackup()
  if (!token) return null

  try {
    const res = await fetch('/api/auth', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken: token })
    })

    if (!res.ok) {
      // Token is invalid, clear backup
      clearSessionBackup()
      return null
    }

    const data = await res.json()
    return data.calendarId || null
  } catch {
    return null
  }
}
