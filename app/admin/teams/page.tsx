'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, Search, Users, Pencil, Trash2, RotateCcw, X, UserPlus } from 'lucide-react'
import type { EventType } from '@/lib/types'

type SessionPref = 'none' | 'am' | 'pm'

interface AllPlayer {
  id: string
  first_name: string
  last_name: string
  suffix: string | null
  handicap_raw: number | null
}

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
  const [allPlayers, setAllPlayers] = useState<AllPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [eventType, setEventType] = useState<EventType>('friday')

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<TeamWithPlayers | null>(null)
  const [editFormData, setEditFormData] = useState({
    team_name: '',
    session_pref: 'none' as SessionPref,
    notes: '',
  })
  const [editPlayers, setEditPlayers] = useState<{ player_id: string; role: string }[]>([])
  const [playerSearch, setPlayerSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [teamsRes, playersRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/players')
      ])
      if (!teamsRes.ok) {
        throw new Error('Failed to fetch teams')
      }
      const teamsData = await teamsRes.json()
      setTeams(teamsData.teams || [])
      setPlayers(teamsData.players || [])
      setTeamPlayers(teamsData.teamPlayers || [])

      if (playersRes.ok) {
        const playersData = await playersRes.json()
        setAllPlayers(playersData.players || [])
      }
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

  // Open edit dialog
  const handleEditTeam = (team: TeamWithPlayers) => {
    setEditingTeam(team)
    setEditFormData({
      team_name: team.team_name || '',
      session_pref: (team.session_pref as SessionPref) || 'none',
      notes: team.notes || '',
    })
    setEditPlayers(team.players.map(p => ({ player_id: p.id, role: p.role })))
    setPlayerSearch('')
    setEditDialogOpen(true)
  }

  // Save team edits
  const handleSaveTeam = async () => {
    if (!editingTeam) return

    setSaving(true)
    try {
      const response = await fetch(`/api/teams/${editingTeam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          players: editPlayers,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update team')
      }

      setEditDialogOpen(false)
      setEditingTeam(null)
      fetchTeams()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save team')
    } finally {
      setSaving(false)
    }
  }

  // Get max players based on event type
  const getMaxPlayers = (eventType: EventType): number => {
    return eventType === 'friday' ? 5 : 2
  }

  // Check if at player limit
  const isAtPlayerLimit = editingTeam
    ? editPlayers.length >= getMaxPlayers(editingTeam.event_type)
    : false

  // Add player to edit list
  const handleAddPlayer = (playerId: string) => {
    if (editPlayers.some(p => p.player_id === playerId)) return
    if (isAtPlayerLimit) return
    setEditPlayers([...editPlayers, { player_id: playerId, role: 'player' }])
    setPlayerSearch('')
  }

  // Remove player from edit list
  const handleRemovePlayer = (playerId: string) => {
    setEditPlayers(editPlayers.filter(p => p.player_id !== playerId))
  }

  // Get player details by ID
  const getPlayerById = (playerId: string) => {
    return allPlayers.find(p => p.id === playerId)
  }

  // Filter players for search dropdown
  const filteredAllPlayers = useMemo(() => {
    if (!playerSearch || playerSearch.length < 2) return []
    const searchLower = playerSearch.toLowerCase()
    return allPlayers
      .filter(p => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
        const lastFirst = `${p.last_name}, ${p.first_name}`.toLowerCase()
        return fullName.includes(searchLower) || lastFirst.includes(searchLower)
      })
      .filter(p => !editPlayers.some(ep => ep.player_id === p.id))
      .slice(0, 10)
  }, [playerSearch, allPlayers, editPlayers])

  // Delete (withdraw) team
  const handleDeleteTeam = async (team: TeamWithPlayers) => {
    const hasCredit = !!team.credit_id
    const message = hasCredit
      ? `Are you sure you want to withdraw "${getTeamDisplayName(team)}"?\n\nThis team used a sponsor credit which will be restored for re-use.`
      : `Are you sure you want to withdraw "${getTeamDisplayName(team)}"?`

    if (!confirm(message)) {
      return
    }

    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to withdraw team')
      }

      fetchTeams()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to withdraw team')
    }
  }

  // Restore withdrawn team
  const handleRestoreTeam = async (team: TeamWithPlayers) => {
    if (!confirm(`Restore "${getTeamDisplayName(team)}" to active status?`)) {
      return
    }

    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to restore team')
      }

      fetchTeams()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to restore team')
    }
  }

  // Permanently delete withdrawn team
  const handlePermanentDelete = async (team: TeamWithPlayers) => {
    if (!confirm(`Permanently delete "${getTeamDisplayName(team)}"?\n\nThis cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'hard_delete' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete team')
      }

      fetchTeams()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete team')
    }
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
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
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
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleEditTeam(team)}
                            title="Edit team"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteTeam(team)}
                            title="Withdraw team"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Withdrawn</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleRestoreTeam(team)}
                              title="Restore team"
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handlePermanentDelete(team)}
                              title="Permanently delete"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
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

      {/* Edit Team Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update team details and players.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Players Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Players</Label>
                {editingTeam && (
                  <span className={`text-sm ${isAtPlayerLimit ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                    {editPlayers.length} / {getMaxPlayers(editingTeam.event_type)}
                    {editingTeam.event_type === 'sat_sun' && ' (exactly 2 required)'}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {editPlayers.map((ep) => {
                  const player = getPlayerById(ep.player_id)
                  if (!player) return null
                  return (
                    <div
                      key={ep.player_id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {player.first_name} {player.last_name}
                          {player.suffix && ` ${player.suffix}`}
                        </span>
                        {player.handicap_raw !== null && (
                          <span className="text-sm text-gray-500">
                            (Handicap: {player.handicap_raw})
                          </span>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemovePlayer(ep.player_id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
                {editPlayers.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No players assigned</p>
                )}
              </div>

              {/* Add Player Search */}
              <div className="relative">
                {isAtPlayerLimit ? (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                    <UserPlus className="h-4 w-4" />
                    <span>
                      {editingTeam?.event_type === 'sat_sun'
                        ? 'Team is full (2 players). Remove a player to add someone else.'
                        : 'Team is full (5 players max). Remove a player to add someone else.'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search to add player..."
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                )}
                {!isAtPlayerLimit && filteredAllPlayers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredAllPlayers.map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => handleAddPlayer(player.id)}
                        className="w-full px-3 py-2 text-left hover:bg-green-50 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="font-medium">
                          {player.last_name}, {player.first_name}
                          {player.suffix && ` ${player.suffix}`}
                        </span>
                        {player.handicap_raw !== null && (
                          <span className="text-sm text-gray-500 ml-2">
                            (Handicap: {player.handicap_raw})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team_name">Team Name</Label>
                <Input
                  id="team_name"
                  value={editFormData.team_name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, team_name: e.target.value })
                  }
                  placeholder="Optional - defaults to sponsor name or captain"
                />
              </div>

              <div className="space-y-2">
                <Label>Session Preference</Label>
                <Select
                  value={editFormData.session_pref}
                  onValueChange={(value: SessionPref) =>
                    setEditFormData({ ...editFormData, session_pref: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Preference</SelectItem>
                    <SelectItem value="am">Morning (7:30 AM)</SelectItem>
                    <SelectItem value="pm">Afternoon (1:00 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, notes: e.target.value })
                  }
                  placeholder="Internal notes about this team"
                />
              </div>
            </div>

            {/* Display read-only info */}
            {editingTeam && (
              <div className="text-sm text-gray-500 space-y-1 pt-2 border-t">
                {editingTeam.sponsor && (
                  <p>Sponsor: <span className="font-medium text-gray-700">{editingTeam.sponsor.name}</span></p>
                )}
                {editingTeam.credit && (
                  <p>Redemption Code: <span className="font-mono text-gray-700">{editingTeam.credit.redemption_code}</span></p>
                )}
                <p>Event: <span className="font-medium text-gray-700 capitalize">{editingTeam.event_type.replace('_', '/')}</span></p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTeam} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
