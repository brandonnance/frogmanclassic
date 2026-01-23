import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import {
  getSponsorshipPackageRepository,
  RepositoryError,
} from '@/lib/repositories'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()
    const packageRepo = getSponsorshipPackageRepository(supabase)

    const pkg = await packageRepo.getById(id)

    if (!pkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ package: pkg })
  } catch (error) {
    console.error('Error fetching package:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, price, includedEntries, dinnerTables, sealPlay, benefits, isActive, displayOrder } = body

    const supabase = createServerClient()
    const packageRepo = getSponsorshipPackageRepository(supabase)

    // Verify package exists
    const existingPkg = await packageRepo.getById(id)
    if (!existingPkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (price !== undefined) updates.price = price
    if (includedEntries !== undefined) updates.included_entries = includedEntries
    if (dinnerTables !== undefined) updates.dinner_tables = dinnerTables
    if (sealPlay !== undefined) updates.seal_play = sealPlay
    if (benefits !== undefined) updates.benefits = benefits
    if (isActive !== undefined) updates.is_active = isActive
    if (displayOrder !== undefined) updates.display_order = displayOrder

    const pkg = await packageRepo.update(id, updates)

    return NextResponse.json({ success: true, package: pkg })
  } catch (error) {
    console.error('Package update error:', error)

    if (error instanceof RepositoryError) {
      return NextResponse.json(
        { error: 'Failed to update package' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()
    const packageRepo = getSponsorshipPackageRepository(supabase)

    // Check if package exists
    const pkg = await packageRepo.getById(id)
    if (!pkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    // Check if any sponsors are using this package
    const { data: sponsors, error: sponsorError } = await supabase
      .from('sponsors')
      .select('id')
      .eq('package_id', id)
      .limit(1)

    if (sponsorError) {
      console.error('Error checking sponsors:', sponsorError)
      return NextResponse.json(
        { error: 'Failed to verify package usage' },
        { status: 500 }
      )
    }

    if (sponsors && sponsors.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete package that is in use by sponsors. Deactivate it instead.' },
        { status: 400 }
      )
    }

    await packageRepo.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Package deletion error:', error)

    if (error instanceof RepositoryError) {
      return NextResponse.json(
        { error: 'Failed to delete package' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
