'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Star, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface SponsorshipPackage {
  id: string
  name: string
  price: number
  included_entries: number
  dinner_tables: number
  seal_play: 'none' | 'one' | 'both'
  benefits: string[]
  display_order: number
  is_active: boolean
  max_sponsors: number // 0 = unlimited
  sponsor_count: number
}

function isSoldOut(pkg: SponsorshipPackage): boolean {
  return pkg.max_sponsors > 0 && pkg.sponsor_count >= pkg.max_sponsors
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

interface SponsorshipPackagesModalProps {
  trigger?: React.ReactNode
  showCta?: boolean
}

export function SponsorshipPackagesModal({ trigger, showCta = true }: SponsorshipPackagesModalProps) {
  const [packages, setPackages] = useState<SponsorshipPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/packages')
      if (response.ok) {
        const data = await response.json()
        const activePackages = (data.packages || [])
          .filter((p: SponsorshipPackage) => p.is_active)
          .sort((a: SponsorshipPackage, b: SponsorshipPackage) => a.display_order - b.display_order)
        setPackages(activePackages)
      }
    } catch (err) {
      console.error('Failed to load packages:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load packages when dialog opens
  useEffect(() => {
    if (open && packages.length === 0) {
      fetchPackages()
    }
  }, [open, packages.length, fetchPackages])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="lg" className="text-lg px-8">
            View Sponsorship Packages
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Sponsorship Packages</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            {packages.map((pkg) => {
              const soldOut = isSoldOut(pkg)
              return (
                <div
                  key={pkg.id}
                  className={`border rounded-lg p-4 transition-colors relative overflow-hidden ${
                    soldOut
                      ? 'opacity-60 bg-gray-50 border-gray-200'
                      : 'hover:border-green-300'
                  }`}
                >
                  {/* Diagonal strikethrough for sold out packages */}
                  {soldOut && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(to top right, transparent calc(50% - 1px), #d1d5db calc(50% - 1px), #d1d5db calc(50% + 1px), transparent calc(50% + 1px))',
                      }}
                    />
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`font-semibold text-lg ${soldOut ? 'text-gray-500' : ''}`}>
                          {pkg.name}
                        </h3>
                        {soldOut && (
                          <Badge variant="destructive" className="text-xs">
                            SOLD OUT
                          </Badge>
                        )}
                        {pkg.seal_play !== 'none' && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            SEAL Play
                          </Badge>
                        )}
                      </div>

                      <ul className="space-y-1">
                        {pkg.benefits.map((benefit, i) => (
                          <li
                            key={i}
                            className={`flex items-start gap-2 text-sm ${
                              soldOut ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            <Check
                              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                soldOut ? 'text-gray-400' : 'text-green-600'
                              }`}
                            />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {pkg.included_entries > 0 && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${soldOut ? 'text-gray-400 border-gray-300' : ''}`}
                          >
                            {pkg.included_entries} Team {pkg.included_entries === 1 ? 'Entry' : 'Entries'}
                          </Badge>
                        )}
                        {pkg.dinner_tables > 0 && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${soldOut ? 'text-gray-400 border-gray-300' : ''}`}
                          >
                            {pkg.dinner_tables} Dinner {pkg.dinner_tables === 1 ? 'Table' : 'Tables'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-right sm:text-left sm:min-w-[120px]">
                      <div className={`text-2xl font-bold ${soldOut ? 'text-gray-400' : 'text-green-700'}`}>
                        {formatPrice(pkg.price)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {showCta && !loading && (
          <div className="flex justify-center pt-4 border-t">
            <Button asChild size="lg">
              <Link href="/sponsor">
                Become a Sponsor
              </Link>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
