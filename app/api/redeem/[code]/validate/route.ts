import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const supabase = createServerClient()

    // Find credit by redemption code
    const { data: credit, error: creditError } = await supabase
      .from('sponsor_credits')
      .select('id, sponsor_id, redeemed_by_team_id')
      .eq('redemption_code', code)
      .single()

    if (creditError || !credit) {
      return NextResponse.json({
        valid: false,
        available: false,
        error: 'Code not found'
      })
    }

    // Get sponsor name
    const { data: sponsor } = await supabase
      .from('sponsors')
      .select('name')
      .eq('id', credit.sponsor_id)
      .single()

    return NextResponse.json({
      valid: true,
      available: !credit.redeemed_by_team_id,
      sponsorName: sponsor?.name || 'Unknown Sponsor'
    })
  } catch (error) {
    console.error('Validate code error:', error)
    return NextResponse.json({
      valid: false,
      available: false,
      error: 'Internal server error'
    })
  }
}
