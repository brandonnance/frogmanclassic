import { SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase'
import {
  PlayerRepository,
  TeamRepository,
  CreditRepository,
  SponsorRepository,
  EventYearRepository,
  RepositoryError,
} from '@/lib/repositories'
import type { Team, EventType, SessionPref, PlayerInput, PlayerRole } from '@/lib/types'

export interface RegistrationInput {
  teamName?: string | null
  eventType: EventType
  sessionPref?: SessionPref
  captainEmail: string
  players: PlayerInput[]
  // For open registration
  paymentMethod?: string
  sunWillowsMemberCount?: number
  entryFee?: number
}

export interface SponsorRegistrationInput extends RegistrationInput {
  redemptionCode: string
}

export interface RegistrationResult {
  success: true
  teamId: string
  sponsorName?: string
}

export class RegistrationService {
  private playerRepo: PlayerRepository
  private teamRepo: TeamRepository
  private creditRepo: CreditRepository
  private sponsorRepo: SponsorRepository
  private eventYearRepo: EventYearRepository

  constructor(client?: SupabaseClient) {
    const supabase = client ?? createServerClient()
    this.playerRepo = new PlayerRepository(supabase)
    this.teamRepo = new TeamRepository(supabase)
    this.creditRepo = new CreditRepository(supabase)
    this.sponsorRepo = new SponsorRepository(supabase)
    this.eventYearRepo = new EventYearRepository(supabase)
  }

  /**
   * Register a team for open registration (Sat/Sun event)
   * Friday is sponsor-only - this will throw if attempted
   */
  async registerOpenTeam(input: RegistrationInput): Promise<RegistrationResult> {
    // Validate required fields
    if (!input.eventType || !input.captainEmail || !input.players?.length) {
      throw new RepositoryError('Missing required fields', 'VALIDATION_ERROR')
    }

    // Friday is sponsor-only
    if (input.eventType === 'friday') {
      throw new RepositoryError(
        'Friday entries require a sponsor code. Open registration is only available for the Saturday/Sunday event.',
        'FRIDAY_REQUIRES_SPONSOR'
      )
    }

    // Get active event year
    const eventYear = await this.eventYearRepo.getActiveOrThrow()

    // Build notes for the team
    const notes = this.buildOpenRegistrationNotes(input)

    // Create team
    const team = await this.teamRepo.create({
      event_year_id: eventYear.id,
      event_type: input.eventType,
      team_name: input.teamName ?? null,
      sponsor_id: null,
      credit_id: null,
      session_pref: input.sessionPref ?? 'none',
      notes,
    })

    // Create and link players
    await this.createAndLinkPlayers(team.id, input.players)

    return {
      success: true,
      teamId: team.id,
    }
  }

  /**
   * Register a team using a sponsor redemption code
   */
  async registerWithSponsorCode(input: SponsorRegistrationInput): Promise<RegistrationResult> {
    // Validate required fields
    if (!input.eventType || !input.captainEmail || !input.players?.length) {
      throw new RepositoryError('Missing required fields', 'VALIDATION_ERROR')
    }

    // Validate redemption code
    const credit = await this.creditRepo.validateCode(input.redemptionCode)

    // Get sponsor info
    const sponsor = await this.sponsorRepo.getById(credit.sponsor_id)
    if (!sponsor) {
      throw new RepositoryError('Sponsor not found', 'SPONSOR_NOT_FOUND')
    }

    // Create team with sponsor linkage
    const team = await this.teamRepo.create({
      event_year_id: sponsor.event_year_id,
      event_type: input.eventType,
      team_name: input.teamName ?? null,
      sponsor_id: sponsor.id,
      credit_id: credit.id,
      session_pref: input.sessionPref ?? 'none',
    })

    // Create and link players
    await this.createAndLinkPlayers(team.id, input.players)

    // Mark credit as redeemed
    await this.creditRepo.redeem(credit.id, team.id, input.captainEmail)

    return {
      success: true,
      teamId: team.id,
      sponsorName: sponsor.name,
    }
  }

  /**
   * Create players and link them to a team
   * This is the consolidated logic that was duplicated in teams/route.ts and redeem/[code]/route.ts
   */
  private async createAndLinkPlayers(
    teamId: string,
    players: PlayerInput[],
    role: PlayerRole = 'player'
  ): Promise<string[]> {
    const playerIds: string[] = []

    for (const playerData of players) {
      const playerId = await this.playerRepo.createOrGetPlayer(playerData)

      if (playerId) {
        await this.teamRepo.addPlayer(teamId, playerId, role)
        playerIds.push(playerId)
      }
    }

    return playerIds
  }

  /**
   * Build notes string for open registration
   */
  private buildOpenRegistrationNotes(input: RegistrationInput): string {
    const parts: string[] = ['Open registration']

    if (input.entryFee !== undefined) {
      parts.push(`Entry fee: $${input.entryFee}`)
    }

    if (input.paymentMethod) {
      parts.push(`Payment: ${input.paymentMethod}`)
    }

    if (input.sunWillowsMemberCount) {
      parts.push(`Sun Willows members: ${input.sunWillowsMemberCount}`)
    }

    return parts.join('. ')
  }

  /**
   * Get player names for email templates
   */
  static getPlayerNamesForEmail(players: PlayerInput[]): string[] {
    return players
      .filter(p => p.firstName?.trim() && p.lastName?.trim())
      .map(p => `${p.firstName.trim()} ${p.lastName.trim()}`)
  }
}

// Factory function for convenience
export function createRegistrationService(client?: SupabaseClient): RegistrationService {
  return new RegistrationService(client)
}
