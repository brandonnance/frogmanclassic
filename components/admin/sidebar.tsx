'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Building2,
  UsersRound,
  Calendar,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Players', href: '/admin/players', icon: Users },
  { name: 'Sponsors', href: '/admin/sponsors', icon: Building2 },
  { name: 'Teams', href: '/admin/teams', icon: UsersRound },
  { name: 'Tee Sheets', href: '/admin/tee-sheets', icon: Calendar },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-green-800 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-green-700">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-2xl">🐸</span>
          <span className="text-xl font-bold">Frogman Classic</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-green-900 text-white'
                  : 'text-green-100 hover:bg-green-700 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-green-700 p-4">
        <div className="text-xs text-green-300">
          2025 Event Year
        </div>
        <div className="mt-1 text-xs text-green-400">
          Demo Mode
        </div>
      </div>
    </div>
  )
}
