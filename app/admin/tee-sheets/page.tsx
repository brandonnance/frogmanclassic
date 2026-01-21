'use client'

import { useState, useMemo } from 'react'
import { useStore } from '@/lib/mock-data'
import { getTeamDisplayName, getPlayerName } from '@/lib/calculations'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, X, GripVertical, Users } from 'lucide-react'
import type { EventDay, Session, TeamWithPlayers } from '@/lib/types'

export default function TeeSheetsPage() {
  const {
    teeSheetSlots,
    getTeamsWithPlayers,
    assignTeamToSlot,
    removeTeamFromSlot,
  } = useStore()

  const [selectedDay, setSelectedDay] = useState<EventDay>('friday')
  const [selectedSession, setSelectedSession] = useState<Session>('am')
  const [draggedTeam, setDraggedTeam] = useState<string | null>(null)

  const teamsWithPlayers = getTeamsWithPlayers()

  // Get teams for the selected day
  const teamsForDay = useMemo(() => {
    if (selectedDay === 'friday') {
      return teamsWithPlayers.filter(t => t.event_type === 'friday' && !t.withdrawn_at)
    } else {
      return teamsWithPlayers.filter(t => t.event_type === 'sat_sun' && !t.withdrawn_at)
    }
  }, [teamsWithPlayers, selectedDay])

  // Get slots for selected day and session
  const currentSlots = useMemo(() => {
    return teeSheetSlots
      .filter(s => s.event_day === selectedDay && s.session === selectedSession)
      .sort((a, b) => a.hole_number - b.hole_number)
  }, [teeSheetSlots, selectedDay, selectedSession])

  // Get assigned team IDs across all slots for this day/session
  const assignedTeamIds = useMemo(() => {
    return new Set(currentSlots.flatMap(s => s.team_ids))
  }, [currentSlots])

  // Get unassigned teams
  const unassignedTeams = useMemo(() => {
    return teamsForDay.filter(t => !assignedTeamIds.has(t.id))
  }, [teamsForDay, assignedTeamIds])

  // Get team by ID
  const getTeam = (teamId: string): TeamWithPlayers | undefined => {
    return teamsWithPlayers.find(t => t.id === teamId)
  }

  // Drag handlers
  const handleDragStart = (teamId: string) => {
    setDraggedTeam(teamId)
  }

  const handleDragEnd = () => {
    setDraggedTeam(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (slotId: string) => {
    if (draggedTeam) {
      // Remove from current slot if assigned
      currentSlots.forEach(slot => {
        if (slot.team_ids.includes(draggedTeam)) {
          removeTeamFromSlot(slot.id, draggedTeam)
        }
      })
      // Add to new slot
      assignTeamToSlot(slotId, draggedTeam)
    }
    setDraggedTeam(null)
  }

  const handleRemoveFromSlot = (slotId: string, teamId: string) => {
    removeTeamFromSlot(slotId, teamId)
  }

  const handleQuickAssign = (slotId: string, teamId: string) => {
    assignTeamToSlot(slotId, teamId)
  }

  // Count assigned teams
  const assignedCount = assignedTeamIds.size
  const totalTeams = teamsForDay.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tee Sheets</h1>
          <p className="text-gray-500 mt-1">
            Assign teams to starting holes
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-base px-3 py-1">
            {assignedCount} / {totalTeams} teams assigned
          </Badge>
        </div>
      </div>

      {/* Day & Session Selection */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Day:</span>
          <Tabs value={selectedDay} onValueChange={(v) => setSelectedDay(v as EventDay)}>
            <TabsList>
              <TabsTrigger value="friday">Friday</TabsTrigger>
              <TabsTrigger value="saturday">Saturday</TabsTrigger>
              <TabsTrigger value="sunday">Sunday</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Session:</span>
          <Tabs value={selectedSession} onValueChange={(v) => setSelectedSession(v as Session)}>
            <TabsList>
              <TabsTrigger value="am">AM</TabsTrigger>
              <TabsTrigger value="pm">PM</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tee Sheet Grid */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)} - {selectedSession.toUpperCase()} Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
                {currentSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`border-2 rounded-lg p-3 min-h-[120px] transition-colors ${
                      draggedTeam ? 'border-dashed border-green-400 bg-green-50' : 'border-gray-200'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(slot.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg text-gray-700">
                        Hole {slot.hole_number}
                      </span>
                      {slot.team_ids.length === 0 && unassignedTeams.length > 0 && (
                        <Select onValueChange={(teamId) => handleQuickAssign(slot.id, teamId)}>
                          <SelectTrigger className="w-8 h-8 p-0">
                            <Plus className="h-4 w-4" />
                          </SelectTrigger>
                          <SelectContent>
                            {unassignedTeams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {getTeamDisplayName(team)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="space-y-2">
                      {slot.team_ids.map((teamId) => {
                        const team = getTeam(teamId)
                        if (!team) return null
                        return (
                          <div
                            key={teamId}
                            className="flex items-center justify-between bg-white border rounded px-2 py-1 group"
                            draggable
                            onDragStart={() => handleDragStart(teamId)}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="flex items-center gap-1 overflow-hidden">
                              <GripVertical className="h-3 w-3 text-gray-400 cursor-grab flex-shrink-0" />
                              <span className="text-sm truncate">{getTeamDisplayName(team)}</span>
                            </div>
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveFromSlot(slot.id, teamId)}
                            >
                              <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unassigned Teams Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Unassigned ({unassignedTeams.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unassignedTeams.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  All teams assigned!
                </p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {unassignedTeams.map((team) => (
                    <div
                      key={team.id}
                      className={`border rounded-lg p-2 cursor-grab hover:border-green-400 hover:bg-green-50 transition-colors ${
                        draggedTeam === team.id ? 'opacity-50' : ''
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(team.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {getTeamDisplayName(team)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {team.players.map(p => p.last_name).join(', ')}
                          </div>
                        </div>
                      </div>
                      {team.session_pref !== 'none' && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          Prefers {team.session_pref.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info */}
      <div className="text-sm text-gray-500">
        Drag teams from the sidebar to assign them to starting holes. Click the X to remove a team from a hole.
      </div>
    </div>
  )
}
