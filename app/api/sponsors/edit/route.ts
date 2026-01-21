import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Find sponsor by access token
    const { data: sponsor, error: sponsorError } = await supabase
      .from('sponsors')
      .select('id, name, contact_name, contact_email, package_id, payment_method, payment_status, total_credits')
      .eq('access_token', token)
      .single()

    if (sponsorError || !sponsor) {
      return NextResponse.json(
        { error: 'Sponsor not found' },
        { status: 404 }
      )
    }

    // Get credits for this sponsor
    const { data: credits, error: creditsError } = await supabase
      .from('sponsor_credits')
      .select('id, redemption_code, redeemed_by_team_id, redeemed_at, captain_email, email_sent_at')
      .eq('sponsor_id', sponsor.id)
      .order('created_at', { ascending: true })

    if (creditsError) {
      console.error('Error fetching credits:', creditsError)
      return NextResponse.json(
        { error: 'Failed to load credits' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sponsor: {
        ...sponsor,
        credits: credits || [],
      },
    })
  } catch (error) {
    console.error('Sponsor edit fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
