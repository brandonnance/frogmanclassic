import { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository, RepositoryError } from './base-repository'
import type { EventYear } from '@/lib/types'

export class EventYearRepository extends BaseRepository {
  constructor(client?: SupabaseClient) {
    super(client)
  }

  async getById(id: string): Promise<EventYear | null> {
    const { data, error } = await this.client
      .from('event_years')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      this.handleError('fetch event year by id', error)
    }

    return data
  }

  async getActive(): Promise<EventYear | null> {
    const { data, error } = await this.client
      .from('event_years')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      this.handleError('fetch active event year', error)
    }

    return data
  }

  /**
   * Get active event year or throw if none exists
   */
  async getActiveOrThrow(): Promise<EventYear> {
    const eventYear = await this.getActive()

    if (!eventYear) {
      throw new RepositoryError('No active event year found', 'NO_ACTIVE_EVENT_YEAR')
    }

    return eventYear
  }

  async getAll(): Promise<EventYear[]> {
    const { data, error } = await this.client
      .from('event_years')
      .select('*')
      .order('year', { ascending: false })

    if (error) {
      this.handleError('fetch all event years', error)
    }

    return data ?? []
  }
}

// Singleton instance for convenience
let eventYearRepositoryInstance: EventYearRepository | null = null

export function getEventYearRepository(client?: SupabaseClient): EventYearRepository {
  if (client) {
    return new EventYearRepository(client)
  }
  if (!eventYearRepositoryInstance) {
    eventYearRepositoryInstance = new EventYearRepository()
  }
  return eventYearRepositoryInstance
}
