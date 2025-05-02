"use client"

import { useState, useEffect } from "react"
import { format, addDays } from "date-fns"
import { Save, X, Send } from "lucide-react"
import type { Timesheet, TimeDetail } from "@/components/simple-timesheet"
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

  // Initialize time details if they don't exist
  useEffect(() => {
    if (!editedTimesheet.timeDetails || editedTimesheet.timeDetails.length === 0) {
      const timeDetails: TimeDetail[] = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(editedTimesheet.weekStarting)
        date.setDate(editedTimesheet.weekStarting.getDate() + index)
        return {
          day: index,
          date: date.toISOString().split('T')[0],
          useDetailedTime: false
        }
      })
      setEditedTimesheet({
        ...editedTimesheet,
        timeDetails
      })
    }
  }, [])

  const isReadOnly = () => {
    return ["submitted", "approved", "pending_payment", "paid"].includes(editedTimesheet.status)
  }

  const handleHoursChange = (dayIndex: number, value: string) => {
    if (isReadOnly()) return
    const hours = parseFloat(value) || 0
    const newHours = [...editedTimesheet.hours]
    newHours[dayIndex] = hours
    setEditedTimesheet({
      ...editedTimesheet,
      hours: newHours
    })
  }

  const handleDayNoteChange = (dayIndex: number, note: string) => {
    if (isReadOnly()) return
    const newDayNotes = [...editedTimesheet.dayNotes]
    newDayNotes[dayIndex] = note
    setEditedTimesheet({
      ...editedTimesheet,
      dayNotes: newDayNotes
    })
  }

  const handleNotesChange = (value: string) => {
    if (isReadOnly()) return
    setEditedTimesheet({
      ...editedTimesheet,
      notes: value
    })
  }

  const getTotalHours = () => {
    return editedTimesheet.hours.reduce((sum, hours) => sum + hours, 0)
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Timesheet Entry</CardTitle>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting || isReadOnly()}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isReadOnly()}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-4">
            {editedTimesheet.timeDetails.map((detail, index) => {
              const date = addDays(editedTimesheet.weekStarting, index)
              return (
                <div key={index} className="space-y-2">
                  <Label>{format(date, 'EEE')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    step="0.25"
                    value={editedTimesheet.hours[index] || 0}
                    onChange={(e) => handleHoursChange(index, e.target.value)}
                    disabled={isReadOnly()}
                  />
                  <Textarea
                    placeholder="Notes"
                    value={editedTimesheet.dayNotes[index] || ''}
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
