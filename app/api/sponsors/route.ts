import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { generateMultipleCodes } from '@/lib/codes'
import { getPackageById } from '@/lib/sponsorship-packages'
import type { PaymentMethod, PaymentStatus } from '@/lib/types'

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

    // Validate package
    const pkg = getPackageById(packageId)
    if (!pkg) {
      return NextResponse.json(
        { error: 'Invalid sponsorship package' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get active event year
    const { data: eventYear, error: eventYearError } = await supabase
      .from('event_years')
      .select('id')
      .eq('is_active', true)
      .single()

    if (eventYearError || !eventYear) {
      return NextResponse.json(
        { error: 'No active event year found' },
        { status: 500 }
      )
    }

    // Determine payment status
    const paymentStatus: PaymentStatus = paymentMethod === 'online'
      ? 'pending_online'
      : 'pending_offline'

    // Create sponsor
    const { data: sponsor, error: sponsorError } = await supabase
      .from('sponsors')
      .insert({
        event_year_id: eventYear.id,
        name: companyName,
        contact_name: contactName,
        contact_email: contactEmail,
        package_id: packageId,
        payment_method: paymentMethod as PaymentMethod,
        payment_status: paymentStatus,
        total_credits: pkg.includedEntries,
      })
      .select()
      .single()

    if (sponsorError || !sponsor) {
      console.error('Error creating sponsor:', sponsorError)
      return NextResponse.json(
        { error: 'Failed to create sponsor' },
        { status: 500 }
      )
    }

    // Generate redemption codes if there are included entries
    if (pkg.includedEntries > 0) {
      const codes = generateMultipleCodes(pkg.includedEntries)

      // Create sponsor credits
      const credits = codes.map((code) => ({
        sponsor_id: sponsor.id,
        redemption_code: code,
        captain_email: null,
      }))

      const { error: creditsError } = await supabase
        .from('sponsor_credits')
        .insert(credits)

      if (creditsError) {
        console.error('Error creating credits:', creditsError)
        // Rollback sponsor creation
        await supabase.from('sponsors').delete().eq('id', sponsor.id)
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
            includedEntries: pkg.includedEntries,
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
