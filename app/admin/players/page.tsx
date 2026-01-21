'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RefreshCw, Search, Users } from 'lucide-react'

interface Player {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  ghin: string | null
  handicap_raw: number | null
  plays_yellow_tees: boolean
  last_handicap_update_at: string | null
  created_at: string
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/players')
      if (!response.ok) {
        throw new Error('Failed to fetch players')
      }
      const data = await response.json()
      setPlayers(data.players || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load players')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  // Filter players
  const filteredPlayers = useMemo(() => {
    if (!search) return players
    const searchLower = search.toLowerCase()
    return players.filter(
      (p) =>
        p.first_name.toLowerCase().includes(searchLower) ||
        p.last_name.toLowerCase().includes(searchLower) ||
        p.email?.toLowerCase().includes(searchLower) ||
        p.ghin?.includes(search)
    )
  }, [players, search])

  // Sort by last name
  const sortedPlayers = useMemo(
    () => [...filteredPlayers].sort((a, b) => a.last_name.localeCompare(b.last_name)),
    [filteredPlayers]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchPlayers}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Players</h1>
          <p className="text-gray-500 mt-1">{players.length} registered players</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchPlayers}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>GHIN</TableHead>
              <TableHead>Handicap</TableHead>
              <TableHead>Yellow Tees</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <Users className="h-10 w-10 text-gray-300" />
                    <p>No players registered yet</p>
                    <p className="text-sm">Players will appear here when teams register</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">
                    {player.first_name} {player.last_name}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {player.email || '-'}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {player.phone || '-'}
                  </TableCell>
                  <TableCell>
                    {!player.ghin || player.ghin === 'NONE' ? (
                      <span className="text-gray-400">NONE</span>
                    ) : (
                      player.ghin
                    )}
                  </TableCell>
                  <TableCell>
                    {player.handicap_raw !== null ? player.handicap_raw : '-'}
                  </TableCell>
                  <TableCell>
                    {player.plays_yellow_tees ? (
                      <Badge variant="secondary">Yes</Badge>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
