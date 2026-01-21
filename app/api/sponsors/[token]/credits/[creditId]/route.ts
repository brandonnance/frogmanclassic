import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; creditId: string }> }
) {
  try {
    const { token, creditId } = await params
    const body = await request.json()
    const supabase = createServerClient()

    // Verify sponsor owns this credit
    const { data: sponsor, error: sponsorError } = await supabase
      .from('sponsors')
      .select('id')
      .eq('access_token', token)
      .single()

    if (sponsorError || !sponsor) {
      return NextResponse.json(
        { error: 'Sponsor not found' },
        { status: 404 }
      )
    }

    const { data: credit, error: creditError } = await supabase
      .from('sponsor_credits')
      .select('id, sponsor_id')
      .eq('id', creditId)
      .single()

    if (creditError || !credit) {
      return NextResponse.json(
        { error: 'Credit not found' },
        { status: 404 }
      )
    }

    if (credit.sponsor_id !== sponsor.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Build update object
    const updates: Record<string, unknown> = {}

    if ('captain_email' in body) {
      updates.captain_email = body.captain_email
    }

    if ('email_sent' in body && body.email_sent) {
      updates.email_sent_at = new Date().toISOString()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('sponsor_credits')
      .update(updates)
      .eq('id', creditId)

    if (updateError) {
      console.error('Error updating credit:', updateError)
      return NextResponse.json(
        { error: 'Failed to update credit' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Credit update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
