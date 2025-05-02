"use client"

import { useState, useEffect } from "react"
import { format, addDays, parseISO } from "date-fns"
import { Save, X, Send } from "lucide-react"
import type { Timesheet, TimesheetDetail } from "@/types/timesheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TimesheetEntryProps {
  timesheet: Timesheet
  onSave: (timesheet: Timesheet) => Promise<void>
  onSubmit: (timesheet: Timesheet) => Promise<void>
  onCancel: () => void
}

export function TimesheetEntry({ timesheet, onSave, onSubmit, onCancel }: TimesheetEntryProps) {
  const [editedTimesheet, setEditedTimesheet] = useState<Timesheet>(timesheet)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize details if they don't exist
  useEffect(() => {
    if (!editedTimesheet.details || editedTimesheet.details.length === 0) {
      setEditedTimesheet({
        ...editedTimesheet,
        details: Array(7).fill({
          uuid: '',
          day: 0,
          hours: 0,
          use_detailed_time: false,
          note: ''
        })
      })
    }
  }, [])

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
      total_hours: newDetails.reduce((sum, detail) => sum + (detail.hours || 0), 0),
    })
  }

  const handleDayNoteChange = (dayIndex: number, note: string) => {
    if (isReadOnly()) return
    const newDetails = [...editedTimesheet.details]
    newDetails[dayIndex] = {
      ...newDetails[dayIndex],
      note,
    }
    setEditedTimesheet({
      ...editedTimesheet,
      details: newDetails,
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

  const getTotalHours = () => {
    return editedTimesheet.details.reduce((sum, detail) => sum + (detail.hours || 0), 0)
  }

  const canSubmit = () => {
    // Check if there are any hours logged
    const hasHours = editedTimesheet.details.some((detail) => (detail.hours || 0) > 0)
    // Check if project is selected
    const hasProject = editedTimesheet.project?.uuid

    return hasHours && hasProject
  }

  // Determine the status badge to display
  const getStatusBadge = () => {
    // Check if the timesheet is for a future week
    const isFutureTimesheet = parseISO(editedTimesheet.week_starting) > new Date()

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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            Week of {format(parseISO(editedTimesheet.week_starting), 'd MMM, yyyy')}
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
                  disabled={isSubmitting || !canSubmit()}
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
          {editedTimesheet.project?.customer?.name || 'No client'} / {editedTimesheet.project?.name || 'No project'}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-4">
            {editedTimesheet.details.map((detail, index) => {
              const date = addDays(parseISO(editedTimesheet.week_starting), index)
              return (
                <div key={index} className="space-y-2">
                  <Label>{format(date, 'EEE')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    step="0.25"
                    value={detail.hours || 0}
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
