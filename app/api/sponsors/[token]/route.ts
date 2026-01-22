import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { generateMultipleCodes } from '@/lib/codes'

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const supabase = createServerClient()

    // Find sponsor by token with current total_credits
    const { data: sponsor, error: findError } = await supabase
      .from('sponsors')
      .select('id, total_credits')
      .eq('access_token', token)
      .single()

    if (findError || !sponsor) {
      return NextResponse.json(
        { error: 'Sponsor not found' },
        { status: 404 }
      )
    }

    // Handle credit adjustment if total_credits is provided
    let newCodes: string[] = []
    if (body.total_credits !== undefined && body.total_credits !== sponsor.total_credits) {
      const newTotal = body.total_credits
      const currentTotal = sponsor.total_credits

      // Get current credits and count used
      const { data: credits } = await supabase
        .from('sponsor_credits')
        .select('id, redeemed_by_team_id')
        .eq('sponsor_id', sponsor.id)

      const usedCredits = credits?.filter(c => c.redeemed_by_team_id !== null) || []
      const unusedCredits = credits?.filter(c => c.redeemed_by_team_id === null) || []
      const usedCount = usedCredits.length

      // Cannot reduce below used credits
      if (newTotal < usedCount) {
        return NextResponse.json(
          { error: `Cannot reduce credits below ${usedCount} (currently in use)` },
          { status: 400 }
        )
      }

      if (newTotal < currentTotal) {
        // Decreasing credits - delete unused credits
        const creditsToDelete = currentTotal - newTotal
        const idsToDelete = unusedCredits.slice(0, creditsToDelete).map(c => c.id)

        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('sponsor_credits')
            .delete()
            .in('id', idsToDelete)

          if (deleteError) {
            console.error('Error deleting credits:', deleteError)
            return NextResponse.json(
              { error: 'Failed to remove credits' },
              { status: 500 }
            )
          }
        }
      } else if (newTotal > currentTotal) {
        // Increasing credits - generate new codes
        const creditsToAdd = newTotal - currentTotal
        newCodes = generateMultipleCodes(creditsToAdd)

        const newCredits = newCodes.map(code => ({
          sponsor_id: sponsor.id,
          redemption_code: code,
          captain_email: null,
        }))

        const { error: insertError } = await supabase
          .from('sponsor_credits')
          .insert(newCredits)

        if (insertError) {
          console.error('Error adding credits:', insertError)
          return NextResponse.json(
            { error: 'Failed to add credits' },
            { status: 500 }
          )
        }
      }
    }

    // Build update object with only provided fields
    const updates: Record<string, string | number | null> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.contact_name !== undefined) updates.contact_name = body.contact_name
    if (body.contact_email !== undefined) updates.contact_email = body.contact_email
    if (body.payment_method !== undefined) updates.payment_method = body.payment_method
    if (body.payment_status !== undefined) updates.payment_status = body.payment_status
    if (body.total_credits !== undefined) updates.total_credits = body.total_credits

    // Update sponsor
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('sponsors')
        .update(updates)
        .eq('id', sponsor.id)

      if (updateError) {
        console.error('Error updating sponsor:', updateError)
        return NextResponse.json(
          { error: 'Failed to update sponsor' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true, newCodes })
  } catch (error) {
    console.error('Sponsor update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = createServerClient()

    // Find sponsor by token
    const { data: sponsor, error: findError } = await supabase
      .from('sponsors')
      .select('id')
      .eq('access_token', token)
      .single()

    if (findError || !sponsor) {
      return NextResponse.json(
        { error: 'Sponsor not found' },
        { status: 404 }
      )
    }

    // Delete credits first (due to foreign key)
    await supabase
      .from('sponsor_credits')
      .delete()
      .eq('sponsor_id', sponsor.id)

    // Delete sponsor
    const { error: deleteError } = await supabase
      .from('sponsors')
      .delete()
      .eq('id', sponsor.id)

    if (deleteError) {
      console.error('Error deleting sponsor:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete sponsor' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sponsor delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
