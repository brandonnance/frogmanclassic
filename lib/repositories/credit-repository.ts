import { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository, RepositoryError } from './base-repository'
import type { SponsorCredit } from '@/lib/types'

export interface CreateCreditData {
  sponsor_id: string
  redemption_code: string
  captain_email?: string | null
}

export class CreditRepository extends BaseRepository {
  constructor(client?: SupabaseClient) {
    super(client)
  }

  async getById(id: string): Promise<SponsorCredit | null> {
    const { data, error } = await this.client
      .from('sponsor_credits')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      this.handleError('fetch credit by id', error)
    }

    return data
  }

  async getByCode(code: string): Promise<SponsorCredit | null> {
    const { data, error } = await this.client
      .from('sponsor_credits')
      .select('*')
      .eq('redemption_code', code)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      this.handleError('fetch credit by code', error)
    }

    return data
  }

  async getBySponsorId(sponsorId: string): Promise<SponsorCredit[]> {
    const { data, error } = await this.client
      .from('sponsor_credits')
      .select('*')
      .eq('sponsor_id', sponsorId)

    if (error) {
      this.handleError('fetch credits by sponsor', error)
    }

    return data ?? []
  }

  async getBySponsorIds(sponsorIds: string[]): Promise<SponsorCredit[]> {
    if (sponsorIds.length === 0) {
      return []
    }

    const { data, error } = await this.client
      .from('sponsor_credits')
      .select('*')
      .in('sponsor_id', sponsorIds)

    if (error) {
      this.handleError('fetch credits by sponsor ids', error)
    }

    return data ?? []
  }

  async create(creditData: CreateCreditData): Promise<SponsorCredit> {
    const { data, error } = await this.client
      .from('sponsor_credits')
      .insert({
        sponsor_id: creditData.sponsor_id,
        redemption_code: creditData.redemption_code,
        captain_email: creditData.captain_email ?? null,
      })
      .select()
      .single()

    if (error || !data) {
      this.handleError('create credit', error)
    }

    return data
  }

  async createMany(credits: CreateCreditData[]): Promise<SponsorCredit[]> {
    if (credits.length === 0) {
      return []
    }

    const { data, error } = await this.client
      .from('sponsor_credits')
      .insert(
        credits.map(c => ({
          sponsor_id: c.sponsor_id,
          redemption_code: c.redemption_code,
          captain_email: c.captain_email ?? null,
        }))
      )
      .select()

    if (error || !data) {
      this.handleError('create credits', error)
    }

    return data
  }

  /**
   * Validate a redemption code and return the credit if available
   * Throws RepositoryError if code is invalid or already redeemed
   */
  async validateCode(code: string): Promise<SponsorCredit> {
    const credit = await this.getByCode(code)

    if (!credit) {
      throw new RepositoryError('Invalid redemption code', 'INVALID_CODE')
    }

    if (credit.redeemed_by_team_id) {
      throw new RepositoryError('This code has already been used', 'CODE_ALREADY_USED')
    }

    return credit
  }

  /**
   * Mark a credit as redeemed by a team
   */
  async redeem(creditId: string, teamId: string, captainEmail: string): Promise<SponsorCredit> {
    const { data, error } = await this.client
      .from('sponsor_credits')
      .update({
        redeemed_by_team_id: teamId,
        redeemed_at: new Date().toISOString(),
        captain_email: captainEmail,
      })
      .eq('id', creditId)
      .select()
      .single()

    if (error || !data) {
      this.handleError('redeem credit', error)
    }

    return data
  }

  /**
   * Mark an email as sent for a credit
   */
  async markEmailSent(creditId: string): Promise<SponsorCredit> {
    const { data, error } = await this.client
      .from('sponsor_credits')
      .update({
        email_sent_at: new Date().toISOString(),
      })
      .eq('id', creditId)
      .select()
      .single()

    if (error || !data) {
      this.handleError('mark email sent', error)
    }

    return data
  }

  /**
   * Delete all credits for a sponsor (used during rollback)
   */
  async deleteBySponsorId(sponsorId: string): Promise<void> {
    const { error } = await this.client
      .from('sponsor_credits')
      .delete()
      .eq('sponsor_id', sponsorId)

    if (error) {
      this.handleError('delete credits by sponsor', error)
    }
  }
}

// Singleton instance for convenience
let creditRepositoryInstance: CreditRepository | null = null

export function getCreditRepository(client?: SupabaseClient): CreditRepository {
  if (client) {
    return new CreditRepository(client)
  }
  if (!creditRepositoryInstance) {
    creditRepositoryInstance = new CreditRepository()
  }
  return creditRepositoryInstance
}
