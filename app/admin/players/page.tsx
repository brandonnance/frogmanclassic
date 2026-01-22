'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, Search, Users, UserCheck, Plus, ArrowUpDown, ArrowUp, ArrowDown, Check, X, Pencil } from 'lucide-react'

interface Player {
  id: string
  first_name: string
  last_name: string
  suffix: string | null
  email: string | null
  phone: string | null
  ghin: string | null
  handicap_raw: number | null
  plays_yellow_tees: boolean
  home_course: string | null
  last_handicap_update_at: string | null
  created_at: string
}

type SortField = 'last_name' | 'first_name' | 'handicap' | 'home_course'
type SortDirection = 'asc' | 'desc'

interface EditingCell {
  playerId: string
  field: keyof Player
}

const defaultNewPlayer = {
  first_name: '',
  last_name: '',
  suffix: '',
  email: '',
  phone: '',
  ghin: '',
  handicap_raw: '',
  plays_yellow_tees: false,
  home_course: '',
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [registeredPlayerIds, setRegisteredPlayerIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'all' | 'registered'>('all')

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('last_name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Inline editing state
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [saving, setSaving] = useState(false)

  // Create player modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPlayer, setNewPlayer] = useState(defaultNewPlayer)
  const [creating, setCreating] = useState(false)

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [playersRes, teamsRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/teams')
      ])

      if (!playersRes.ok) {
        throw new Error('Failed to fetch players')
      }
      const playersData = await playersRes.json()
      setPlayers(playersData.players || [])

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json()
        const registeredIds = new Set<string>(
          (teamsData.players || []).map((p: { id: string }) => p.id)
        )
        setRegisteredPlayerIds(registeredIds)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load players')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />
  }

  // Filter and sort players
  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players

    // Filter by view mode
    if (viewMode === 'registered') {
      filtered = filtered.filter(p => registeredPlayerIds.has(p.id))
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.first_name.toLowerCase().includes(searchLower) ||
          p.last_name.toLowerCase().includes(searchLower) ||
          p.email?.toLowerCase().includes(searchLower) ||
          p.ghin?.includes(search) ||
          p.home_course?.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    return [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'last_name':
          comparison = a.last_name.localeCompare(b.last_name)
          if (comparison === 0) {
            comparison = a.first_name.localeCompare(b.first_name)
          }
          break
        case 'first_name':
          comparison = a.first_name.localeCompare(b.first_name)
          if (comparison === 0) {
            comparison = a.last_name.localeCompare(b.last_name)
          }
          break
        case 'handicap':
          const aHandicap = a.handicap_raw ?? 999
          const bHandicap = b.handicap_raw ?? 999
          comparison = aHandicap - bHandicap
          break
        case 'home_course':
          comparison = (a.home_course || '').localeCompare(b.home_course || '')
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [players, search, viewMode, registeredPlayerIds, sortField, sortDirection])

  // Inline editing handlers
  const startEditing = (playerId: string, field: keyof Player, currentValue: string | number | boolean | null) => {
    setEditingCell({ playerId, field })
    // For handicap, show the formatted display value (+6 instead of -6)
    if (field === 'handicap_raw' && typeof currentValue === 'number') {
      setEditValue(formatHandicap(currentValue))
    } else {
      setEditValue(currentValue?.toString() || '')
    }
  }

  const cancelEditing = () => {
    setEditingCell(null)
    setEditValue('')
  }

  // Parse handicap input: "+6" → -6, "6" → 6, "" → null
  const parseHandicapInput = (value: string): number | null => {
    const trimmed = value.trim()
    if (trimmed === '' || trimmed === '-') return null
    if (trimmed.startsWith('+')) {
      // Plus handicap: "+6" becomes -6 in storage
      return -Math.abs(parseFloat(trimmed.substring(1)))
    }
    return parseFloat(trimmed)
  }

  const saveEdit = async () => {
    if (!editingCell) return

    setSaving(true)
    try {
      // Convert handicap display format to storage format
      let valueToSave: string | number | null = editValue
      if (editingCell.field === 'handicap_raw') {
        valueToSave = parseHandicapInput(editValue)
      }

      const response = await fetch('/api/players', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCell.playerId,
          [editingCell.field]: valueToSave,
        }),
      })

      if (!response.ok) throw new Error('Failed to update player')

      const { player: updatedPlayer } = await response.json()
      setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p))
      setEditingCell(null)
      setEditValue('')
    } catch {
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const toggleYellowTees = async (playerId: string, currentValue: boolean) => {
    setSaving(true)
    try {
      const response = await fetch('/api/players', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: playerId,
          plays_yellow_tees: !currentValue,
        }),
      })

      if (!response.ok) throw new Error('Failed to update player')

      const { player: updatedPlayer } = await response.json()
      setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p))
    } catch {
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // Create player handler
  const handleCreatePlayer = async () => {
    if (!newPlayer.first_name || !newPlayer.last_name) {
      alert('First name and last name are required')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlayer),
      })

      if (!response.ok) throw new Error('Failed to create player')

      const { player: createdPlayer } = await response.json()
      setPlayers(prev => [...prev, createdPlayer])
      setShowCreateModal(false)
      setNewPlayer(defaultNewPlayer)
    } catch {
      alert('Failed to create player')
    } finally {
      setCreating(false)
    }
  }

  // Format handicap for display (negative stored values = plus handicaps in golf)
  const formatHandicap = (handicapRaw: number | null): string => {
    if (handicapRaw === null) return '-'
    if (handicapRaw < 0) return `+${Math.abs(handicapRaw)}`
    return handicapRaw.toString()
  }

  // Field-specific input widths
  const fieldInputWidths: Partial<Record<keyof Player, string>> = {
    first_name: 'w-32',
    last_name: 'w-32',
    suffix: 'w-16',
    email: 'w-48',
    phone: 'w-32',
    ghin: 'w-24',
    handicap_raw: 'w-16',
    home_course: 'w-40',
  }

  // Render editable cell
  const renderEditableCell = (player: Player, field: keyof Player, displayValue: React.ReactNode) => {
    const isEditing = editingCell?.playerId === player.id && editingCell?.field === field
    const inputWidth = fieldInputWidths[field] || 'w-32'

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className={`h-7 ${inputWidth} text-sm`}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit()
              if (e.key === 'Escape') cancelEditing()
            }}
            disabled={saving}
          />
          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={saveEdit} disabled={saving}>
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={cancelEditing} disabled={saving}>
            <X className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      )
    }

    return (
      <div
        className="group flex items-center gap-1 cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded"
        onClick={() => startEditing(player.id, field, player[field])}
      >
        <span className="flex-1">{displayValue}</span>
        <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 shrink-0" />
      </div>
    )
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
        <Button onClick={fetchPlayers}>Try Again</Button>
      </div>
    )
  }

  const registeredCount = registeredPlayerIds.size

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Players</h1>
          <p className="text-gray-500 mt-1">
            <span className="font-medium text-green-600">{registeredCount} registered for 2026</span>
            {' · '}
            {players.length} in directory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Player
          </Button>
          <Button variant="outline" size="icon" onClick={fetchPlayers}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* View Mode Tabs and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'all' | 'registered')}>
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Users className="h-4 w-4" />
              All Players ({players.length})
            </TabsTrigger>
            <TabsTrigger value="registered" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Registered 2026 ({registeredCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-auto sm:min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white overflow-x-auto">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-gray-50 select-none w-32"
                onClick={() => handleSort('last_name')}
              >
                <div className="flex items-center">
                  Last Name
                  {getSortIcon('last_name')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50 select-none w-32"
                onClick={() => handleSort('first_name')}
              >
                <div className="flex items-center">
                  First Name
                  {getSortIcon('first_name')}
                </div>
              </TableHead>
              <TableHead className="w-16">Suffix</TableHead>
              <TableHead className="w-48">Email</TableHead>
              <TableHead className="w-28">Phone</TableHead>
              <TableHead className="w-24">GHIN</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50 select-none w-20"
                onClick={() => handleSort('handicap')}
              >
                <div className="flex items-center">
                  HCP
                  {getSortIcon('handicap')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50 select-none w-40"
                onClick={() => handleSort('home_course')}
              >
                <div className="flex items-center">
                  Home Course
                  {getSortIcon('home_course')}
                </div>
              </TableHead>
              <TableHead className="w-20">Yellow</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedPlayers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    {viewMode === 'registered' ? (
                      <>
                        <UserCheck className="h-10 w-10 text-gray-300" />
                        <p>No players registered for 2026 yet</p>
                        <p className="text-sm">Players will appear here when teams register</p>
                      </>
                    ) : (
                      <>
                        <Users className="h-10 w-10 text-gray-300" />
                        <p>{search ? 'No players match your search' : 'No players in directory'}</p>
                        <p className="text-sm">{search ? 'Try a different search term' : 'Click "Add Player" to create one'}</p>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">
                    {renderEditableCell(player, 'last_name', player.last_name)}
                  </TableCell>
                  <TableCell>
                    {renderEditableCell(player, 'first_name', player.first_name)}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {renderEditableCell(player, 'suffix', player.suffix || '-')}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {renderEditableCell(player, 'email', player.email || '-')}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {renderEditableCell(player, 'phone', player.phone || '-')}
                  </TableCell>
                  <TableCell>
                    {renderEditableCell(
                      player,
                      'ghin',
                      !player.ghin || player.ghin === 'NONE' ? (
                        <span className="text-gray-400">NONE</span>
                      ) : (
                        player.ghin
                      )
                    )}
                  </TableCell>
                  <TableCell>
                    {renderEditableCell(
                      player,
                      'handicap_raw',
                      formatHandicap(player.handicap_raw)
                    )}
                  </TableCell>
                  <TableCell>
                    {renderEditableCell(
                      player,
                      'home_course',
                      player.home_course || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={player.plays_yellow_tees}
                        onCheckedChange={() => toggleYellowTees(player.id, player.plays_yellow_tees)}
                        disabled={saving}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Player Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={newPlayer.first_name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, first_name: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={newPlayer.last_name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, last_name: e.target.value })}
                  placeholder="Smith"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="suffix">Suffix</Label>
                <Input
                  id="suffix"
                  value={newPlayer.suffix}
                  onChange={(e) => setNewPlayer({ ...newPlayer, suffix: e.target.value })}
                  placeholder="Jr, Sr, III..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ghin">GHIN</Label>
                <Input
                  id="ghin"
                  value={newPlayer.ghin}
                  onChange={(e) => setNewPlayer({ ...newPlayer, ghin: e.target.value })}
                  placeholder="1234567"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPlayer.email}
                  onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newPlayer.phone}
                  onChange={(e) => setNewPlayer({ ...newPlayer, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="handicap">Handicap Index</Label>
                <Input
                  id="handicap"
                  type="number"
                  value={newPlayer.handicap_raw}
                  onChange={(e) => setNewPlayer({ ...newPlayer, handicap_raw: e.target.value })}
                  placeholder="12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="home_course">Home Course</Label>
                <Input
                  id="home_course"
                  value={newPlayer.home_course}
                  onChange={(e) => setNewPlayer({ ...newPlayer, home_course: e.target.value })}
                  placeholder="Sun Willows - WA"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="yellow_tees"
                checked={newPlayer.plays_yellow_tees}
                onCheckedChange={(checked) => setNewPlayer({ ...newPlayer, plays_yellow_tees: checked as boolean })}
              />
              <Label htmlFor="yellow_tees" className="cursor-pointer">Plays from yellow tees</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlayer} disabled={creating}>
              {creating ? 'Creating...' : 'Create Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
