'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react'

interface CodeStatus {
  valid: boolean
  available: boolean
  sponsorName?: string
  error?: string
}

interface PlayerInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  ghin: string
}

const emptyPlayer: PlayerInput = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  ghin: ''
}

export default function RedeemCodePage() {
  const params = useParams()
  const code = params.code as string

  const [codeStatus, setCodeStatus] = useState<CodeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    teamName: '',
    eventType: 'sat_sun',
    sessionPref: 'none',
    captainEmail: '',
    players: [{ ...emptyPlayer }, { ...emptyPlayer }, { ...emptyPlayer }, { ...emptyPlayer }]
  })

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

  const updatePlayer = (index: number, field: keyof PlayerInput, value: string) => {
    const newPlayers = [...formData.players]
    newPlayers[index] = { ...newPlayers[index], [field]: value }
    setFormData({ ...formData, players: newPlayers })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    // Validate at least one player
    const validPlayers = formData.players.filter(p => p.firstName.trim() && p.lastName.trim())
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
        throw new Error(data.error || 'Failed to register team')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Validating code...</div>
      </div>
    )
  }

  if (!codeStatus?.valid || !codeStatus?.available) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <CardTitle>Invalid or Used Code</CardTitle>
            <CardDescription>
              {!codeStatus?.valid
                ? 'This redemption code does not exist.'
                : 'This code has already been used to register a team.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Code: <span className="font-mono">{code}</span>
            </p>
            <p className="text-sm text-gray-500">
              If you believe this is an error, please contact your sponsor.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              A confirmation email has been sent. You&apos;ll receive tee time information closer to the event.
            </p>
            <p className="text-sm text-gray-500">
              Thank you for participating!
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800">Register Your Team</h1>
          <p className="text-gray-600 mt-2">Frogman Classic 2026</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">
              Sponsored by <strong>{codeStatus.sponsorName}</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="eventType">Event</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(v) => setFormData({ ...formData, eventType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friday">Friday Event</SelectItem>
                      <SelectItem value="sat_sun">Saturday/Sunday Event</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="am">Morning (AM)</SelectItem>
                      <SelectItem value="pm">Afternoon (PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Players</CardTitle>
              <CardDescription>
                Enter information for up to 4 players. At least one player is required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.players.map((player, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Player {index + 1}</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>First Name {index === 0 && '*'}</Label>
                      <Input
                        value={player.firstName}
                        onChange={(e) => updatePlayer(index, 'firstName', e.target.value)}
                        placeholder="John"
                        required={index === 0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name {index === 0 && '*'}</Label>
                      <Input
                        value={player.lastName}
                        onChange={(e) => updatePlayer(index, 'lastName', e.target.value)}
                        placeholder="Smith"
                        required={index === 0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={player.email}
                        onChange={(e) => updatePlayer(index, 'email', e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={player.phone}
                        onChange={(e) => updatePlayer(index, 'phone', e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>GHIN Number</Label>
                      <Input
                        value={player.ghin}
                        onChange={(e) => updatePlayer(index, 'ghin', e.target.value)}
                        placeholder="1234567 or NONE"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? 'Registering Team...' : 'Register Team'}
          </Button>
        </form>
      </div>
    </div>
  )
}
