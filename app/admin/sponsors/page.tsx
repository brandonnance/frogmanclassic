'use client'

import { useState, useMemo } from 'react'
import { useStore } from '@/lib/mock-data'
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
import { Plus, Search, Edit2, Trash2, Download } from 'lucide-react'
import type { Sponsor, PaymentMethod, PaymentStatus } from '@/lib/types'

export default function SponsorsPage() {
  const { sponsors, sponsorCredits, addSponsor, updateSponsor, deleteSponsor, eventYears, activeEventYearId } = useStore()

  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    contact_email: '',
    package_id: 'hole_1000',
    payment_method: 'check' as PaymentMethod,
    payment_status: 'pending_offline' as PaymentStatus,
    total_credits: 1,
  })

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

  const handleSaveSponsor = () => {
    if (editingSponsor) {
      updateSponsor(editingSponsor.id, {
        name: formData.name,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        package_id: formData.package_id,
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
      })
    } else {
      addSponsor({
        event_year_id: activeEventYearId || 'ey_2025',
        name: formData.name,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        package_id: formData.package_id,
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
        total_credits: formData.total_credits,
      })
    }
    setDialogOpen(false)
  }

  const handleDeleteSponsor = (id: string) => {
    const sponsor = sponsors.find(s => s.id === id)
    if (sponsor && sponsor.credits_used > 0) {
      alert('Cannot delete sponsor with used credits. Remove team associations first.')
      return
    }
    if (confirm('Are you sure you want to delete this sponsor?')) {
      deleteSponsor(id)
    }
  }

  const exportCSV = () => {
    const headers = ['Name', 'Contact', 'Email', 'Payment Method', 'Payment Status', 'Total Credits', 'Used Credits', 'Available Credits']
    const rows = sortedSponsors.map(s => [
      s.name,
      s.contact_name,
      s.contact_email,
      s.payment_method,
      s.payment_status,
      s.total_credits,
      s.credits_used,
      s.total_credits - s.credits_used,
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
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
              <TableHead>Contact</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead className="text-center">Credits</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSponsors.map((sponsor) => (
              <TableRow key={sponsor.id}>
                <TableCell>
                  <div className="font-medium">{sponsor.name}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{sponsor.contact_name}</div>
                  <div className="text-sm text-gray-500">{sponsor.contact_email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {sponsor.payment_method}
                  </Badge>
                </TableCell>
                <TableCell>
                  {sponsor.payment_status === 'paid' ? (
                    <Badge variant="success">Paid</Badge>
                  ) : sponsor.payment_status === 'pending_online' ? (
                    <Badge variant="warning">Pending (Online)</Badge>
                  ) : (
                    <Badge variant="warning">Pending</Badge>
                  )}
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
                      onClick={() => handleEditSponsor(sponsor)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteSponsor(sponsor.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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

            {!editingSponsor && (
              <div className="space-y-2">
                <Label>Number of Team Entries</Label>
                <Select
                  value={formData.total_credits.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, total_credits: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 entries (Banner only)</SelectItem>
                    <SelectItem value="1">1 entry</SelectItem>
                    <SelectItem value="5">5 entries (Tournament)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Each entry allows one team to register under this sponsor
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSponsor}
              disabled={!formData.name || !formData.contact_name || !formData.contact_email}
            >
              {editingSponsor ? 'Save Changes' : 'Add Sponsor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
