'use client'

import { useState, useEffect, useCallback } from 'react'

export interface CachedPlayer {
  id: string
  first_name: string
  last_name: string
  suffix: string | null
  email: string | null
  phone: string | null
  ghin: string | null
}

interface PlayersCache {
  players: CachedPlayer[]
  isLoading: boolean
  error: string | null
  search: (query: string) => CachedPlayer[]
}

// Module-level cache so it persists across component instances
let cachedPlayers: CachedPlayer[] | null = null
let cachePromise: Promise<CachedPlayer[]> | null = null

async function fetchAllPlayers(): Promise<CachedPlayer[]> {
  const response = await fetch('/api/players')
  if (!response.ok) {
    throw new Error('Failed to fetch players')
  }
  const data = await response.json()
  return data.players || []
}

export function usePlayersCache(): PlayersCache {
  const [players, setPlayers] = useState<CachedPlayer[]>(cachedPlayers || [])
  const [isLoading, setIsLoading] = useState(!cachedPlayers)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If already cached, use it
    if (cachedPlayers) {
      setPlayers(cachedPlayers)
      setIsLoading(false)
      return
    }

    // If fetch is in progress, wait for it
    if (cachePromise) {
      cachePromise
        .then(data => {
          setPlayers(data)
          setIsLoading(false)
        })
        .catch(err => {
          setError(err.message)
          setIsLoading(false)
        })
      return
    }

    // Start new fetch
    cachePromise = fetchAllPlayers()
    cachePromise
      .then(data => {
        cachedPlayers = data
        setPlayers(data)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setIsLoading(false)
        cachePromise = null // Allow retry on error
      })
  }, [])

  // Local search function - filters cached data (memoized to prevent infinite loops)
  const search = useCallback((query: string): CachedPlayer[] => {
    if (!query || query.length < 2) return []

    const lowerQuery = query.toLowerCase()
    return players
      .filter(p => p.last_name.toLowerCase().includes(lowerQuery))
      .sort((a, b) => a.last_name.localeCompare(b.last_name))
      .slice(0, 10)
  }, [players])

  return { players, isLoading, error, search }
}
