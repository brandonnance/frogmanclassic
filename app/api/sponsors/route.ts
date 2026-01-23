import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { generateMultipleCodes } from '@/lib/codes'
import {
  getSponsorRepository,
  getCreditRepository,
  getEventYearRepository,
  getSponsorshipPackageRepository,
  RepositoryError,
} from '@/lib/repositories'
import type { PaymentMethod, PaymentStatus } from '@/lib/types'

export async function GET() {
  try {
    const supabase = createServerClient()
    const eventYearRepo = getEventYearRepository(supabase)
    const sponsorRepo = getSponsorRepository(supabase)
    const creditRepo = getCreditRepository(supabase)
    const packageRepo = getSponsorshipPackageRepository(supabase)

    // Get active event year
    const eventYear = await eventYearRepo.getActive()

    if (!eventYear) {
      return NextResponse.json({ sponsors: [], credits: [], packages: [] })
    }

    // Fetch sponsors with credits_used calculated
    const sponsors = await sponsorRepo.getByEventYearWithCreditsUsed(eventYear.id)

    // Fetch all credits for these sponsors
    const sponsorIds = sponsors.map(s => s.id)
    const credits = await creditRepo.getBySponsorIds(sponsorIds)

    // Fetch all packages (including inactive) for admin display
    const packages = await packageRepo.getAllPackages(eventYear.id)

    return NextResponse.json({
      sponsors,
      credits,
      packages,
    })
  } catch (error) {
    console.error('Error fetching sponsors:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, contactName, contactEmail, packageId, paymentMethod } = body

    if (!companyName || !contactName || !contactEmail || !packageId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const eventYearRepo = getEventYearRepository(supabase)
    const sponsorRepo = getSponsorRepository(supabase)
    const creditRepo = getCreditRepository(supabase)
    const packageRepo = getSponsorshipPackageRepository(supabase)

    // Get active event year
    const eventYear = await eventYearRepo.getActive()

    if (!eventYear) {
      return NextResponse.json(
        { error: 'No active event year found' },
        { status: 500 }
      )
    }

    // Validate package from database
    const pkg = await packageRepo.getById(packageId)
    if (!pkg || !pkg.is_active) {
      return NextResponse.json(
        { error: 'Invalid sponsorship package' },
        { status: 400 }
      )
    }

    // Check if package is available (not full)
    const isAvailable = await packageRepo.isPackageAvailable(packageId)
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'This sponsorship package is no longer available. Please select a different package.' },
        { status: 400 }
      )
    }

    // Determine payment status
    const paymentStatus: PaymentStatus = paymentMethod === 'online'
      ? 'pending_online'
      : 'pending_offline'

    // Create sponsor
    const sponsor = await sponsorRepo.create({
      event_year_id: eventYear.id,
      name: companyName,
      contact_name: contactName,
      contact_email: contactEmail,
      package_id: packageId,
      payment_method: paymentMethod as PaymentMethod,
      payment_status: paymentStatus,
      total_credits: pkg.included_entries,
    })

    // Generate redemption codes if there are included entries
    if (pkg.included_entries > 0) {
      const codes = generateMultipleCodes(pkg.included_entries)

      try {
        await creditRepo.createMany(
          codes.map(code => ({
            sponsor_id: sponsor.id,
            redemption_code: code,
          }))
        )
      } catch (creditsError) {
        console.error('Error creating credits:', creditsError)
        // Rollback sponsor creation
        await sponsorRepo.delete(sponsor.id)
        return NextResponse.json(
          { error: 'Failed to create redemption codes' },
          { status: 500 }
        )
      }
    }

    // Build URLs
    const baseUrl = request.nextUrl.origin
    const editUrl = `${baseUrl}/sponsor/edit?token=${sponsor.access_token}`

    // Send welcome email
    try {
      await fetch(`${baseUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sponsor_welcome',
          to: contactEmail,
          data: {
            sponsorName: companyName,
            contactName,
            packageName: pkg.name,
            packagePrice: pkg.price,
            includedEntries: pkg.included_entries,
            benefits: pkg.benefits,
            paymentMethod,
            editUrl,
          },
        }),
      })
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      sponsorId: sponsor.id,
      editUrl,
    })
  } catch (error) {
    console.error('Sponsor creation error:', error)

    if (error instanceof RepositoryError) {
      return NextResponse.json(
        { error: 'Failed to create sponsor' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
