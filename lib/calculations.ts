import type { Player, PlayerWithComputed, Team, TeamWithPlayers, GhinStatus, Flight, TeamPlayer, Sponsor, SponsorCredit, PlayerRole } from './types'

/**
 * Calculate playing handicap with yellow tee adjustment
 * Yellow tees reduce handicap by 2
 */
export function calculatePlayingHandicap(player: Player): number | null {
  if (player.handicap_raw === null) return null
  return player.plays_yellow_tees
    ? player.handicap_raw - 2
    : player.handicap_raw
}

/**
 * Get GHIN status based on handicap data freshness
 */
export function getGhinStatus(player: Player): GhinStatus {
  // Missing if no handicap or GHIN is 'NONE'
  if (player.handicap_raw === null || player.ghin === 'NONE' || !player.ghin) {
    return 'missing'
  }

  // Check freshness (4 days)
  if (player.last_handicap_update_at) {
    const lastUpdate = new Date(player.last_handicap_update_at)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff <= 4) {
      return 'fresh'
    }
  }

  return 'stale'
}

/**
 * Enhance a player with computed fields
 */
export function computePlayer(player: Player): PlayerWithComputed {
  return {
    ...player,
    handicap_playing: calculatePlayingHandicap(player),
    ghin_status: getGhinStatus(player),
  }
}

/**
 * Calculate combined team handicap
 */
export function calculateCombinedHandicap(players: PlayerWithComputed[]): number | null {
  const handicaps = players.map(p => p.handicap_playing).filter((h): h is number => h !== null)

  if (handicaps.length === 0) return null

  return handicaps.reduce((sum, h) => sum + h, 0)
}

/**
 * Calculate flight assignment for Sat/Sun teams
 * Flight 1: Lower handicaps (better players)
 * Flight 2: Higher handicaps
 *
 * The cutoff uses inclusive rule - all teams with handicap <= midpoint value go to Flight 1
 */
export function calculateFlights(teams: TeamWithPlayers[]): Map<string, Flight> {
  const flightMap = new Map<string, Flight>()

  // Only consider Sat/Sun teams with valid handicaps
  const satSunTeams = teams.filter(
    t => t.event_type === 'sat_sun' &&
    t.withdrawn_at === null &&
    t.combined_handicap !== null
  )

  if (satSunTeams.length === 0) return flightMap

  // Sort by combined handicap ascending
  const sorted = [...satSunTeams].sort((a, b) =>
    (a.combined_handicap ?? 0) - (b.combined_handicap ?? 0)
  )

  // Find midpoint
  const midpointIndex = Math.floor(sorted.length / 2)
  const cutoffHandicap = sorted[midpointIndex - 1]?.combined_handicap ?? 0

  // Assign flights - inclusive cutoff for Flight 1
  for (const team of sorted) {
    if ((team.combined_handicap ?? 0) <= cutoffHandicap) {
      flightMap.set(team.id, 1)
    } else {
      flightMap.set(team.id, 2)
    }
  }

  return flightMap
}

/**
 * Build a full team with players and computed fields
 */
export function buildTeamWithPlayers(
  team: Team,
  teamPlayers: TeamPlayer[],
  players: Player[],
  sponsors: Sponsor[],
  allTeams: Team[]
): TeamWithPlayers {
  // Get players for this team
  const teamPlayerLinks = teamPlayers.filter(tp => tp.team_id === team.id)
  const teamPlayersList = teamPlayerLinks.map(tp => {
    const player = players.find(p => p.id === tp.player_id)
    if (!player) return null
    return {
      ...computePlayer(player),
      role: tp.role,
    }
  }).filter((p): p is (PlayerWithComputed & { role: PlayerRole }) => p !== null)

  // Get sponsor if assigned
  const sponsor = team.sponsor_id
    ? sponsors.find(s => s.id === team.sponsor_id)
    : undefined

  const combined_handicap = calculateCombinedHandicap(teamPlayersList)

  return {
    ...team,
    players: teamPlayersList,
    sponsor,
    combined_handicap,
    // Flight will be calculated separately for all sat/sun teams
  }
}

/**
 * Get available sponsor credits
 */
export function getAvailableCredits(
  sponsor: Sponsor,
  credits: SponsorCredit[]
): SponsorCredit[] {
  return credits.filter(
    c => c.sponsor_id === sponsor.id && c.redeemed_by_team_id === null
  )
}

/**
 * Count credits used by a sponsor
 */
export function countCreditsUsed(
  sponsor: Sponsor,
  credits: SponsorCredit[]
): number {
  return credits.filter(
    c => c.sponsor_id === sponsor.id && c.redeemed_by_team_id !== null
  ).length
}

/**
 * Format handicap for display
 */
export function formatHandicap(handicap: number | null): string {
  if (handicap === null) return '-'
  return handicap >= 0 ? `+${handicap}` : handicap.toString()
}

/**
 * Get full player name
 */
export function getPlayerName(player: Player): string {
  return `${player.first_name} ${player.last_name}`
}

/**
 * Get team display name
 */
export function getTeamDisplayName(team: TeamWithPlayers): string {
  if (team.team_name) return team.team_name
  if (team.sponsor) return team.sponsor.name
  if (team.players.length > 0) {
    return team.players.map(p => p.last_name).join(' / ')
  }
  return 'Unnamed Team'
}
