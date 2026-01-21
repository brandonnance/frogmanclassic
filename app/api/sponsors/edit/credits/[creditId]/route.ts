import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ creditId: string }> }
) {
  try {
    const { creditId } = await params
    const body = await request.json()
    const { token, captainEmail } = body

    if (!token || !captainEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Verify sponsor by token
    const { data: sponsor, error: sponsorError } = await supabase
      .from('sponsors')
      .select('id, name')
      .eq('access_token', token)
      .single()

    if (sponsorError || !sponsor) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      )
    }

    // Verify credit belongs to this sponsor and is not redeemed
    const { data: credit, error: creditError } = await supabase
      .from('sponsor_credits')
      .select('id, redemption_code, redeemed_by_team_id')
      .eq('id', creditId)
      .eq('sponsor_id', sponsor.id)
      .single()

    if (creditError || !credit) {
      return NextResponse.json(
        { error: 'Credit not found' },
        { status: 404 }
      )
    }

    if (credit.redeemed_by_team_id) {
      return NextResponse.json(
        { error: 'This entry has already been redeemed' },
        { status: 400 }
      )
    }

    // Update credit with captain email and mark email as sent
    const { error: updateError } = await supabase
      .from('sponsor_credits')
      .update({
        captain_email: captainEmail,
        email_sent_at: new Date().toISOString(),
      })
      .eq('id', creditId)

    if (updateError) {
      console.error('Error updating credit:', updateError)
      return NextResponse.json(
        { error: 'Failed to update credit' },
        { status: 500 }
      )
    }

    // Send invite email to captain
    const baseUrl = request.nextUrl.origin
    const redeemUrl = `${baseUrl}/redeem/${credit.redemption_code}`

    try {
      await fetch(`${baseUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'captain_code',
          to: captainEmail,
          data: {
            sponsorName: sponsor.name,
            code: credit.redemption_code,
            redeemUrl,
          },
        }),
      })
    } catch (emailError) {
      console.error('Error sending captain email:', emailError)
      // Don't fail the request if email fails - the update was successful
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Credit update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
