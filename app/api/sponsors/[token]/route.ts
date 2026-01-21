import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = createServerClient()

    // Fetch sponsor by access token
    const { data: sponsor, error: sponsorError } = await supabase
      .from('sponsors')
      .select('id, name, contact_name, contact_email, payment_status, total_credits')
      .eq('access_token', token)
      .single()

    if (sponsorError || !sponsor) {
      return NextResponse.json(
        { error: 'Sponsor not found' },
        { status: 404 }
      )
    }

    // Fetch credits for this sponsor
    const { data: credits, error: creditsError } = await supabase
      .from('sponsor_credits')
      .select('id, redemption_code, captain_email, redeemed_by_team_id, redeemed_at')
      .eq('sponsor_id', sponsor.id)
      .order('created_at', { ascending: true })

    if (creditsError) {
      console.error('Error fetching credits:', creditsError)
      return NextResponse.json(
        { error: 'Failed to fetch credits' },
        { status: 500 }
      )
    }

    // Fetch team names for redeemed credits
    const redeemedTeamIds = credits
      ?.filter(c => c.redeemed_by_team_id)
      .map(c => c.redeemed_by_team_id) || []

    let teamsMap: Record<string, string> = {}
    if (redeemedTeamIds.length > 0) {
      const { data: teams } = await supabase
        .from('teams')
        .select('id, team_name')
        .in('id', redeemedTeamIds)

      if (teams) {
        teamsMap = teams.reduce((acc, team) => {
          acc[team.id] = team.team_name || 'Unnamed Team'
          return acc
        }, {} as Record<string, string>)
      }
    }

    // Combine credits with team names
    const creditsWithTeams = credits?.map(credit => ({
      ...credit,
      team_name: credit.redeemed_by_team_id ? teamsMap[credit.redeemed_by_team_id] : null
    }))

    return NextResponse.json({
      ...sponsor,
      credits: creditsWithTeams
    })
  } catch (error) {
    console.error('Sponsor fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
