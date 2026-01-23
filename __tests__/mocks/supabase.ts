import { vi } from 'vitest'

// Mock response types
export interface MockQueryResult<T> {
  data: T | null
  error: { code: string; message: string } | null
}

// Create a chainable mock for Supabase queries
export function createMockSupabaseClient() {
  const mockResult: MockQueryResult<unknown> = { data: null, error: null }

  const chainMock = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(() => Promise.resolve(mockResult)),
    then: vi.fn((resolve) => resolve(mockResult)),
  }

  const fromMock = vi.fn(() => chainMock)

  return {
    from: fromMock,
    _chainMock: chainMock,
    _setMockResult: <T>(data: T | null, error: { code: string; message: string } | null = null) => {
      mockResult.data = data
      mockResult.error = error
    },
    _reset: () => {
      mockResult.data = null
      mockResult.error = null
      vi.clearAllMocks()
    },
  }
}

// Type-safe mock client
export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>
