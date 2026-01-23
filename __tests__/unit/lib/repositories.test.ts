import { describe, it, expect } from 'vitest'
import { RepositoryError } from '@/lib/repositories/base-repository'

describe('RepositoryError', () => {
  it('creates error with message and code', () => {
    const error = new RepositoryError('Test error', 'TEST_CODE')

    expect(error.message).toBe('Test error')
    expect(error.code).toBe('TEST_CODE')
    expect(error.name).toBe('RepositoryError')
  })

  it('stores original error', () => {
    const originalError = new Error('Original')
    const error = new RepositoryError('Wrapped error', 'WRAPPED', originalError)

    expect(error.originalError).toBe(originalError)
  })

  it('extends Error class', () => {
    const error = new RepositoryError('Test', 'CODE')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(RepositoryError)
  })

  it('can be caught as Error', () => {
    let caught: Error | null = null

    try {
      throw new RepositoryError('Test', 'CODE')
    } catch (e) {
      caught = e as Error
    }

    expect(caught).not.toBeNull()
    expect(caught?.message).toBe('Test')
  })

  it('instanceof check works correctly', () => {
    const repoError = new RepositoryError('Repo error', 'REPO')
    const regularError = new Error('Regular error')

    expect(repoError instanceof RepositoryError).toBe(true)
    expect(regularError instanceof RepositoryError).toBe(false)
  })
})

describe('Repository error codes', () => {
  it('uses consistent error codes', () => {
    // These are the error codes we use throughout repositories
    const expectedCodes = [
      'INVALID_CODE',
      'CODE_ALREADY_USED',
      'VALIDATION_ERROR',
      'NO_ACTIVE_EVENT_YEAR',
      'FRIDAY_REQUIRES_SPONSOR',
      'SPONSOR_NOT_FOUND',
      'UNKNOWN',
    ]

    // Just verify we can create errors with these codes
    for (const code of expectedCodes) {
      const error = new RepositoryError(`Error for ${code}`, code)
      expect(error.code).toBe(code)
    }
  })
})
