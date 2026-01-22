import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// PATCH - Update team (team_name, session_pref, notes, players)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { team_name, session_pref, notes, players } = body

    const supabase = createServerClient()

    // Build update object with only provided fields
    const updates: Record<string, string | null> = {}
    if (team_name !== undefined) updates.team_name = team_name || null
    if (session_pref !== undefined) updates.session_pref = session_pref
    if (notes !== undefined) updates.notes = notes || null

    // Update team fields if any
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Error updating team:', error)
        return NextResponse.json(
          { error: 'Failed to update team' },
          { status: 500 }
        )
      }
    }

    // Update players if provided
    // players is an array of { player_id: string, role: string }
    if (players !== undefined) {
      // Delete existing team_players
      const { error: deleteError } = await supabase
        .from('team_players')
        .delete()
        .eq('team_id', id)

      if (deleteError) {
        console.error('Error removing team players:', deleteError)
        return NextResponse.json(
          { error: 'Failed to update team players' },
          { status: 500 }
        )
      }

      // Insert new team_players
      if (players.length > 0) {
        const teamPlayerRecords = players.map((p: { player_id: string; role: string }) => ({
          team_id: id,
          player_id: p.player_id,
          role: p.role || 'player'
        }))

        const { error: insertError } = await supabase
          .from('team_players')
          .insert(teamPlayerRecords)

        if (insertError) {
          console.error('Error adding team players:', insertError)
          return NextResponse.json(
            { error: 'Failed to update team players' },
            { status: 500 }
          )
        }
      }
    }

    // Fetch updated team with relations
    const { data: team, error: fetchError } = await supabase
      .from('teams')
      .select(`
        *,
        sponsor:sponsors(id, name),
        credit:sponsor_credits(id, redemption_code)
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching updated team:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch updated team' },
        { status: 500 }
      )
    }

    return NextResponse.json({ team })
  } catch (error) {
    console.error('Team update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete team (set withdrawn_at)
// Also restores sponsor credit if team has credit_id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    // First, get the team to check for credit_id
    const { data: team, error: fetchError } = await supabase
      .from('teams')
      .select('id, credit_id, withdrawn_at')
      .eq('id', id)
      .single()

    if (fetchError || !team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // If team has a credit_id, restore the sponsor credit
    if (team.credit_id) {
      const { error: creditError } = await supabase
        .from('sponsor_credits')
        .update({
          redeemed_by_team_id: null,
          redeemed_at: null
        })
        .eq('id', team.credit_id)

      if (creditError) {
        console.error('Error restoring sponsor credit:', creditError)
        // Continue with soft delete even if credit restore fails
      }
    }

    // Soft delete the team
    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams')
      .update({ withdrawn_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error withdrawing team:', updateError)
      return NextResponse.json(
        { error: 'Failed to withdraw team' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      team: updatedTeam,
      creditRestored: !!team.credit_id
    })
  } catch (error) {
    console.error('Team delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Restore a withdrawn team or permanently delete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (action !== 'restore' && action !== 'hard_delete') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Handle permanent deletion
    if (action === 'hard_delete') {
      // First delete team_players
      const { error: tpError } = await supabase
        .from('team_players')
        .delete()
        .eq('team_id', id)

      if (tpError) {
        console.error('Error deleting team players:', tpError)
        return NextResponse.json(
          { error: 'Failed to delete team players' },
          { status: 500 }
        )
      }

      // Then delete the team
      const { error: teamError } = await supabase
        .from('teams')
        .delete()
        .eq('id', id)

      if (teamError) {
        console.error('Error deleting team:', teamError)
        return NextResponse.json(
          { error: 'Failed to delete team' },
          { status: 500 }
        )
      }

      return NextResponse.json({ deleted: true })
    }

    // Get team to check credit_id
    const { data: team, error: fetchError } = await supabase
      .from('teams')
      .select('id, credit_id')
      .eq('id', id)
      .single()

    if (fetchError || !team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // If team has credit_id, check if credit is still available
    if (team.credit_id) {
      const { data: credit } = await supabase
        .from('sponsor_credits')
        .select('id, redeemed_by_team_id')
        .eq('id', team.credit_id)
        .single()

      // If credit was re-used by another team, cannot restore
      if (credit && credit.redeemed_by_team_id && credit.redeemed_by_team_id !== id) {
        return NextResponse.json(
          { error: 'Sponsor credit has been used by another team. Cannot restore.' },
          { status: 400 }
        )
      }

      // Re-link the credit to this team
      if (credit) {
        await supabase
          .from('sponsor_credits')
          .update({
            redeemed_by_team_id: id,
            redeemed_at: new Date().toISOString()
          })
          .eq('id', team.credit_id)
      }
    }

    // Restore the team
    const { data: restoredTeam, error: updateError } = await supabase
      .from('teams')
      .update({ withdrawn_at: null })
      .eq('id', id)
      .select(`
        *,
        sponsor:sponsors(id, name),
        credit:sponsor_credits(id, redemption_code)
      `)
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to restore team' },
        { status: 500 }
      )
    }

    return NextResponse.json({ team: restoredTeam })
  } catch (error) {
    console.error('Team restore error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
