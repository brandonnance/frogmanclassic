'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { sponsorshipPackages, formatPrice } from '@/lib/sponsorship-packages'
import { Check, Star } from 'lucide-react'
import Link from 'next/link'

interface SponsorshipPackagesModalProps {
  trigger?: React.ReactNode
  showCta?: boolean
}

export function SponsorshipPackagesModal({ trigger, showCta = true }: SponsorshipPackagesModalProps) {
  return (
    <Dialog>
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

        <div className="grid gap-4 py-4">
          {sponsorshipPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="border rounded-lg p-4 hover:border-green-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{pkg.name}</h3>
                    {pkg.sealPlay && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        SEAL Play
                      </Badge>
                    )}
                  </div>

                  <ul className="space-y-1">
                    {pkg.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {pkg.includedEntries > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {pkg.includedEntries} Team {pkg.includedEntries === 1 ? 'Entry' : 'Entries'}
                      </Badge>
                    )}
                    {pkg.dinnerTable && (
                      <Badge variant="outline" className="text-xs">
                        Dinner Table
                      </Badge>
                    )}
                    {pkg.dinnerTables && pkg.dinnerTables > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {pkg.dinnerTables} Dinner {pkg.dinnerTables === 1 ? 'Table' : 'Tables'}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-right sm:text-left sm:min-w-[120px]">
                  <div className="text-2xl font-bold text-green-700">
                    {formatPrice(pkg.price)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showCta && (
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
