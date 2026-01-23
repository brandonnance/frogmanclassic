import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createRegistrationService, RegistrationService } from '@/lib/services'
import { getTeamRepository, getPlayerRepository, getEventYearRepository, RepositoryError } from '@/lib/repositories'

// Create a new team (open registration without sponsor code)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamName, eventType, sessionPref, captainEmail, players, paymentMethod, sunWillowsMemberCount, entryFee } = body

    const registrationService = createRegistrationService()

    const result = await registrationService.registerOpenTeam({
      teamName,
      eventType,
      sessionPref,
      captainEmail,
      players,
      paymentMethod,
      sunWillowsMemberCount,
      entryFee,
    })

    // Send confirmation email
    const baseUrl = request.nextUrl.origin
    const playerNames = RegistrationService.getPlayerNamesForEmail(players)

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
            paymentMethod,
          },
        }),
      })
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
    }

    return NextResponse.json({
      success: true,
      teamId: result.teamId,
    })
  } catch (error) {
    console.error('Team creation error:', error)

    if (error instanceof RepositoryError) {
      const status = error.code === 'FRIDAY_REQUIRES_SPONSOR' || error.code === 'VALIDATION_ERROR'
        ? 400
        : error.code === 'NO_ACTIVE_EVENT_YEAR'
        ? 400
        : 500

      return NextResponse.json(
        { error: error.message },
        { status }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = createServerClient()
    const eventYearRepo = getEventYearRepository(supabase)
    const teamRepo = getTeamRepository(supabase)
    const playerRepo = getPlayerRepository(supabase)

    // Get active event year
    const eventYear = await eventYearRepo.getActive()

    if (!eventYear) {
      return NextResponse.json({ teams: [], players: [] })
    }

    // Fetch teams with related data
    const teams = await teamRepo.getByEventYear(eventYear.id)

    // Fetch team players
    const teamIds = teams.map(t => t.id)
    const teamPlayers = await teamRepo.getTeamPlayers(teamIds)

    // Fetch all players for those teams
    const playerIds = [...new Set(teamPlayers.map(tp => tp.player_id))]
    const players = await playerRepo.getByIds(playerIds)

    return NextResponse.json({
      teams,
      teamPlayers,
      players,
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
