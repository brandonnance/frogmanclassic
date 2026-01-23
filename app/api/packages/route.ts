import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import {
  getSponsorshipPackageRepository,
  getEventYearRepository,
  RepositoryError,
} from '@/lib/repositories'

export async function GET() {
  try {
    const supabase = createServerClient()
    const eventYearRepo = getEventYearRepository(supabase)
    const packageRepo = getSponsorshipPackageRepository(supabase)

    // Get active event year
    const eventYear = await eventYearRepo.getActive()

    if (!eventYear) {
      return NextResponse.json({ packages: [] })
    }

    // Fetch all packages with sponsor counts (including inactive) for admin
    const packages = await packageRepo.getPackagesWithSponsorCounts(eventYear.id, false)

    return NextResponse.json({ packages })
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, price, includedEntries, dinnerTables, sealPlay, benefits, maxSponsors } = body

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const eventYearRepo = getEventYearRepository(supabase)
    const packageRepo = getSponsorshipPackageRepository(supabase)

    // Get active event year
    const eventYear = await eventYearRepo.getActive()

    if (!eventYear) {
      return NextResponse.json(
        { error: 'No active event year found' },
        { status: 500 }
      )
    }

    // Get max display order for the new package
    const maxOrder = await packageRepo.getMaxDisplayOrder(eventYear.id)

    // Create package
    const pkg = await packageRepo.create({
      event_year_id: eventYear.id,
      name,
      price,
      included_entries: includedEntries ?? 0,
      dinner_tables: dinnerTables ?? 0,
      seal_play: sealPlay ?? 'none',
      benefits: benefits ?? [],
      display_order: maxOrder + 1,
      max_sponsors: maxSponsors ?? 0, // 0 = unlimited
    })

    return NextResponse.json({ success: true, package: pkg })
  } catch (error) {
    console.error('Package creation error:', error)

    if (error instanceof RepositoryError) {
      return NextResponse.json(
        { error: 'Failed to create package' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
