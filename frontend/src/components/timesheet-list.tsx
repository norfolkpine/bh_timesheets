"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import type { Timesheet, PaginatedResponse } from "@/types/timesheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { timesheetService } from "@/services/timesheet"

interface TimesheetListProps {
  onViewTimesheet: (timesheet: Timesheet) => void
  onCreateTimesheet: () => void
}

export function TimesheetList({ onViewTimesheet, onCreateTimesheet }: TimesheetListProps) {
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

  // Sort timesheets by date in descending order (newest first)
  const sortedTimesheets = [...timesheets].sort((a, b) => {
    const dateA = parseISO(a.week_starting)
    const dateB = parseISO(b.week_starting)
    return dateB.getTime() - dateA.getTime()
  })

  const canEditTimesheet = (status: string) => {
    return !["submitted", "approved", "pending_payment", "paid"].includes(status)
  }

  const getStatusBadge = (status: string, weekStarting: string) => {
    // Check if the timesheet is for a future week
    const isFutureTimesheet = parseISO(weekStarting) > new Date()

    // If it's a future timesheet, show a "Future" badge
    if (isFutureTimesheet) {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          Future
        </Badge>
      )
    }

    // Otherwise, show the regular status badge
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="bg-gray-100">
            Draft
          </Badge>
        )
      case "submitted":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Submitted
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Rejected
          </Badge>
        )
      case "pending_payment":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Pending Payment
          </Badge>
        )
      case "paid":
        return (
          <Badge variant="outline" className="bg-green-200 text-green-900">
            Paid
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100">
            Draft
          </Badge>
        )
    }
  }

  if (loading) {
    return <div>Loading timesheets...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">My Timesheets</h2>
        <Button onClick={onCreateTimesheet} className="bg-blue-600 hover:bg-blue-700 text-white">
          New Timesheet
        </Button>
      </div>

      {sortedTimesheets.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">No timesheets found. Create your first timesheet!</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Week</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Client / Project</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Hours</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedTimesheets.map((timesheet) => (
                <tr
                  key={timesheet.uuid}
                  className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onViewTimesheet(timesheet)}
                >
                  <td className="px-4 py-3">{format(parseISO(timesheet.week_starting), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {timesheet.project?.customer?.name || "No client"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {timesheet.project?.name || "No project"}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{timesheet.total_hours || "0.0"}</td>
                  <td className="px-4 py-3">
                    {getStatusBadge(timesheet.status, timesheet.week_starting)}
                    {!canEditTimesheet(timesheet.status) && <div className="text-xs text-gray-500 mt-1">View only</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
