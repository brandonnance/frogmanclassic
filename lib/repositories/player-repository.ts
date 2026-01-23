import { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository, RepositoryError } from './base-repository'
import type { Player, PlayerInput } from '@/lib/types'

export interface CreatePlayerData {
  first_name: string
  last_name: string
  suffix?: string | null
  email?: string | null
  phone?: string | null
  ghin?: string | null
  handicap_raw?: number | null
  plays_yellow_tees?: boolean
  home_course?: string | null
}

export interface UpdatePlayerData {
  first_name?: string
  last_name?: string
  suffix?: string | null
  email?: string | null
  phone?: string | null
  ghin?: string | null
  handicap_raw?: number | null
  plays_yellow_tees?: boolean
  home_course?: string | null
  last_handicap_update_at?: string | null
}

export class PlayerRepository extends BaseRepository {
  constructor(client?: SupabaseClient) {
    super(client)
  }

  async getAll(): Promise<Player[]> {
    const { data, error } = await this.client
      .from('players')
      .select('*')
      .order('last_name', { ascending: true })

    if (error) {
      this.handleError('fetch all players', error)
    }

    return data ?? []
  }

  async getById(id: string): Promise<Player | null> {
    const { data, error } = await this.client
      .from('players')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      this.handleError('fetch player by id', error)
    }

    return data
  }

  async getByIds(ids: string[]): Promise<Player[]> {
    if (ids.length === 0) {
      return []
    }

    const { data, error } = await this.client
      .from('players')
      .select('*')
      .in('id', ids)

    if (error) {
      this.handleError('fetch players by ids', error)
    }

    return data ?? []
  }

  async create(playerData: CreatePlayerData): Promise<Player> {
    const { data, error } = await this.client
      .from('players')
      .insert({
        first_name: playerData.first_name,
        last_name: playerData.last_name,
        suffix: playerData.suffix ?? null,
        email: playerData.email ?? null,
        phone: playerData.phone ?? null,
        ghin: playerData.ghin ?? 'NONE',
        handicap_raw: playerData.handicap_raw ?? null,
        plays_yellow_tees: playerData.plays_yellow_tees ?? false,
        home_course: playerData.home_course ?? null,
      })
      .select()
      .single()

    if (error || !data) {
      this.handleError('create player', error)
    }

    return data
  }

  async update(id: string, updates: UpdatePlayerData): Promise<Player> {
    // Process handicap_raw to handle empty string values
    const processedUpdates = { ...updates }
    if ('handicap_raw' in processedUpdates && processedUpdates.handicap_raw === ('' as unknown)) {
      processedUpdates.handicap_raw = null
    }

    const { data, error } = await this.client
      .from('players')
      .update(processedUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      this.handleError('update player', error)
    }

    return data
  }

  /**
   * Update a player's GHIN only if their current GHIN is null or 'NONE'
   * Returns true if updated, false if skipped
   */
  async updateGhinIfEmpty(id: string, ghin: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('players')
      .update({ ghin })
      .eq('id', id)
      .or('ghin.is.null,ghin.eq.NONE')
      .select()
      .single()

    if (error) {
      // If no rows matched the filter, that's expected
      if (error.code === 'PGRST116') {
        return false
      }
      this.handleError('update player GHIN', error)
    }

    return data !== null
  }

  /**
   * Create a new player or update GHIN for existing player
   * This consolidates the duplicate logic from teams/route.ts and redeem/[code]/route.ts
   *
   * @param playerInput - Player input from registration form
   * @returns The player ID (existing or newly created)
   */
  async createOrGetPlayer(playerInput: PlayerInput): Promise<string | null> {
    const firstName = playerInput.firstName?.trim()
    const lastName = playerInput.lastName?.trim()

    if (!firstName || !lastName) {
      return null
    }

    // If existing player ID provided, use it and optionally update GHIN
    if (playerInput.existingPlayerId) {
      const ghin = playerInput.ghin?.trim()
      if (ghin && ghin !== 'NONE') {
        await this.updateGhinIfEmpty(playerInput.existingPlayerId, ghin)
      }
      return playerInput.existingPlayerId
    }

    // Create new player
    const player = await this.create({
      first_name: firstName,
      last_name: lastName,
      suffix: playerInput.suffix?.trim() || null,
      email: playerInput.email?.trim() || null,
      phone: playerInput.phone?.trim() || null,
      ghin: playerInput.ghin?.trim() || 'NONE',
    })

    return player.id
  }
}

// Singleton instance for convenience
let playerRepositoryInstance: PlayerRepository | null = null

export function getPlayerRepository(client?: SupabaseClient): PlayerRepository {
  if (client) {
    return new PlayerRepository(client)
  }
  if (!playerRepositoryInstance) {
    playerRepositoryInstance = new PlayerRepository()
  }
  return playerRepositoryInstance
}
