import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const body = await request.json()
    const { teamName, eventType, sessionPref, captainEmail, players } = body

    if (!eventType || !captainEmail || !players || players.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Validate code exists and is available
    const { data: credit, error: creditError } = await supabase
      .from('sponsor_credits')
      .select('id, sponsor_id, redeemed_by_team_id')
      .eq('redemption_code', code)
      .single()

    if (creditError || !credit) {
      return NextResponse.json(
        { error: 'Invalid redemption code' },
        { status: 400 }
      )
    }

    if (credit.redeemed_by_team_id) {
      return NextResponse.json(
        { error: 'This code has already been used' },
        { status: 400 }
      )
    }

    // Get sponsor info
    const { data: sponsor } = await supabase
      .from('sponsors')
      .select('id, name, event_year_id')
      .eq('id', credit.sponsor_id)
      .single()

    if (!sponsor) {
      return NextResponse.json(
        { error: 'Sponsor not found' },
        { status: 500 }
      )
    }

    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        event_year_id: sponsor.event_year_id,
        event_type: eventType,
        team_name: teamName || null,
        sponsor_id: sponsor.id,
        credit_id: credit.id,
        session_pref: sessionPref || 'none'
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

    // Create or find players and link to team
    for (const playerData of players) {
      if (!playerData.firstName?.trim() || !playerData.lastName?.trim()) {
        continue
      }

      // Create player
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          first_name: playerData.firstName.trim(),
          last_name: playerData.lastName.trim(),
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

      // Link player to team
      await supabase
        .from('team_players')
        .insert({
          team_id: team.id,
          player_id: player.id,
          role: 'player'
        })
    }

    // Mark credit as redeemed
    const { error: redeemError } = await supabase
      .from('sponsor_credits')
      .update({
        redeemed_by_team_id: team.id,
        redeemed_at: new Date().toISOString(),
        captain_email: captainEmail
      })
      .eq('id', credit.id)

    if (redeemError) {
      console.error('Error redeeming credit:', redeemError)
    }

    // Send confirmation email
    const baseUrl = request.nextUrl.origin
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
            sponsorName: sponsor.name
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
    console.error('Redeem error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
