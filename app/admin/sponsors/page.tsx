'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Plus, Search, Edit2, Trash2, Download, RefreshCw, ExternalLink } from 'lucide-react'
import { getPackageById, formatPrice } from '@/lib/sponsorship-packages'
import type { PaymentMethod, PaymentStatus } from '@/lib/types'

interface Sponsor {
  id: string
  event_year_id: string
  name: string
  contact_name: string
  contact_email: string
  package_id: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  total_credits: number
  credits_used: number
  access_token: string
  created_at: string
}

interface SponsorCredit {
  id: string
  sponsor_id: string
  redemption_code: string
  redeemed_by_team_id: string | null
  redeemed_at: string | null
  captain_email: string | null
  email_sent_at: string | null
  created_at: string
}

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [credits, setCredits] = useState<SponsorCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    contact_email: '',
    package_id: 'hole_1000',
    payment_method: 'check' as PaymentMethod,
    payment_status: 'pending_offline' as PaymentStatus,
    total_credits: 1,
  })

  const fetchSponsors = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/sponsors')
      if (!response.ok) {
        throw new Error('Failed to fetch sponsors')
      }
      const data = await response.json()
      setSponsors(data.sponsors || [])
      setCredits(data.credits || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sponsors')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSponsors()
  }, [fetchSponsors])

  // Filter sponsors
  const filteredSponsors = useMemo(() => {
    if (!search) return sponsors
    const searchLower = search.toLowerCase()
    return sponsors.filter(
      (s) =>
        s.name.toLowerCase().includes(searchLower) ||
        s.contact_name.toLowerCase().includes(searchLower) ||
        s.contact_email.toLowerCase().includes(searchLower)
    )
  }, [sponsors, search])

  // Sort by name
  const sortedSponsors = useMemo(
    () => [...filteredSponsors].sort((a, b) => a.name.localeCompare(b.name)),
    [filteredSponsors]
  )

  const handleAddSponsor = () => {
    setEditingSponsor(null)
    setFormData({
      name: '',
      contact_name: '',
      contact_email: '',
      package_id: 'hole_1000',
      payment_method: 'check',
      payment_status: 'pending_offline',
      total_credits: 1,
    })
    setDialogOpen(true)
  }

  const handleEditSponsor = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor)
    setFormData({
      name: sponsor.name,
      contact_name: sponsor.contact_name,
      contact_email: sponsor.contact_email,
      package_id: sponsor.package_id,
      payment_method: sponsor.payment_method,
      payment_status: sponsor.payment_status,
      total_credits: sponsor.total_credits,
    })
    setDialogOpen(true)
  }

  const handleSaveSponsor = async () => {
    setSaving(true)
    try {
      if (editingSponsor) {
        // Update existing sponsor
        const response = await fetch(`/api/sponsors/${editingSponsor.access_token}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            contact_name: formData.contact_name,
            contact_email: formData.contact_email,
            payment_method: formData.payment_method,
            payment_status: formData.payment_status,
          }),
        })
        if (!response.ok) {
          throw new Error('Failed to update sponsor')
        }
      } else {
        // Create new sponsor
        const pkg = getPackageById(formData.package_id)
        const response = await fetch('/api/sponsors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: formData.name,
            contactName: formData.contact_name,
            contactEmail: formData.contact_email,
            packageId: formData.package_id,
            paymentMethod: formData.payment_method,
          }),
        })
        if (!response.ok) {
          throw new Error('Failed to create sponsor')
        }
      }
      setDialogOpen(false)
      fetchSponsors()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save sponsor')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSponsor = async (sponsor: Sponsor) => {
    if (sponsor.credits_used > 0) {
      alert('Cannot delete sponsor with used credits. Remove team associations first.')
      return
    }
    if (!confirm('Are you sure you want to delete this sponsor?')) {
      return
    }

    try {
      const response = await fetch(`/api/sponsors/${sponsor.access_token}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete sponsor')
      }
      fetchSponsors()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete sponsor')
    }
  }

  const exportCSV = () => {
    const headers = ['Name', 'Contact', 'Email', 'Package', 'Payment Method', 'Payment Status', 'Total Credits', 'Used Credits', 'Available Credits']
    const rows = sortedSponsors.map(s => {
      const pkg = getPackageById(s.package_id)
      return [
        s.name,
        s.contact_name,
        s.contact_email,
        pkg?.name || s.package_id,
        s.payment_method,
        s.payment_status,
        s.total_credits,
        s.credits_used,
        s.total_credits - s.credits_used,
      ]
    })

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sponsors.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Calculate totals
  const totalCredits = sponsors.reduce((sum, s) => sum + s.total_credits, 0)
  const usedCredits = sponsors.reduce((sum, s) => sum + s.credits_used, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchSponsors}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sponsors</h1>
          <p className="text-gray-500 mt-1">
            {sponsors.length} sponsors | {usedCredits}/{totalCredits} credits used
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchSponsors}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleAddSponsor}>
            <Plus className="h-4 w-4 mr-2" />
            Add Sponsor
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search sponsors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sponsor</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-center">Credits</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSponsors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No sponsors found
                </TableCell>
              </TableRow>
            ) : (
              sortedSponsors.map((sponsor) => {
                const pkg = getPackageById(sponsor.package_id)
                return (
                  <TableRow key={sponsor.id}>
                    <TableCell>
                      <div className="font-medium">{sponsor.name}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(sponsor.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{pkg?.name || sponsor.package_id}</div>
                      {pkg && (
                        <div className="text-xs text-gray-500">{formatPrice(pkg.price)}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{sponsor.contact_name}</div>
                      <div className="text-sm text-gray-500">{sponsor.contact_email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="capitalize w-fit">
                          {sponsor.payment_method}
                        </Badge>
                        {sponsor.payment_status === 'paid' ? (
                          <Badge variant="success" className="w-fit">Paid</Badge>
                        ) : sponsor.payment_status === 'pending_online' ? (
                          <Badge variant="warning" className="w-fit">Pending (Online)</Badge>
                        ) : (
                          <Badge variant="warning" className="w-fit">Pending</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-medium">{sponsor.credits_used}</span>
                        <span className="text-gray-400">/</span>
                        <span>{sponsor.total_credits}</span>
                      </div>
                      {sponsor.total_credits - sponsor.credits_used > 0 && (
                        <div className="text-xs text-green-600">
                          {sponsor.total_credits - sponsor.credits_used} available
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => window.open(`/sponsor/edit?token=${sponsor.access_token}`, '_blank')}
                          title="Open sponsor portal"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleEditSponsor(sponsor)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteSponsor(sponsor)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSponsor ? 'Edit Sponsor' : 'Add Sponsor'}
            </DialogTitle>
            <DialogDescription>
              {editingSponsor
                ? 'Update sponsor information'
                : 'Add a new sponsor to the event'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company/Sponsor Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                />
              </div>
            </div>

            {!editingSponsor && (
              <div className="space-y-2">
                <Label>Sponsorship Package</Label>
                <Select
                  value={formData.package_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, package_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hole_1000">$1,000 Hole Sponsor</SelectItem>
                    <SelectItem value="event_1500">$1,500 Event Sponsor</SelectItem>
                    <SelectItem value="hole_2500">$2,500 Hole Sponsor</SelectItem>
                    <SelectItem value="golf_cart">$2,500 Golf Cart Sponsor</SelectItem>
                    <SelectItem value="driving_range">$2,500 Driving Range Sponsor</SelectItem>
                    <SelectItem value="tee_block">$3,000 Tee Block Sponsor</SelectItem>
                    <SelectItem value="flag">$3,500 Flag Sponsor</SelectItem>
                    <SelectItem value="seal">$5,000 SEAL Sponsor</SelectItem>
                    <SelectItem value="tee_prize">$7,500 Tee Prize Sponsor</SelectItem>
                    <SelectItem value="tournament">$10,000+ Tournament Sponsor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value: PaymentMethod) =>
                    setFormData({ ...formData, payment_method: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="invoice">Invoice / ACH</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select
                  value={formData.payment_status}
                  onValueChange={(value: PaymentStatus) =>
                    setFormData({ ...formData, payment_status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_offline">Pending (Offline)</SelectItem>
                    <SelectItem value="pending_online">Pending (Online)</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSponsor}
              disabled={!formData.name || !formData.contact_name || !formData.contact_email || saving}
            >
              {saving ? 'Saving...' : editingSponsor ? 'Save Changes' : 'Add Sponsor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
