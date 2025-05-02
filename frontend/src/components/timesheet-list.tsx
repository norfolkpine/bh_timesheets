"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Eye, Plus } from "lucide-react"
import type { Timesheet, PaginatedResponse } from "@/types/timesheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { timesheetService } from "@/services/timesheet"

interface TimesheetListProps {
  onViewTimesheet: (timesheet: Timesheet) => void
  onCreateTimesheet: () => void
}

// Helper function to safely parse and format dates
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return 'Invalid date'
  }
  try {
    const date = parseISO(dateString)
    return format(date, 'd MMM, yyyy')
  } catch (error) {
    console.error('Error parsing date:', dateString, error)
    return 'Invalid date'
  }
}

export function TimesheetList({ onViewTimesheet, onCreateTimesheet }: TimesheetListProps) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTimesheets()
  }, [])

  const loadTimesheets = async () => {
    try {
      setLoading(true)
      const response = await timesheetService.getTimesheets()
      setTimesheets(response.results)
      setError(null)
    } catch (err) {
      console.error('Error loading timesheets:', err)
      setError('Failed to load timesheets')
      setTimesheets([])
    } finally {
      setLoading(false)
    }
  }

  const sortedTimesheets = [...timesheets].sort((a, b) => {
    try {
      const dateA = a.week_starting ? parseISO(a.week_starting) : new Date(0)
      const dateB = b.week_starting ? parseISO(b.week_starting) : new Date(0)
      return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
    } catch (error) {
      console.error('Error sorting dates:', error)
      return 0
    }
  })

  const getStatusBadgeColor = (status: Timesheet['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500 hover:bg-gray-600'
      case 'submitted':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'approved':
        return 'bg-green-500 hover:bg-green-600'
      case 'rejected':
        return 'bg-red-500 hover:bg-red-600'
      case 'pending_payment':
        return 'bg-yellow-500 hover:bg-yellow-600'
      case 'paid':
        return 'bg-purple-500 hover:bg-purple-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  if (loading) {
    return <div>Loading timesheets...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">My Timesheets</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            Sort {sortOrder === 'asc' ? '↓' : '↑'}
          </Button>
          <Button onClick={onCreateTimesheet}>
            <Plus className="mr-2 h-4 w-4" />
            New Timesheet
          </Button>
        </div>
      </div>

      {sortedTimesheets.length === 0 ? (
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-gray-500">No timesheets found.</p>
            <Button variant="outline" className="mt-4" onClick={onCreateTimesheet}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first timesheet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedTimesheets.map((timesheet) => (
            <Card key={timesheet.uuid} className="overflow-hidden">
              <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-b">
                <div className="font-medium">
                  Week of {formatDate(timesheet.week_starting)}
                </div>
                <Badge className={getStatusBadgeColor(timesheet.status)}>
                  {timesheet.status.replace('_', ' ')}
                </Badge>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p>
                      {timesheet.project?.customer?.name || 'No Customer'} / {timesheet.project?.name || 'No Project'}
                    </p>
                    <div className="mt-2">
                      <p>
                        <span className="font-medium">{timesheet.total_hours || '0.00'}</span> hours
                      </p>
                      {timesheet.notes && (
                        <p className="text-sm text-gray-500 mt-1">{timesheet.notes}</p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onViewTimesheet(timesheet)}>
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
