import { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository } from './base-repository'
import type { Team, TeamPlayer, EventType, SessionPref, PlayerRole } from '@/lib/types'

export interface CreateTeamData {
  event_year_id: string
  event_type: EventType
  team_name?: string | null
  sponsor_id?: string | null
  credit_id?: string | null
  session_pref?: SessionPref
  notes?: string
}

export interface UpdateTeamData {
  team_name?: string | null
  session_pref?: SessionPref
  notes?: string
  withdrawn_at?: string | null
}

export interface TeamWithRelations extends Team {
  sponsor?: { id: string; name: string } | null
  credit?: { id: string; redemption_code: string } | null
}

export class TeamRepository extends BaseRepository {
  constructor(client?: SupabaseClient) {
    super(client)
  }

  async getById(id: string): Promise<Team | null> {
    const { data, error } = await this.client
      .from('teams')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      this.handleError('fetch team by id', error)
    }

    return data
  }

  async getByEventYear(eventYearId: string): Promise<TeamWithRelations[]> {
    const { data, error } = await this.client
      .from('teams')
      .select(`
        *,
        sponsor:sponsors(id, name),
        credit:sponsor_credits(id, redemption_code)
      `)
      .eq('event_year_id', eventYearId)
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError('fetch teams by event year', error)
    }

    return data ?? []
  }

  async create(teamData: CreateTeamData): Promise<Team> {
    const { data, error } = await this.client
      .from('teams')
      .insert({
        event_year_id: teamData.event_year_id,
        event_type: teamData.event_type,
        team_name: teamData.team_name ?? null,
        sponsor_id: teamData.sponsor_id ?? null,
        credit_id: teamData.credit_id ?? null,
        session_pref: teamData.session_pref ?? 'none',
        notes: teamData.notes ?? '',
      })
      .select()
      .single()

    if (error || !data) {
      this.handleError('create team', error)
    }

    return data
  }

  async update(id: string, updates: UpdateTeamData): Promise<Team> {
    const { data, error } = await this.client
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      this.handleError('update team', error)
    }

    return data
  }

  async withdraw(id: string): Promise<Team> {
    return this.update(id, { withdrawn_at: new Date().toISOString() })
  }

  async reinstate(id: string): Promise<Team> {
    return this.update(id, { withdrawn_at: null })
  }

  // Team-Player relationship methods

  async addPlayer(teamId: string, playerId: string, role: PlayerRole = 'player'): Promise<void> {
    const { error } = await this.client
      .from('team_players')
      .insert({
        team_id: teamId,
        player_id: playerId,
        role,
      })

    if (error) {
      this.handleError('add player to team', error)
    }
  }

  async removePlayer(teamId: string, playerId: string): Promise<void> {
    const { error } = await this.client
      .from('team_players')
      .delete()
      .eq('team_id', teamId)
      .eq('player_id', playerId)

    if (error) {
      this.handleError('remove player from team', error)
    }
  }

  async getTeamPlayers(teamIds: string[]): Promise<TeamPlayer[]> {
    if (teamIds.length === 0) {
      return []
    }

    const { data, error } = await this.client
      .from('team_players')
      .select('*')
      .in('team_id', teamIds)

    if (error) {
      this.handleError('fetch team players', error)
    }

    return data ?? []
  }

  async getPlayersForTeam(teamId: string): Promise<TeamPlayer[]> {
    const { data, error } = await this.client
      .from('team_players')
      .select('*')
      .eq('team_id', teamId)

    if (error) {
      this.handleError('fetch players for team', error)
    }

    return data ?? []
  }
}

// Singleton instance for convenience
let teamRepositoryInstance: TeamRepository | null = null

export function getTeamRepository(client?: SupabaseClient): TeamRepository {
  if (client) {
    return new TeamRepository(client)
  }
  if (!teamRepositoryInstance) {
    teamRepositoryInstance = new TeamRepository()
  }
  return teamRepositoryInstance
}
