'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type {
  EventYear, Sponsor, SponsorCredit, Team, Player, TeamPlayer,
  TeeSheetSlot, StoreState, PaymentMethod, PaymentStatus, EventType,
  SessionPref, PlayerRole, EventDay, Session, TeamWithPlayers
} from './types'
import { buildTeamWithPlayers, calculateFlights } from './calculations'

// Generate unique IDs
let idCounter = 1000
export function generateId(): string {
  return `id_${++idCounter}`
}

// Helper to create random date within range
function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString()
}

// Helper to pick random item from array
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Generate initial mock data
function generateMockData(): StoreState {
  // Event Year
  const eventYear: EventYear = {
    id: 'ey_2025',
    year: 2025,
    start_date: '2025-06-13',
    end_date: '2025-06-15',
    is_active: true,
  }

  // Sponsor names for realism
  const sponsorNames = [
    'Acme Golf Supplies', 'Bayside Marina', 'Coastal Bank', 'Delta Engineering',
    'Eagle Eye Security', 'First Federal Credit Union', 'Green Valley Construction',
    'Harbor View Restaurant', 'Island Insurance', 'Johnson & Associates',
    'Keystone Properties', 'Lakeside Auto', 'Mountain View Dental',
    'Newport Brewing Co', 'Oceanside Medical', 'Pacific Coast Realty',
    'Quality Home Services', 'Riverside Financial', 'Sunset Landscaping',
    'Trident Security', 'United Concrete', 'Valley Veterinary', 'Westside Auto Body',
    'Xavier Technologies', 'Yorktown Electric'
  ]

  // Package IDs for sponsors
  const packageIds = ['hole_1000', 'event_1500', 'hole_2500', 'golf_cart', 'driving_range', 'tee_block', 'flag', 'seal', 'tee_prize', 'tournament']

  // Generate sponsors
  const sponsors: Sponsor[] = sponsorNames.map((name, i) => ({
    id: `sponsor_${i + 1}`,
    event_year_id: eventYear.id,
    name,
    contact_name: `${['John', 'Jane', 'Bob', 'Sarah', 'Mike', 'Lisa'][i % 6]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis'][i % 6]}`,
    contact_email: `contact@${name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
    package_id: randomPick(packageIds),
    payment_method: randomPick<PaymentMethod>(['online', 'check', 'invoice', 'venmo', 'paypal']),
    payment_status: randomPick<PaymentStatus>(['pending_offline', 'paid']),
    total_credits: randomPick([1, 1, 1, 5]), // Most packages include 1 entry, tournament includes 5
    credits_used: 0, // Will be calculated
    access_token: `token_${i + 1}_${Math.random().toString(36).substring(7)}`,
    created_at: randomDate(new Date('2025-01-01'), new Date('2025-03-01')),
  }))

  // Generate sponsor credits
  const sponsorCredits: SponsorCredit[] = []
  sponsors.forEach(sponsor => {
    for (let i = 0; i < sponsor.total_credits; i++) {
      const year = new Date().getFullYear()
      const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase()
      sponsorCredits.push({
        id: `credit_${sponsor.id}_${i + 1}`,
        sponsor_id: sponsor.id,
        redemption_code: `FROG-${year}-${randomCode}`,
        redeemed_by_team_id: null,
        redeemed_at: null,
        captain_email: null,
        email_sent_at: null,
        created_at: sponsor.created_at,
      })
    }
  })

  // Real player data from Frogman GHIN List
  // Players marked with plays_yellow_tees: true are over 60 (yellow highlighted in Excel)
  const realPlayerData: { name: string; hi: number | null; ghin: string | null; yellowTees: boolean }[] = [
    { name: 'Kent Hagen', hi: 6, ghin: '12559386', yellowTees: false },
    { name: 'Arnell Garza', hi: 4, ghin: '812324', yellowTees: false },
    { name: 'Brian Barton', hi: 4, ghin: '1988442', yellowTees: false },
    { name: 'Amy Beth Simanton', hi: 4, ghin: '6737739', yellowTees: false },
    { name: 'Ken Wade', hi: 3, ghin: '5693316', yellowTees: true },
    { name: 'Nick Mandell', hi: 3, ghin: null, yellowTees: false },
    { name: 'Tommy Vonghalath', hi: 3, ghin: '11721006', yellowTees: false },
    { name: 'Cormac Meinshausen', hi: 2, ghin: '11405861', yellowTees: false },
    { name: 'Nick Atkin', hi: 1, ghin: '2125000', yellowTees: false },
    { name: 'Ryan Anderson', hi: 1, ghin: '6454631', yellowTees: false },
    { name: 'Pavin Combs', hi: 1, ghin: '1915545', yellowTees: false },
    { name: 'Drew Brayton', hi: 1, ghin: '6870720', yellowTees: false },
    { name: 'Austin Brown', hi: 1, ghin: '6475683', yellowTees: false },
    { name: 'Blake Foster', hi: 0, ghin: '2259031', yellowTees: false },
    { name: 'Wilton Gurrera', hi: 0, ghin: '4065280', yellowTees: false },
    { name: 'Nick Ryther', hi: 0, ghin: '11245313', yellowTees: false },
    { name: 'Mike Rogers', hi: 0, ghin: '7678292', yellowTees: false },
    { name: 'Jeremy Simanton', hi: 1, ghin: '4211016', yellowTees: false },
    { name: 'Drew Goodman', hi: 1, ghin: '5752174', yellowTees: false },
    { name: 'Todd Beyers', hi: 1, ghin: '2485506', yellowTees: true },
    { name: 'Todd Ralston', hi: 1, ghin: '344670', yellowTees: false },
    { name: 'George Mackie', hi: 1, ghin: '2759615', yellowTees: false },
    { name: 'Dan Oberg', hi: 1, ghin: '7154667', yellowTees: false },
    { name: 'Andy Brandt', hi: 1, ghin: '3154869', yellowTees: false },
    { name: 'David Vonghalath', hi: 2, ghin: '637573', yellowTees: false },
    { name: 'Ernie Del Rio', hi: 2, ghin: '1471451', yellowTees: false },
    { name: 'Justin Ratcliffe', hi: 2, ghin: '10892400', yellowTees: false },
    { name: 'Marcus Goodman', hi: 2, ghin: '344669', yellowTees: false },
    { name: 'Joey Edminster', hi: 2, ghin: '5565520', yellowTees: false },
    { name: 'Saul Martinez Jr', hi: 2, ghin: '1470542', yellowTees: false },
    { name: 'Todd Caldwell', hi: 2, ghin: '2150366', yellowTees: false },
    { name: 'Tyler Jensen', hi: 2, ghin: '5204773', yellowTees: false },
    { name: 'Hank Chafin', hi: 2, ghin: '1095384', yellowTees: true },
    { name: 'Rick Gleed', hi: 2, ghin: '2775589', yellowTees: false },
    { name: 'Kyle Thomas', hi: 2, ghin: '1915524', yellowTees: false },
    { name: 'Dan Johnson', hi: 3, ghin: null, yellowTees: false },
    { name: 'Justin Goodman', hi: 3, ghin: '344677', yellowTees: false },
    { name: 'Calvin Nash', hi: 3, ghin: '11233713', yellowTees: false },
    { name: 'Jeremy Bacon', hi: 3, ghin: '344664', yellowTees: false },
    { name: "Luke O'Rourke", hi: 3, ghin: '10481000', yellowTees: false },
    { name: 'Dick Forsyth', hi: 4, ghin: '5826403', yellowTees: true },
    { name: 'Cameron Hardiek', hi: 4, ghin: '2735243', yellowTees: false },
    { name: 'Ryan Keene', hi: 4, ghin: '10752191', yellowTees: false },
    { name: "Dan O'Neil", hi: 4, ghin: '2226017', yellowTees: false },
    { name: 'Kyle Hein', hi: 4, ghin: '7804361', yellowTees: true },
    { name: 'Lars Olsen', hi: 4, ghin: '7392281', yellowTees: true },
    { name: 'Kasey Hutto', hi: 4, ghin: '1731663', yellowTees: false },
    { name: 'Sean Simper', hi: 5, ghin: '7667433', yellowTees: false },
    { name: 'Chris Faris', hi: 5, ghin: '6867462', yellowTees: false },
    { name: 'Saul Martinez Sr', hi: 5, ghin: '6309311', yellowTees: false },
    { name: 'Lee Petty', hi: 5, ghin: '4130096', yellowTees: false },
    { name: 'Dave Garcia', hi: 5, ghin: '11484765', yellowTees: false },
    { name: 'Rudy Ruelas', hi: 5, ghin: '423339', yellowTees: false },
    { name: 'Derek Nelson', hi: 5, ghin: '2708668', yellowTees: false },
    { name: 'Michael Coldren', hi: 5, ghin: '10349638', yellowTees: false },
    { name: 'Lee Schwartz', hi: 5, ghin: '485136', yellowTees: false },
    { name: 'Brice Gordon', hi: 5, ghin: '413185', yellowTees: false },
    { name: 'Josh Brimberry', hi: 5, ghin: '4320271', yellowTees: false },
    { name: 'Jake Schnibbe', hi: 5, ghin: '1245131', yellowTees: false },
    { name: 'Cody Crow', hi: 6, ghin: '11289459', yellowTees: false },
    { name: 'Chris Williams', hi: 6, ghin: '1583423', yellowTees: false },
    { name: 'Darren Markwick', hi: 6, ghin: '2133810', yellowTees: false },
    { name: 'Leo Conrad', hi: 6, ghin: '1906986', yellowTees: true },
    { name: 'Amanda Hendler', hi: 6, ghin: '7667416', yellowTees: false },
    { name: 'Allan Townsend', hi: 6, ghin: '10963229', yellowTees: false },
    { name: 'Julian Villegas', hi: 6, ghin: '4888700', yellowTees: false },
    { name: 'Chuck Bergez', hi: 6, ghin: '10744692', yellowTees: false },
    { name: 'Mark Ness', hi: 6, ghin: '5394800', yellowTees: true },
    { name: 'Matt Smith', hi: 6, ghin: '316860', yellowTees: false },
    { name: 'KC Rallens', hi: 6, ghin: '3078188', yellowTees: false },
    { name: 'Paul Felts', hi: 7, ghin: '2259025', yellowTees: true },
    { name: 'Jamie Monroe', hi: 7, ghin: '2511496', yellowTees: false },
    { name: 'Johnny Cochran', hi: 7, ghin: null, yellowTees: true },
    { name: 'Joel Gilliland', hi: 7, ghin: '5818776', yellowTees: false },
    { name: 'Mike Legard', hi: 7, ghin: '12206229', yellowTees: false },
    { name: 'Chris Klasen', hi: 7, ghin: '485134', yellowTees: false },
    { name: 'Mitch Lenkersdorfer', hi: 7, ghin: '320954', yellowTees: false },
    { name: 'Tyson Best', hi: 7, ghin: '2651728', yellowTees: false },
    { name: 'Simon Josephson', hi: 7, ghin: '10623147', yellowTees: false },
    { name: 'Brandon Nance', hi: 7, ghin: '11503070', yellowTees: false },
    { name: 'Derek Ellig', hi: 8, ghin: '313759', yellowTees: false },
    { name: 'John Plughoff', hi: 8, ghin: '10449412', yellowTees: false },
    { name: 'Andrew Sporcich', hi: 8, ghin: '3090585', yellowTees: false },
    { name: 'Mike Ricard', hi: 8, ghin: '975723', yellowTees: true },
    { name: 'Brett Hisle', hi: 8, ghin: '1319817', yellowTees: false },
    { name: 'Chris Pelletier', hi: 8, ghin: '11225660', yellowTees: false },
    { name: 'Cameron Simpson', hi: 8, ghin: '13006769', yellowTees: false },
    { name: 'Jax Hammond', hi: 8, ghin: '11708431', yellowTees: false },
    { name: 'Brett Gillespie', hi: 9, ghin: '9737244', yellowTees: false },
    { name: 'Paine Garvie', hi: 9, ghin: '2491698', yellowTees: true },
    { name: 'Alex Buggy', hi: 9, ghin: '2798581', yellowTees: false },
    { name: 'Brandon Chavez', hi: 9, ghin: '7049111', yellowTees: false },
    { name: 'Scott Smith', hi: 9, ghin: '12152692', yellowTees: true },
    { name: 'Kelly Akridge', hi: 9, ghin: '1988439', yellowTees: false },
    { name: 'Dwight Rogers', hi: 9, ghin: '5693324', yellowTees: true },
    { name: 'Matt Mahan', hi: 9, ghin: null, yellowTees: false },
    { name: 'Lee Perez', hi: 10, ghin: '4065281', yellowTees: false },
    { name: 'Chuck Barr', hi: 10, ghin: '11491359', yellowTees: false },
    { name: 'Ross Hammond', hi: 10, ghin: '806337', yellowTees: false },
    { name: 'Brian Bradley', hi: 10, ghin: '11726062', yellowTees: false },
    { name: 'Tim Peterson', hi: 10, ghin: null, yellowTees: false },
    { name: 'Justin Miller', hi: 10, ghin: '2547079', yellowTees: false },
    { name: 'Griffen Mead', hi: 10, ghin: '11820881', yellowTees: false },
    { name: 'Wil Ricard', hi: 11, ghin: '10986475', yellowTees: true },
    { name: 'Carah Barr', hi: 11, ghin: '11940215', yellowTees: false },
    { name: 'Zac Clark', hi: 11, ghin: '3029261', yellowTees: false },
    { name: 'Donnie Watts', hi: 11, ghin: '701632', yellowTees: false },
    { name: 'Jay Allen', hi: 12, ghin: '10758642', yellowTees: false },
    { name: 'Dave Legard', hi: 12, ghin: '690269', yellowTees: true },
    { name: 'Drew Clement', hi: 12, ghin: '3103319', yellowTees: false },
    { name: 'Trevor Phelps', hi: 12, ghin: '10500741', yellowTees: false },
    { name: 'Jeff Dietz', hi: 12, ghin: null, yellowTees: false },
    { name: 'Charles Hodges', hi: 12, ghin: '1015017', yellowTees: false },
    { name: 'Boyd Gebers', hi: 12, ghin: '11885297', yellowTees: false },
    { name: 'Cody Grant', hi: 12, ghin: null, yellowTees: false },
    { name: 'Seth Hawkins', hi: 12, ghin: '12337061', yellowTees: false },
    { name: 'Justin Magula', hi: 12, ghin: '10850629', yellowTees: false },
    { name: 'Gary Stanley', hi: 13, ghin: null, yellowTees: true },
    { name: 'John Rasmussen', hi: 13, ghin: '6838389', yellowTees: false },
    { name: 'Danny Flannery', hi: 13, ghin: '11678170', yellowTees: false },
    { name: 'Drayson McDaniel', hi: 13, ghin: '10582415', yellowTees: false },
    { name: 'Kirk Rathbun', hi: 14, ghin: '3072539', yellowTees: false },
    { name: 'Mike Davis', hi: 14, ghin: '11873405', yellowTees: true },
    { name: 'Braxton Collier', hi: 14, ghin: '10801875', yellowTees: false },
    { name: 'Levi Mathews', hi: 14, ghin: '11346582', yellowTees: false },
    { name: 'Steve McNutt', hi: 15, ghin: null, yellowTees: false },
    { name: 'Shane Hummel', hi: 15, ghin: '2888089', yellowTees: false },
    { name: 'Heath Pock', hi: 15, ghin: '12699486', yellowTees: false },
    { name: 'Rick Klontz', hi: 15, ghin: '760695', yellowTees: false },
    { name: 'Tanner Guy', hi: 15, ghin: '11536737', yellowTees: false },
    { name: 'Kyle Haworth', hi: 15, ghin: '11080232', yellowTees: false },
    { name: 'Jordan Esparza', hi: 15, ghin: '12337558', yellowTees: false },
    { name: 'Kyle Koelling', hi: 15, ghin: '10856311', yellowTees: false },
    { name: 'Kyle Lenkersdorfer', hi: 15, ghin: '11536751', yellowTees: false },
    { name: 'Shawn Middleton', hi: 16, ghin: '11330600', yellowTees: false },
    { name: 'Larry Hutchison', hi: 16, ghin: '2259047', yellowTees: true },
    { name: 'Matt McDaniel', hi: 16, ghin: '2038563', yellowTees: false },
    { name: 'Mike Macaloon', hi: 16, ghin: null, yellowTees: false },
    { name: 'Dyllon Smith', hi: 16, ghin: '11525962', yellowTees: false },
    { name: 'Brayton Leach', hi: 17, ghin: '11280188', yellowTees: false },
    { name: 'Tyler Simpson', hi: 17, ghin: '13128469', yellowTees: false },
    { name: 'Dusty Vojta', hi: 17, ghin: '13078838', yellowTees: false },
    { name: 'Mike Rodgers', hi: 17, ghin: '12266932', yellowTees: false },
    { name: 'Ryan Hammond', hi: 18, ghin: '812302', yellowTees: false },
    { name: 'Mason Mahan', hi: 18, ghin: '12959181', yellowTees: false },
    { name: 'Jake Haworth', hi: 18, ghin: '11080860', yellowTees: false },
    { name: 'Cody Galbraith', hi: 19, ghin: '10589833', yellowTees: false },
    { name: 'Billy Lowery', hi: 19, ghin: null, yellowTees: false },
    { name: 'Josh Mead', hi: 20, ghin: '11792459', yellowTees: false },
    { name: 'Brent Buckner', hi: 20, ghin: '11237766', yellowTees: false },
    { name: 'Zamburr Sporcich', hi: 22, ghin: '12739654', yellowTees: false },
    { name: 'Chris Herrera', hi: 24, ghin: '12697599', yellowTees: false },
    { name: 'Aislinn Holland', hi: 24, ghin: '11040482', yellowTees: false },
    { name: 'Dustin Beck', hi: 25, ghin: '11692268', yellowTees: false },
    { name: 'CJ McGreevy', hi: 27, ghin: '12332254', yellowTees: false },
    { name: 'Doug Bezotte', hi: 30, ghin: '11772280', yellowTees: false },
    { name: 'Jason Hayes', hi: 32, ghin: '12219203', yellowTees: false },
    { name: 'Ethan Padilla', hi: 34, ghin: '12862098', yellowTees: false },
    { name: 'Mike Torres', hi: 34, ghin: '11777253', yellowTees: false },
    { name: 'Sydnee Grent', hi: null, ghin: null, yellowTees: false },
    { name: 'Rachel Young', hi: null, ghin: null, yellowTees: false },
    { name: 'Tyler Grant', hi: null, ghin: null, yellowTees: false },
    { name: 'Jalen Whitley', hi: null, ghin: null, yellowTees: false },
    { name: 'Woody', hi: null, ghin: null, yellowTees: false },
    { name: 'Nate', hi: null, ghin: null, yellowTees: false },
    { name: 'Brandon Allen', hi: null, ghin: null, yellowTees: false },
    { name: 'Ricky Graff', hi: null, ghin: null, yellowTees: false },
  ]

  // Generate players from real data
  const players: Player[] = realPlayerData.map((data, i) => {
    const nameParts = data.name.split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || nameParts[0]

    // Set handicap update date - most within last week, some stale
    let lastUpdate: string | null = null
    if (data.ghin && data.hi !== null) {
      const daysAgo = Math.random() > 0.3 ? Math.floor(Math.random() * 4) : Math.floor(Math.random() * 14)
      const updateDate = new Date()
      updateDate.setDate(updateDate.getDate() - daysAgo)
      lastUpdate = updateDate.toISOString()
    }

    return {
      id: `player_${i + 1}`,
      first_name: firstName,
      last_name: lastName,
      email: Math.random() > 0.2 ? `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}@email.com` : null,
      phone: Math.random() > 0.3 ? `(509) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : null,
      ghin: data.ghin || 'NONE',
      handicap_raw: data.hi,
      plays_yellow_tees: data.yellowTees,
      last_handicap_update_at: lastUpdate,
    }
  })

  // Generate teams and team-player associations
  const teams: Team[] = []
  const teamPlayers: TeamPlayer[] = []
  let playerIndex = 0

  // 30 Friday teams (4-5 players each)
  for (let i = 0; i < 30; i++) {
    const teamId = `team_fri_${i + 1}`
    const teamSize = Math.random() > 0.7 ? 5 : 4 // 30% have 5 players
    const hasSponsor = Math.random() > 0.3 // 70% have sponsor

    let sponsorId: string | null = null
    let creditId: string | null = null

    if (hasSponsor) {
      // Find a sponsor with available credits
      const availableCredit = sponsorCredits.find(c => c.redeemed_by_team_id === null)
      if (availableCredit) {
        creditId = availableCredit.id
        sponsorId = availableCredit.sponsor_id
        availableCredit.redeemed_by_team_id = teamId
        availableCredit.redeemed_at = randomDate(new Date('2025-01-01'), new Date('2025-05-01'))
      }
    }

    teams.push({
      id: teamId,
      event_year_id: eventYear.id,
      event_type: 'friday',
      team_name: !hasSponsor ? `Team ${String.fromCharCode(65 + i)}` : null,
      sponsor_id: sponsorId,
      credit_id: creditId,
      session_pref: randomPick<SessionPref>(['am', 'pm', 'none']),
      notes: '',
      withdrawn_at: Math.random() > 0.95 ? new Date().toISOString() : null, // 5% withdrawn
      created_at: randomDate(new Date('2025-01-01'), new Date('2025-05-01')),
    })

    // Assign players
    for (let j = 0; j < teamSize && playerIndex < players.length; j++) {
      teamPlayers.push({
        team_id: teamId,
        player_id: players[playerIndex].id,
        role: j === 4 ? 'seal_guest' : 'player',
      })
      playerIndex++
    }
  }

  // 60 Sat/Sun teams (2 players each)
  for (let i = 0; i < 60; i++) {
    const teamId = `team_ss_${i + 1}`
    const hasSponsor = Math.random() > 0.5 // 50% have sponsor

    let sponsorId: string | null = null
    let creditId: string | null = null

    if (hasSponsor) {
      const availableCredit = sponsorCredits.find(c => c.redeemed_by_team_id === null)
      if (availableCredit) {
        creditId = availableCredit.id
        sponsorId = availableCredit.sponsor_id
        availableCredit.redeemed_by_team_id = teamId
        availableCredit.redeemed_at = randomDate(new Date('2025-01-01'), new Date('2025-05-01'))
      }
    }

    teams.push({
      id: teamId,
      event_year_id: eventYear.id,
      event_type: 'sat_sun',
      team_name: null,
      sponsor_id: sponsorId,
      credit_id: creditId,
      session_pref: randomPick<SessionPref>(['am', 'pm', 'none']),
      notes: '',
      withdrawn_at: Math.random() > 0.95 ? new Date().toISOString() : null,
      created_at: randomDate(new Date('2025-01-01'), new Date('2025-05-01')),
    })

    // Assign 2 players
    for (let j = 0; j < 2 && playerIndex < players.length; j++) {
      teamPlayers.push({
        team_id: teamId,
        player_id: players[playerIndex].id,
        role: 'player',
      })
      playerIndex++
    }
  }

  // Update sponsors' credits_used count
  sponsors.forEach(sponsor => {
    sponsor.credits_used = sponsorCredits.filter(
      c => c.sponsor_id === sponsor.id && c.redeemed_by_team_id !== null
    ).length
  })

  // Generate some tee sheet slots (pre-filled for demo)
  const teeSheetSlots: TeeSheetSlot[] = []
  const days: EventDay[] = ['friday', 'saturday', 'sunday']
  const sessions: Session[] = ['am', 'pm']

  days.forEach(day => {
    sessions.forEach(session => {
      for (let hole = 1; hole <= 18; hole++) {
        teeSheetSlots.push({
          id: `slot_${day}_${session}_${hole}`,
          event_day: day,
          session,
          hole_number: hole,
          team_ids: [],
        })
      }
    })
  })

  return {
    eventYears: [eventYear],
    activeEventYearId: eventYear.id,
    sponsors,
    sponsorCredits,
    teams,
    players,
    teamPlayers,
    teeSheetSlots,
  }
}

// Store context
interface StoreContextType extends StoreState {
  // Player operations
  addPlayer: (player: Omit<Player, 'id'>) => Player
  updatePlayer: (id: string, updates: Partial<Player>) => void
  deletePlayer: (id: string) => void

  // Sponsor operations
  addSponsor: (sponsor: Omit<Sponsor, 'id' | 'credits_used' | 'access_token' | 'created_at'>) => Sponsor
  updateSponsor: (id: string, updates: Partial<Sponsor>) => void
  deleteSponsor: (id: string) => void

  // Team operations
  addTeam: (team: Omit<Team, 'id' | 'created_at'>, playerIds: string[]) => Team
  updateTeam: (id: string, updates: Partial<Team>) => void
  withdrawTeam: (id: string) => void
  deleteTeam: (id: string) => void
  setTeamPlayers: (teamId: string, playerIds: string[], roles?: PlayerRole[]) => void

  // Credit operations
  redeemCredit: (creditId: string, teamId: string) => void
  restoreCredit: (creditId: string) => void

  // Tee sheet operations
  assignTeamToSlot: (slotId: string, teamId: string) => void
  removeTeamFromSlot: (slotId: string, teamId: string) => void

  // Computed data
  getTeamsWithPlayers: () => TeamWithPlayers[]
  getTeamById: (id: string) => TeamWithPlayers | undefined
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(generateMockData)

  // Player operations
  const addPlayer = useCallback((player: Omit<Player, 'id'>): Player => {
    const newPlayer: Player = { ...player, id: generateId() }
    setState(s => ({ ...s, players: [...s.players, newPlayer] }))
    return newPlayer
  }, [])

  const updatePlayer = useCallback((id: string, updates: Partial<Player>) => {
    setState(s => ({
      ...s,
      players: s.players.map(p => p.id === id ? { ...p, ...updates } : p),
    }))
  }, [])

  const deletePlayer = useCallback((id: string) => {
    setState(s => ({
      ...s,
      players: s.players.filter(p => p.id !== id),
      teamPlayers: s.teamPlayers.filter(tp => tp.player_id !== id),
    }))
  }, [])

  // Sponsor operations
  const addSponsor = useCallback((sponsor: Omit<Sponsor, 'id' | 'credits_used' | 'access_token' | 'created_at'>): Sponsor => {
    const now = new Date().toISOString()
    const newSponsor: Sponsor = {
      ...sponsor,
      id: generateId(),
      credits_used: 0,
      access_token: `token_${Math.random().toString(36).substring(2, 15)}`,
      created_at: now,
    }
    const newCredits: SponsorCredit[] = []
    const year = new Date().getFullYear()
    for (let i = 0; i < sponsor.total_credits; i++) {
      const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase()
      newCredits.push({
        id: generateId(),
        sponsor_id: newSponsor.id,
        redemption_code: `FROG-${year}-${randomCode}`,
        redeemed_by_team_id: null,
        redeemed_at: null,
        captain_email: null,
        email_sent_at: null,
        created_at: now,
      })
    }
    setState(s => ({
      ...s,
      sponsors: [...s.sponsors, newSponsor],
      sponsorCredits: [...s.sponsorCredits, ...newCredits],
    }))
    return newSponsor
  }, [])

  const updateSponsor = useCallback((id: string, updates: Partial<Sponsor>) => {
    setState(s => ({
      ...s,
      sponsors: s.sponsors.map(sp => sp.id === id ? { ...sp, ...updates } : sp),
    }))
  }, [])

  const deleteSponsor = useCallback((id: string) => {
    setState(s => ({
      ...s,
      sponsors: s.sponsors.filter(sp => sp.id !== id),
      sponsorCredits: s.sponsorCredits.filter(c => c.sponsor_id !== id),
    }))
  }, [])

  // Team operations
  const addTeam = useCallback((team: Omit<Team, 'id' | 'created_at'>, playerIds: string[]): Team => {
    const newTeam: Team = {
      ...team,
      id: generateId(),
      created_at: new Date().toISOString(),
    }
    const newTeamPlayers: TeamPlayer[] = playerIds.map(pid => ({
      team_id: newTeam.id,
      player_id: pid,
      role: 'player' as PlayerRole,
    }))
    setState(s => ({
      ...s,
      teams: [...s.teams, newTeam],
      teamPlayers: [...s.teamPlayers, ...newTeamPlayers],
    }))
    return newTeam
  }, [])

  const updateTeam = useCallback((id: string, updates: Partial<Team>) => {
    setState(s => ({
      ...s,
      teams: s.teams.map(t => t.id === id ? { ...t, ...updates } : t),
    }))
  }, [])

  const withdrawTeam = useCallback((id: string) => {
    setState(s => {
      const team = s.teams.find(t => t.id === id)
      if (!team) return s

      // Restore credit if used
      const updatedCredits = team.credit_id
        ? s.sponsorCredits.map(c =>
            c.id === team.credit_id
              ? { ...c, redeemed_by_team_id: null, redeemed_at: null }
              : c
          )
        : s.sponsorCredits

      // Update sponsor credits_used
      const updatedSponsors = team.sponsor_id
        ? s.sponsors.map(sp =>
            sp.id === team.sponsor_id
              ? { ...sp, credits_used: sp.credits_used - 1 }
              : sp
          )
        : s.sponsors

      return {
        ...s,
        teams: s.teams.map(t =>
          t.id === id ? { ...t, withdrawn_at: new Date().toISOString() } : t
        ),
        sponsorCredits: updatedCredits,
        sponsors: updatedSponsors,
      }
    })
  }, [])

  const deleteTeam = useCallback((id: string) => {
    setState(s => ({
      ...s,
      teams: s.teams.filter(t => t.id !== id),
      teamPlayers: s.teamPlayers.filter(tp => tp.team_id !== id),
    }))
  }, [])

  const setTeamPlayers = useCallback((teamId: string, playerIds: string[], roles?: PlayerRole[]) => {
    setState(s => ({
      ...s,
      teamPlayers: [
        ...s.teamPlayers.filter(tp => tp.team_id !== teamId),
        ...playerIds.map((pid, i) => ({
          team_id: teamId,
          player_id: pid,
          role: roles?.[i] ?? 'player' as PlayerRole,
        })),
      ],
    }))
  }, [])

  // Credit operations
  const redeemCredit = useCallback((creditId: string, teamId: string) => {
    setState(s => {
      const credit = s.sponsorCredits.find(c => c.id === creditId)
      if (!credit) return s

      return {
        ...s,
        sponsorCredits: s.sponsorCredits.map(c =>
          c.id === creditId
            ? { ...c, redeemed_by_team_id: teamId, redeemed_at: new Date().toISOString() }
            : c
        ),
        sponsors: s.sponsors.map(sp =>
          sp.id === credit.sponsor_id
            ? { ...sp, credits_used: sp.credits_used + 1 }
            : sp
        ),
        teams: s.teams.map(t =>
          t.id === teamId
            ? { ...t, credit_id: creditId, sponsor_id: credit.sponsor_id }
            : t
        ),
      }
    })
  }, [])

  const restoreCredit = useCallback((creditId: string) => {
    setState(s => {
      const credit = s.sponsorCredits.find(c => c.id === creditId)
      if (!credit || !credit.redeemed_by_team_id) return s

      return {
        ...s,
        sponsorCredits: s.sponsorCredits.map(c =>
          c.id === creditId
            ? { ...c, redeemed_by_team_id: null, redeemed_at: null }
            : c
        ),
        sponsors: s.sponsors.map(sp =>
          sp.id === credit.sponsor_id
            ? { ...sp, credits_used: Math.max(0, sp.credits_used - 1) }
            : sp
        ),
        teams: s.teams.map(t =>
          t.credit_id === creditId
            ? { ...t, credit_id: null, sponsor_id: null }
            : t
        ),
      }
    })
  }, [])

  // Tee sheet operations
  const assignTeamToSlot = useCallback((slotId: string, teamId: string) => {
    setState(s => ({
      ...s,
      teeSheetSlots: s.teeSheetSlots.map(slot =>
        slot.id === slotId && !slot.team_ids.includes(teamId)
          ? { ...slot, team_ids: [...slot.team_ids, teamId] }
          : slot
      ),
    }))
  }, [])

  const removeTeamFromSlot = useCallback((slotId: string, teamId: string) => {
    setState(s => ({
      ...s,
      teeSheetSlots: s.teeSheetSlots.map(slot =>
        slot.id === slotId
          ? { ...slot, team_ids: slot.team_ids.filter(id => id !== teamId) }
          : slot
      ),
    }))
  }, [])

  // Computed data
  const getTeamsWithPlayers = useCallback((): TeamWithPlayers[] => {
    const teamsWithPlayers = state.teams.map(team =>
      buildTeamWithPlayers(team, state.teamPlayers, state.players, state.sponsors, state.teams)
    )

    // Calculate flights for sat/sun teams
    const flights = calculateFlights(teamsWithPlayers)
    return teamsWithPlayers.map(team => ({
      ...team,
      flight: flights.get(team.id),
    }))
  }, [state.teams, state.teamPlayers, state.players, state.sponsors])

  const getTeamById = useCallback((id: string): TeamWithPlayers | undefined => {
    const teams = getTeamsWithPlayers()
    return teams.find(t => t.id === id)
  }, [getTeamsWithPlayers])

  const contextValue: StoreContextType = {
    ...state,
    addPlayer,
    updatePlayer,
    deletePlayer,
    addSponsor,
    updateSponsor,
    deleteSponsor,
    addTeam,
    updateTeam,
    withdrawTeam,
    deleteTeam,
    setTeamPlayers,
    redeemCredit,
    restoreCredit,
    assignTeamToSlot,
    removeTeamFromSlot,
    getTeamsWithPlayers,
    getTeamById,
  }

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
