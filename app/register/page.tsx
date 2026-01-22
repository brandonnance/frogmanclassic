'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle2, AlertCircle, Ticket, DollarSign, Info } from 'lucide-react'
import { PlayerAutocomplete } from '@/components/player-autocomplete'

interface PlayerInput {
  firstName: string
  lastName: string
  suffix: string
  email: string
  phone: string
  ghin: string
  existingPlayerId?: string
  isSunWillowsMember: boolean
}

const emptyPlayer: PlayerInput = {
  firstName: '',
  lastName: '',
  suffix: '',
  email: '',
  phone: '',
  ghin: '',
  isSunWillowsMember: false
}

type PaymentMethod = 'check' | 'invoice' | 'venmo' | 'paypal'

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'check', label: 'Check' },
  { value: 'invoice', label: 'Invoice / ACH' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'paypal', label: 'PayPal' },
]

// Entry fees - Friday is sponsor-only, open registration is Sat/Sun only
const SAT_SUN_EVENT = {
  price: 500,
  label: 'Saturday/Sunday 2-Man Best Ball',
  players: 2,
  date: 'Saturday–Sunday, Sept 12-13',
  sunWillowsDiscount: 50, // $50 off per Sun Willows member
}

export default function RegisterPage() {
  const [hasCode, setHasCode] = useState<boolean | null>(null)
  const [redemptionCode, setRedemptionCode] = useState('')

  const [formData, setFormData] = useState({
    teamName: '',
    eventType: 'sat_sun' as const, // Open registration is Sat/Sun only
    sessionPref: 'none',
    captainEmail: '',
    paymentMethod: '' as PaymentMethod | '',
    players: [{ ...emptyPlayer }, { ...emptyPlayer }] // 2 players for Sat/Sun
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Count Sun Willows members for pricing
  const sunWillowsMemberCount = formData.players.filter(p => p.isSunWillowsMember).length
  const sunWillowsDiscount = sunWillowsMemberCount * SAT_SUN_EVENT.sunWillowsDiscount
  const currentPrice = SAT_SUN_EVENT.price - sunWillowsDiscount
  const maxPlayers = SAT_SUN_EVENT.players

  const updatePlayer = (index: number, field: string, value: string | boolean) => {
    setFormData(prev => {
      const newPlayers = [...prev.players]
      // Handle isSunWillowsMember boolean field
      if (field === 'isSunWillowsMember') {
        newPlayers[index] = { ...newPlayers[index], isSunWillowsMember: value === true || value === 'true' }
      } else {
        newPlayers[index] = { ...newPlayers[index], [field]: value }
      }
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

    const validPlayers = formData.players
      .slice(0, maxPlayers)
      .filter(p => p.firstName.trim() && p.lastName.trim())

    if (validPlayers.length === 0) {
      setError('Please enter at least one player')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: formData.teamName || null,
          eventType: formData.eventType,
          sessionPref: formData.sessionPref,
          captainEmail: formData.captainEmail,
          paymentMethod: formData.paymentMethod,
          sunWillowsMemberCount,
          entryFee: currentPrice,
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

  // Initial choice: Have a code or register without one
  if (hasCode === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card
              className="cursor-pointer hover:border-green-300 transition-colors"
              onClick={() => setHasCode(true)}
            >
              <CardHeader className="text-center pb-2">
                <Ticket className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <CardTitle>I Have a Code</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600">
                  Enter your sponsor-provided redemption code to register your team.
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-green-300 transition-colors"
              onClick={() => setHasCode(false)}
            >
              <CardHeader className="text-center pb-2">
                <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <CardTitle>Register & Pay</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600">
                  Register your team and pay the entry fee directly.
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/" className="hover:text-green-600">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // User has a redemption code - redirect to redeem page
  if (hasCode === true) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
        <div className="max-w-md mx-auto">
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
            <h1 className="text-3xl font-bold text-green-800">Enter Your Code</h1>
            <p className="text-gray-600 mt-2">Frogman Classic 2026</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Redemption Code</CardTitle>
              <CardDescription>
                Enter the code provided by your sponsor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={redemptionCode}
                  onChange={(e) => setRedemptionCode(e.target.value.toUpperCase())}
                  placeholder="FROG-2025-XXXX"
                  className="font-mono text-center text-lg"
                />
              </div>
              <Button
                className="w-full"
                disabled={!redemptionCode.trim()}
                onClick={() => {
                  window.location.href = `/redeem/${redemptionCode.trim()}`
                }}
              >
                Continue
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setHasCode(null)}
              >
                ← Back
              </Button>
            </CardContent>
          </Card>
        </div>
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
              Your team has been registered for Frogman Classic 2026
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Payment Required</p>
                  <p>
                    Payment instructions have been sent to your email. Your registration
                    will be confirmed once payment is received.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              A confirmation email has been sent. You&apos;ll receive tee time information closer to the event.
            </p>
            <Button asChild className="w-full">
              <Link href="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Open registration form
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
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setHasCode(null)}
          >
            ← Back to options
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Event Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Saturday/Sunday 2-Man Best Ball</CardTitle>
              <CardDescription>{SAT_SUN_EVENT.date}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-green-500 bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-700">
                  ${currentPrice}
                  {sunWillowsDiscount > 0 && (
                    <span className="text-sm font-normal text-gray-400 line-through ml-2">
                      ${SAT_SUN_EVENT.price}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  2-person team · 36 holes over 2 days
                </div>
                {sunWillowsDiscount > 0 && (
                  <div className="text-sm text-green-600 mt-1">
                    ${sunWillowsDiscount} Sun Willows member discount applied
                  </div>
                )}
              </div>

              {/* Friday sponsor-only notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Want to play Friday?</p>
                    <p>
                      Friday Florida Scramble entries are only available through sponsorship.
                      Become a Hole Sponsor ($1,500+) to receive a team entry for the Friday event.{' '}
                      <Link href="/sponsor" className="text-amber-700 underline hover:text-amber-900">
                        View sponsorship packages
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rest of form always shown since event is pre-selected */}
          <>
            {/* Team Info */}
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

              {/* Players */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Players</CardTitle>
                  <CardDescription>
                    Enter information for your 2-person team. At least one player is required.
                    Start typing a last name to search existing players.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {formData.players.map((player, index) => (
                    <div key={index} className="space-y-3">
                      <PlayerAutocomplete
                        player={player}
                        index={index}
                        updatePlayer={updatePlayer}
                        setExistingPlayerId={setExistingPlayerId}
                        showGhin={true}
                        isRequired={index === 0}
                      />
                      <div className="flex items-center space-x-3 pl-1">
                        <Checkbox
                          id={`sunWillows-${index}`}
                          checked={player.isSunWillowsMember}
                          onCheckedChange={(checked) =>
                            updatePlayer(index, 'isSunWillowsMember', checked === true)
                          }
                        />
                        <Label htmlFor={`sunWillows-${index}`} className="text-sm cursor-pointer">
                          Sun Willows Golf Course member
                          <span className="text-green-600 ml-1">($50 discount)</span>
                        </Label>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Payment */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Payment</CardTitle>
                  <CardDescription>
                    Entry fee: <strong>${currentPrice}</strong> per team
                    {sunWillowsDiscount > 0 && (
                      <span className="text-green-600 ml-1">(${sunWillowsDiscount} Sun Willows discount applied)</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(v: PaymentMethod) => setFormData({ ...formData, paymentMethod: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.paymentMethod && (
                      <p className="text-sm text-gray-500">
                        Payment instructions will be sent to your email after registration.
                      </p>
                    )}
                  </div>
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
                disabled={submitting || !formData.paymentMethod}
              >
                {submitting ? 'Registering Team...' : `Register Team – $${currentPrice}`}
              </Button>
            </>
        </form>
      </div>
    </div>
  )
}
