import type { SponsorshipPackage } from './types'

export const sponsorshipPackages: SponsorshipPackage[] = [
  {
    id: 'banner',
    name: 'Banner Sponsor',
    price: 500,
    includedEntries: 0,
    benefits: ['Banner on a hole'],
  },
  {
    id: 'hole_1000',
    name: 'Hole Sponsor',
    price: 1000,
    includedEntries: 1,
    benefits: ['Banner on a hole', 'Entry for a team into ONE Frogman event'],
  },
  {
    id: 'event_1500',
    name: 'Event Sponsor',
    price: 1500,
    includedEntries: 1,
    benefits: ['Banner on a hole', 'Entry for a team into BOTH Frogman events'],
  },
  {
    id: 'hole_2500',
    name: 'Hole Sponsor (w/ Dinner Table)',
    price: 2500,
    includedEntries: 1,
    dinnerTable: true,
    benefits: [
      'Banner on a hole',
      'Entry for a team into BOTH Frogman events',
      'Table for 10 at benefit dinner',
    ],
  },
  {
    id: 'golf_cart',
    name: 'Golf Cart Sponsor',
    price: 5000,
    includedEntries: 1,
    sealPlay: true,
    dinnerTable: true,
    benefits: [
      'Logo on every rental cart',
      'Entry for a team into BOTH Frogman events',
      'Play with a SEAL in the Scramble (per request)',
      'Table for 10 at benefit dinner',
    ],
  },
  {
    id: 'driving_range',
    name: 'Driving Range Sponsor',
    price: 5000,
    includedEntries: 1,
    sealPlay: true,
    dinnerTable: true,
    benefits: [
      'Company logo on 5x20 ft banner',
      'Entry for a team into BOTH Frogman events',
      'Play with a SEAL (per request)',
      'Table for 10 at benefit dinner',
    ],
  },
  {
    id: 'tee_block',
    name: 'Tee Block Sponsor',
    price: 7500,
    includedEntries: 1,
    sealPlay: true,
    dinnerTable: true,
    benefits: [
      'Company logo on EVERY tee block',
      'Entry for a team into BOTH Frogman events',
      'Play with a SEAL (per request)',
      'Table for 10 at benefit dinner',
    ],
  },
  {
    id: 'flag',
    name: 'Flag Sponsor',
    price: 7500,
    includedEntries: 1,
    sealPlay: true,
    dinnerTable: true,
    benefits: [
      'Company logo on every flag',
      'Entry for a team into BOTH Frogman events',
      'Play with a SEAL (per request)',
      'Table for 10 at benefit dinner',
    ],
  },
  {
    id: 'seal',
    name: 'SEAL Sponsor',
    price: 7500,
    includedEntries: 1,
    sealPlay: 'both',
    dinnerTable: true,
    benefits: [
      '3x5 ft banner on clubhouse',
      'Entry for a team into BOTH Frogman events',
      'Play with a SEAL for BOTH events (3 days)',
      'Table for 10 at benefit dinner',
    ],
  },
  {
    id: 'tee_prize',
    name: 'Tee Prize Sponsor',
    price: 10000,
    includedEntries: 1,
    dinnerTable: true,
    benefits: [
      'Logo on tee prize swag bags',
      'Company logo on ProV1 balls',
      'Entry for a team into BOTH Frogman events',
      'Table for 10 at benefit dinner',
    ],
  },
  {
    id: 'tournament',
    name: 'Tournament Sponsor',
    price: 20000,
    includedEntries: 5,
    dinnerTables: 1,
    benefits: [
      'Event named after your company',
      '(5) Entries into Frogman events',
      'Company logo on every scorecard',
      'Table for 10 at benefit dinner',
      'Special tee prize with company logo',
    ],
  },
]

export function getPackageById(id: string): SponsorshipPackage | undefined {
  return sponsorshipPackages.find((pkg) => pkg.id === id)
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function getEntryDescription(pkg: SponsorshipPackage): string {
  if (pkg.includedEntries === 0) {
    return 'No team entries included'
  }
  if (pkg.includedEntries === 1) {
    // Check benefits to determine if it's ONE or BOTH events
    const hasBoth = pkg.benefits.some((b) => b.toLowerCase().includes('both'))
    if (hasBoth) {
      return 'Includes entry for a team into BOTH Frogman events'
    }
    return 'Includes entry for a team into ONE Frogman event'
  }
  return `Includes (${pkg.includedEntries}) team entries`
}
