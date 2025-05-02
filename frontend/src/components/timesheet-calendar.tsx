"use client"

import { useState, useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
  addDays,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Timesheet } from "./simple-timesheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TimesheetCalendarProps {
  timesheets: Timesheet[]
  onSelectTimesheet: (id: string) => void
}

export function TimesheetCalendar({ timesheets, onSelectTimesheet }: TimesheetCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Calculate days needed to fill the calendar grid
  const startDay = getDay(monthStart)
  const endDay = getDay(monthEnd)

  // Add days from previous month to fill the start of the grid
  const prevMonthDays =
    startDay > 0 ? Array.from({ length: startDay }, (_, i) => addDays(monthStart, -(startDay - i))) : []

  // Add days from next month to fill the end of the grid
  const nextMonthDays = 6 - endDay > 0 ? Array.from({ length: 6 - endDay }, (_, i) => addDays(monthEnd, i + 1)) : []

  // Combine all days for the calendar grid
  const calendarDays = [...prevMonthDays, ...monthDays, ...nextMonthDays]

  // Group timesheets by date for easier lookup
  const timesheetsByDate = useMemo(() => {
    const map = new Map<string, Timesheet[]>()

    // Sort timesheets by date (newest first) before processing
    const sortedTimesheets = [...timesheets].sort((a, b) => b.weekStarting.getTime() - a.weekStarting.getTime())

    sortedTimesheets.forEach((timesheet) => {
      // For each timesheet, add entries for each day with hours
      for (let i = 0; i < 7; i++) {
        if (timesheet.hours[i] > 0) {
          const date = addDays(timesheet.weekStarting, i)
          const dateKey = format(date, "yyyy-MM-dd")

          if (!map.has(dateKey)) {
            map.set(dateKey, [])
          }

          map.get(dateKey)?.push(timesheet)
        }
      }
    })

    return map
  }, [timesheets])

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-200"
      case "submitted":
        return "bg-yellow-200"
      case "approved":
        return "bg-green-200"
      case "rejected":
        return "bg-red-200"
      case "paid":
        return "bg-blue-200"
      default:
        return "bg-gray-200"
    }
  }

  const getDayContent = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd")
    const dayTimesheets = timesheetsByDate.get(dateKey) || []

    return (
      <>
        <div className="text-right mb-1">{format(day, "d")}</div>
        {dayTimesheets.length > 0 && (
          <div className="space-y-1">
            {dayTimesheets.map((timesheet, index) => {
              // Find which day of the week this is for the timesheet
              const dayIndex = Math.floor((day.getTime() - timesheet.weekStarting.getTime()) / (24 * 60 * 60 * 1000))
              const hours = timesheet.hours[dayIndex]

              return (
                <TooltipProvider key={`${timesheet.id}-${index}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`text-xs p-1 rounded cursor-pointer truncate ${getStatusColor(timesheet.status)}`}
                        onClick={() => onSelectTimesheet(timesheet.id)}
                      >
                        {timesheet.client || "No client"} ({hours}h)
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <p className="font-medium">{timesheet.client || "No client"}</p>
                        <p>{hours} hours</p>
                        <p>Status: {timesheet.status}</p>
                        {timesheet.dayNotes[dayIndex] && <p className="text-xs mt-1">{timesheet.dayNotes[dayIndex]}</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        )}
      </>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Timesheet Calendar</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-medium">{format(currentMonth, "MMMM yyyy")}</div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-medium text-sm py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => (
            <div
              key={i}
              className={`min-h-[80px] p-1 border rounded-sm ${
                isSameMonth(day, currentMonth) ? "bg-white" : "bg-gray-50 text-gray-400"
              }`}
            >
              {getDayContent(day)}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <div className="text-sm">Status:</div>
          <Badge variant="outline" className="bg-gray-200">
            Draft
          </Badge>
          <Badge variant="outline" className="bg-yellow-200">
            Submitted
          </Badge>
          <Badge variant="outline" className="bg-green-200">
            Approved
          </Badge>
          <Badge variant="outline" className="bg-red-200">
            Rejected
          </Badge>
          <Badge variant="outline" className="bg-blue-200">
            Paid
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
