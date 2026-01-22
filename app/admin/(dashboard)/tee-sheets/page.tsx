'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export default function TeeSheetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tee Sheets</h1>
        <p className="text-gray-500 mt-1">Manage tee time assignments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tee Sheet Management
          </CardTitle>
          <CardDescription>
            Assign teams to tee times for each day and session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Calendar className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium">Coming Soon</p>
            <p className="text-sm mt-2">
              Tee sheet management will be available once teams are registered
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
