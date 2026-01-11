'use client'

import { useState, useEffect } from 'react'
import versionData from '@/version.json'

export function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    // Check for Service Worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check immediately
        registration.update()

        // Listen for new service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true)
              }
            })
          }
        })

        // Check periodically
        const interval = setInterval(() => {
          registration.update()
        }, 60000)

        return () => clearInterval(interval)
      })
    }

    // Also check version.json periodically for server-side version
    const checkVersion = async () => {
      try {
        const res = await fetch('/version.json?t=' + Date.now())
        if (res.ok) {
          const serverVersion = await res.json()
          if (serverVersion.version !== versionData.version) {
            setUpdateAvailable(true)
          }
        }
      } catch {
        // Ignore errors
      }
    }

    // Check after 5 seconds, then every 2 minutes
    const timeout = setTimeout(checkVersion, 5000)
    const interval = setInterval(checkVersion, 120000)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [])

  const handleUpdate = async () => {
    setUpdating(true)

    // Unregister service worker and clear caches
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(r => r.unregister()))
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
    }

    // Hard reload
    window.location.reload()
  }

  if (!updateAvailable) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-emerald-600 text-white px-4 py-3 z-50 flex items-center justify-between safe-area-inset">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-sm font-medium">Uusi versio saatavilla</span>
      </div>
      <button
        onClick={handleUpdate}
        disabled={updating}
        className="px-4 py-1.5 bg-white text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50"
      >
        {updating ? 'Päivitetään...' : 'Päivitä'}
      </button>
    </div>
  )
}
