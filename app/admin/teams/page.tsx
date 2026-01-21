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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, Search, Users } from 'lucide-react'
import type { EventType } from '@/lib/types'

interface Team {
  id: string
  event_year_id: string
  event_type: EventType
  team_name: string | null
  sponsor_id: string | null
  credit_id: string | null
  session_pref: string
  notes: string | null
  withdrawn_at: string | null
  created_at: string
  sponsor?: { id: string; name: string } | null
  credit?: { id: string; redemption_code: string } | null
}

interface Player {
  id: string
  first_name: string
  last_name: string
  handicap_raw: number | null
  plays_yellow_tees: boolean
}

interface TeamPlayer {
  team_id: string
  player_id: string
  role: string
}

interface TeamWithPlayers extends Team {
  players: (Player & { role: string })[]
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [eventType, setEventType] = useState<EventType>('friday')

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/teams')
      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }
      const data = await response.json()
      setTeams(data.teams || [])
      setPlayers(data.players || [])
      setTeamPlayers(data.teamPlayers || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  // Build teams with players
  const teamsWithPlayers = useMemo((): TeamWithPlayers[] => {
    return teams.map(team => {
      const tps = teamPlayers.filter(tp => tp.team_id === team.id)
      const teamPlayerList = tps.map(tp => {
        const player = players.find(p => p.id === tp.player_id)
        return player ? { ...player, role: tp.role } : null
      }).filter((p): p is Player & { role: string } => p !== null)

      return {
        ...team,
        players: teamPlayerList
      }
    })
  }, [teams, players, teamPlayers])

  // Filter teams by event type and search
  const filteredTeams = useMemo(() => {
    let result = teamsWithPlayers.filter(t => t.event_type === eventType)
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(t => {
        const displayName = t.sponsor?.name || t.team_name || 'Team'
        const playerNames = t.players.map(p => `${p.first_name} ${p.last_name}`.toLowerCase()).join(' ')
        return displayName.toLowerCase().includes(searchLower) || playerNames.includes(searchLower)
      })
    }
    return result
  }, [teamsWithPlayers, eventType, search])

  // Separate active and withdrawn teams
  const activeTeams = filteredTeams.filter(t => !t.withdrawn_at)
  const withdrawnTeams = filteredTeams.filter(t => t.withdrawn_at)

  const getTeamDisplayName = (team: TeamWithPlayers) => {
    if (team.sponsor?.name) return team.sponsor.name
    if (team.team_name) return team.team_name
    if (team.players.length > 0) {
      return `Team ${team.players[0].last_name}`
    }
    return 'Unnamed Team'
  }

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
        <Button onClick={fetchTeams}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-500 mt-1">
            {activeTeams.length} active teams
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchTeams}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
        <TabsList>
          <TabsTrigger value="friday">
            Friday ({teamsWithPlayers.filter(t => t.event_type === 'friday' && !t.withdrawn_at).length})
          </TabsTrigger>
          <TabsTrigger value="sat_sun">
            Sat/Sun ({teamsWithPlayers.filter(t => t.event_type === 'sat_sun' && !t.withdrawn_at).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={eventType} className="space-y-4 mt-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search teams or players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Teams Table */}
          <div className="border rounded-lg bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Sponsor</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Users className="h-10 w-10 text-gray-300" />
                        <p>No teams registered yet</p>
                        <p className="text-sm">Teams will appear here when sponsors redeem their credits</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  activeTeams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <div className="font-medium">{getTeamDisplayName(team)}</div>
                        {team.notes && (
                          <div className="text-xs text-gray-500">{team.notes}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {team.players.length === 0 ? (
                            <span className="text-gray-400 text-sm">No players assigned</span>
                          ) : (
                            team.players.map((player) => (
                              <div key={player.id} className="flex items-center gap-2 text-sm">
                                <span>{player.first_name} {player.last_name}</span>
                                {player.role === 'seal_guest' && (
                                  <Badge variant="secondary" className="text-xs">Guest</Badge>
                                )}
                                {player.handicap_raw !== null && (
                                  <span className="text-gray-400">
                                    ({player.handicap_raw})
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {team.sponsor ? (
                          <Badge variant="outline">{team.sponsor.name}</Badge>
                        ) : (
                          <span className="text-gray-400">Direct Pay</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {team.session_pref === 'none' ? 'Any' : team.session_pref.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Withdrawn Teams */}
          {withdrawnTeams.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Withdrawn Teams ({withdrawnTeams.length})</h3>
              <div className="border rounded-lg bg-gray-50">
                <Table>
                  <TableBody>
                    {withdrawnTeams.map((team) => (
                      <TableRow key={team.id} className="opacity-60">
                        <TableCell className="font-medium">{getTeamDisplayName(team)}</TableCell>
                        <TableCell>
                          {team.players.map(p => `${p.first_name} ${p.last_name}`).join(', ') || 'No players'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Withdrawn</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
