import type { Player, Team, Sponsor, SponsorCredit, EventYear, TeamPlayer } from '@/lib/types'

// Player fixtures
export const mockPlayer: Player = {
  id: 'player-1',
  first_name: 'John',
  last_name: 'Doe',
  suffix: null,
  email: 'john@example.com',
  phone: '555-1234',
  ghin: '1234567',
  handicap_raw: 12.5,
  plays_yellow_tees: false,
  home_course: 'Sun Willows Golf Course',
  last_handicap_update_at: '2026-01-01T00:00:00Z',
}

export const mockPlayer2: Player = {
  id: 'player-2',
  first_name: 'Jane',
  last_name: 'Smith',
  suffix: 'Jr',
  email: 'jane@example.com',
  phone: '555-5678',
  ghin: '7654321',
  handicap_raw: 8.2,
  plays_yellow_tees: true,
  home_course: 'Canyon Lakes',
  last_handicap_update_at: '2026-01-01T00:00:00Z',
}

// Event Year fixtures
export const mockEventYear: EventYear = {
  id: 'event-year-2026',
  year: 2026,
  start_date: '2026-09-13',
  end_date: '2026-09-15',
  is_active: true,
}

// Team fixtures
export const mockTeam: Team = {
  id: 'team-1',
  event_year_id: 'event-year-2026',
  event_type: 'sat_sun',
  team_name: 'The Bogeys',
  sponsor_id: null,
  credit_id: null,
  session_pref: 'am',
  notes: 'Open registration',
  withdrawn_at: null,
  created_at: '2026-01-15T10:00:00Z',
}

export const mockSponsoredTeam: Team = {
  id: 'team-2',
  event_year_id: 'event-year-2026',
  event_type: 'friday',
  team_name: 'Team ACME',
  sponsor_id: 'sponsor-1',
  credit_id: 'credit-1',
  session_pref: 'pm',
  notes: '',
  withdrawn_at: null,
  created_at: '2026-01-15T11:00:00Z',
}

// Team Player fixtures
export const mockTeamPlayer: TeamPlayer = {
  team_id: 'team-1',
  player_id: 'player-1',
  role: 'player',
}

// Sponsor fixtures
export const mockSponsor: Sponsor = {
  id: 'sponsor-1',
  event_year_id: 'event-year-2026',
  name: 'ACME Corp',
  contact_name: 'Bob Smith',
  contact_email: 'bob@acme.com',
  package_id: 'birdie',
  payment_method: 'online',
  payment_status: 'paid',
  total_credits: 4,
  credits_used: 1,
  access_token: 'token-abc123',
  created_at: '2026-01-10T09:00:00Z',
}

// Sponsor Credit fixtures
export const mockCredit: SponsorCredit = {
  id: 'credit-1',
  sponsor_id: 'sponsor-1',
  redemption_code: 'FROG-2026-ABCD',
  redeemed_by_team_id: null,
  redeemed_at: null,
  captain_email: null,
  email_sent_at: null,
  created_at: '2026-01-10T09:00:00Z',
}

export const mockRedeemedCredit: SponsorCredit = {
  id: 'credit-2',
  sponsor_id: 'sponsor-1',
  redemption_code: 'FROG-2026-EFGH',
  redeemed_by_team_id: 'team-2',
  redeemed_at: '2026-01-15T11:00:00Z',
  captain_email: 'captain@example.com',
  email_sent_at: '2026-01-15T11:05:00Z',
  created_at: '2026-01-10T09:00:00Z',
}

// Factory functions
export function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return { ...mockPlayer, ...overrides }
}

export function createMockTeam(overrides: Partial<Team> = {}): Team {
  return { ...mockTeam, ...overrides }
}

export function createMockSponsor(overrides: Partial<Sponsor> = {}): Sponsor {
  return { ...mockSponsor, ...overrides }
}

export function createMockCredit(overrides: Partial<SponsorCredit> = {}): SponsorCredit {
  return { ...mockCredit, ...overrides }
}

export function createMockEventYear(overrides: Partial<EventYear> = {}): EventYear {
  return { ...mockEventYear, ...overrides }
}
