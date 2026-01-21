'use client'

import { useState, useMemo } from 'react'
import { useStore } from '@/lib/mock-data'
import { getTeamDisplayName, formatHandicap, getPlayerName } from '@/lib/calculations'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Search, Edit2, Trash2, UserMinus, Users } from 'lucide-react'
import type { EventType, SessionPref, Team, TeamWithPlayers } from '@/lib/types'

export default function TeamsPage() {
  const {
    sponsors,
    sponsorCredits,
    players,
    getTeamsWithPlayers,
    addTeam,
    updateTeam,
    withdrawTeam,
    deleteTeam,
    setTeamPlayers,
    activeEventYearId,
  } = useStore()

  const [search, setSearch] = useState('')
  const [eventType, setEventType] = useState<EventType>('friday')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<TeamWithPlayers | null>(null)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [formData, setFormData] = useState({
    team_name: '',
    sponsor_id: '',
    session_pref: 'none' as SessionPref,
    notes: '',
  })

  const teamsWithPlayers = getTeamsWithPlayers()

  // Filter teams by event type and search
  const filteredTeams = useMemo(() => {
    let teams = teamsWithPlayers.filter(t => t.event_type === eventType)
    if (search) {
      const searchLower = search.toLowerCase()
      teams = teams.filter(t => {
        const displayName = getTeamDisplayName(t).toLowerCase()
        const playerNames = t.players.map(p => getPlayerName(p).toLowerCase()).join(' ')
        return displayName.includes(searchLower) || playerNames.includes(searchLower)
      })
    }
    return teams
  }, [teamsWithPlayers, eventType, search])

  // Separate active and withdrawn teams
  const activeTeams = filteredTeams.filter(t => !t.withdrawn_at)
  const withdrawnTeams = filteredTeams.filter(t => t.withdrawn_at)

  // Get available credits for sponsor selection
  const sponsorsWithAvailableCredits = sponsors.filter(s => {
    const available = sponsorCredits.filter(
      c => c.sponsor_id === s.id && c.redeemed_by_team_id === null
    )
    return available.length > 0 || (editingTeam && editingTeam.sponsor_id === s.id)
  })

  // Get players not on any active team for current event type
  const availablePlayers = useMemo(() => {
    const assignedPlayerIds = new Set(
      teamsWithPlayers
        .filter(t => t.event_type === eventType && !t.withdrawn_at && t.id !== editingTeam?.id)
        .flatMap(t => t.players.map(p => p.id))
    )
    return players.filter(p => !assignedPlayerIds.has(p.id))
  }, [players, teamsWithPlayers, eventType, editingTeam])

  const handleAddTeam = () => {
    setEditingTeam(null)
    setSelectedPlayers([])
    setFormData({
      team_name: '',
      sponsor_id: '',
      session_pref: 'none',
      notes: '',
    })
    setDialogOpen(true)
  }

  const handleEditTeam = (team: TeamWithPlayers) => {
    setEditingTeam(team)
    setSelectedPlayers(team.players.map(p => p.id))
    setFormData({
      team_name: team.team_name || '',
      sponsor_id: team.sponsor_id || '',
      session_pref: team.session_pref,
      notes: team.notes,
    })
    setDialogOpen(true)
  }

  const handleSaveTeam = () => {
    const teamData = {
      event_year_id: activeEventYearId || 'ey_2025',
      event_type: eventType,
      team_name: formData.team_name || null,
      sponsor_id: formData.sponsor_id || null,
      credit_id: null as string | null,
      session_pref: formData.session_pref,
      notes: formData.notes,
      withdrawn_at: null,
    }

    // If sponsor selected, find an available credit
    if (formData.sponsor_id) {
      const availableCredit = sponsorCredits.find(
        c => c.sponsor_id === formData.sponsor_id && c.redeemed_by_team_id === null
      )
      if (availableCredit) {
        teamData.credit_id = availableCredit.id
      }
    }

    if (editingTeam) {
      updateTeam(editingTeam.id, teamData)
      setTeamPlayers(editingTeam.id, selectedPlayers)
    } else {
      addTeam(teamData, selectedPlayers)
    }

    setDialogOpen(false)
  }

  const handleWithdrawTeam = (team: TeamWithPlayers) => {
    if (confirm(`Withdraw team "${getTeamDisplayName(team)}"? This will restore any sponsor credits.`)) {
      withdrawTeam(team.id)
    }
  }

  const handleDeleteTeam = (team: TeamWithPlayers) => {
    if (confirm(`Permanently delete team "${getTeamDisplayName(team)}"?`)) {
      deleteTeam(team.id)
    }
  }

  const togglePlayer = (playerId: string) => {
    const maxPlayers = eventType === 'friday' ? 5 : 2
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId))
    } else if (selectedPlayers.length < maxPlayers) {
      setSelectedPlayers([...selectedPlayers, playerId])
    }
  }

  const maxPlayers = eventType === 'friday' ? 5 : 2
  const minPlayers = eventType === 'friday' ? 4 : 2

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
        <Button onClick={handleAddTeam}>
          <Plus className="h-4 w-4 mr-2" />
          Add Team
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

          {/* Active Teams Table */}
          <div className="border rounded-lg bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Sponsor</TableHead>
                  <TableHead className="text-center">Combined Handicap</TableHead>
                  {eventType === 'sat_sun' && <TableHead className="text-center">Flight</TableHead>}
                  <TableHead>Session</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={eventType === 'sat_sun' ? 7 : 6} className="text-center text-gray-500 py-8">
                      No teams registered
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
                          {team.players.map((player) => (
                            <div key={player.id} className="flex items-center gap-2 text-sm">
                              <span>{getPlayerName(player)}</span>
                              {player.role === 'seal_guest' && (
                                <Badge variant="secondary" className="text-xs">Guest</Badge>
                              )}
                              <span className="text-gray-400">
                                ({formatHandicap(player.handicap_playing)})
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {team.sponsor ? (
                          <Badge variant="outline">{team.sponsor.name}</Badge>
                        ) : (
                          <span className="text-gray-400">Direct Pay</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {team.combined_handicap !== null ? team.combined_handicap : '-'}
                      </TableCell>
                      {eventType === 'sat_sun' && (
                        <TableCell className="text-center">
                          {team.flight ? (
                            <Badge variant={team.flight === 1 ? 'default' : 'secondary'}>
                              Flight {team.flight}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {team.session_pref === 'none' ? 'Any' : team.session_pref.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleEditTeam(team)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-amber-600 hover:text-amber-700"
                            onClick={() => handleWithdrawTeam(team)}
                            title="Withdraw team"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteTeam(team)}
                            title="Delete team"
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
                          {team.players.map(p => getPlayerName(p)).join(', ')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Withdrawn</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => handleDeleteTeam(team)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? 'Edit Team' : `Add ${eventType === 'friday' ? 'Friday' : 'Sat/Sun'} Team`}
            </DialogTitle>
            <DialogDescription>
              {eventType === 'friday'
                ? 'Friday teams have 4-5 players'
                : 'Sat/Sun teams have 2 players'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="team_name">Team Name (optional)</Label>
                <Input
                  id="team_name"
                  value={formData.team_name}
                  onChange={(e) =>
                    setFormData({ ...formData, team_name: e.target.value })
                  }
                  placeholder="Auto-generated if blank"
                />
              </div>
              <div className="space-y-2">
                <Label>Session Preference</Label>
                <Select
                  value={formData.session_pref}
                  onValueChange={(value: SessionPref) =>
                    setFormData({ ...formData, session_pref: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Preference</SelectItem>
                    <SelectItem value="am">AM Session</SelectItem>
                    <SelectItem value="pm">PM Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sponsor (optional - uses credit)</Label>
              <Select
                value={formData.sponsor_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, sponsor_id: value === 'none' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Direct Pay (no sponsor)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Direct Pay (no sponsor)</SelectItem>
                  {sponsorsWithAvailableCredits.map((sponsor) => (
                    <SelectItem key={sponsor.id} value={sponsor.id}>
                      {sponsor.name} ({sponsor.total_credits - sponsor.credits_used} credits available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Optional notes about this team"
              />
            </div>

            {/* Player Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Players ({selectedPlayers.length}/{maxPlayers})</Label>
                {selectedPlayers.length < minPlayers && (
                  <span className="text-sm text-amber-600">
                    Need at least {minPlayers} players
                  </span>
                )}
              </div>

              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {/* Selected players first */}
                {selectedPlayers.length > 0 && (
                  <div className="border-b p-2 bg-green-50">
                    <div className="text-xs font-medium text-green-700 mb-2">Selected Players</div>
                    {selectedPlayers.map((playerId) => {
                      const player = players.find(p => p.id === playerId)
                      if (!player) return null
                      return (
                        <div
                          key={playerId}
                          className="flex items-center justify-between py-1 px-2 hover:bg-green-100 rounded cursor-pointer"
                          onClick={() => togglePlayer(playerId)}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox checked={true} />
                            <span className="font-medium">{getPlayerName(player)}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {player.handicap_raw !== null ? `Hcp: ${player.handicap_raw}` : 'No handicap'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Available players */}
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 mb-2">Available Players</div>
                  {availablePlayers
                    .filter(p => !selectedPlayers.includes(p.id))
                    .sort((a, b) => a.last_name.localeCompare(b.last_name))
                    .map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => togglePlayer(player.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={false}
                            disabled={selectedPlayers.length >= maxPlayers}
                          />
                          <span>{getPlayerName(player)}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {player.handicap_raw !== null ? `Hcp: ${player.handicap_raw}` : 'No handicap'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTeam}
              disabled={selectedPlayers.length < minPlayers}
            >
              <Users className="h-4 w-4 mr-2" />
              {editingTeam ? 'Save Team' : 'Create Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
