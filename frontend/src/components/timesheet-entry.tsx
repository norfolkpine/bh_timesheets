"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns/format"
import { addDays } from "date-fns/addDays"
import { Save, X, MessageSquare, Send } from "lucide-react"
import type { Timesheet, TimeDetail } from "./simple-timesheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { INITIAL_CUSTOMERS } from "./customer-management"
import { INITIAL_PROJECTS } from "./project-management"
import { Card, CardContent } from "@/components/ui/card"
import { customerService } from "@/services/customer-service"
import { projectService } from "@/services/project-service"
import { toast } from "@/components/ui/use-toast"

// Add isReadOnly prop to the interface
interface TimesheetEntryProps {
  timesheet: Timesheet
  onSave: (timesheet: Timesheet) => void
  onSubmit: (timesheet: Timesheet) => void
  onCancel: () => void
}

const getInitialWeekStarting = () => {
  const today = new Date()
  const day = today.getDay() // 0 is Sunday, 1 is Monday, etc.
  // Calculate days to subtract to get to the most recent Monday
  const daysToSubtract = day === 0 ? 6 : day - 1 // If Sunday, go back 6 days, otherwise go back (day - 1) days
  const monday = new Date(today)
  monday.setDate(today.getDate() - daysToSubtract)
  // Reset to midnight
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function TimesheetEntry({ timesheet, onSave, onSubmit, onCancel }: TimesheetEntryProps) {
  // Initialize with default values to prevent undefined errors
  const initialTimesheet = {
    ...timesheet,
    weekStarting:
      timesheet.weekStarting instanceof Date
        ? timesheet.weekStarting
        : new Date(timesheet.weekStarting || getInitialWeekStarting()),
    hours: Array.isArray(timesheet.hours) ? timesheet.hours : Array(7).fill(0),
    timeDetails: Array.isArray(timesheet.timeDetails)
      ? timesheet.timeDetails
      : Array(7).fill({ useDetailedTime: false }),
    dayNotes: Array.isArray(timesheet.dayNotes) ? timesheet.dayNotes : Array(7).fill(""),
  }

  const [editedTimesheet, setEditedTimesheet] = useState<Timesheet>(initialTimesheet)
  const [expandedNoteIndex, setExpandedNoteIndex] = useState<number | null>(null)
  const noteRefs = useRef<(HTMLTextAreaElement | null)[]>(Array(7).fill(null))

  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS)
  const [projects, setProjects] = useState(INITIAL_PROJECTS)
  const [projectMap, setProjectMap] = useState<Record<string, string>>({}) // UUID to name mapping
  const [clientMap, setClientMap] = useState<Record<string, string>>({}) // UUID to name mapping
  const [isLoading, setIsLoading] = useState(true)
  const [availableProjects, setAvailableProjects] = useState<any[]>([])

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

        // If we have a client selected, load its projects
        if (editedTimesheet.client) {
          const clientProjects = await projectService.getProjectsByCustomer(editedTimesheet.client)
          const activeProjects = clientProjects.filter((project) => project.isActive || project.is_active)
          setAvailableProjects(activeProjects)
        }
      } catch (error) {
        console.error("Failed to load projects and customers:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [editedTimesheet.client]) // Add editedTimesheet.client as a dependency

  // Ensure weekStarting is a Monday when initializing the timesheet
  useEffect(() => {
    // Check if weekStarting is already set and is a valid date
    if (editedTimesheet.weekStarting) {
      const weekStarting =
        editedTimesheet.weekStarting instanceof Date
          ? editedTimesheet.weekStarting
          : new Date(editedTimesheet.weekStarting)

      // Check if the weekStarting is not a Monday (1)
      if (weekStarting.getDay() !== 1) {
        console.warn("Timesheet starting date is not a Monday, adjusting to the nearest Monday")
        const correctedDate = getInitialWeekStarting()
        setEditedTimesheet((prev) => ({
          ...prev,
          weekStarting: correctedDate,
        }))
      }
    }
  }, [])

  // Initialize timeDetails if it doesn't exist
  useEffect(() => {
    if (!editedTimesheet.timeDetails || !Array.isArray(editedTimesheet.timeDetails)) {
      setEditedTimesheet({
        ...editedTimesheet,
        timeDetails: Array(7).fill({ useDetailedTime: false }),
      })
    }

    // Ensure hours array exists
    if (!editedTimesheet.hours || !Array.isArray(editedTimesheet.hours)) {
      setEditedTimesheet({
        ...editedTimesheet,
        hours: Array(7).fill(0),
      })
    }

    // Ensure dayNotes array exists
    if (!editedTimesheet.dayNotes || !Array.isArray(editedTimesheet.dayNotes)) {
      setEditedTimesheet({
        ...editedTimesheet,
        dayNotes: Array(7).fill(""),
      })
    }
  }, [])

  // Focus the textarea when a note is expanded
  useEffect(() => {
    if (expandedNoteIndex !== null && noteRefs.current[expandedNoteIndex]) {
      noteRefs.current[expandedNoteIndex]?.focus()
    }
  }, [expandedNoteIndex])

  // Add a function to check if the timesheet is in read-only mode
  const isReadOnly = () => {
    return ["submitted", "approved", "pending_payment", "paid"].includes(editedTimesheet.status)
  }

  const handleHoursChange = (dayIndex: number, value: string) => {
    // Ensure hours array exists
    const currentHours = Array.isArray(editedTimesheet.hours) ? [...editedTimesheet.hours] : Array(7).fill(0)

    // If the value is empty (user backspaced everything), set to 0
    if (value === "" || value === null) {
      currentHours[dayIndex] = 0
      setEditedTimesheet({ ...editedTimesheet, hours: currentHours })
      return
    }

    // Otherwise parse the number as before
    const hours = Number.parseFloat(value)
    if (!isNaN(hours)) {
      currentHours[dayIndex] = hours
      setEditedTimesheet({ ...editedTimesheet, hours: currentHours })
    }
  }

  const handleDayNoteChange = (dayIndex: number, note: string) => {
    // Ensure dayNotes array exists
    const currentDayNotes = Array.isArray(editedTimesheet.dayNotes) ? [...editedTimesheet.dayNotes] : Array(7).fill("")

    currentDayNotes[dayIndex] = note
    setEditedTimesheet({ ...editedTimesheet, dayNotes: currentDayNotes })
  }

  const toggleDetailedTime = (dayIndex: number, useDetailed: boolean) => {
    // Ensure timeDetails array exists
    const currentTimeDetails = Array.isArray(editedTimesheet.timeDetails)
      ? [...editedTimesheet.timeDetails]
      : Array(7).fill({ useDetailedTime: false })

    // Ensure hours array exists
    const currentHours = Array.isArray(editedTimesheet.hours) ? [...editedTimesheet.hours] : Array(7).fill(0)

    // If switching to detailed time, initialize with default values
    if (useDetailed) {
      currentTimeDetails[dayIndex] = {
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 30,
        useDetailedTime: true,
      }

      // Calculate and update hours based on the default times
      currentHours[dayIndex] = 7.5 // 8 hours - 30 min break
      setEditedTimesheet({
        ...editedTimesheet,
        timeDetails: currentTimeDetails,
        hours: currentHours,
      })
    } else {
      // Keep the existing hours but mark as not using detailed time
      currentTimeDetails[dayIndex] = {
        ...currentTimeDetails[dayIndex],
        useDetailedTime: false,
      }
      setEditedTimesheet({
        ...editedTimesheet,
        timeDetails: currentTimeDetails,
      })
    }
  }

  const handleTimeDetailChange = (dayIndex: number, field: keyof TimeDetail, value: any) => {
    // Ensure timeDetails array exists
    const currentTimeDetails = Array.isArray(editedTimesheet.timeDetails)
      ? [...editedTimesheet.timeDetails]
      : Array(7).fill({ useDetailedTime: false })

    // Ensure the specific day's timeDetail exists
    if (!currentTimeDetails[dayIndex]) {
      currentTimeDetails[dayIndex] = { useDetailedTime: true }
    }

    currentTimeDetails[dayIndex] = {
      ...currentTimeDetails[dayIndex],
      [field]: value,
    }

    // Calculate hours if we have start and end time
    if (field === "startTime" || field === "endTime" || field === "breakMinutes") {
      const { startTime, endTime, breakMinutes } = currentTimeDetails[dayIndex]

      if (startTime && endTime) {
        try {
          // Validate time format (should be HH:MM)
          const isValidTimeFormat = (time: string) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)

          if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
            console.warn("Invalid time format. Expected HH:MM")
            setEditedTimesheet({
              ...editedTimesheet,
              timeDetails: currentTimeDetails,
            })
            return
          }

          // Parse times manually to avoid date-fns issues
          const [startHours, startMinutes] = startTime.split(":").map(Number)
          const [endHours, endMinutes] = endTime.split(":").map(Number)

          // Calculate minutes worked directly without using Date objects
          let minutesWorked = 0

          // Convert hours and minutes to total minutes
          const startTotalMinutes = startHours * 60 + startMinutes
          const endTotalMinutes = endHours * 60 + endMinutes

          // Handle case where end time is on the next day
          if (endTotalMinutes < startTotalMinutes) {
            // End time is on the next day (add 24 hours in minutes)
            minutesWorked = 24 * 60 - startTotalMinutes + endTotalMinutes
          } else {
            // Same day calculation
            minutesWorked = endTotalMinutes - startTotalMinutes
          }

          // Subtract break if applicable
          if (breakMinutes) {
            minutesWorked -= breakMinutes
          }

          // Convert to hours (with 2 decimal precision)
          const hoursWorked = Math.max(0, minutesWorked / 60)

          // Update hours
          const currentHours = Array.isArray(editedTimesheet.hours) ? [...editedTimesheet.hours] : Array(7).fill(0)
          currentHours[dayIndex] = Number.parseFloat(hoursWorked.toFixed(2))

          setEditedTimesheet({
            ...editedTimesheet,
            timeDetails: currentTimeDetails,
            hours: currentHours,
          })
          return
        } catch (error) {
          console.error("Error calculating time:", error)
        }
      }
    }

    // If we can't calculate hours or for other fields, just update the time details
    setEditedTimesheet({
      ...editedTimesheet,
      timeDetails: currentTimeDetails,
    })
  }

  const formatTimeValue = (time: string) => {
    if (!time) return null

    // If it's already in HH:MM format, return it
    if (/^\d{2}:\d{2}$/.test(time)) return time

    // Try to parse and format the time
    try {
      const [hours, minutes] = time.split(":").map(Number)
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
    } catch (e) {
      console.error("Invalid time format:", time)
      return null
    }
  }

  const handleSave = () => {
    // Format time values properly before saving
    const formattedTimeDetails = editedTimesheet.timeDetails?.map((detail) => {
      if (!detail || !detail.useDetailedTime) {
        return detail
      }

      // Ensure time values are in HH:MM format
      return {
        ...detail,
        startTime: detail.startTime ? formatTimeValue(detail.startTime) : null,
        endTime: detail.endTime ? formatTimeValue(detail.endTime) : null,
      }
    })

    // Update the timesheet with formatted values
    const updatedTimesheet = {
      ...editedTimesheet,
      timeDetails: formattedTimeDetails,
    }

    // If it was rejected, change status back to draft when saving edits
    const updatedStatus = editedTimesheet.status === "rejected" ? "draft" : editedTimesheet.status
    onSave({
      ...updatedTimesheet,
      status: updatedStatus,
      // Clear rejection reason if it was rejected before
      rejectionReason: updatedStatus === "draft" ? undefined : editedTimesheet.rejectionReason,
    })
  }

  const handleSubmit = () => {
    // Format time values properly before saving
    const formattedTimeDetails = editedTimesheet.timeDetails?.map((detail) => {
      if (!detail || !detail.useDetailedTime) {
        return detail
      }

      // Ensure time values are in HH:MM format
      return {
        ...detail,
        startTime: detail.startTime ? formatTimeValue(detail.startTime) : null,
        endTime: detail.endTime ? formatTimeValue(detail.endTime) : null,
      }
    })

    // Ensure the timesheet data is properly formatted before saving
    const updatedTimesheet = {
      ...editedTimesheet,
      // Make sure location is set to the project UUID
      location: editedTimesheet.location,
      // Ensure hours array is complete
      hours: Array.isArray(editedTimesheet.hours) ? editedTimesheet.hours.map((h) => h || 0) : Array(7).fill(0),
      // Ensure timeDetails array is complete
      timeDetails: Array.isArray(editedTimesheet.timeDetails)
        ? formattedTimeDetails.map((detail, index) => ({
            useDetailedTime: detail?.useDetailedTime || false,
            startTime: detail?.startTime || "",
            endTime: detail?.endTime || "",
            breakMinutes: detail?.breakMinutes || 0,
            dayIndex: index,
          }))
        : Array(7).fill({ useDetailedTime: false }),
      // Ensure dayNotes array is complete
      dayNotes: Array.isArray(editedTimesheet.dayNotes)
        ? editedTimesheet.dayNotes.map((note) => note || "")
        : Array(7).fill(""),
    }

    // If it was rejected, change status back to draft when saving edits
    const updatedStatus = editedTimesheet.status === "rejected" ? "draft" : editedTimesheet.status
    onSubmit({
      ...updatedTimesheet,
      status: updatedStatus,
      // Clear rejection reason if it was rejected before
      rejectionReason: updatedStatus === "draft" ? undefined : editedTimesheet.rejectionReason,
    })
  }

  const getDayLabel = (dayIndex: number) => {
    try {
      // Ensure weekStarting is a valid Date object
      const weekStarting =
        editedTimesheet.weekStarting instanceof Date
          ? editedTimesheet.weekStarting
          : new Date(editedTimesheet.weekStarting || Date.now())

      const date = addDays(weekStarting, dayIndex)
      return `${format(date, "EEE")} ${format(date, "d")}`
    } catch (error) {
      console.error("Error formatting date:", error)
      return `Day ${dayIndex + 1}`
    }
  }

  const getTotalHours = (): number => {
    if (!Array.isArray(editedTimesheet.hours)) return 0

    return editedTimesheet.hours.reduce((sum, hour) => {
      // Use the logical OR to default to 0 if hour is not a number
      const validHour = typeof hour === "number" && !isNaN(hour) ? hour : 0
      return sum + validHour
    }, 0)
  }

  const toggleNoteExpansion = (dayIndex: number) => {
    if (expandedNoteIndex === dayIndex) {
      setExpandedNoteIndex(null)
    } else {
      setExpandedNoteIndex(dayIndex)
    }
  }

  const getProjectsByClient = (clientId: string) => {
    if (!Array.isArray(projects)) return []
    return projects.filter(
      (project) =>
        (project.customerId === clientId || project.customer_uuid === clientId) &&
        (project.isActive || project.is_active),
    )
  }

  const canSubmit = () => {
    // Check if there are any hours logged
    const hasHours = Array.isArray(editedTimesheet.hours) && editedTimesheet.hours.some((hour) => hour > 0)
    // Check if client and project are selected
    const hasClientAndProject = editedTimesheet.client !== "" && editedTimesheet.location !== ""

    return hasHours && hasClientAndProject
  }

  // Determine the status badge to display
  const getStatusBadge = () => {
    // Check if the timesheet is for a future week
    const weekStarting =
      editedTimesheet.weekStarting instanceof Date
        ? editedTimesheet.weekStarting
        : new Date(editedTimesheet.weekStarting || Date.now())

    const isFutureTimesheet = weekStarting > new Date()

    if (isFutureTimesheet) {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          Future
        </Badge>
      )
    }

    // Display the actual status
    switch (editedTimesheet.status) {
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

  const getClientName = (clientId: string) => {
    if (!clientId) return ""

    // First check if it's a UUID in our mapping
    if (clientMap[clientId]) {
      return clientMap[clientId]
    }

    // Fall back to the old method
    if (!Array.isArray(customers)) return clientId
    const client = customers.find((c) => c.id === clientId || c.uuid === clientId)
    return client ? client.name : clientId
  }

  const getProjectName = (projectId: string) => {
    if (!projectId) return ""

    // First check if it's a UUID in our mapping
    if (projectMap[projectId]) {
      return projectMap[projectId]
    }

    // Fall back to the old method
    if (!Array.isArray(projects)) return projectId
    const project = projects.find((p) => p.id === projectId || p.uuid === projectId)
    return project ? project.name : projectId
  }

  const fetchProjectsForClient = async (clientId: string) => {
    try {
      console.log(`Fetching projects for customer UUID: ${clientId}`)
      // Use the projectService instead of direct fetch
      const projects = await projectService.getProjectsByCustomer(clientId)
      console.log("Projects fetched successfully:", projects)
      return projects
    } catch (error) {
      console.error(`Error fetching projects for customer ${clientId}:`, error)
      // Return empty array on error instead of throwing
      return []
    }
  }

  // Update the handleClientChange function to ensure it correctly filters projects by client
  // and properly handles loading states

  const handleClientChange = async (clientId: string) => {
    // Update the timesheet with the new client and reset the project
    setEditedTimesheet((prev) => ({
      ...prev,
      client: clientId,
      location: "", // Reset project when client changes
    }))

    if (clientId) {
      try {
        // Show loading state while fetching projects
        setIsLoading(true)

        // Fetch projects for the selected client using the service
        console.log(`Fetching projects for client: ${clientId}`)
        const clientProjects = await projectService.getProjectsByCustomer(clientId)
        console.log(`Found ${clientProjects.length} projects for client ${clientId}:`, clientProjects)

        // Filter to only include active projects
        const activeProjects = clientProjects.filter((project) => project.isActive || project.is_active)

        setAvailableProjects(activeProjects)

        if (activeProjects.length === 0) {
          console.log(`No active projects found for client ${clientId}`)
          toast({
            title: "No Projects",
            description: "This client has no active projects. Please create a project first.",
            variant: "default",
          })
        }
      } catch (error) {
        console.error("Error fetching projects for client:", error)
        toast({
          title: "Error",
          description: "Failed to load projects for this client. Please try again.",
          variant: "destructive",
        })
        setAvailableProjects([])
      } finally {
        setIsLoading(false)
      }
    } else {
      setAvailableProjects([])
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading timesheet data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium">
        Week of{" "}
        {editedTimesheet.weekStarting instanceof Date
          ? format(editedTimesheet.weekStarting, "d MMMM, yyyy")
          : "Loading..."}
      </div>
      {isReadOnly() && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
          <p className="text-amber-800">
            This timesheet is in <strong>{editedTimesheet.status.replace("_", " ")}</strong> status and cannot be
            edited.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="client">Client</Label>
          <Select
            value={editedTimesheet.client || ""}
            onValueChange={(value) => {
              if (isReadOnly()) return
              handleClientChange(value)
            }}
            disabled={isReadOnly()}
          >
            <SelectTrigger id="client" className="mt-1">
              <SelectValue placeholder={isLoading ? "Loading clients..." : "Select a client"}>
                {editedTimesheet.client && clientMap[editedTimesheet.client]
                  ? clientMap[editedTimesheet.client]
                  : editedTimesheet.client || "Select a client"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(customers) &&
                customers
                  .filter((customer) => customer.isActive || customer.is_active)
                  .map((customer) => (
                    <SelectItem key={customer.uuid || customer.id} value={customer.uuid || customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="location">Project</Label>
          <Select
            value={editedTimesheet.location || ""}
            onValueChange={(value) => {
              if (isReadOnly()) return
              setEditedTimesheet({ ...editedTimesheet, location: value })
            }}
            disabled={!editedTimesheet.client || isReadOnly() || isLoading}
          >
            <SelectTrigger id="location" className="mt-1">
              <SelectValue>
                {isLoading
                  ? "Loading projects..."
                  : editedTimesheet.location && projectMap[editedTimesheet.location]
                    ? projectMap[editedTimesheet.location]
                    : editedTimesheet.location ||
                      (editedTimesheet.client ? "Select a project" : "Select a client first")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {editedTimesheet.client && availableProjects.length > 0 ? (
                availableProjects.map((project) => (
                  <SelectItem key={project.uuid || project.id} value={project.uuid || project.id}>
                    {project.name}
                  </SelectItem>
                ))
              ) : editedTimesheet.client ? (
                <SelectItem value="no-projects" disabled>
                  No projects available for this client
                </SelectItem>
              ) : null}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-500 w-32">Day</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 w-32">Hours</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 w-64">Time Details</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Notes</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 7 }).map((_, index) => {
                  const hours = Array.isArray(editedTimesheet.hours) ? editedTimesheet.hours[index] || 0 : 0
                  const timeDetail = Array.isArray(editedTimesheet.timeDetails)
                    ? editedTimesheet.timeDetails[index]
                    : undefined
                  const dayNote = Array.isArray(editedTimesheet.dayNotes) ? editedTimesheet.dayNotes[index] || "" : ""

                  return (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-3 font-medium w-32">{getDayLabel(index)}</td>
                      <td className="px-4 py-3 w-32">
                        {timeDetail?.useDetailedTime ? (
                          <div className="text-sm font-medium">{hours.toFixed(2)} hrs</div>
                        ) : (
                          <div className="w-28">
                            <Input
                              type="number"
                              step="0.25"
                              min="0"
                              max="24"
                              value={hours}
                              onChange={(e) => {
                                if (isReadOnly()) return
                                handleHoursChange(index, e.target.value)
                              }}
                              onClick={(e) => !isReadOnly() && e.currentTarget.select()}
                              onFocus={(e) => !isReadOnly() && e.currentTarget.select()}
                              tabIndex={index + 1}
                              className="h-8 text-sm"
                              aria-label={`Hours for ${getDayLabel(index)}`}
                              disabled={isReadOnly()}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 w-64">
                        <div className="flex items-center space-x-2 mb-2">
                          <Switch
                            checked={timeDetail?.useDetailedTime || false}
                            onCheckedChange={(checked) => {
                              if (isReadOnly()) return
                              toggleDetailedTime(index, checked)
                            }}
                            disabled={isReadOnly()}
                          />
                          <span className="text-sm">
                            {timeDetail?.useDetailedTime ? "Detailed Time" : "Simple Hours"}
                          </span>
                        </div>

                        {timeDetail?.useDetailedTime && (
                          <div className="space-y-2 overflow-hidden">
                            <div className="grid grid-cols-2 gap-1">
                              <div>
                                <Label htmlFor={`start-time-${index}`} className="text-xs">
                                  Start Time
                                </Label>
                                <Input
                                  id={`start-time-${index}`}
                                  type="time"
                                  value={timeDetail?.startTime || ""}
                                  onChange={(e) => {
                                    if (isReadOnly()) return
                                    handleTimeDetailChange(index, "startTime", e.target.value)
                                  }}
                                  className="h-7 text-xs w-full"
                                  disabled={isReadOnly()}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`end-time-${index}`} className="text-xs">
                                  End Time
                                </Label>
                                <Input
                                  id={`end-time-${index}`}
                                  type="time"
                                  value={timeDetail?.endTime || ""}
                                  onChange={(e) => {
                                    if (isReadOnly()) return
                                    handleTimeDetailChange(index, "endTime", e.target.value)
                                  }}
                                  className="h-7 text-xs w-full"
                                  disabled={isReadOnly()}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center">
                                <Label htmlFor={`break-${index}`} className="text-xs">
                                  Break (minutes)
                                </Label>
                                <span className="text-xs font-medium">{timeDetail?.breakMinutes || 0} min</span>
                              </div>
                              <Slider
                                id={`break-${index}`}
                                min={0}
                                max={120}
                                step={5}
                                value={[timeDetail?.breakMinutes || 0]}
                                onValueChange={(value) => {
                                  if (isReadOnly()) return
                                  handleTimeDetailChange(index, "breakMinutes", value[0])
                                }}
                                className="mt-1 max-w-[180px]"
                                disabled={isReadOnly()}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <div
                            className={cn(
                              "border rounded transition-all duration-200 ease-in-out",
                              expandedNoteIndex === index ? "bg-white" : "bg-gray-50 hover:bg-gray-100 cursor-pointer",
                            )}
                            onClick={() => expandedNoteIndex !== index && toggleNoteExpansion(index)}
                          >
                            {expandedNoteIndex === index ? (
                              <div className="p-2">
                                <div className="flex justify-between items-center mb-1">
                                  <Label htmlFor={`day-note-${index}`} className="text-xs font-medium">
                                    Note for {getDayLabel(index)}
                                  </Label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => toggleNoteExpansion(index)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                <Textarea
                                  id={`day-note-${index}`}
                                  ref={(el) => (noteRefs.current[index] = el)}
                                  placeholder={`Add notes for ${getDayLabel(index)}`}
                                  value={dayNote}
                                  onChange={(e) => {
                                    if (isReadOnly()) return
                                    handleDayNoteChange(index, e.target.value)
                                  }}
                                  className="min-h-[80px] resize-none border-0 focus-visible:ring-0 p-0 text-sm"
                                  disabled={isReadOnly()}
                                />
                              </div>
                            ) : (
                              <div className="p-2 flex items-center gap-2 min-h-[36px]">
                                <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                {dayNote ? (
                                  <p className="text-sm truncate">{dayNote}</p>
                                ) : (
                                  <p className="text-sm text-gray-500">Add note...</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                <tr className="border-t bg-gray-50">
                  <td className="px-4 py-3 font-medium w-32">Total</td>
                  <td className="px-4 py-3 font-medium w-32">{getTotalHours().toFixed(2)} hours</td>
                  <td className="px-4 py-3 w-64"></td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500">
                    {editedTimesheet.client && <span>Client: {getClientName(editedTimesheet.client)}</span>}
                    {editedTimesheet.client && editedTimesheet.location && (
                      <span> | Project: {getProjectName(editedTimesheet.location)}</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action sidebar - aligned with the table */}
        <div className="md:w-64">
          <Card className="w-full">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>{getStatusBadge()}</div>

                <div className="space-y-3 pt-3 border-t">
                  {!isReadOnly() ? (
                    <>
                      <Button className="w-full" size="sm" onClick={handleSubmit} disabled={!canSubmit()}>
                        <Send className="mr-2 h-4 w-4" />
                        Submit
                      </Button>

                      <Button variant="outline" className="w-full" size="sm" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Draft
                      </Button>
                    </>
                  ) : null}

                  <Button variant="ghost" className="w-full" size="sm" onClick={onCancel}>
                    <X className="mr-2 h-4 w-4" />
                    {isReadOnly() ? "Close" : "Cancel"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={editedTimesheet.notes || ""}
          onChange={(e) => {
            if (isReadOnly()) return
            setEditedTimesheet({ ...editedTimesheet, notes: e.target.value })
          }}
          placeholder="Add any notes about this timesheet"
          className="mt-1"
          rows={3}
          disabled={isReadOnly()}
        />
      </div>

      {editedTimesheet.status === "rejected" && editedTimesheet.rejectionReason && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-md">
          <p className="font-medium text-red-800">Previous rejection reason:</p>
          <p className="text-red-700">{editedTimesheet.rejectionReason}</p>
          <p className="text-sm text-red-600 mt-2">This timesheet will be resubmitted as a draft when saved.</p>
        </div>
      )}
    </div>
  )
}
