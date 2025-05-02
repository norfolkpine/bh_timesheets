"use client"
import { format } from "date-fns/format"
import type { Timesheet, User } from "./simple-timesheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Add imports for the customer and project data
import { INITIAL_CUSTOMERS } from "./customer-management"
import { INITIAL_PROJECTS } from "./project-management"
import { useState, useEffect } from "react"
import { projectService } from "@/services/project-service"
import { customerService } from "@/services/customer-service"

interface TimesheetListProps {
  timesheets: Timesheet[]
  onEditTimesheet: (id: string) => void
  currentUser: User
}

export function TimesheetList({ timesheets, onEditTimesheet, currentUser }: TimesheetListProps) {
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS)
  const [projects, setProjects] = useState(INITIAL_PROJECTS)
  const [projectMap, setProjectMap] = useState<Record<string, string>>({}) // UUID to name mapping
  const [clientMap, setClientMap] = useState<Record<string, string>>({}) // UUID to name mapping
  const [isLoading, setIsLoading] = useState(true)

  // Load projects and customers from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [projectsData, customersData] = await Promise.all([
          projectService.getProjects(),
          customerService.getCustomers(),
        ])

        if (Array.isArray(projectsData)) {
          setProjects(projectsData)

          // Create UUID to name mapping for projects
          const projectMapping: Record<string, string> = {}
          projectsData.forEach((project) => {
            if (project.uuid) {
              projectMapping[project.uuid] = project.name
            }
          })
          setProjectMap(projectMapping)
        }

        if (Array.isArray(customersData)) {
          setCustomers(customersData)

          // Create UUID to name mapping for customers
          const clientMapping: Record<string, string> = {}
          customersData.forEach((customer) => {
            if (customer.uuid) {
              clientMapping[customer.uuid] = customer.name
            }
          })
          setClientMap(clientMapping)
        }
      } catch (error) {
        console.error("Failed to load projects and customers:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Sort timesheets by date in descending order (newest first)
  const sortedTimesheets = [...timesheets].sort((a, b) => {
    // Ensure both dates are valid before comparing
    const dateA = a.weekStarting instanceof Date && !isNaN(a.weekStarting.getTime()) ? a.weekStarting.getTime() : 0
    const dateB = b.weekStarting instanceof Date && !isNaN(b.weekStarting.getTime()) ? b.weekStarting.getTime() : 0
    return dateB - dateA
  })

  // Add helper functions to get names from IDs
  const getClientName = (clientId: string) => {
    if (!clientId) return "No client"

    // First check if it's a UUID in our mapping
    if (clientMap[clientId]) {
      return clientMap[clientId]
    }

    // Fall back to the old method
    const client = customers.find((c) => c.id === clientId || c.uuid === clientId)
    return client ? client.name : clientId
  }

  const getProjectName = (projectId: string) => {
    if (!projectId) return "No project"

    // First check if it's a UUID in our mapping
    if (projectMap[projectId]) {
      return projectMap[projectId]
    }

    // Fall back to the old method
    const project = projects.find((p) => p.id === projectId || p.uuid === projectId)
    return project ? project.name : projectId
  }

  // Add this function inside the TimesheetList component
  const canEditTimesheet = (status: string) => {
    return !["submitted", "approved", "pending_payment", "paid"].includes(status)
  }

  // Update the getStatusBadge function to handle future timesheets
  const getStatusBadge = (status: string, weekStarting: Date) => {
    // Check if the date is valid
    const isValidDate = weekStarting instanceof Date && !isNaN(weekStarting.getTime())

    // Check if the timesheet is for a future week (only if date is valid)
    const isFutureTimesheet = isValidDate && weekStarting > new Date()

    // If it's a future timesheet, show a "Future" badge (priority over other statuses)
    if (isFutureTimesheet) {
      return (
        <Badge key="future-badge" variant="outline" className="bg-blue-100 text-blue-800">
          Future
        </Badge>
      )
    }

    // Otherwise, show the regular status badge
    switch (status) {
      case "draft":
        return (
          <Badge key="draft-badge" variant="outline" className="bg-gray-100">
            Draft
          </Badge>
        )
      case "submitted":
        return (
          <Badge key="submitted-badge" variant="outline" className="bg-yellow-100 text-yellow-800">
            Submitted
          </Badge>
        )
      case "approved":
        return (
          <Badge key="approved-badge" variant="outline" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge key="rejected-badge" variant="outline" className="bg-red-100 text-red-800">
            Rejected
          </Badge>
        )
      case "pending_payment":
        return (
          <Badge key="pending-payment-badge" variant="outline" className="bg-blue-100 text-blue-800">
            Pending Payment
          </Badge>
        )
      case "paid":
        return (
          <Badge key="paid-badge" variant="outline" className="bg-green-200 text-green-900">
            Paid
          </Badge>
        )
      default:
        return (
          <Badge key="default-badge" variant="outline" className="bg-gray-100">
            Draft
          </Badge>
        )
    }
  }

  const getTotalHours = (timesheet: Timesheet): number => {
    // First check if the API provided a totalHours value
    if (typeof timesheet.totalHours === "number") {
      return timesheet.totalHours
    }

    // Otherwise calculate from the hours array
    if (!timesheet || !Array.isArray(timesheet.hours)) {
      return 0
    }

    // Filter out any non-numeric values and sum the valid hours
    return timesheet.hours.reduce((sum, hour) => {
      // Use the logical OR to default to 0 if hour is not a number
      const validHour = typeof hour === "number" && !isNaN(hour) ? hour : 0
      return sum + validHour
    }, 0)
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2">Loading timesheets...</p>
      </div>
    )
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
              {sortedTimesheets.map((timesheet, index) => (
                <tr
                  key={timesheet.id || `timesheet-${index}`}
                  className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onEditTimesheet(timesheet.id)}
                >
                  <td className="px-4 py-3">
                    {timesheet.weekStarting instanceof Date && !isNaN(timesheet.weekStarting.getTime())
                      ? format(timesheet.weekStarting, "MMM d, yyyy")
                      : "Invalid date"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {timesheet.clientName || (timesheet.client ? getClientName(timesheet.client) : "No client")}
                    </div>
                    <div className="text-sm text-gray-500">
                      {timesheet.projectName ||
                        (timesheet.location ? getProjectName(timesheet.location) : "No project")}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{getTotalHours(timesheet).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {getStatusBadge(
                      timesheet.status,
                      timesheet.weekStarting instanceof Date
                        ? timesheet.weekStarting
                        : new Date(timesheet.weekStarting),
                    )}
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
