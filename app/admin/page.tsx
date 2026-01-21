'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Users, Building2, UsersRound, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Sponsor {
  id: string
  name: string
  total_credits: number
  credits_used: number
  payment_status: string
}

interface Team {
  id: string
  event_type: string
  withdrawn_at: string | null
}

interface Player {
  id: string
}

export default function AdminDashboard() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [sponsorsRes, teamsRes, playersRes] = await Promise.all([
        fetch('/api/sponsors'),
        fetch('/api/teams'),
        fetch('/api/players')
      ])

      if (sponsorsRes.ok) {
        const data = await sponsorsRes.json()
        setSponsors(data.sponsors || [])
      }
      if (teamsRes.ok) {
        const data = await teamsRes.json()
        setTeams(data.teams || [])
        // Players come from teams API
        setPlayers(data.players || [])
      }
      if (playersRes.ok) {
        const data = await playersRes.json()
        if (data.players?.length > 0) {
          setPlayers(data.players)
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calculate stats
  const activeTeams = teams.filter(t => !t.withdrawn_at)
  const fridayTeams = activeTeams.filter(t => t.event_type === 'friday')
  const satSunTeams = activeTeams.filter(t => t.event_type === 'sat_sun')

  const totalCredits = sponsors.reduce((sum, s) => sum + s.total_credits, 0)
  const usedCredits = sponsors.reduce((sum, s) => sum + s.credits_used, 0)

  const paidSponsors = sponsors.filter(s => s.payment_status === 'paid')
  const pendingSponsors = sponsors.filter(s => s.payment_status === 'pending_offline' || s.payment_status === 'pending_online')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Frogman Classic 2025 Overview</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
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
                Registered players
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

        <Card>
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
                  <p className="text-xs text-muted-foreground">Best ball format</p>
                </div>
                <div className="text-2xl font-bold">{fridayTeams.length}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Sat/Sun (2 player teams)</p>
                  <p className="text-xs text-muted-foreground">Tournament format</p>
                </div>
                <div className="text-2xl font-bold">{satSunTeams.length}</div>
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
              {totalCredits > 0 && (
                <div className="mt-2 h-2 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-600"
                    style={{ width: `${(usedCredits / totalCredits) * 100}%` }}
                  />
                </div>
              )}
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Common actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                href="/sponsor"
                className="block p-2 rounded hover:bg-gray-100 text-sm text-blue-600"
              >
                View sponsor signup page
              </Link>
              <Link
                href="/admin/sponsors"
                className="block p-2 rounded hover:bg-gray-100 text-sm text-blue-600"
              >
                Manage sponsors
              </Link>
              <Link
                href="/admin/teams"
                className="block p-2 rounded hover:bg-gray-100 text-sm text-blue-600"
              >
                View registered teams
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
