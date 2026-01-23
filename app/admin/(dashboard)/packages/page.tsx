'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Edit2, Trash2, RefreshCw, X, GripVertical, Eye, EyeOff } from 'lucide-react'

interface SponsorshipPackage {
  id: string
  event_year_id: string
  name: string
  price: number
  included_entries: number
  dinner_tables: number
  seal_play: 'none' | 'one' | 'both'
  benefits: string[]
  display_order: number
  is_active: boolean
  created_at: string
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<SponsorshipPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<SponsorshipPackage | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    includedEntries: 0,
    dinnerTables: 0,
    sealPlay: 'none' as 'none' | 'one' | 'both',
    benefits: [] as string[],
    isActive: true,
  })
  const [newBenefit, setNewBenefit] = useState('')

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/packages')
      if (!response.ok) {
        throw new Error('Failed to fetch packages')
      }
      const data = await response.json()
      setPackages(data.packages || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packages')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  const handleAddPackage = () => {
    setEditingPackage(null)
    setFormData({
      name: '',
      price: 0,
      includedEntries: 0,
      dinnerTables: 0,
      sealPlay: 'none',
      benefits: [],
      isActive: true,
    })
    setNewBenefit('')
    setDialogOpen(true)
  }

  const handleEditPackage = (pkg: SponsorshipPackage) => {
    setEditingPackage(pkg)
    setFormData({
      name: pkg.name,
      price: pkg.price,
      includedEntries: pkg.included_entries,
      dinnerTables: pkg.dinner_tables,
      sealPlay: pkg.seal_play,
      benefits: [...pkg.benefits],
      isActive: pkg.is_active,
    })
    setNewBenefit('')
    setDialogOpen(true)
  }

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, newBenefit.trim()],
      })
      setNewBenefit('')
    }
  }

  const handleRemoveBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index),
    })
  }

  const handleSavePackage = async () => {
    setSaving(true)
    try {
      if (editingPackage) {
        // Update existing package
        const response = await fetch(`/api/packages/${editingPackage.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            price: formData.price,
            includedEntries: formData.includedEntries,
            dinnerTables: formData.dinnerTables,
            sealPlay: formData.sealPlay,
            benefits: formData.benefits,
            isActive: formData.isActive,
          }),
        })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update package')
        }
      } else {
        // Create new package
        const response = await fetch('/api/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            price: formData.price,
            includedEntries: formData.includedEntries,
            dinnerTables: formData.dinnerTables,
            sealPlay: formData.sealPlay,
            benefits: formData.benefits,
          }),
        })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to create package')
        }
      }
      setDialogOpen(false)
      fetchPackages()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save package')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (pkg: SponsorshipPackage) => {
    try {
      const response = await fetch(`/api/packages/${pkg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !pkg.is_active }),
      })
      if (!response.ok) {
        throw new Error('Failed to update package')
      }
      fetchPackages()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle package status')
    }
  }

  const handleDeletePackage = async (pkg: SponsorshipPackage) => {
    if (!confirm(`Are you sure you want to delete "${pkg.name}"? This cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/packages/${pkg.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete package')
      }
      fetchPackages()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete package')
    }
  }

  // Sort by display order
  const sortedPackages = [...packages].sort((a, b) => a.display_order - b.display_order)

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
        <Button onClick={fetchPackages}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sponsorship Packages</h1>
          <p className="text-gray-500 mt-1">
            {packages.length} packages | {packages.filter(p => p.is_active).length} active
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchPackages}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleAddPackage}>
            <Plus className="h-4 w-4 mr-2" />
            Add Package
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Package Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Entries</TableHead>
              <TableHead className="text-center">Dinner</TableHead>
              <TableHead className="text-center">SEAL Play</TableHead>
              <TableHead>Benefits</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPackages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No packages found. Add your first sponsorship package.
                </TableCell>
              </TableRow>
            ) : (
              sortedPackages.map((pkg) => (
                <TableRow key={pkg.id} className={!pkg.is_active ? 'opacity-50' : ''}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-gray-300" />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{pkg.name}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(pkg.price)}
                  </TableCell>
                  <TableCell className="text-center">
                    {pkg.included_entries > 0 ? (
                      <Badge variant="secondary">{pkg.included_entries}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {pkg.dinner_tables > 0 ? (
                      <Badge variant="secondary">{pkg.dinner_tables}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {pkg.seal_play === 'both' ? (
                      <Badge variant="default">Both Events</Badge>
                    ) : pkg.seal_play === 'one' ? (
                      <Badge variant="secondary">One Event</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {pkg.benefits.length} items
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {pkg.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleToggleActive(pkg)}
                        title={pkg.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {pkg.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleEditPackage(pkg)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => handleDeletePackage(pkg)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edit Package' : 'Add Package'}
            </DialogTitle>
            <DialogDescription>
              {editingPackage
                ? 'Update sponsorship package details'
                : 'Create a new sponsorship package'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Package Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Hole Sponsor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="includedEntries">Team Entries</Label>
                <Input
                  id="includedEntries"
                  type="number"
                  min="0"
                  value={formData.includedEntries}
                  onChange={(e) =>
                    setFormData({ ...formData, includedEntries: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dinnerTables">Dinner Tables</Label>
                <Input
                  id="dinnerTables"
                  type="number"
                  min="0"
                  value={formData.dinnerTables}
                  onChange={(e) =>
                    setFormData({ ...formData, dinnerTables: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>SEAL Play</Label>
                <Select
                  value={formData.sealPlay}
                  onValueChange={(value: 'none' | 'one' | 'both') =>
                    setFormData({ ...formData, sealPlay: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="one">One Event</SelectItem>
                    <SelectItem value="both">Both Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editingPackage && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked === true })
                  }
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Package is active and visible to sponsors
                </Label>
              </div>
            )}

            <div className="space-y-3">
              <Label>Benefits</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a benefit..."
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddBenefit()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddBenefit}
                  disabled={!newBenefit.trim()}
                >
                  Add
                </Button>
              </div>

              {formData.benefits.length > 0 && (
                <div className="border rounded-lg divide-y">
                  {formData.benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3"
                    >
                      <span className="text-sm">{benefit}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleRemoveBenefit(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {formData.benefits.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  No benefits added yet. Type a benefit and press Enter or click Add.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePackage}
              disabled={!formData.name || formData.price <= 0 || saving}
            >
              {saving ? 'Saving...' : editingPackage ? 'Save Changes' : 'Add Package'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
