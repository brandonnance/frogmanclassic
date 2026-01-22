import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Search players by last name (case-insensitive, partial match)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.length < 3) {
      return NextResponse.json({ players: [] })
    }

    const supabase = createServerClient()

    const { data: players, error } = await supabase
      .from('players')
      .select('id, first_name, last_name, suffix, email, phone, ghin')
      .ilike('last_name', `%${query}%`)
      .limit(10)
      .order('last_name', { ascending: true })

    if (error) {
      console.error('Error searching players:', error)
      return NextResponse.json(
        { error: 'Failed to search players' },
        { status: 500 }
      )
    }

    return NextResponse.json({ players: players || [] })
  } catch (error) {
    console.error('Player search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
