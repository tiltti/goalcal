'use client'

import { useState } from 'react'

interface Calendar {
  calendarId: string
  name: string
  createdAt: string
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // New calendar form
  const [newCalendarId, setNewCalendarId] = useState('')
  const [newName, setNewName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)

  // Password reset
  const [resetId, setResetId] = useState<string | null>(null)
  const [resetPassword, setResetPassword] = useState('')

  const fetchCalendars = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin', {
        headers: { Authorization: `Bearer ${password}` }
      })

      if (!res.ok) {
        if (res.status === 401) {
          setAuthenticated(false)
          setError('Väärä salasana')
          return
        }
        throw new Error('Failed to fetch')
      }

      const data = await res.json()
      setCalendars(data)
      setAuthenticated(true)
      setError('')
    } catch {
      setError('Virhe haettaessa kalentereita')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetchCalendars()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCalendarId || !newName || !newPassword) return

    setCreating(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`
        },
        body: JSON.stringify({
          calendarId: newCalendarId.toLowerCase(),
          name: newName,
          password: newPassword
        })
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Virhe luotaessa kalenteria')
        return
      }

      await fetchCalendars()
      setNewCalendarId('')
      setNewName('')
      setNewPassword('')
      setSuccess('Kalenteri luotu!')
    } catch {
      setError('Virhe luotaessa kalenteria')
    } finally {
      setCreating(false)
    }
  }

  const handleResetPassword = async (calendarId: string) => {
    if (!resetPassword) return

    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`
        },
        body: JSON.stringify({
          calendarId,
          password: resetPassword
        })
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Virhe vaihdettaessa salasanaa')
        return
      }

      setResetId(null)
      setResetPassword('')
      setSuccess(`Salasana vaihdettu: ${calendarId}`)
    } catch {
      setError('Virhe vaihdettaessa salasanaa')
    }
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin</h1>
            <p className="text-zinc-400">Kalenterien hallinta</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin-salasana"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-xl text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
            >
              {loading ? 'Kirjaudutaan...' : 'Kirjaudu'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Admin</h1>
          <button
            onClick={() => {
              setAuthenticated(false)
              setPassword('')
            }}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Ulos
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded-xl text-red-200 text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-900/50 border border-emerald-700 rounded-xl text-emerald-200 text-sm mb-4">
            {success}
          </div>
        )}

        {/* Create new calendar */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-6">
          <h2 className="text-lg font-medium text-white mb-3">Uusi kalenteri</h2>

          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                value={newCalendarId}
                onChange={(e) => setNewCalendarId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="id"
                className="px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nimi"
                className="px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Salasana"
                className="px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={creating || !newCalendarId || !newName || !newPassword}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
            >
              {creating ? 'Luodaan...' : 'Luo'}
            </button>
          </form>
        </div>

        {/* Existing calendars */}
        <div className="space-y-2">
          {calendars.map((cal) => (
            <div
              key={cal.calendarId}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-white">{cal.name}</span>
                  <span className="text-zinc-500 text-sm ml-2">/{cal.calendarId}</span>
                </div>
                <div className="flex items-center gap-2">
                  {resetId === cal.calendarId ? (
                    <>
                      <input
                        type="text"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        placeholder="Uusi salasana"
                        className="px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-white text-sm w-32 focus:outline-none focus:border-emerald-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleResetPassword(cal.calendarId)}
                        disabled={!resetPassword}
                        className="text-emerald-400 hover:text-emerald-300 disabled:text-zinc-600 text-sm"
                      >
                        Tallenna
                      </button>
                      <button
                        onClick={() => { setResetId(null); setResetPassword('') }}
                        className="text-zinc-400 hover:text-white text-sm"
                      >
                        Peruuta
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setResetId(cal.calendarId)}
                        className="text-zinc-400 hover:text-white text-sm"
                      >
                        Vaihda salasana
                      </button>
                      <a
                        href={`/${cal.calendarId}`}
                        target="_blank"
                        className="text-emerald-400 hover:text-emerald-300 text-sm"
                      >
                        Avaa
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {calendars.length === 0 && (
            <p className="text-zinc-500 text-center py-8">Ei kalentereita</p>
          )}
        </div>
      </div>
    </main>
  )
}
