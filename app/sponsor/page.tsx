'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, Check, Info, ArrowLeft } from 'lucide-react'
import { sponsorshipPackages, getPackageById, formatPrice, getEntryDescription } from '@/lib/sponsorship-packages'
import { SponsorshipPackagesModal } from '@/components/sponsorship-packages-modal'
import type { PaymentMethod, SponsorshipPackage } from '@/lib/types'

interface FormData {
  companyName: string
  contactName: string
  contactEmail: string
  packageId: string
  paymentMethod: PaymentMethod | ''
}

interface SuccessData {
  sponsorName: string
  packageName: string
  editUrl: string
}

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'online', label: 'Pay Online (coming soon)' },
  { value: 'check', label: 'Check' },
  { value: 'invoice', label: 'Invoice / ACH' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'paypal', label: 'PayPal' },
]

export default function SponsorSignupPage() {
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    contactName: '',
    contactEmail: '',
    packageId: '',
    paymentMethod: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SuccessData | null>(null)

  const selectedPackage = useMemo(() => {
    return formData.packageId ? getPackageById(formData.packageId) : null
  }, [formData.packageId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          packageId: formData.packageId,
          paymentMethod: formData.paymentMethod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create sponsorship')
      }

      setSuccess({
        sponsorName: formData.companyName,
        packageName: selectedPackage?.name || '',
        editUrl: data.editUrl,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Thank You for Your Support!</CardTitle>
            <CardDescription>
              Your {success.packageName} sponsorship for {success.sponsorName} has been registered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">What happens next?</p>
                  <p>
                    A confirmation email has been sent to your email address with details about your sponsorship
                    and a link to manage your included team entries.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Check your inbox for next steps. If you don&apos;t see the email, check your spam folder.
            </p>
            <div className="pt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Become a Frogman Classic Sponsor</CardTitle>
            <CardDescription>
              Support our veterans while enjoying great golf
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company / Sponsor Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Acme Corp"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="John Smith"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="john@acme.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Sponsorship Package */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="packageId">Sponsorship Package</Label>
                  <SponsorshipPackagesModal
                    showCta={false}
                    trigger={
                      <button
                        type="button"
                        className="text-xs text-green-600 hover:text-green-700 hover:underline"
                      >
                        (view all levels)
                      </button>
                    }
                  />
                </div>
                <Select
                  value={formData.packageId}
                  onValueChange={(value) => setFormData({ ...formData, packageId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sponsorship package" />
                  </SelectTrigger>
                  <SelectContent>
                    {sponsorshipPackages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} – {formatPrice(pkg.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Package Details Preview */}
              {selectedPackage && (
                <PackageDetailsPreview pkg={selectedPackage} />
              )}

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: PaymentMethod) => setFormData({ ...formData, paymentMethod: value })}
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

                {formData.paymentMethod === 'online' && (
                  <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    Online payment will be available soon.
                  </p>
                )}
                {formData.paymentMethod && formData.paymentMethod !== 'online' && (
                  <p className="text-sm text-gray-500">
                    Payment instructions will be sent via email.
                  </p>
                )}
              </div>

              {/* Info about team entries */}
              {selectedPackage && selectedPackage.includedEntries > 0 && (
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    After registering, you&apos;ll receive an email with a link to manage your included team entries.
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !formData.packageId || !formData.paymentMethod}
              >
                {isSubmitting ? 'Registering...' : 'Register as Sponsor'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PackageDetailsPreview({ pkg }: { pkg: SponsorshipPackage }) {
  const entryDescription = getEntryDescription(pkg)

  return (
    <div className="bg-green-50 border border-green-100 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-green-800">{pkg.name}</h3>
        <span className="text-lg font-bold text-green-700">{formatPrice(pkg.price)}</span>
      </div>

      <div>
        <p className="text-sm font-medium text-green-700 mb-2">What&apos;s included:</p>
        <ul className="space-y-1.5">
          {pkg.benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-green-800">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {pkg.includedEntries > 0 && (
        <div className="pt-2 border-t border-green-200">
          <p className="text-sm text-green-700">
            <strong>{entryDescription}</strong>
          </p>
          <p className="text-xs text-green-600 mt-1">
            Team entries can be used for Friday OR Saturday/Sunday.
          </p>
        </div>
      )}
    </div>
  )
}
