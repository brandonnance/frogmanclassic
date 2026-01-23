import { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository } from './base-repository'
import type { Sponsor, PaymentMethod, PaymentStatus } from '@/lib/types'

export interface CreateSponsorData {
  event_year_id: string
  name: string
  contact_name: string
  contact_email: string
  package_id: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  total_credits: number
}

export interface UpdateSponsorData {
  name?: string
  contact_name?: string
  contact_email?: string
  payment_status?: PaymentStatus
  total_credits?: number
}

export interface SponsorWithCreditsUsed extends Sponsor {
  credits_used: number
}

export class SponsorRepository extends BaseRepository {
  constructor(client?: SupabaseClient) {
    super(client)
  }

  async getById(id: string): Promise<Sponsor | null> {
    const { data, error } = await this.client
      .from('sponsors')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      this.handleError('fetch sponsor by id', error)
    }

    return data
  }

  async getByAccessToken(token: string): Promise<Sponsor | null> {
    const { data, error } = await this.client
      .from('sponsors')
      .select('*')
      .eq('access_token', token)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      this.handleError('fetch sponsor by access token', error)
    }

    return data
  }

  async getByEventYear(eventYearId: string): Promise<Sponsor[]> {
    const { data, error } = await this.client
      .from('sponsors')
      .select('*')
      .eq('event_year_id', eventYearId)
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError('fetch sponsors by event year', error)
    }

    return data ?? []
  }

  async getByEventYearWithCreditsUsed(eventYearId: string): Promise<SponsorWithCreditsUsed[]> {
    // Get sponsors
    const sponsors = await this.getByEventYear(eventYearId)

    if (sponsors.length === 0) {
      return []
    }

    // Get credits for these sponsors
    const sponsorIds = sponsors.map(s => s.id)
    const { data: credits, error: creditsError } = await this.client
      .from('sponsor_credits')
      .select('sponsor_id, redeemed_by_team_id')
      .in('sponsor_id', sponsorIds)

    if (creditsError) {
      this.handleError('fetch credits for sponsors', creditsError)
    }

    // Calculate credits_used for each sponsor
    return sponsors.map(sponsor => {
      const sponsorCredits = credits?.filter(c => c.sponsor_id === sponsor.id) ?? []
      const creditsUsed = sponsorCredits.filter(c => c.redeemed_by_team_id !== null).length
      return {
        ...sponsor,
        credits_used: creditsUsed,
      }
    })
  }

  async create(sponsorData: CreateSponsorData): Promise<Sponsor> {
    const { data, error } = await this.client
      .from('sponsors')
      .insert({
        event_year_id: sponsorData.event_year_id,
        name: sponsorData.name,
        contact_name: sponsorData.contact_name,
        contact_email: sponsorData.contact_email,
        package_id: sponsorData.package_id,
        payment_method: sponsorData.payment_method,
        payment_status: sponsorData.payment_status,
        total_credits: sponsorData.total_credits,
      })
      .select()
      .single()

    if (error || !data) {
      this.handleError('create sponsor', error)
    }

    return data
  }

  async update(id: string, updates: UpdateSponsorData): Promise<Sponsor> {
    const { data, error } = await this.client
      .from('sponsors')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      this.handleError('update sponsor', error)
    }

    return data
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('sponsors')
      .delete()
      .eq('id', id)

    if (error) {
      this.handleError('delete sponsor', error)
    }
  }

  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Sponsor> {
    return this.update(id, { payment_status: status })
  }
}

// Singleton instance for convenience
let sponsorRepositoryInstance: SponsorRepository | null = null

export function getSponsorRepository(client?: SupabaseClient): SponsorRepository {
  if (client) {
    return new SponsorRepository(client)
  }
  if (!sponsorRepositoryInstance) {
    sponsorRepositoryInstance = new SponsorRepository()
  }
  return sponsorRepositoryInstance
}
