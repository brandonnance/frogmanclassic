// Tournament Configuration
// Edit this file to customize the tournament for your organization.
// Changes here will propagate throughout the application.

export const tournamentConfig = {
  // Tournament identity
  tournament: {
    name: 'Frogman Classic',
    shortName: 'FROG', // Used in redemption codes: FROG-2026-XXXX
    year: 2026,
    tagline: 'Golf Tournament',
    mission: 'Supporting Our Veterans',
  },

  // Event dates
  dates: {
    // Tournament dates (displayed on homepage)
    display: 'September 11-13, 2026',
    // Individual event dates
    friday: 'Friday, September 11',
    satSun: 'Saturday-Sunday, Sept 12-13',
    // Database start/end dates (ISO format)
    startDate: '2026-09-11',
    endDate: '2026-09-13',
  },

  // Contact information
  contact: {
    // General info email
    infoEmail: 'info@frogmanclassic.com',
    // Email sender address
    fromEmail: 'noreply@frogmanclassic.com',
    // Tournament director
    directorName: 'Drew Goodman',
    directorEmail: 'drew@gameincgc.com',
  },

  // Venue details
  venue: {
    name: 'Sun Willows Golf Course',
    // Discount for venue members
    memberDiscount: 50, // $ amount per member
    memberLabel: 'Sun Willows Golf Course member',
  },

  // Event configurations
  events: {
    friday: {
      name: 'Florida Scramble',
      format: '4-person team format',
      teamSize: 4,
      sponsorOnly: true,
      description:
        'A fun, fast-paced scramble format perfect for teams of all skill levels. Everyone contributes to the team score in this exciting one-day event.',
    },
    satSun: {
      name: '2-Man Best Ball',
      format: '2-person team format',
      teamSize: 2,
      basePrice: 500,
      description:
        'A competitive two-day tournament where partners play their own ball and count the best score on each hole. Test your skills over 36 holes.',
    },
  },

  // Tee time sessions
  sessions: {
    am: {
      label: 'Morning',
      time: '7:30 AM',
    },
    pm: {
      label: 'Afternoon',
      time: '1:00 PM',
    },
  },

  // Branding and charity
  branding: {
    // Charity partner
    charityName: 'Best Defense Foundation',
    charityUrl: 'https://bestdefensefoundation.org/',
    charityTagline: 'Taking Care of the Ones Who Took Care of Us',
    // Theme color (Tailwind class name)
    primaryColor: 'green',
    // Admin sidebar emoji
    logoEmoji: '\uD83D\uDC38', // Frog emoji
    // Footer tagline variations
    footerTagline: 'Supporting Veterans',
    footerTaglineAlt: 'Supporting Navy SEAL Families',
  },

  // Sponsorship
  sponsorship: {
    // Minimum package price that includes entries
    entryPackageMinPrice: 1500,
    // Default starting price for sponsorship CTA
    startingPrice: 500,
    // Check payable to
    checkPayableTo: 'Frogman Classic',
  },

  // Payment methods available
  paymentMethods: [
    { value: 'check', label: 'Check' },
    { value: 'invoice', label: 'Invoice / ACH' },
    { value: 'venmo', label: 'Venmo' },
    { value: 'paypal', label: 'PayPal' },
  ] as const,
} as const

// Helper types
export type PaymentMethodValue = (typeof tournamentConfig.paymentMethods)[number]['value']
export type EventType = 'friday' | 'sat_sun'
export type SessionPref = 'am' | 'pm' | 'none'

// Helper functions for common config access
export function getTournamentFullName(): string {
  return `${tournamentConfig.tournament.name} ${tournamentConfig.tournament.year}`
}

export function getFromEmail(): string {
  return `${tournamentConfig.tournament.name} <${tournamentConfig.contact.fromEmail}>`
}

export function getCodePrefix(): string {
  return tournamentConfig.tournament.shortName
}

export function getSatSunPrice(memberCount: number = 0): number {
  const basePrice = tournamentConfig.events.satSun.basePrice
  const discount = memberCount * tournamentConfig.venue.memberDiscount
  return basePrice - discount
}

export function formatSessionTime(session: 'am' | 'pm'): string {
  const sessionConfig = tournamentConfig.sessions[session]
  return `${sessionConfig.label} (${sessionConfig.time})`
}
