import { describe, it, expect } from 'vitest'
import {
  calculatePlayingHandicap,
  getGhinStatus,
  computePlayer,
  calculateCombinedHandicap,
  calculateFlights,
  buildTeamWithPlayers,
  getAvailableCredits,
  countCreditsUsed,
  formatHandicap,
  getPlayerName,
  getTeamDisplayName,
} from '@/lib/calculations'
import type { Player, PlayerWithComputed, Team, TeamWithPlayers, Sponsor, SponsorCredit, TeamPlayer } from '@/lib/types'

// Test fixtures
const createPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'player-1',
  first_name: 'John',
  last_name: 'Doe',
  suffix: null,
  email: 'john@example.com',
  phone: '555-1234',
  ghin: '1234567',
  handicap_raw: 10,
  plays_yellow_tees: false,
  home_course: 'Sun Willows',
  last_handicap_update_at: new Date().toISOString(),
  ...overrides,
})

const createTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'team-1',
  event_year_id: 'year-1',
  event_type: 'sat_sun',
  team_name: null,
  sponsor_id: null,
  credit_id: null,
  session_pref: 'am',
  notes: '',
  withdrawn_at: null,
  created_at: new Date().toISOString(),
  ...overrides,
})

const createSponsor = (overrides: Partial<Sponsor> = {}): Sponsor => ({
  id: 'sponsor-1',
  event_year_id: 'year-1',
  name: 'Acme Corp',
  contact_name: 'Jane Smith',
  contact_email: 'jane@acme.com',
  package_id: 'hole_1000',
  payment_method: 'check',
  payment_status: 'paid',
  total_credits: 2,
  credits_used: 1,
  access_token: 'token-123',
  created_at: new Date().toISOString(),
  ...overrides,
})

const createCredit = (overrides: Partial<SponsorCredit> = {}): SponsorCredit => ({
  id: 'credit-1',
  sponsor_id: 'sponsor-1',
  redemption_code: 'FROG-2026-ABCD',
  redeemed_by_team_id: null,
  redeemed_at: null,
  captain_email: null,
  email_sent_at: null,
  created_at: new Date().toISOString(),
  ...overrides,
})

// ============================================
// calculatePlayingHandicap tests
// ============================================
describe('calculatePlayingHandicap', () => {
  it('returns raw handicap when not playing yellow tees', () => {
    const player = createPlayer({ handicap_raw: 15, plays_yellow_tees: false })
    expect(calculatePlayingHandicap(player)).toBe(15)
  })

  it('subtracts 2 from handicap when playing yellow tees', () => {
    const player = createPlayer({ handicap_raw: 15, plays_yellow_tees: true })
    expect(calculatePlayingHandicap(player)).toBe(13)
  })

  it('returns null when handicap_raw is null', () => {
    const player = createPlayer({ handicap_raw: null })
    expect(calculatePlayingHandicap(player)).toBeNull()
  })

  it('handles zero handicap correctly', () => {
    const player = createPlayer({ handicap_raw: 0, plays_yellow_tees: false })
    expect(calculatePlayingHandicap(player)).toBe(0)
  })

  it('handles negative handicap (scratch golfer) with yellow tees', () => {
    const player = createPlayer({ handicap_raw: 2, plays_yellow_tees: true })
    expect(calculatePlayingHandicap(player)).toBe(0)
  })
})

// ============================================
// getGhinStatus tests
// ============================================
describe('getGhinStatus', () => {
  it('returns "missing" when handicap_raw is null', () => {
    const player = createPlayer({ handicap_raw: null })
    expect(getGhinStatus(player)).toBe('missing')
  })

  it('returns "missing" when ghin is "NONE"', () => {
    const player = createPlayer({ ghin: 'NONE' })
    expect(getGhinStatus(player)).toBe('missing')
  })

  it('returns "missing" when ghin is empty string', () => {
    const player = createPlayer({ ghin: '' })
    expect(getGhinStatus(player)).toBe('missing')
  })

  it('returns "fresh" when last update is within 4 days', () => {
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const player = createPlayer({ last_handicap_update_at: twoDaysAgo.toISOString() })
    expect(getGhinStatus(player)).toBe('fresh')
  })

  it('returns "fresh" when last update is exactly 4 days ago', () => {
    const fourDaysAgo = new Date()
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4)
    const player = createPlayer({ last_handicap_update_at: fourDaysAgo.toISOString() })
    expect(getGhinStatus(player)).toBe('fresh')
  })

  it('returns "stale" when last update is more than 4 days ago', () => {
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
    const player = createPlayer({ last_handicap_update_at: fiveDaysAgo.toISOString() })
    expect(getGhinStatus(player)).toBe('stale')
  })

  it('returns "stale" when last_handicap_update_at is null', () => {
    const player = createPlayer({ last_handicap_update_at: null })
    expect(getGhinStatus(player)).toBe('stale')
  })
})

// ============================================
// computePlayer tests
// ============================================
describe('computePlayer', () => {
  it('adds handicap_playing and ghin_status to player', () => {
    const player = createPlayer({ handicap_raw: 12, plays_yellow_tees: false })
    const computed = computePlayer(player)

    expect(computed.handicap_playing).toBe(12)
    expect(computed.ghin_status).toBe('fresh')
    expect(computed.first_name).toBe('John')
  })

  it('handles player with yellow tees', () => {
    const player = createPlayer({ handicap_raw: 12, plays_yellow_tees: true })
    const computed = computePlayer(player)

    expect(computed.handicap_playing).toBe(10) // 12 - 2
  })
})

// ============================================
// calculateCombinedHandicap tests
// ============================================
describe('calculateCombinedHandicap', () => {
  it('sums handicaps of all players', () => {
    const players: PlayerWithComputed[] = [
      { ...createPlayer(), handicap_playing: 10, ghin_status: 'fresh' },
      { ...createPlayer({ id: 'player-2' }), handicap_playing: 15, ghin_status: 'fresh' },
    ]
    expect(calculateCombinedHandicap(players)).toBe(25)
  })

  it('returns null when all players have null handicaps', () => {
    const players: PlayerWithComputed[] = [
      { ...createPlayer(), handicap_playing: null, ghin_status: 'missing' },
      { ...createPlayer({ id: 'player-2' }), handicap_playing: null, ghin_status: 'missing' },
    ]
    expect(calculateCombinedHandicap(players)).toBeNull()
  })

  it('ignores players with null handicaps in sum', () => {
    const players: PlayerWithComputed[] = [
      { ...createPlayer(), handicap_playing: 10, ghin_status: 'fresh' },
      { ...createPlayer({ id: 'player-2' }), handicap_playing: null, ghin_status: 'missing' },
    ]
    expect(calculateCombinedHandicap(players)).toBe(10)
  })

  it('returns null for empty player array', () => {
    expect(calculateCombinedHandicap([])).toBeNull()
  })
})

// ============================================
// calculateFlights tests
// ============================================
describe('calculateFlights', () => {
  const createTeamWithPlayers = (
    id: string,
    combinedHandicap: number | null,
    eventType: 'friday' | 'sat_sun' = 'sat_sun',
    withdrawn: boolean = false
  ): TeamWithPlayers => ({
    ...createTeam({ id, event_type: eventType, withdrawn_at: withdrawn ? new Date().toISOString() : null }),
    players: [],
    combined_handicap: combinedHandicap,
  })

  it('assigns lower handicaps to Flight 1', () => {
    const teams = [
      createTeamWithPlayers('team-1', 10),
      createTeamWithPlayers('team-2', 20),
      createTeamWithPlayers('team-3', 15),
      createTeamWithPlayers('team-4', 25),
    ]

    const flights = calculateFlights(teams)

    expect(flights.get('team-1')).toBe(1) // 10 - lowest
    expect(flights.get('team-3')).toBe(1) // 15 - below median
    expect(flights.get('team-2')).toBe(2) // 20 - above median
    expect(flights.get('team-4')).toBe(2) // 25 - highest
  })

  it('excludes Friday teams from flight calculation', () => {
    const teams = [
      createTeamWithPlayers('team-1', 10, 'friday'),
      createTeamWithPlayers('team-2', 15, 'sat_sun'),
      createTeamWithPlayers('team-3', 20, 'sat_sun'),
    ]

    const flights = calculateFlights(teams)

    expect(flights.has('team-1')).toBe(false) // Friday excluded
    expect(flights.get('team-2')).toBe(1) // Lower handicap = Flight 1
    expect(flights.get('team-3')).toBe(2) // Higher handicap = Flight 2
  })

  it('excludes withdrawn teams from flight calculation', () => {
    const teams = [
      createTeamWithPlayers('team-1', 10, 'sat_sun', true), // Withdrawn
      createTeamWithPlayers('team-2', 15, 'sat_sun'),
      createTeamWithPlayers('team-3', 20, 'sat_sun'),
    ]

    const flights = calculateFlights(teams)

    expect(flights.has('team-1')).toBe(false) // Withdrawn excluded
    expect(flights.get('team-2')).toBe(1)
    expect(flights.get('team-3')).toBe(2)
  })

  it('excludes teams with null handicap from flight calculation', () => {
    const teams = [
      createTeamWithPlayers('team-1', null), // No handicap
      createTeamWithPlayers('team-2', 15),
      createTeamWithPlayers('team-3', 20),
    ]

    const flights = calculateFlights(teams)

    expect(flights.has('team-1')).toBe(false) // Null handicap excluded
    expect(flights.get('team-2')).toBe(1)
    expect(flights.get('team-3')).toBe(2)
  })

  it('returns empty map for no eligible teams', () => {
    const flights = calculateFlights([])
    expect(flights.size).toBe(0)
  })

  it('handles tie at cutoff by including in Flight 1', () => {
    const teams = [
      createTeamWithPlayers('team-1', 10),
      createTeamWithPlayers('team-2', 15),
      createTeamWithPlayers('team-3', 15), // Same as cutoff
      createTeamWithPlayers('team-4', 20),
    ]

    const flights = calculateFlights(teams)

    // With inclusive cutoff, both 15s should be in Flight 1
    expect(flights.get('team-1')).toBe(1)
    expect(flights.get('team-2')).toBe(1)
    expect(flights.get('team-3')).toBe(1)
    expect(flights.get('team-4')).toBe(2)
  })
})

// ============================================
// getAvailableCredits tests
// ============================================
describe('getAvailableCredits', () => {
  it('returns credits that are not redeemed', () => {
    const sponsor = createSponsor()
    const credits = [
      createCredit({ id: 'c1', sponsor_id: 'sponsor-1', redeemed_by_team_id: null }),
      createCredit({ id: 'c2', sponsor_id: 'sponsor-1', redeemed_by_team_id: 'team-1' }),
      createCredit({ id: 'c3', sponsor_id: 'sponsor-1', redeemed_by_team_id: null }),
    ]

    const available = getAvailableCredits(sponsor, credits)

    expect(available).toHaveLength(2)
    expect(available.map(c => c.id)).toEqual(['c1', 'c3'])
  })

  it('excludes credits from other sponsors', () => {
    const sponsor = createSponsor({ id: 'sponsor-1' })
    const credits = [
      createCredit({ id: 'c1', sponsor_id: 'sponsor-1', redeemed_by_team_id: null }),
      createCredit({ id: 'c2', sponsor_id: 'sponsor-2', redeemed_by_team_id: null }),
    ]

    const available = getAvailableCredits(sponsor, credits)

    expect(available).toHaveLength(1)
    expect(available[0].id).toBe('c1')
  })

  it('returns empty array when all credits are redeemed', () => {
    const sponsor = createSponsor()
    const credits = [
      createCredit({ redeemed_by_team_id: 'team-1' }),
      createCredit({ id: 'c2', redeemed_by_team_id: 'team-2' }),
    ]

    expect(getAvailableCredits(sponsor, credits)).toHaveLength(0)
  })
})

// ============================================
// countCreditsUsed tests
// ============================================
describe('countCreditsUsed', () => {
  it('counts redeemed credits for sponsor', () => {
    const sponsor = createSponsor()
    const credits = [
      createCredit({ redeemed_by_team_id: 'team-1' }),
      createCredit({ id: 'c2', redeemed_by_team_id: null }),
      createCredit({ id: 'c3', redeemed_by_team_id: 'team-2' }),
    ]

    expect(countCreditsUsed(sponsor, credits)).toBe(2)
  })

  it('excludes credits from other sponsors', () => {
    const sponsor = createSponsor({ id: 'sponsor-1' })
    const credits = [
      createCredit({ sponsor_id: 'sponsor-1', redeemed_by_team_id: 'team-1' }),
      createCredit({ id: 'c2', sponsor_id: 'sponsor-2', redeemed_by_team_id: 'team-2' }),
    ]

    expect(countCreditsUsed(sponsor, credits)).toBe(1)
  })

  it('returns 0 when no credits are used', () => {
    const sponsor = createSponsor()
    const credits = [
      createCredit({ redeemed_by_team_id: null }),
    ]

    expect(countCreditsUsed(sponsor, credits)).toBe(0)
  })
})

// ============================================
// formatHandicap tests
// ============================================
describe('formatHandicap', () => {
  it('formats positive handicap with plus sign', () => {
    expect(formatHandicap(10)).toBe('+10')
  })

  it('formats zero handicap with plus sign', () => {
    expect(formatHandicap(0)).toBe('+0')
  })

  it('formats negative handicap without additional sign', () => {
    expect(formatHandicap(-2)).toBe('-2')
  })

  it('returns dash for null handicap', () => {
    expect(formatHandicap(null)).toBe('-')
  })
})

// ============================================
// getPlayerName tests
// ============================================
describe('getPlayerName', () => {
  it('combines first and last name', () => {
    const player = createPlayer({ first_name: 'John', last_name: 'Doe' })
    expect(getPlayerName(player)).toBe('John Doe')
  })

  it('handles names with spaces', () => {
    const player = createPlayer({ first_name: 'Mary Ann', last_name: 'Van Der Berg' })
    expect(getPlayerName(player)).toBe('Mary Ann Van Der Berg')
  })
})

// ============================================
// getTeamDisplayName tests
// ============================================
describe('getTeamDisplayName', () => {
  const createFullTeamWithPlayers = (overrides: Partial<TeamWithPlayers> = {}): TeamWithPlayers => ({
    ...createTeam(),
    players: [],
    combined_handicap: 20,
    ...overrides,
  })

  it('returns team_name when set', () => {
    const team = createFullTeamWithPlayers({ team_name: 'The Eagles' })
    expect(getTeamDisplayName(team)).toBe('The Eagles')
  })

  it('returns sponsor name when no team_name but has sponsor', () => {
    const team = createFullTeamWithPlayers({
      team_name: null,
      sponsor: createSponsor({ name: 'Acme Corp' }),
    })
    expect(getTeamDisplayName(team)).toBe('Acme Corp')
  })

  it('returns player last names joined when no team_name or sponsor', () => {
    const team = createFullTeamWithPlayers({
      team_name: null,
      sponsor: undefined,
      players: [
        { ...createPlayer({ last_name: 'Smith' }), handicap_playing: 10, ghin_status: 'fresh', role: 'player' },
        { ...createPlayer({ id: 'p2', last_name: 'Jones' }), handicap_playing: 10, ghin_status: 'fresh', role: 'player' },
      ],
    })
    expect(getTeamDisplayName(team)).toBe('Smith / Jones')
  })

  it('returns "Unnamed Team" when no name, sponsor, or players', () => {
    const team = createFullTeamWithPlayers({
      team_name: null,
      sponsor: undefined,
      players: [],
    })
    expect(getTeamDisplayName(team)).toBe('Unnamed Team')
  })
})
