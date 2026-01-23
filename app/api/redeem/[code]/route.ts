import { NextRequest, NextResponse } from 'next/server'
import { createRegistrationService, RegistrationService } from '@/lib/services'
import { RepositoryError } from '@/lib/repositories'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const body = await request.json()
    const { teamName, eventType, sessionPref, captainEmail, players } = body

    const registrationService = createRegistrationService()

    const result = await registrationService.registerWithSponsorCode({
      redemptionCode: code,
      teamName,
      eventType,
      sessionPref,
      captainEmail,
      players,
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
            sponsorName: result.sponsorName,
            playerNames,
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
    console.error('Redeem error:', error)

    if (error instanceof RepositoryError) {
      const status =
        error.code === 'INVALID_CODE' ||
        error.code === 'CODE_ALREADY_USED' ||
        error.code === 'VALIDATION_ERROR'
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
