"use client"

import { useState, useEffect, useRef } from "react"
import { format, addDays, parse, differenceInMinutes } from "date-fns"
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

// Add isReadOnly prop to the interface
interface TimesheetEntryProps {
  timesheet: Timesheet
  onSave: (timesheet: Timesheet) => void
  onSubmit: (timesheet: Timesheet) => void
  onCancel: () => void
}

export function TimesheetEntry({ timesheet, onSave, onSubmit, onCancel }: TimesheetEntryProps) {
  const [editedTimesheet, setEditedTimesheet] = useState<Timesheet>({ ...timesheet })
  const [expandedNoteIndex, setExpandedNoteIndex] = useState<number | null>(null)
  const noteRefs = useRef<(HTMLTextAreaElement | null)[]>(Array(7).fill(null))

  const [customers] = useState(INITIAL_CUSTOMERS)
  const [projects] = useState(INITIAL_PROJECTS)

  // Initialize timeDetails if it doesn't exist
  useEffect(() => {
    if (!editedTimesheet.timeDetails) {
      setEditedTimesheet({
        ...editedTimesheet,
        timeDetails: Array(7).fill({ useDetailedTime: false }),
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
    // If the value is empty (user backspaced everything), set to 0
    if (value === "" || value === null) {
      const newHours = [...editedTimesheet.hours]
      newHours[dayIndex] = 0
      setEditedTimesheet({ ...editedTimesheet, hours: newHours })
      return
    }

    // Otherwise parse the number as before
    const hours = Number.parseFloat(value)
    if (!isNaN(hours)) {
      const newHours = [...editedTimesheet.hours]
      newHours[dayIndex] = hours
      setEditedTimesheet({ ...editedTimesheet, hours: newHours })
    }
  }

  const handleDayNoteChange = (dayIndex: number, note: string) => {
    const newDayNotes = [...editedTimesheet.dayNotes]
    newDayNotes[dayIndex] = note
    setEditedTimesheet({ ...editedTimesheet, dayNotes: newDayNotes })
  }

  const toggleDetailedTime = (dayIndex: number, useDetailed: boolean) => {
    const newTimeDetails = [...editedTimesheet.timeDetails]

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
        timeDetails: newTimeDetails,
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
        timeDetails: newTimeDetails,
      })
    }
  }

  const handleTimeDetailChange = (dayIndex: number, field: keyof TimeDetail, value: any) => {
    const newTimeDetails = [...editedTimesheet.timeDetails]
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
            timeDetails: newTimeDetails,
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
      timeDetails: newTimeDetails,
    })
  }

  const handleSave = () => {
    // If it was rejected, change status back to draft when saving edits
    const updatedStatus = editedTimesheet.status === "rejected" ? "draft" : editedTimesheet.status
    onSave({
      ...editedTimesheet,
      status: updatedStatus,
      // Clear rejection reason if it was rejected before
      rejectionReason: updatedStatus === "draft" ? undefined : editedTimesheet.rejectionReason,
    })
  }

  const handleSubmit = () => {
    onSubmit({
      ...editedTimesheet,
      status: "submitted",
      // Clear rejection reason if it was rejected before
      rejectionReason: undefined,
    })
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
    <div className="space-y-6">
      <div className="text-lg font-medium">Week of {format(editedTimesheet.weekStarting, "d MMMM, yyyy")}</div>
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
            value={editedTimesheet.client}
            onValueChange={(value) => {
              if (isReadOnly()) return
              setEditedTimesheet({
                ...editedTimesheet,
                client: value,
                // Clear project when client changes
                location: "",
              })
            }}
            disabled={isReadOnly()}
          >
            <SelectTrigger id="client" className="mt-1">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {customers
                .filter((customer) => customer.isActive)
                .map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="location">Project</Label>
          <Select
            value={editedTimesheet.location}
            onValueChange={(value) => {
              if (isReadOnly()) return
              setEditedTimesheet({ ...editedTimesheet, location: value })
            }}
            disabled={!editedTimesheet.client || isReadOnly()}
          >
            <SelectTrigger id="location" className="mt-1">
              <SelectValue placeholder={editedTimesheet.client ? "Select a project" : "Select a client first"} />
            </SelectTrigger>
            <SelectContent>
              {editedTimesheet.client &&
                getProjectsByClient(editedTimesheet.client).map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
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
                {editedTimesheet.hours.map((hours, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-3 font-medium w-32">{getDayLabel(index)}</td>
                    <td className="px-4 py-3 w-32">
                      {editedTimesheet.timeDetails[index]?.useDetailedTime ? (
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
                          checked={editedTimesheet.timeDetails[index]?.useDetailedTime || false}
                          onCheckedChange={(checked) => {
                            if (isReadOnly()) return
                            toggleDetailedTime(index, checked)
                          }}
                          disabled={isReadOnly()}
                        />
                        <span className="text-sm">
                          {editedTimesheet.timeDetails[index]?.useDetailedTime ? "Detailed Time" : "Simple Hours"}
                        </span>
                      </div>

                      {editedTimesheet.timeDetails[index]?.useDetailedTime && (
                        <div className="space-y-2 overflow-hidden">
                          <div className="grid grid-cols-2 gap-1">
                            <div>
                              <Label htmlFor={`start-time-${index}`} className="text-xs">
                                Start Time
                              </Label>
                              <Input
                                id={`start-time-${index}`}
                                type="time"
                                value={editedTimesheet.timeDetails[index]?.startTime || ""}
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
                                value={editedTimesheet.timeDetails[index]?.endTime || ""}
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
                              <span className="text-xs font-medium">
                                {editedTimesheet.timeDetails[index]?.breakMinutes || 0} min
                              </span>
                            </div>
                            <Slider
                              id={`break-${index}`}
                              min={0}
                              max={120}
                              step={5}
                              value={[editedTimesheet.timeDetails[index]?.breakMinutes || 0]}
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
                                value={editedTimesheet.dayNotes[index]}
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
                              {editedTimesheet.dayNotes[index] ? (
                                <p className="text-sm truncate">{editedTimesheet.dayNotes[index]}</p>
                              ) : (
                                <p className="text-sm text-gray-500">Add note...</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
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
          value={editedTimesheet.notes}
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
