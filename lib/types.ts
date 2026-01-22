// Core entity types based on the Frogman Classic Platform spec

export interface EventYear {
  id: string
  year: number
  start_date: string
  end_date: string
  is_active: boolean
}

export type PaymentMethod = 'online' | 'check' | 'invoice' | 'venmo' | 'paypal'
export type PaymentStatus = 'pending_online' | 'pending_offline' | 'paid'

export interface SponsorshipPackage {
  id: string
  name: string
  price: number
  includedEntries: number
  dinnerTable?: boolean
  dinnerTables?: number
  sealPlay?: boolean | 'both'
  benefits: string[]
}

export interface Sponsor {
  id: string
  event_year_id: string
  name: string
  contact_name: string
  contact_email: string
  package_id: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  total_credits: number
  credits_used: number
  access_token: string
  created_at: string
}

export interface SponsorCredit {
  id: string
  sponsor_id: string
  redemption_code: string
  redeemed_by_team_id: string | null
  redeemed_at: string | null
  captain_email: string | null
  email_sent_at: string | null
  created_at: string
}

export type EventType = 'friday' | 'sat_sun'
export type SessionPref = 'am' | 'pm' | 'none'

export interface Team {
  id: string
  event_year_id: string
  event_type: EventType
  team_name: string | null
  sponsor_id: string | null
  credit_id: string | null
  session_pref: SessionPref
  notes: string
  withdrawn_at: string | null
  created_at: string
}

export type PlayerRole = 'player' | 'seal_guest'

export interface Player {
  id: string
  first_name: string
  last_name: string
  suffix: string | null
  email: string | null
  phone: string | null
  ghin: string
  handicap_raw: number | null
  plays_yellow_tees: boolean
  home_course: string | null
  last_handicap_update_at: string | null
}

// Input type for registration forms
export interface PlayerInput {
  firstName: string
  lastName: string
  suffix: string
  email: string
  phone: string
  ghin: string
  existingPlayerId?: string
}

export interface TeamPlayer {
  team_id: string
  player_id: string
  role: PlayerRole
}

// Computed types
export type GhinStatus = 'fresh' | 'stale' | 'missing'
export type Flight = 1 | 2

export interface PlayerWithComputed extends Player {
  handicap_playing: number | null
  ghin_status: GhinStatus
}

export interface TeamWithPlayers extends Team {
  players: (PlayerWithComputed & { role: PlayerRole })[]
  sponsor?: Sponsor
  combined_handicap: number | null
  flight?: Flight
}

// Tee Sheet types
export type EventDay = 'friday' | 'saturday' | 'sunday'
export type Session = 'am' | 'pm'

export interface TeeSheetSlot {
  id: string
  event_day: EventDay
  session: Session
  hole_number: number
  team_ids: string[]
}

// Store state
export interface StoreState {
  eventYears: EventYear[]
  activeEventYearId: string | null
  sponsors: Sponsor[]
  sponsorCredits: SponsorCredit[]
  teams: Team[]
  players: Player[]
  teamPlayers: TeamPlayer[]
  teeSheetSlots: TeeSheetSlot[]
}
