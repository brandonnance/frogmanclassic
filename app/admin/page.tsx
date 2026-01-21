'use client'

import { useStore } from '@/lib/mock-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Users, Building2, UsersRound, Calendar, TrendingUp, AlertCircle } from 'lucide-react'
import { computePlayer } from '@/lib/calculations'

export default function AdminDashboard() {
  const { players, sponsors, teams, sponsorCredits, getTeamsWithPlayers } = useStore()

  const teamsWithPlayers = getTeamsWithPlayers()

  // Calculate stats
  const activeTeams = teams.filter(t => !t.withdrawn_at)
  const fridayTeams = activeTeams.filter(t => t.event_type === 'friday')
  const satSunTeams = activeTeams.filter(t => t.event_type === 'sat_sun')

  const totalCredits = sponsors.reduce((sum, s) => sum + s.total_credits, 0)
  const usedCredits = sponsors.reduce((sum, s) => sum + s.credits_used, 0)

  const paidSponsors = sponsors.filter(s => s.payment_status === 'paid')
  const pendingSponsors = sponsors.filter(s => s.payment_status === 'pending_offline' || s.payment_status === 'pending_online')

  // GHIN status breakdown
  const playersWithComputed = players.map(computePlayer)
  const freshGhin = playersWithComputed.filter(p => p.ghin_status === 'fresh').length
  const staleGhin = playersWithComputed.filter(p => p.ghin_status === 'stale').length
  const missingGhin = playersWithComputed.filter(p => p.ghin_status === 'missing').length

  // Flight breakdown for sat/sun
  const teamsWithFlights = teamsWithPlayers.filter(t => t.event_type === 'sat_sun' && !t.withdrawn_at)
  const flight1Count = teamsWithFlights.filter(t => t.flight === 1).length
  const flight2Count = teamsWithFlights.filter(t => t.flight === 2).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Frogman Classic 2025 Overview</p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/players">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{players.length}</div>
              <p className="text-xs text-muted-foreground">
                {freshGhin} fresh, {staleGhin} stale, {missingGhin} missing GHIN
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/sponsors">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sponsors</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sponsors.length}</div>
              <p className="text-xs text-muted-foreground">
                {paidSponsors.length} paid, {pendingSponsors.length} pending
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/teams">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
              <UsersRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTeams.length}</div>
              <p className="text-xs text-muted-foreground">
                {fridayTeams.length} Friday, {satSunTeams.length} Sat/Sun
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/tee-sheets">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usedCredits} / {totalCredits}</div>
              <p className="text-xs text-muted-foreground">
                {totalCredits - usedCredits} available
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Details Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Registration by Event */}
        <Card>
          <CardHeader>
            <CardTitle>Registration by Event</CardTitle>
            <CardDescription>Team counts by event type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Friday (4-5 player teams)</p>
                  <p className="text-xs text-muted-foreground">
                    {fridayTeams.reduce((sum, t) => {
                      const tp = teamsWithPlayers.find(twp => twp.id === t.id)
                      return sum + (tp?.players.length ?? 0)
                    }, 0)} players
                  </p>
                </div>
                <div className="text-2xl font-bold">{fridayTeams.length}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Sat/Sun (2 player teams)</p>
                  <p className="text-xs text-muted-foreground">
                    Flight 1: {flight1Count}, Flight 2: {flight2Count}
                  </p>
                </div>
                <div className="text-2xl font-bold">{satSunTeams.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GHIN Status */}
        <Card>
          <CardHeader>
            <CardTitle>GHIN Status</CardTitle>
            <CardDescription>Player handicap data freshness</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Fresh</Badge>
                  <span className="text-sm">Updated within 4 days</span>
                </div>
                <span className="font-bold">{freshGhin}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="warning">Stale</Badge>
                  <span className="text-sm">Needs update</span>
                </div>
                <span className="font-bold">{staleGhin}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="error">Missing</Badge>
                  <span className="text-sm">No GHIN data</span>
                </div>
                <span className="font-bold">{missingGhin}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sponsor Credits */}
        <Card>
          <CardHeader>
            <CardTitle>Sponsor Credits</CardTitle>
            <CardDescription>Credit allocation overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Credits</span>
                <span className="font-bold">{totalCredits}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Used</span>
                <span className="font-bold text-green-600">{usedCredits}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Available</span>
                <span className="font-bold text-blue-600">{totalCredits - usedCredits}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-600"
                  style={{ width: `${(usedCredits / totalCredits) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Sponsor payment overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Paid</Badge>
                </div>
                <span className="font-bold">{paidSponsors.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="warning">Pending</Badge>
                </div>
                <span className="font-bold">{pendingSponsors.length}</span>
              </div>
              {pendingSponsors.length > 0 && (
                <div className="flex items-center gap-2 text-amber-600 text-sm mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{pendingSponsors.length} sponsors awaiting payment</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
