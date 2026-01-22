/**
 * Import players from the Frogman GHIN List CSV
 *
 * Usage: npx tsx scripts/import-ghin-list.ts
 *
 * CSV columns:
 * A: Row number (skip)
 * B: Name (parse: "Saul Martinez, Jr" -> first:"Saul", last:"Martinez", suffix:"Jr")
 * C: Home Course (skip)
 * D: HI (handicap_raw, treat 100 as null)
 * E: GHIN (clean whitespace, empty = null)
 * F: Yellow tees marker ("x" = true)
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  console.error('Make sure you have a .env.local file with these values')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Suffix patterns to detect
const SUFFIX_PATTERNS = ['Jr', 'Jr.', 'Senior', 'Sr', 'Sr.', 'II', 'III', 'IV', 'V']

interface ParsedPlayer {
  firstName: string
  lastName: string
  suffix: string | null
  handicapRaw: number | null
  ghin: string | null
  playsYellowTees: boolean
}

function parseName(fullName: string): { firstName: string; lastName: string; suffix: string | null } {
  // Handle names like "Saul Martinez, Jr" or "John Smith"
  let suffix: string | null = null
  let namePart = fullName.trim()

  // Check for suffix at the end (after comma or space)
  for (const suffixPattern of SUFFIX_PATTERNS) {
    const commaPattern = `, ${suffixPattern}`
    const spacePattern = ` ${suffixPattern}`

    if (namePart.endsWith(commaPattern) || namePart.toLowerCase().endsWith(commaPattern.toLowerCase())) {
      suffix = suffixPattern.replace('.', '') // Normalize Jr. to Jr
      namePart = namePart.slice(0, -commaPattern.length).trim()
      break
    }
    if (namePart.endsWith(spacePattern) && !namePart.includes(',')) {
      // Only match space-suffix if no comma (to avoid matching "Smith, John Jr" incorrectly)
      suffix = suffixPattern.replace('.', '')
      namePart = namePart.slice(0, -spacePattern.length).trim()
      break
    }
  }

  // Split remaining name into first and last
  const parts = namePart.split(' ').filter(p => p.trim())

  if (parts.length === 1) {
    // Single word name - skip these
    return { firstName: '', lastName: parts[0], suffix }
  }

  // First word is first name, rest is last name
  const firstName = parts[0]
  const lastName = parts.slice(1).join(' ')

  return { firstName, lastName, suffix }
}

function cleanGhin(ghin: string): string | null {
  if (!ghin) return null
  // Remove tabs, newlines, and extra whitespace
  const cleaned = ghin.replace(/[\t\n\r]/g, '').trim()
  return cleaned || null
}

function parseHandicap(hi: string): number | null {
  if (!hi) return null
  // Remove + prefix for plus handicaps
  const cleaned = hi.replace('+', '-').trim() // +6 becomes -6 (plus handicap)
  const num = parseFloat(cleaned)
  if (isNaN(num) || num === 100) return null // 100 means N/A
  return Math.round(num) // Store as integer
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)

  return result.map(s => s.trim().replace(/^"|"$/g, ''))
}

async function importPlayers() {
  const csvPath = path.join(process.cwd(), 'docs', 'Frogman GHIN List.csv')

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`)
    process.exit(1)
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const lines = csvContent.split('\n')

  // Skip header row
  const dataLines = lines.slice(1).filter(line => line.trim())

  console.log(`Found ${dataLines.length} rows to process`)

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const line of dataLines) {
    const columns = parseCsvLine(line)

    // Column indices: 0=row#, 1=Name, 2=HomeCourse, 3=HI, 4=GHIN, 5=Yellow
    const name = columns[1] || ''
    const hi = columns[3] || ''
    const ghinRaw = columns[4] || ''
    const yellowMarker = columns[5] || ''

    if (!name) {
      skipped++
      continue
    }

    const { firstName, lastName, suffix } = parseName(name)

    // Skip single-word names (like "Woody", "Nate")
    if (!firstName || !lastName) {
      console.log(`Skipping single-word name: ${name}`)
      skipped++
      continue
    }

    const ghin = cleanGhin(ghinRaw)
    const handicapRaw = parseHandicap(hi)
    const playsYellowTees = yellowMarker.toLowerCase() === 'x'

    // Check if player with this GHIN already exists (for deduplication)
    if (ghin) {
      const { data: existing } = await supabase
        .from('players')
        .select('id')
        .eq('ghin', ghin)
        .single()

      if (existing) {
        console.log(`Skipping duplicate GHIN ${ghin}: ${firstName} ${lastName}`)
        skipped++
        continue
      }
    }

    // Insert player
    const { error } = await supabase
      .from('players')
      .insert({
        first_name: firstName,
        last_name: lastName,
        suffix: suffix,
        ghin: ghin,
        handicap_raw: handicapRaw,
        plays_yellow_tees: playsYellowTees
      })

    if (error) {
      console.error(`Error inserting ${firstName} ${lastName}:`, error.message)
      errors++
    } else {
      console.log(`Imported: ${firstName} ${lastName}${suffix ? ` ${suffix}` : ''} (GHIN: ${ghin || 'none'}, HI: ${handicapRaw ?? 'N/A'}, Yellow: ${playsYellowTees})`)
      imported++
    }
  }

  console.log('\n--- Import Summary ---')
  console.log(`Imported: ${imported}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)
}

// Run the import
importPlayers().catch(console.error)
