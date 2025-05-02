"use client"
import { format } from "date-fns"
import type { Timesheet, User } from "./simple-timesheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Add imports for the customer and project data
import { INITIAL_CUSTOMERS } from "./customer-management"
import { INITIAL_PROJECTS } from "./project-management"
import { useState } from "react"

interface TimesheetListProps {
  timesheets: Timesheet[]
  onEditTimesheet: (id: string) => void
  currentUser: User
}

export function TimesheetList({ timesheets, onEditTimesheet, currentUser }: TimesheetListProps) {
  // Sort timesheets by date in descending order (newest first)
  const sortedTimesheets = [...timesheets].sort((a, b) => b.weekStarting.getTime() - a.weekStarting.getTime())

  // Add these inside the TimesheetList component, after the sortedTimesheets declaration:
  const [customers] = useState(INITIAL_CUSTOMERS)
  const [projects] = useState(INITIAL_PROJECTS)

  // Add helper functions to get names from IDs
  const getClientName = (clientId: string) => {
    const client = customers.find((c) => c.id === clientId)
    return client ? client.name : clientId
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    return project ? project.name : projectId
  }

  // Update the TimesheetList component to disable editing for non-editable timesheets

  // Add this function inside the TimesheetList component
  const canEditTimesheet = (status: string) => {
    return !["submitted", "approved", "pending_payment", "paid"].includes(status)
  }

  // Update the getStatusBadge function to handle future timesheets
  const getStatusBadge = (status: string, weekStarting: Date) => {
    // Check if the timesheet is for a future week
    const isFutureTimesheet = weekStarting > new Date()

    // If it's a future timesheet, show a "Future" badge (priority over other statuses)
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

  const getTotalHours = (hours: number[]) => {
    return hours.reduce((sum, hour) => sum + hour, 0).toFixed(1)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">My Timesheets</h2>
        <Button onClick={() => onEditTimesheet("new")} className="bg-blue-600 hover:bg-blue-700 text-white">
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
                  key={timesheet.id}
                  className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onEditTimesheet(timesheet.id)}
                >
                  <td className="px-4 py-3">{format(timesheet.weekStarting, "MMM d, yyyy")}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {timesheet.client ? getClientName(timesheet.client) : "No client"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {timesheet.location ? getProjectName(timesheet.location) : "No project"}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{getTotalHours(timesheet.hours)}</td>
                  <td className="px-4 py-3">
                    {getStatusBadge(timesheet.status, timesheet.weekStarting)}
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
