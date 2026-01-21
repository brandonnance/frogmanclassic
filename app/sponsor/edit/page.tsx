'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Copy, Send, Loader2, AlertCircle } from 'lucide-react'
import { getPackageById, formatPrice } from '@/lib/sponsorship-packages'

interface SponsorCredit {
  id: string
  redemption_code: string
  redeemed_by_team_id: string | null
  redeemed_at: string | null
  captain_email: string | null
  email_sent_at: string | null
}

interface SponsorData {
  id: string
  name: string
  contact_name: string
  contact_email: string
  package_id: string
  payment_method: string
  payment_status: string
  total_credits: number
  credits: SponsorCredit[]
}

type EntryStatus = 'available' | 'invite_sent' | 'redeemed'

function getEntryStatus(credit: SponsorCredit): EntryStatus {
  if (credit.redeemed_by_team_id) return 'redeemed'
  if (credit.email_sent_at) return 'invite_sent'
  return 'available'
}

function StatusBadge({ status }: { status: EntryStatus }) {
  switch (status) {
    case 'available':
      return <Badge variant="outline" className="text-gray-600 border-gray-300">Available</Badge>
    case 'invite_sent':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Invite Sent</Badge>
    case 'redeemed':
      return <Badge variant="success" className="bg-green-100 text-green-700">Redeemed</Badge>
  }
}

function SponsorEditContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [sponsor, setSponsor] = useState<SponsorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [captainEmails, setCaptainEmails] = useState<Record<string, string>>({})
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const fetchSponsor = useCallback(async () => {
    if (!token) {
      setError('Invalid access link')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/sponsors/edit?token=${token}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load sponsor data')
      }

      setSponsor(data.sponsor)
      // Initialize captain emails from existing data
      const emails: Record<string, string> = {}
      data.sponsor.credits.forEach((credit: SponsorCredit) => {
        emails[credit.id] = credit.captain_email || ''
      })
      setCaptainEmails(emails)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sponsor data')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchSponsor()
  }, [fetchSponsor])

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/redeem/${code}`)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSendInvite = async (creditId: string) => {
    const email = captainEmails[creditId]
    if (!email || !email.trim()) {
      alert('Please enter a captain email address')
      return
    }

    setSendingEmail(creditId)

    try {
      const response = await fetch(`/api/sponsors/edit/credits/${creditId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          captainEmail: email.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite')
      }

      // Refresh sponsor data
      await fetchSponsor()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setSendingEmail(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (error || !sponsor) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <div>
                <p className="font-medium">Unable to Load Sponsorship</p>
                <p className="text-sm text-gray-600">{error || 'Sponsor not found'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pkg = getPackageById(sponsor.package_id)

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{sponsor.name}</CardTitle>
                <CardDescription>
                  {pkg?.name || 'Sponsorship'} {pkg && `– ${formatPrice(pkg.price)}`}
                </CardDescription>
              </div>
              <Badge
                variant={sponsor.payment_status === 'paid' ? 'success' : 'secondary'}
                className={sponsor.payment_status === 'paid' ? 'bg-green-100 text-green-700' : ''}
              >
                {sponsor.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Contact</p>
                <p className="font-medium">{sponsor.contact_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{sponsor.contact_email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Entry Management */}
        {sponsor.total_credits > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Team Entry Management</CardTitle>
              <CardDescription>
                Manage your {sponsor.total_credits} included team {sponsor.total_credits === 1 ? 'entry' : 'entries'}.
                Send invite links to team captains or copy links to share directly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sponsor.credits.map((credit, index) => {
                const status = getEntryStatus(credit)
                const isRedeemed = status === 'redeemed'

                return (
                  <div
                    key={credit.id}
                    className={`p-4 rounded-lg border ${
                      isRedeemed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-700">
                        Team Entry {index + 1}
                      </span>
                      <StatusBadge status={status} />
                    </div>

                    {isRedeemed ? (
                      <p className="text-sm text-green-700">
                        This entry has been redeemed{credit.captain_email ? ` by ${credit.captain_email}` : ''}.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label htmlFor={`email-${credit.id}`} className="sr-only">
                              Captain Email
                            </Label>
                            <Input
                              id={`email-${credit.id}`}
                              type="email"
                              placeholder="Enter team captain email"
                              value={captainEmails[credit.id] || ''}
                              onChange={(e) =>
                                setCaptainEmails({
                                  ...captainEmails,
                                  [credit.id]: e.target.value,
                                })
                              }
                              disabled={sendingEmail === credit.id}
                            />
                          </div>
                          <Button
                            variant="default"
                            size="icon"
                            onClick={() => handleSendInvite(credit.id)}
                            disabled={sendingEmail === credit.id || !captainEmails[credit.id]?.trim()}
                            title="Send invite email"
                          >
                            {sendingEmail === credit.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded px-3 py-2 font-mono text-sm">
                            {credit.redemption_code}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyCode(credit.redemption_code)}
                            className="flex items-center gap-1"
                          >
                            {copiedCode === credit.redemption_code ? (
                              <>
                                <Check className="w-4 h-4 text-green-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </Button>
                        </div>

                        {status === 'invite_sent' && credit.captain_email && (
                          <p className="text-xs text-blue-600">
                            Invite sent to {credit.captain_email}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Package Benefits */}
        {pkg && (
          <Card>
            <CardHeader>
              <CardTitle>Your Sponsorship Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {pkg.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Help */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Questions? Contact us at{' '}
            <a href="mailto:info@frogmanclassic.com" className="text-green-600 hover:underline">
              info@frogmanclassic.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SponsorEditPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      }
    >
      <SponsorEditContent />
    </Suspense>
  )
}
