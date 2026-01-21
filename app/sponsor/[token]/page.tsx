'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Mail, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

interface Credit {
  id: string
  redemption_code: string
  captain_email: string | null
  redeemed_by_team_id: string | null
  redeemed_at: string | null
  team_name?: string
}

interface SponsorData {
  id: string
  name: string
  contact_name: string
  contact_email: string
  payment_status: string
  total_credits: number
  credits: Credit[]
}

export default function SponsorPortalPage() {
  const params = useParams()
  const token = params.token as string

  const [sponsor, setSponsor] = useState<SponsorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [editingEmail, setEditingEmail] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    fetchSponsor()
  }, [token])

  const fetchSponsor = async () => {
    try {
      const response = await fetch(`/api/sponsors/${token}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Sponsor not found. Please check your link.')
        }
        throw new Error('Failed to load sponsor data')
      }
      const data = await response.json()
      setSponsor(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const sendCodeEmail = async (creditId: string, email: string, code: string) => {
    if (!email) return
    setSendingEmail(creditId)
    try {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'captain_code',
          to: email,
          data: {
            sponsorName: sponsor?.name,
            code,
            redeemUrl: `${window.location.origin}/redeem/${code}`
          }
        })
      })
      // Update email_sent_at in database
      await fetch(`/api/sponsors/${token}/credits/${creditId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_sent: true })
      })
      fetchSponsor()
    } catch (err) {
      console.error('Failed to send email:', err)
    } finally {
      setSendingEmail(null)
    }
  }

  const updateCaptainEmail = async (creditId: string) => {
    if (!newEmail.trim()) return
    try {
      await fetch(`/api/sponsors/${token}/credits/${creditId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captain_email: newEmail })
      })
      setEditingEmail(null)
      setNewEmail('')
      fetchSponsor()
    } catch (err) {
      console.error('Failed to update email:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error || !sponsor) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const usedCredits = sponsor.credits.filter(c => c.redeemed_by_team_id).length
  const availableCredits = sponsor.credits.filter(c => !c.redeemed_by_team_id).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800">Sponsor Portal</h1>
          <p className="text-gray-600 mt-2">{sponsor.name}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-600">{sponsor.total_credits}</div>
              <div className="text-sm text-gray-500">Total Credits</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{availableCredits}</div>
              <div className="text-sm text-gray-500">Available</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-gray-600">{usedCredits}</div>
              <div className="text-sm text-gray-500">Redeemed</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Redemption Codes</CardTitle>
            <CardDescription>
              Share these codes with your team captains to register their teams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sponsor.credits.map((credit) => (
                <div
                  key={credit.id}
                  className={`border rounded-lg p-4 ${
                    credit.redeemed_by_team_id ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="font-mono text-lg">{credit.redemption_code}</div>
                      {credit.redeemed_by_team_id ? (
                        <Badge variant="secondary">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Redeemed
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <Clock className="w-3 h-3 mr-1" />
                          Available
                        </Badge>
                      )}
                    </div>

                    {!credit.redeemed_by_team_id && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyCode(credit.redemption_code)}
                        >
                          {copiedCode === credit.redemption_code ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {credit.redeemed_by_team_id && credit.team_name && (
                    <div className="mt-2 text-sm text-gray-600">
                      Registered: <span className="font-medium">{credit.team_name}</span>
                    </div>
                  )}

                  {!credit.redeemed_by_team_id && (
                    <div className="mt-4 pt-4 border-t">
                      {editingEmail === credit.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="email"
                            placeholder="Captain email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={() => updateCaptainEmail(credit.id)}>
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingEmail(null)
                              setNewEmail('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            {credit.captain_email ? (
                              <span className="text-gray-600">
                                Captain: <span className="font-medium">{credit.captain_email}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400">No captain email set</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingEmail(credit.id)
                                setNewEmail(credit.captain_email || '')
                              }}
                            >
                              {credit.captain_email ? 'Edit' : 'Add Email'}
                            </Button>
                            {credit.captain_email && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={sendingEmail === credit.id}
                                onClick={() =>
                                  sendCodeEmail(credit.id, credit.captain_email!, credit.redemption_code)
                                }
                              >
                                <Mail className="w-4 h-4 mr-1" />
                                {sendingEmail === credit.id ? 'Sending...' : 'Send Code'}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Badge
                  className={
                    sponsor.payment_status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {sponsor.payment_status === 'paid' ? 'Paid' : 'Pending'}
                </Badge>
              </div>
              {sponsor.payment_status !== 'paid' && (
                <p className="text-sm text-gray-500">
                  Payment instructions will be sent separately
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
