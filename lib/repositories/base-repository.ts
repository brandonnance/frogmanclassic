import { SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase'

export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'RepositoryError'
  }
}

export abstract class BaseRepository {
  protected client: SupabaseClient

  constructor(client?: SupabaseClient) {
    this.client = client ?? createServerClient()
  }

  protected handleError(operation: string, error: unknown): never {
    console.error(`Repository error in ${operation}:`, error)

    const message = error instanceof Error ? error.message : 'Unknown error'
    const code = (error as { code?: string })?.code ?? 'UNKNOWN'

    throw new RepositoryError(
      `Failed to ${operation}: ${message}`,
      code,
      error
    )
  }
}
