import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Create a new team (open registration without sponsor code)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamName, eventType, sessionPref, captainEmail, players, paymentMethod, sunWillowsMemberCount, entryFee } = body

    if (!eventType || !captainEmail || !players || players.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Friday is sponsor-only - reject open registrations for Friday
    if (eventType === 'friday') {
      return NextResponse.json(
        { error: 'Friday entries require a sponsor code. Open registration is only available for the Saturday/Sunday event.' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get active event year
    const { data: eventYear } = await supabase
      .from('event_years')
      .select('id')
      .eq('is_active', true)
      .single()

    if (!eventYear) {
      return NextResponse.json(
        { error: 'No active event year found' },
        { status: 400 }
      )
    }

    // Create team (no sponsor)
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        event_year_id: eventYear.id,
        event_type: eventType,
        team_name: teamName || null,
        sponsor_id: null,
        credit_id: null,
        session_pref: sessionPref || 'none',
        notes: `Open registration. Entry fee: $${entryFee || 'TBD'}. Payment: ${paymentMethod || 'pending'}${sunWillowsMemberCount ? `. Sun Willows members: ${sunWillowsMemberCount}` : ''}`
      })
      .select()
      .single()

    if (teamError || !team) {
      console.error('Error creating team:', teamError)
      return NextResponse.json(
        { error: 'Failed to create team' },
        { status: 500 }
      )
    }

    // Create or link players to team
    for (const playerData of players) {
      if (!playerData.firstName?.trim() || !playerData.lastName?.trim()) {
        continue
      }

      let playerId: string

      if (playerData.existingPlayerId) {
        // Existing player - update GHIN if provided and was empty/NONE
        playerId = playerData.existingPlayerId

        if (playerData.ghin && playerData.ghin.trim() && playerData.ghin.trim() !== 'NONE') {
          await supabase
            .from('players')
            .update({ ghin: playerData.ghin.trim() })
            .eq('id', playerId)
            .or('ghin.is.null,ghin.eq.NONE')
        }
      } else {
        // New player - create record
        const { data: player, error: playerError } = await supabase
          .from('players')
          .insert({
            first_name: playerData.firstName.trim(),
            last_name: playerData.lastName.trim(),
            suffix: playerData.suffix?.trim() || null,
            email: playerData.email?.trim() || null,
            phone: playerData.phone?.trim() || null,
            ghin: playerData.ghin?.trim() || 'NONE'
          })
          .select()
          .single()

        if (playerError || !player) {
          console.error('Error creating player:', playerError)
          continue
        }
        playerId = player.id
      }

      await supabase
        .from('team_players')
        .insert({
          team_id: team.id,
          player_id: playerId,
          role: 'player'
        })
    }

    // Send confirmation email
    const baseUrl = request.nextUrl.origin

    // Build player names list for email
    const playerNames = players
      .filter((p: { firstName?: string; lastName?: string }) => p.firstName?.trim() && p.lastName?.trim())
      .map((p: { firstName: string; lastName: string }) => `${p.firstName.trim()} ${p.lastName.trim()}`)

    try {
      await fetch(`${baseUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'team_confirmation',
          to: captainEmail,
          data: {
            teamName: teamName || 'Your Team',
            captainName: players[0]?.firstName || 'Captain',
            eventType,
            sponsorName: null,
            playerNames,
            paymentMethod
          }
        })
      })
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
    }

    return NextResponse.json({
      success: true,
      teamId: team.id
    })
  } catch (error) {
    console.error('Team creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
