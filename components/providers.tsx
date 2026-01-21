'use client'

import { StoreProvider } from '@/lib/mock-data'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>
}
