import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Frogman Classic 2026 | Golf Tournament Supporting Our Veterans',
  description: 'Join us September 11-13, 2026 at Sun Willows Golf Course for the Frogman Classic golf tournament. Featuring Friday Florida Scramble and Saturday/Sunday 2-Man Best Ball events. All proceeds benefit the Best Defense Foundation.',
  keywords: ['golf tournament', 'charity golf', 'veterans', 'Frogman Classic', 'Sun Willows Golf Course', 'Florida Scramble', 'Best Ball', 'Best Defense Foundation'],
  openGraph: {
    title: 'Frogman Classic 2026',
    description: 'Golf tournament supporting our veterans. September 11-13, 2026 at Sun Willows Golf Course. Benefiting the Best Defense Foundation.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
