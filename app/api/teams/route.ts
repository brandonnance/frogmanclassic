import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()

    // Get active event year
    const { data: eventYear } = await supabase
      .from('event_years')
      .select('id')
      .eq('is_active', true)
      .single()

    if (!eventYear) {
      return NextResponse.json({ teams: [], players: [] })
    }

    // Fetch teams with related data
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select(`
        *,
        sponsor:sponsors(id, name),
        credit:sponsor_credits(id, redemption_code)
      `)
      .eq('event_year_id', eventYear.id)
      .order('created_at', { ascending: false })

    if (teamsError) {
      console.error('Error fetching teams:', teamsError)
      return NextResponse.json(
        { error: 'Failed to fetch teams' },
        { status: 500 }
      )
    }

    // Fetch team players
    const teamIds = teams?.map(t => t.id) || []
    let teamPlayers: { team_id: string; player_id: string; role: string }[] = []

    if (teamIds.length > 0) {
      const { data: tpData } = await supabase
        .from('team_players')
        .select('*')
        .in('team_id', teamIds)
      teamPlayers = tpData || []
    }

    // Fetch all players for those teams
    const playerIds = [...new Set(teamPlayers.map(tp => tp.player_id))]
    let players: { id: string; first_name: string; last_name: string; handicap_raw: number | null; plays_yellow_tees: boolean }[] = []

    if (playerIds.length > 0) {
      const { data: pData } = await supabase
        .from('players')
        .select('id, first_name, last_name, handicap_raw, plays_yellow_tees')
        .in('id', playerIds)
      players = pData || []
    }

    return NextResponse.json({
      teams: teams || [],
      teamPlayers,
      players
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
