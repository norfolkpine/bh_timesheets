"use client"

import { useState, useEffect, useRef } from "react"
import { format, addDays, parse, differenceInMinutes } from "date-fns"
import { Save, X, MessageSquare, Send } from "lucide-react"
import type { Timesheet, TimesheetDetail } from "@/types/timesheet"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Add isReadOnly prop to the interface
interface TimesheetEntryProps {
  timesheet: Timesheet
  onSave: (timesheet: Timesheet) => Promise<void>
  onSubmit: (timesheet: Timesheet) => Promise<void>
  onCancel: () => void
}

export function TimesheetEntry({ timesheet, onSave, onSubmit, onCancel }: TimesheetEntryProps) {
  const [editedTimesheet, setEditedTimesheet] = useState<Timesheet>(timesheet)
  const [expandedNoteIndex, setExpandedNoteIndex] = useState<number | null>(null)
  const noteRefs = useRef<(HTMLTextAreaElement | null)[]>(Array(7).fill(null))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [customers] = useState(INITIAL_CUSTOMERS)
  const [projects] = useState(INITIAL_PROJECTS)

  // Initialize timeDetails if it doesn't exist
  useEffect(() => {
    if (!editedTimesheet.details) {
      setEditedTimesheet({
        ...editedTimesheet,
        details: Array(7).fill({ useDetailedTime: false }),
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
    if (isReadOnly()) return
    const hours = parseFloat(value) || 0
    const newDetails = [...editedTimesheet.details]
    newDetails[dayIndex] = {
      ...newDetails[dayIndex],
      hours,
    }
    setEditedTimesheet({
      ...editedTimesheet,
      details: newDetails,
      total_hours: newDetails.reduce((sum, detail) => sum + detail.hours, 0),
    })
  }

  const handleDayNoteChange = (dayIndex: number, note: string) => {
    if (isReadOnly()) return
    const newDetails = [...editedTimesheet.details]
    newDetails[dayIndex] = {
      ...newDetails[dayIndex],
      note: note,
    }
    setEditedTimesheet({
      ...editedTimesheet,
      details: newDetails,
    })
  }

  const toggleDetailedTime = (dayIndex: number, useDetailed: boolean) => {
    const newTimeDetails = [...editedTimesheet.details]

    // If switching to detailed time, initialize with default values
    if (useDetailed) {
      newTimeDetails[dayIndex] = {
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 30,
        useDetailedTime: true,
      }

      // Calculate and update hours based on the default times
      const newHours = [...editedTimesheet.hours]
      newHours[dayIndex] = 7.5 // 8 hours - 30 min break
      setEditedTimesheet({
        ...editedTimesheet,
        details: newTimeDetails,
        hours: newHours,
      })
    } else {
      // Keep the existing hours but mark as not using detailed time
      newTimeDetails[dayIndex] = {
        ...newTimeDetails[dayIndex],
        useDetailedTime: false,
      }
      setEditedTimesheet({
        ...editedTimesheet,
        details: newTimeDetails,
      })
    }
  }

  const handleTimeDetailChange = (dayIndex: number, field: keyof TimesheetDetail, value: any) => {
    if (isReadOnly()) return
    const newTimeDetails = [...editedTimesheet.details]
    newTimeDetails[dayIndex] = {
      ...newTimeDetails[dayIndex],
      [field]: value,
    }

    // Calculate hours if we have start and end time
    if (field === "startTime" || field === "endTime" || field === "breakMinutes") {
      const { startTime, endTime, breakMinutes } = newTimeDetails[dayIndex]

      if (startTime && endTime) {
        try {
          // Parse times to calculate duration
          const start = parse(startTime, "HH:mm", new Date())
          const end = parse(endTime, "HH:mm", new Date())

          // Calculate minutes worked
          let minutesWorked = differenceInMinutes(end, start)

          // Subtract break if applicable
          if (breakMinutes) {
            minutesWorked -= breakMinutes
          }

          // Convert to hours (with 2 decimal precision)
          const hoursWorked = Math.max(0, minutesWorked / 60)

          // Update hours
          const newHours = [...editedTimesheet.hours]
          newHours[dayIndex] = Number.parseFloat(hoursWorked.toFixed(2))

          setEditedTimesheet({
            ...editedTimesheet,
            details: newTimeDetails,
            hours: newHours,
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
      details: newTimeDetails,
    })
  }

  const handleNotesChange = (value: string) => {
    if (isReadOnly()) return
    setEditedTimesheet({
      ...editedTimesheet,
      notes: value,
    })
  }

  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      await onSave(editedTimesheet)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      await onSubmit(editedTimesheet)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDayLabel = (dayIndex: number) => {
    const date = addDays(editedTimesheet.weekStarting, dayIndex)
    return `${format(date, "EEE")} ${format(date, "d")}`
  }

  const getTotalHours = () => {
    return editedTimesheet.hours.reduce((sum, hour) => sum + hour, 0)
  }

  const toggleNoteExpansion = (dayIndex: number) => {
    if (expandedNoteIndex === dayIndex) {
      setExpandedNoteIndex(null)
    } else {
      setExpandedNoteIndex(dayIndex)
    }
  }

  const getProjectsByClient = (clientId: string) => {
    return projects.filter((project) => project.customerId === clientId && project.isActive)
  }

  const canSubmit = () => {
    // Check if there are any hours logged
    const hasHours = editedTimesheet.hours.some((hour) => hour > 0)
    // Check if client and project are selected
    const hasClientAndProject = editedTimesheet.client !== "" && editedTimesheet.location !== ""

    return hasHours && hasClientAndProject
  }

  // Determine the status badge to display
  const getStatusBadge = () => {
    // Check if the timesheet is for a future week
    const isFutureTimesheet = editedTimesheet.weekStarting > new Date()

    if (isFutureTimesheet) {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          Future
        </Badge>
      )
    }

    if (editedTimesheet.status === "rejected") {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800">
          Rejected - Draft
        </Badge>
      )
    }

    return <Badge variant="outline">Draft</Badge>
  }

  const getClientName = (clientId: string) => {
    const client = customers.find((c) => c.id === clientId)
    return client ? client.name : clientId
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    return project ? project.name : projectId
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            Week of {format(new Date(editedTimesheet.week_starting), 'd MMM, yyyy')}
          </CardTitle>
          <div className="flex gap-2">
            {!isReadOnly() && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <Button
                  variant="default"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {editedTimesheet.project.customer.name} / {editedTimesheet.project.name}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-4">
            {editedTimesheet.details.map((detail, index) => {
              const date = addDays(new Date(editedTimesheet.week_starting), index)
              return (
                <div key={index} className="space-y-2">
                  <Label>{format(date, 'EEE')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    step="0.25"
                    value={detail.hours}
                    onChange={(e) => handleHoursChange(index, e.target.value)}
                    disabled={isReadOnly()}
                  />
                  <Textarea
                    placeholder="Notes"
                    value={detail.note || ''}
                    onChange={(e) => handleDayNoteChange(index, e.target.value)}
                    disabled={isReadOnly()}
                    className="h-20"
                  />
                </div>
              )
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-lg font-medium">Total Hours: {getTotalHours().toFixed(2)}</div>
            <div className="w-1/3">
              <Label>Additional Notes</Label>
              <Textarea
                placeholder="Enter any additional notes here..."
                value={editedTimesheet.notes || ''}
                onChange={(e) => handleNotesChange(e.target.value)}
                disabled={isReadOnly()}
                className="h-24"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
