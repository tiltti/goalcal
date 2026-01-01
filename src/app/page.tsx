'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import versionData from '@/version.json'
import { SpaceInvaders } from '@/components/SpaceInvaders'

export default function Home() {
  const [calendarId, setCalendarId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Try to auto-fill from saved credentials
  useEffect(() => {
    if ('credentials' in navigator && 'PasswordCredential' in window) {
      navigator.credentials.get({
        password: true,
        mediation: 'optional'
      } as CredentialRequestOptions).then((credential) => {
        if (credential && 'password' in credential) {
          const pwCred = credential as PasswordCredential
          setCalendarId(pwCred.id)
          setPassword(pwCred.password || '')
        }
      }).catch(() => {
        // Credential API not supported or denied
      })
    }
  }, [])

  const saveCredentials = async (id: string, pw: string) => {
    if ('credentials' in navigator && 'PasswordCredential' in window) {
      try {
        const credential = new PasswordCredential({
          id: id,
          password: pw,
          name: id
        })
        await navigator.credentials.store(credential)
      } catch {
        // Credential API not supported
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const id = calendarId.toLowerCase().trim()

    if (!id) {
      setError('Anna kalenterin nimi')
      setLoading(false)
      return
    }

    if (!password) {
      setError('Anna salasana')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId: id, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Kirjautuminen epäonnistui')
        setLoading(false)
        return
      }

      // Save credentials for next time
      await saveCredentials(id, password)

      // Redirect to calendar
      router.push(`/${id}`)
    } catch {
      setError('Yhteysvirhe, yritä uudelleen')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 safe-area-inset relative">
      <SpaceInvaders />
      <div className="w-4/5 max-w-md mx-auto relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">2026</h1>
          <p className="text-zinc-400">Tavoitekalenteri</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          <div>
            <label
              htmlFor="calendarId"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              Kalenteri
            </label>
            <input
              type="text"
              id="calendarId"
              name="username"
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl
                       text-white text-lg focus:outline-none focus:border-emerald-500
                       transition-colors"
              autoFocus
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              Salasana
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl
                       text-white text-lg focus:outline-none focus:border-emerald-500
                       transition-colors"
              autoComplete="current-password"
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
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700
                     disabled:bg-zinc-700 text-white text-lg font-medium rounded-xl
                     transition-colors touch-manipulation"
          >
            {loading ? 'Kirjaudutaan...' : 'Kirjaudu'}
          </button>

          <div className="text-center mt-6">
            <span className="text-zinc-700 text-xs">v{versionData.version}</span>
          </div>
        </form>
      </div>
    </main>
  )
}
