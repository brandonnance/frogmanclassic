'use client'

import { useState, useMemo } from 'react'
import { useStore } from '@/lib/mock-data'
import { computePlayer, formatHandicap, getPlayerName } from '@/lib/calculations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Label } from '@/components/ui/label'
import { Plus, Search, Edit2, Trash2, Check, X } from 'lucide-react'
import type { Player, GhinStatus } from '@/lib/types'

function GhinStatusBadge({ status }: { status: GhinStatus }) {
  switch (status) {
    case 'fresh':
      return <Badge variant="success">Fresh</Badge>
    case 'stale':
      return <Badge variant="warning">Stale</Badge>
    case 'missing':
      return <Badge variant="error">Missing</Badge>
  }
}

export default function PlayersPage() {
  const { players, addPlayer, updatePlayer, deletePlayer } = useStore()

  const [search, setSearch] = useState('')
  const [editingHandicap, setEditingHandicap] = useState<string | null>(null)
  const [handicapValue, setHandicapValue] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    ghin: '',
    handicap_raw: '',
    plays_yellow_tees: false,
  })

  // Compute players with calculated fields
  const playersWithComputed = useMemo(
    () => players.map(computePlayer),
    [players]
  )

  // Filter players
  const filteredPlayers = useMemo(() => {
    if (!search) return playersWithComputed
    const searchLower = search.toLowerCase()
    return playersWithComputed.filter(
      (p) =>
        p.first_name.toLowerCase().includes(searchLower) ||
        p.last_name.toLowerCase().includes(searchLower) ||
        p.email?.toLowerCase().includes(searchLower) ||
        p.ghin.includes(search)
    )
  }, [playersWithComputed, search])

  // Sort by last name
  const sortedPlayers = useMemo(
    () => [...filteredPlayers].sort((a, b) => a.last_name.localeCompare(b.last_name)),
    [filteredPlayers]
  )

  const handleAddPlayer = () => {
    setEditingPlayer(null)
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      ghin: '',
      handicap_raw: '',
      plays_yellow_tees: false,
    })
    setDialogOpen(true)
  }

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player)
    setFormData({
      first_name: player.first_name,
      last_name: player.last_name,
      email: player.email || '',
      phone: player.phone || '',
      ghin: player.ghin,
      handicap_raw: player.handicap_raw?.toString() || '',
      plays_yellow_tees: player.plays_yellow_tees,
    })
    setDialogOpen(true)
  }

  const handleSavePlayer = () => {
    const playerData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email || null,
      phone: formData.phone || null,
      ghin: formData.ghin || 'NONE',
      handicap_raw: formData.handicap_raw ? parseFloat(formData.handicap_raw) : null,
      plays_yellow_tees: formData.plays_yellow_tees,
      last_handicap_update_at: formData.handicap_raw ? new Date().toISOString() : null,
    }

    if (editingPlayer) {
      updatePlayer(editingPlayer.id, playerData)
    } else {
      addPlayer(playerData as Omit<Player, 'id'>)
    }

    setDialogOpen(false)
  }

  const handleDeletePlayer = (id: string) => {
    if (confirm('Are you sure you want to delete this player?')) {
      deletePlayer(id)
    }
  }

  const startEditHandicap = (player: Player) => {
    setEditingHandicap(player.id)
    setHandicapValue(player.handicap_raw?.toString() || '')
  }

  const saveHandicap = (playerId: string) => {
    const value = handicapValue === '' ? null : parseFloat(handicapValue)
    updatePlayer(playerId, {
      handicap_raw: value,
      last_handicap_update_at: value !== null ? new Date().toISOString() : null,
    })
    setEditingHandicap(null)
  }

  const cancelEditHandicap = () => {
    setEditingHandicap(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Players</h1>
          <p className="text-gray-500 mt-1">{players.length} registered players</p>
        </div>
        <Button onClick={handleAddPlayer}>
          <Plus className="h-4 w-4 mr-2" />
          Add Player
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
              <TableHead>Handicap (Raw)</TableHead>
              <TableHead>Playing</TableHead>
              <TableHead>Yellow Tees</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.map((player) => (
              <TableRow key={player.id}>
                <TableCell className="font-medium">
                  {getPlayerName(player)}
                </TableCell>
                <TableCell className="text-gray-500">
                  {player.email || '-'}
                </TableCell>
                <TableCell className="text-gray-500">
                  {player.phone || '-'}
                </TableCell>
                <TableCell>
                  {player.ghin === 'NONE' ? (
                    <span className="text-gray-400">NONE</span>
                  ) : (
                    player.ghin
                  )}
                </TableCell>
                <TableCell>
                  {editingHandicap === player.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={handicapValue}
                        onChange={(e) => setHandicapValue(e.target.value)}
                        className="w-20 h-8"
                        step="0.1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveHandicap(player.id)
                          if (e.key === 'Escape') cancelEditHandicap()
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => saveHandicap(player.id)}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={cancelEditHandicap}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      className="hover:bg-gray-100 px-2 py-1 rounded cursor-pointer"
                      onClick={() => startEditHandicap(player)}
                    >
                      {player.handicap_raw !== null ? player.handicap_raw : '-'}
                    </button>
                  )}
                </TableCell>
                <TableCell>
                  {formatHandicap(player.handicap_playing)}
                </TableCell>
                <TableCell>
                  {player.plays_yellow_tees ? (
                    <Badge variant="secondary">Yes</Badge>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </TableCell>
                <TableCell>
                  <GhinStatusBadge status={player.ghin_status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleEditPlayer(player)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => handleDeletePlayer(player.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPlayer ? 'Edit Player' : 'Add Player'}
            </DialogTitle>
            <DialogDescription>
              {editingPlayer
                ? 'Update player information'
                : 'Add a new player to the roster'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ghin">GHIN Number</Label>
                <Input
                  id="ghin"
                  value={formData.ghin}
                  onChange={(e) =>
                    setFormData({ ...formData, ghin: e.target.value })
                  }
                  placeholder="NONE if not available"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="handicap">Handicap Index</Label>
                <Input
                  id="handicap"
                  type="number"
                  step="0.1"
                  value={formData.handicap_raw}
                  onChange={(e) =>
                    setFormData({ ...formData, handicap_raw: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="yellow_tees"
                checked={formData.plays_yellow_tees}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    plays_yellow_tees: checked === true,
                  })
                }
              />
              <Label htmlFor="yellow_tees">Plays from Yellow/Senior Tees (-2 handicap adjustment)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePlayer}
              disabled={!formData.first_name || !formData.last_name}
            >
              {editingPlayer ? 'Save Changes' : 'Add Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
