import { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository } from './base-repository'

// Database model for sponsorship packages
export interface SponsorshipPackageDB {
  id: string
  event_year_id: string
  name: string
  price: number
  included_entries: number
  dinner_tables: number
  seal_play: 'none' | 'one' | 'both'
  benefits: string[]
  display_order: number
  is_active: boolean
  max_sponsors: number // 0 = unlimited, positive number = limited
  created_at: string
}

// Package with current sponsor count for availability checking
export interface SponsorshipPackageWithCount extends SponsorshipPackageDB {
  sponsor_count: number
}

export interface CreatePackageData {
  event_year_id: string
  name: string
  price: number
  included_entries?: number
  dinner_tables?: number
  seal_play?: 'none' | 'one' | 'both'
  benefits?: string[]
  display_order?: number
  is_active?: boolean
  max_sponsors?: number // 0 = unlimited
}

export interface UpdatePackageData {
  name?: string
  price?: number
  included_entries?: number
  dinner_tables?: number
  seal_play?: 'none' | 'one' | 'both'
  benefits?: string[]
  display_order?: number
  is_active?: boolean
  max_sponsors?: number // 0 = unlimited
}

export class SponsorshipPackageRepository extends BaseRepository {
  constructor(client?: SupabaseClient) {
    super(client)
  }

  async getById(id: string): Promise<SponsorshipPackageDB | null> {
    const { data, error } = await this.client
      .from('sponsorship_packages')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      this.handleError('fetch package by id', error)
    }

    return data
  }

  async getByEventYear(eventYearId: string, activeOnly = true): Promise<SponsorshipPackageDB[]> {
    let query = this.client
      .from('sponsorship_packages')
      .select('*')
      .eq('event_year_id', eventYearId)
      .order('display_order', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      this.handleError('fetch packages by event year', error)
    }

    return data ?? []
  }

  async getActivePackages(eventYearId: string): Promise<SponsorshipPackageDB[]> {
    return this.getByEventYear(eventYearId, true)
  }

  async getAllPackages(eventYearId: string): Promise<SponsorshipPackageDB[]> {
    return this.getByEventYear(eventYearId, false)
  }

  async create(packageData: CreatePackageData): Promise<SponsorshipPackageDB> {
    const { data, error } = await this.client
      .from('sponsorship_packages')
      .insert({
        event_year_id: packageData.event_year_id,
        name: packageData.name,
        price: packageData.price,
        included_entries: packageData.included_entries ?? 0,
        dinner_tables: packageData.dinner_tables ?? 0,
        seal_play: packageData.seal_play ?? 'none',
        benefits: packageData.benefits ?? [],
        display_order: packageData.display_order ?? 0,
        is_active: packageData.is_active ?? true,
        max_sponsors: packageData.max_sponsors ?? 0,
      })
      .select()
      .single()

    if (error || !data) {
      this.handleError('create package', error)
    }

    return data
  }

  async update(id: string, updates: UpdatePackageData): Promise<SponsorshipPackageDB> {
    const { data, error } = await this.client
      .from('sponsorship_packages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      this.handleError('update package', error)
    }

    return data
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('sponsorship_packages')
      .delete()
      .eq('id', id)

    if (error) {
      this.handleError('delete package', error)
    }
  }

  async toggleActive(id: string, isActive: boolean): Promise<SponsorshipPackageDB> {
    return this.update(id, { is_active: isActive })
  }

  async reorder(id: string, newOrder: number): Promise<SponsorshipPackageDB> {
    return this.update(id, { display_order: newOrder })
  }

  // Get packages with sponsor counts for availability checking
  async getPackagesWithSponsorCounts(eventYearId: string, activeOnly = false): Promise<SponsorshipPackageWithCount[]> {
    // First get all packages
    const packages = await this.getByEventYear(eventYearId, activeOnly)

    if (packages.length === 0) {
      return []
    }

    // Get sponsor counts per package
    const packageIds = packages.map(p => p.id)
    const { data: countData, error: countError } = await this.client
      .from('sponsors')
      .select('package_id')
      .eq('event_year_id', eventYearId)
      .in('package_id', packageIds)

    if (countError) {
      this.handleError('fetch sponsor counts', countError)
    }

    // Build count map
    const countMap = new Map<string, number>()
    for (const row of countData ?? []) {
      const count = countMap.get(row.package_id) || 0
      countMap.set(row.package_id, count + 1)
    }

    // Merge counts with packages
    return packages.map(pkg => ({
      ...pkg,
      sponsor_count: countMap.get(pkg.id) || 0,
    }))
  }

  // Check if a package is available (not full)
  async isPackageAvailable(packageId: string): Promise<boolean> {
    const pkg = await this.getById(packageId)
    if (!pkg || !pkg.is_active) {
      return false
    }

    // If max_sponsors is 0, it's unlimited
    if (pkg.max_sponsors === 0) {
      return true
    }

    // Count current sponsors for this package
    const { count, error } = await this.client
      .from('sponsors')
      .select('*', { count: 'exact', head: true })
      .eq('package_id', packageId)
      .eq('event_year_id', pkg.event_year_id)

    if (error) {
      this.handleError('check package availability', error)
    }

    return (count ?? 0) < pkg.max_sponsors
  }

  async getMaxDisplayOrder(eventYearId: string): Promise<number> {
    const { data, error } = await this.client
      .from('sponsorship_packages')
      .select('display_order')
      .eq('event_year_id', eventYearId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return 0
      }
      this.handleError('fetch max display order', error)
    }

    return data?.display_order ?? 0
  }

  // Clone packages from one event year to another
  async cloneForEventYear(sourceEventYearId: string, targetEventYearId: string): Promise<SponsorshipPackageDB[]> {
    const sourcePackages = await this.getAllPackages(sourceEventYearId)

    if (sourcePackages.length === 0) {
      return []
    }

    const newPackages = sourcePackages.map(pkg => ({
      event_year_id: targetEventYearId,
      name: pkg.name,
      price: pkg.price,
      included_entries: pkg.included_entries,
      dinner_tables: pkg.dinner_tables,
      seal_play: pkg.seal_play,
      benefits: pkg.benefits,
      display_order: pkg.display_order,
      is_active: pkg.is_active,
      max_sponsors: pkg.max_sponsors,
    }))

    const { data, error } = await this.client
      .from('sponsorship_packages')
      .insert(newPackages)
      .select()

    if (error || !data) {
      this.handleError('clone packages for event year', error)
    }

    return data
  }
}

// Singleton instance for convenience
let packageRepositoryInstance: SponsorshipPackageRepository | null = null

export function getSponsorshipPackageRepository(client?: SupabaseClient): SponsorshipPackageRepository {
  if (client) {
    return new SponsorshipPackageRepository(client)
  }
  if (!packageRepositoryInstance) {
    packageRepositoryInstance = new SponsorshipPackageRepository()
  }
  return packageRepositoryInstance
}
