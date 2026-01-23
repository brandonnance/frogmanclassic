import { describe, it, expect } from 'vitest'
import { generateRedemptionCode, generateMultipleCodes } from '@/lib/codes'

describe('generateRedemptionCode', () => {
  it('generates code in correct format FROG-YYYY-XXXX', () => {
    const code = generateRedemptionCode()
    expect(code).toMatch(/^FROG-\d{4}-[A-Z0-9]{4}$/)
  })

  it('uses current year in code', () => {
    const currentYear = new Date().getFullYear()
    const code = generateRedemptionCode()
    expect(code).toContain(`FROG-${currentYear}-`)
  })

  it('generates 4 character random suffix', () => {
    const code = generateRedemptionCode()
    const parts = code.split('-')
    expect(parts[2]).toHaveLength(4)
  })

  it('excludes ambiguous characters (I, O, 0, 1)', () => {
    // Generate many codes to increase probability of catching issues
    for (let i = 0; i < 100; i++) {
      const code = generateRedemptionCode()
      const randomPart = code.split('-')[2]

      expect(randomPart).not.toMatch(/[IO01]/)
    }
  })

  it('only uses uppercase letters and digits 2-9', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateRedemptionCode()
      const randomPart = code.split('-')[2]

      // Should only contain A-H, J-N, P-Z, and 2-9
      expect(randomPart).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/)
    }
  })

  it('generates different codes on subsequent calls', () => {
    const codes = new Set<string>()

    // Generate 50 codes - statistically should all be unique
    for (let i = 0; i < 50; i++) {
      codes.add(generateRedemptionCode())
    }

    // With 32^4 = 1,048,576 possible combinations, 50 should be unique
    expect(codes.size).toBe(50)
  })
})

describe('generateMultipleCodes', () => {
  it('generates requested number of codes', () => {
    const codes = generateMultipleCodes(5)
    expect(codes).toHaveLength(5)
  })

  it('generates unique codes', () => {
    const codes = generateMultipleCodes(10)
    const uniqueCodes = new Set(codes)
    expect(uniqueCodes.size).toBe(10)
  })

  it('returns empty array when count is 0', () => {
    const codes = generateMultipleCodes(0)
    expect(codes).toHaveLength(0)
  })

  it('all generated codes have correct format', () => {
    const codes = generateMultipleCodes(10)

    for (const code of codes) {
      expect(code).toMatch(/^FROG-\d{4}-[A-Z0-9]{4}$/)
    }
  })

  it('handles generating many codes without duplicates', () => {
    const codes = generateMultipleCodes(100)
    const uniqueCodes = new Set(codes)

    expect(codes).toHaveLength(100)
    expect(uniqueCodes.size).toBe(100)
  })
})

describe('code format edge cases', () => {
  it('includes a 4-digit year in the code', () => {
    const code = generateRedemptionCode()
    const yearMatch = code.match(/FROG-(\d{4})-/)

    expect(yearMatch).not.toBeNull()
    const year = parseInt(yearMatch![1], 10)
    // Year should be reasonable (between 2020 and 2100)
    expect(year).toBeGreaterThanOrEqual(2020)
    expect(year).toBeLessThanOrEqual(2100)
  })

  it('code year matches current year', () => {
    const currentYear = new Date().getFullYear()
    const code = generateRedemptionCode()
    expect(code).toContain(`FROG-${currentYear}-`)
  })
})
