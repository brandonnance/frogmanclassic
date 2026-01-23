import { NextResponse } from 'next/server'
import { getPlayerRepository, RepositoryError } from '@/lib/repositories'

export async function GET() {
  try {
    const playerRepo = getPlayerRepository()
    const players = await playerRepo.getAll()

    return NextResponse.json({ players })
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { first_name, last_name, suffix, email, phone, ghin, handicap_raw, plays_yellow_tees, home_course } = body

    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    const playerRepo = getPlayerRepository()
    const player = await playerRepo.create({
      first_name,
      last_name,
      suffix: suffix || null,
      email: email || null,
      phone: phone || null,
      ghin: ghin || null,
      handicap_raw: handicap_raw !== undefined && handicap_raw !== '' ? Number(handicap_raw) : null,
      plays_yellow_tees: plays_yellow_tees || false,
      home_course: home_course || null,
    })

    return NextResponse.json({ player })
  } catch (error) {
    console.error('Error creating player:', error)

    if (error instanceof RepositoryError) {
      return NextResponse.json(
        { error: 'Failed to create player' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      )
    }

    // Process handicap_raw to handle empty string
    if ('handicap_raw' in updates) {
      updates.handicap_raw = updates.handicap_raw !== '' ? Number(updates.handicap_raw) : null
    }

    const playerRepo = getPlayerRepository()
    const player = await playerRepo.update(id, updates)

    return NextResponse.json({ player })
  } catch (error) {
    console.error('Error updating player:', error)

    if (error instanceof RepositoryError) {
      return NextResponse.json(
        { error: 'Failed to update player' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
