'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, AlertCircle, XCircle, Home, RefreshCw } from 'lucide-react'
import { PlayerAutocomplete } from '@/components/player-autocomplete'

interface CodeStatus {
  valid: boolean
  available: boolean
  sponsorName?: string
  error?: string
}

interface PlayerInput {
  firstName: string
  lastName: string
  suffix: string
  email: string
  phone: string
  ghin: string
  existingPlayerId?: string
}

const emptyPlayer: PlayerInput = {
  firstName: '',
  lastName: '',
  suffix: '',
  email: '',
  phone: '',
  ghin: ''
}

// Event details (no prices since this is sponsored)
const EVENTS = {
  friday: { label: 'Friday Florida Scramble', players: 4, date: 'Friday, September 11', description: '4-person team, best ball format' },
  sat_sun: { label: 'Saturday/Sunday 2-Man Best Ball', players: 2, date: 'Saturday–Sunday, Sept 12-13', description: '2-person team, 36 holes' },
}

export default function RedeemCodePage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [codeStatus, setCodeStatus] = useState<CodeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [newCode, setNewCode] = useState('')

  const [formData, setFormData] = useState({
    teamName: '',
    eventType: '' as 'friday' | 'sat_sun' | '',
    sessionPref: 'none',
    captainEmail: '',
    players: [{ ...emptyPlayer }, { ...emptyPlayer }, { ...emptyPlayer }, { ...emptyPlayer }]
  })

  const selectedEvent = formData.eventType ? EVENTS[formData.eventType] : null
  const maxPlayers = selectedEvent?.players || 4

  useEffect(() => {
    validateCode()
  }, [code])

  const validateCode = async () => {
    try {
      const response = await fetch(`/api/redeem/${code}/validate`)
      const data = await response.json()
      setCodeStatus(data)
    } catch {
      setCodeStatus({ valid: false, available: false, error: 'Failed to validate code' })
    } finally {
      setLoading(false)
    }
  }

  const updatePlayer = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newPlayers = [...prev.players]
      newPlayers[index] = { ...newPlayers[index], [field]: value }
      return { ...prev, players: newPlayers }
    })
  }

  const setExistingPlayerId = (index: number, id: string | null) => {
    setFormData(prev => {
      const newPlayers = [...prev.players]
      newPlayers[index] = { ...newPlayers[index], existingPlayerId: id || undefined }
      return { ...prev, players: newPlayers }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    // Validate at least one player
    const validPlayers = formData.players
      .slice(0, maxPlayers)
      .filter(p => p.firstName.trim() && p.lastName.trim())

    if (validPlayers.length === 0) {
      setError('Please enter at least one player')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch(`/api/redeem/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: formData.teamName || null,
          eventType: formData.eventType,
          sessionPref: formData.sessionPref,
          captainEmail: formData.captainEmail,
          players: validPlayers
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if code was already used (race condition)
        if (data.error?.includes('already been used') || data.error?.includes('not available')) {
          setCodeStatus({ valid: true, available: false })
          return
        }
        throw new Error(data.error || 'Failed to register team')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-500">Validating your code...</p>
        </div>
      </div>
    )
  }

  // Invalid or used code
  if (!codeStatus?.valid || !codeStatus?.available) {
    const handleTryNewCode = (e: React.FormEvent) => {
      e.preventDefault()
      if (newCode.trim()) {
        router.push(`/redeem/${newCode.trim().toUpperCase()}`)
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <CardTitle>
              {!codeStatus?.valid ? 'Invalid Code' : 'Code Already Used'}
            </CardTitle>
            <CardDescription>
              {!codeStatus?.valid
                ? 'This redemption code does not exist or has expired.'
                : 'This code has already been used to register a team.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{code}</span>
              </p>
              <p className="text-sm text-gray-500">
                If you believe this is an error, please contact your sponsor.
              </p>
            </div>

            <div className="border-t pt-4">
              <form onSubmit={handleTryNewCode} className="space-y-3">
                <Label htmlFor="newCode" className="text-sm font-medium">
                  Try a different code
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="newCode"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="FROG-2026-XXXX"
                    className="font-mono"
                  />
                  <Button type="submit" disabled={!newCode.trim()}>
                    Go
                  </Button>
                </div>
              </form>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle>Team Registered!</CardTitle>
            <CardDescription>
              Your team has been successfully registered for Frogman Classic 2026
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Sponsored by {codeStatus.sponsorName}</strong>
              </p>
              <p className="text-xs text-green-600 mt-1">
                Your entry fee has been covered by your sponsor.
              </p>
            </div>
            <p className="text-sm text-gray-600">
              A confirmation email has been sent. You&apos;ll receive tee time information closer to the event.
            </p>
            <p className="text-sm text-gray-500">
              Thank you for participating!
            </p>
            <div className="pt-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Return to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Valid code - show registration form
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="/frogman-logo.png"
              alt="Frogman Classic"
              width={100}
              height={100}
              className="mx-auto mb-4"
            />
          </Link>
          <h1 className="text-3xl font-bold text-green-800">Register Your Team</h1>
          <p className="text-gray-600 mt-2">Frogman Classic 2026</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-full">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">
              Sponsored by <strong>{codeStatus.sponsorName}</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Event Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Your Event</CardTitle>
              <CardDescription>
                Which event will your team be playing in?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(EVENTS).map(([key, event]) => (
                  <div
                    key={key}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.eventType === key
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-200'
                    }`}
                    onClick={() => setFormData({ ...formData, eventType: key as 'friday' | 'sat_sun' })}
                  >
                    <div className="text-xs text-gray-500 mb-1">{event.date}</div>
                    <div className="font-medium">{event.label}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {event.description}
                    </div>
                    <div className="mt-2 inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                      {event.players}-person team
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Show rest of form only after event is selected */}
          {formData.eventType && (
            <>
              {/* Team Information */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Team Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Team Name (optional)</Label>
                    <Input
                      id="teamName"
                      value={formData.teamName}
                      onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                      placeholder="The Frogmen"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionPref">Session Preference</Label>
                    <Select
                      value={formData.sessionPref}
                      onValueChange={(v) => setFormData({ ...formData, sessionPref: v })}
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
                    <Label htmlFor="captainEmail">Captain Email (for confirmation)</Label>
                    <Input
                      id="captainEmail"
                      type="email"
                      value={formData.captainEmail}
                      onChange={(e) => setFormData({ ...formData, captainEmail: e.target.value })}
                      placeholder="captain@example.com"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Players - dynamically show correct number */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Players</CardTitle>
                  <CardDescription>
                    Enter information for your {maxPlayers}-person team. At least one player is required.
                    Start typing a last name to search existing players.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {formData.players.slice(0, maxPlayers).map((player, index) => (
                    <PlayerAutocomplete
                      key={index}
                      player={player}
                      index={index}
                      updatePlayer={updatePlayer}
                      setExistingPlayerId={setExistingPlayerId}
                      showGhin={formData.eventType === 'sat_sun'}
                      isRequired={index === 0}
                    />
                  ))}
                </CardContent>
              </Card>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitting || !formData.eventType}
              >
                {submitting ? 'Registering Team...' : 'Register Team'}
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
