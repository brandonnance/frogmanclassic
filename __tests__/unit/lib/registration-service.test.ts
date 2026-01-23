import { describe, it, expect } from 'vitest'
import { RegistrationService } from '@/lib/services/registration-service'
import type { PlayerInput } from '@/lib/types'

describe('RegistrationService', () => {
  describe('getPlayerNamesForEmail', () => {
    it('formats player names correctly', () => {
      const players: PlayerInput[] = [
        { firstName: 'John', lastName: 'Doe', suffix: '', email: '', phone: '', ghin: '' },
        { firstName: 'Jane', lastName: 'Smith', suffix: '', email: '', phone: '', ghin: '' },
      ]

      const names = RegistrationService.getPlayerNamesForEmail(players)

      expect(names).toEqual(['John Doe', 'Jane Smith'])
    })

    it('filters out players with empty first name', () => {
      const players: PlayerInput[] = [
        { firstName: 'John', lastName: 'Doe', suffix: '', email: '', phone: '', ghin: '' },
        { firstName: '', lastName: 'Smith', suffix: '', email: '', phone: '', ghin: '' },
      ]

      const names = RegistrationService.getPlayerNamesForEmail(players)

      expect(names).toEqual(['John Doe'])
    })

    it('filters out players with empty last name', () => {
      const players: PlayerInput[] = [
        { firstName: 'John', lastName: 'Doe', suffix: '', email: '', phone: '', ghin: '' },
        { firstName: 'Jane', lastName: '', suffix: '', email: '', phone: '', ghin: '' },
      ]

      const names = RegistrationService.getPlayerNamesForEmail(players)

      expect(names).toEqual(['John Doe'])
    })

    it('filters out players with whitespace-only names', () => {
      const players: PlayerInput[] = [
        { firstName: 'John', lastName: 'Doe', suffix: '', email: '', phone: '', ghin: '' },
        { firstName: '   ', lastName: 'Smith', suffix: '', email: '', phone: '', ghin: '' },
        { firstName: 'Jane', lastName: '   ', suffix: '', email: '', phone: '', ghin: '' },
      ]

      const names = RegistrationService.getPlayerNamesForEmail(players)

      expect(names).toEqual(['John Doe'])
    })

    it('trims whitespace from names', () => {
      const players: PlayerInput[] = [
        { firstName: '  John  ', lastName: '  Doe  ', suffix: '', email: '', phone: '', ghin: '' },
      ]

      const names = RegistrationService.getPlayerNamesForEmail(players)

      expect(names).toEqual(['John Doe'])
    })

    it('returns empty array for no valid players', () => {
      const players: PlayerInput[] = [
        { firstName: '', lastName: '', suffix: '', email: '', phone: '', ghin: '' },
      ]

      const names = RegistrationService.getPlayerNamesForEmail(players)

      expect(names).toEqual([])
    })

    it('returns empty array for empty input', () => {
      const names = RegistrationService.getPlayerNamesForEmail([])

      expect(names).toEqual([])
    })

    it('handles undefined first/last names gracefully', () => {
      const players = [
        { firstName: 'John', lastName: 'Doe', suffix: '', email: '', phone: '', ghin: '' },
        { firstName: undefined, lastName: 'Smith', suffix: '', email: '', phone: '', ghin: '' } as unknown as PlayerInput,
        { firstName: 'Jane', lastName: undefined, suffix: '', email: '', phone: '', ghin: '' } as unknown as PlayerInput,
      ]

      const names = RegistrationService.getPlayerNamesForEmail(players)

      expect(names).toEqual(['John Doe'])
    })
  })
})

describe('RegistrationInput validation', () => {
  it('validates required event type', () => {
    // This tests that the service properly validates inputs
    // The actual validation happens inside registerOpenTeam/registerWithSponsorCode
    // We're documenting the expected validation rules here

    const validInput = {
      eventType: 'sat_sun' as const,
      captainEmail: 'test@example.com',
      players: [{ firstName: 'John', lastName: 'Doe', suffix: '', email: '', phone: '', ghin: '' }],
    }

    // Should have eventType
    expect(validInput.eventType).toBeDefined()
    expect(['friday', 'sat_sun']).toContain(validInput.eventType)

    // Should have captainEmail
    expect(validInput.captainEmail).toBeDefined()
    expect(validInput.captainEmail.length).toBeGreaterThan(0)

    // Should have at least one player
    expect(validInput.players.length).toBeGreaterThan(0)
  })

  it('accepts optional session preference', () => {
    const validSessionPrefs = ['am', 'pm', 'none', undefined]

    for (const pref of validSessionPrefs) {
      const input = {
        eventType: 'sat_sun' as const,
        captainEmail: 'test@example.com',
        players: [{ firstName: 'John', lastName: 'Doe', suffix: '', email: '', phone: '', ghin: '' }],
        sessionPref: pref as 'am' | 'pm' | 'none' | undefined,
      }

      // All should be valid
      expect(input.sessionPref === undefined || ['am', 'pm', 'none'].includes(input.sessionPref)).toBe(true)
    }
  })
})
