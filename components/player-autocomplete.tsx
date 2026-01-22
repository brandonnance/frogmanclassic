'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, X, User, Plus } from 'lucide-react'
import { usePlayersCache, CachedPlayer } from '@/hooks/use-players-cache'

interface PlayerInputData {
  firstName: string
  lastName: string
  suffix: string
  email: string
  phone: string
  ghin: string
  existingPlayerId?: string
}

interface PlayerAutocompleteProps {
  player: PlayerInputData
  index: number
  updatePlayer: (index: number, field: string, value: string) => void
  setExistingPlayerId: (index: number, id: string | null) => void
  showGhin: boolean
  isRequired: boolean
}

const SUFFIX_OPTIONS = ['', 'Jr', 'Sr', 'II', 'III', 'IV', 'V']

export function PlayerAutocomplete({
  player,
  index,
  updatePlayer,
  setExistingPlayerId,
  showGhin,
  isRequired,
}: PlayerAutocompleteProps) {
  const { search, isLoading: isCacheLoading } = usePlayersCache()
  const [searchResults, setSearchResults] = useState<CachedPlayer[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSelected, setIsSelected] = useState(!!player.existingPlayerId)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Instant local search (no debounce needed)
  useEffect(() => {
    if (isSelected || player.lastName.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    // Instant filtering from cache
    const results = search(player.lastName)
    setSearchResults(results)
    setShowDropdown(true)
  }, [player.lastName, isSelected, search])

  const handleSelectPlayer = (selectedPlayer: CachedPlayer) => {
    updatePlayer(index, 'firstName', selectedPlayer.first_name)
    updatePlayer(index, 'lastName', selectedPlayer.last_name)
    updatePlayer(index, 'suffix', selectedPlayer.suffix || '')
    updatePlayer(index, 'email', selectedPlayer.email || '')
    updatePlayer(index, 'phone', selectedPlayer.phone || '')
    updatePlayer(index, 'ghin', selectedPlayer.ghin || '')
    setExistingPlayerId(index, selectedPlayer.id)
    setIsSelected(true)
    setShowDropdown(false)
  }

  const handleClearSelection = () => {
    updatePlayer(index, 'firstName', '')
    updatePlayer(index, 'lastName', '')
    updatePlayer(index, 'suffix', '')
    updatePlayer(index, 'email', '')
    updatePlayer(index, 'phone', '')
    updatePlayer(index, 'ghin', '')
    setExistingPlayerId(index, null)
    setIsSelected(false)
    inputRef.current?.focus()
  }

  const handleAddAsNew = () => {
    setIsSelected(false)
    setExistingPlayerId(index, null)
    setShowDropdown(false)
  }

  // Build dynamic info line for dropdown
  const getPlayerInfo = (p: CachedPlayer): string => {
    const parts: string[] = []

    // GHIN is always shown
    if (p.ghin && p.ghin !== 'NONE') {
      parts.push(`GHIN: ${p.ghin}`)
    } else {
      parts.push('No GHIN')
    }

    // Email only if exists
    if (p.email) {
      parts.push(p.email)
    }

    // Phone only if exists
    if (p.phone) {
      parts.push(p.phone)
    }

    return parts.join(' · ')
  }

  // Check if existing player needs GHIN for Sat/Sun event
  const needsGhin = showGhin && isSelected && (!player.ghin || player.ghin === 'NONE')

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium">Player {index + 1}</h4>
        {isSelected && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear & enter new
          </button>
        )}
      </div>

      {isSelected && (
        <div className="mb-3 bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
          <User className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700">
            Existing player selected - fields auto-filled
          </span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Last Name with Autocomplete */}
        <div className="space-y-2 relative" ref={dropdownRef}>
          <Label>Last Name {isRequired && '*'}</Label>
          <Input
            ref={inputRef}
            value={player.lastName}
            onChange={(e) => {
              updatePlayer(index, 'lastName', e.target.value)
              if (isSelected) {
                setIsSelected(false)
                setExistingPlayerId(index, null)
              }
            }}
            placeholder="Smith"
            required={isRequired}
            autoComplete="off"
          />
          {isCacheLoading && player.lastName.length >= 2 && (
            <div className="absolute right-3 top-9 text-gray-400 text-sm">
              Loading...
            </div>
          )}

          {/* Autocomplete Dropdown */}
          {showDropdown && (searchResults.length > 0 || player.lastName.length >= 2) && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleSelectPlayer(result)}
                  className="w-full px-3 py-2 text-left hover:bg-green-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">
                    {result.last_name}, {result.first_name}
                    {result.suffix && ` ${result.suffix}`}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getPlayerInfo(result)}
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddAsNew}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-green-700"
              >
                <Plus className="w-4 h-4" />
                Add &quot;{player.lastName}&quot; as new player
              </button>
            </div>
          )}
        </div>

        {/* First Name */}
        <div className="space-y-2">
          <Label>First Name {isRequired && '*'}</Label>
          <Input
            value={player.firstName}
            onChange={(e) => updatePlayer(index, 'firstName', e.target.value)}
            placeholder="John"
            required={isRequired}
            disabled={isSelected}
            className={isSelected ? 'bg-gray-50' : ''}
          />
        </div>

        {/* Suffix */}
        <div className="space-y-2">
          <Label>Suffix</Label>
          <Select
            value={player.suffix}
            onValueChange={(v) => updatePlayer(index, 'suffix', v)}
            disabled={isSelected}
          >
            <SelectTrigger className={isSelected ? 'bg-gray-50' : ''}>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {SUFFIX_OPTIONS.map((suffix) => (
                <SelectItem key={suffix || 'none'} value={suffix || 'none'}>
                  {suffix || 'None'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={player.email}
            onChange={(e) => updatePlayer(index, 'email', e.target.value)}
            placeholder="john@example.com"
            disabled={isSelected}
            className={isSelected ? 'bg-gray-50' : ''}
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={player.phone}
            onChange={(e) => updatePlayer(index, 'phone', e.target.value)}
            placeholder="(555) 123-4567"
            disabled={isSelected}
            className={isSelected ? 'bg-gray-50' : ''}
          />
        </div>

        {/* GHIN - Only show for Sat/Sun events */}
        {showGhin && (
          <div className="space-y-2">
            <Label>
              GHIN Number
              {needsGhin && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              value={player.ghin}
              onChange={(e) => updatePlayer(index, 'ghin', e.target.value)}
              placeholder="1234567 or NONE"
              required={needsGhin}
              className={needsGhin ? 'border-amber-300 focus:border-amber-500' : ''}
            />
          </div>
        )}
      </div>

      {/* GHIN Warning for existing player without GHIN on Sat/Sun */}
      {needsGhin && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">GHIN Required</p>
              <p>
                This player doesn&apos;t have a GHIN on file. Please enter their GHIN number
                (or &quot;NONE&quot; if they don&apos;t have one).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
