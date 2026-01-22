import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: eventYear, error } = await supabase
      .from('event_years')
      .select('id, year, start_date, end_date, is_active')
      .eq('is_active', true)
      .single()

    if (error || !eventYear) {
      return NextResponse.json({ year: 2026 }) // Fallback
    }

    return NextResponse.json({
      id: eventYear.id,
      year: eventYear.year,
      startDate: eventYear.start_date,
      endDate: eventYear.end_date
    })
  } catch (error) {
    console.error('Error fetching event year:', error)
    return NextResponse.json({ year: 2026 }) // Fallback
  }
}
