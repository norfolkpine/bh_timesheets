"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import type { Timesheet, User } from "@/components/simple-timesheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TimesheetListProps {
  timesheets: Timesheet[]
  onEditTimesheet: (timesheetId: string) => void
  currentUser: User
}

export function TimesheetList({ timesheets, onEditTimesheet, currentUser }: TimesheetListProps) {
  // Sort timesheets by date in descending order (newest first)
  const sortedTimesheets = [...timesheets].sort((a, b) => {
    return b.weekStarting.getTime() - a.weekStarting.getTime()
  })

  const canEditTimesheet = (status: string) => {
    return !["submitted", "approved", "pending_payment", "paid"].includes(status)
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      pending_payment: "bg-yellow-100 text-yellow-800",
      paid: "bg-purple-100 text-purple-800",
    }
    return (
      <Badge className={statusColors[status as keyof typeof statusColors]}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {timesheets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No timesheets found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left">Week Starting</th>
                <th className="px-4 py-2 text-left">Client/Project</th>
                <th className="px-4 py-2 text-left">Hours</th>
                <th className="px-4 py-2 text-left">Status</th>
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
                    <div className="font-medium">{timesheet.client}</div>
                    <div className="text-sm text-gray-500">{timesheet.location}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">{timesheet.hours.reduce((a, b) => a + b, 0)}</td>
                  <td className="px-4 py-3">
                    {getStatusBadge(timesheet.status)}
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
