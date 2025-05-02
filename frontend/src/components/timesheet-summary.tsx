"use client"

import { useMemo } from "react"
import { BarChart, Calendar, Clock, CheckCircle, XCircle, Clock3, CircleDollarSign, CreditCard } from "lucide-react"
import type { Timesheet } from "./simple-timesheet"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { startOfMonth } from "date-fns/startOfMonth"
import { endOfMonth } from "date-fns/endOfMonth"
import { isWithinInterval } from "date-fns/isWithinInterval"

interface TimesheetSummaryProps {
  timesheets: Timesheet[]
  isManager: boolean
}

export function TimesheetSummary({ timesheets, isManager }: TimesheetSummaryProps) {
  // Ensure timesheets is always an array
  const safeTimesheets = Array.isArray(timesheets) ? timesheets : []

  const totalHours = useMemo(
    () =>
      safeTimesheets.reduce((sum, entry) => {
        // Check if hours exists and is an array
        if (!entry.hours || !Array.isArray(entry.hours)) {
          return sum
        }
        return (
          sum +
          entry.hours.reduce((h, v) => {
            // Ensure v is a number
            const validValue = typeof v === "number" && !isNaN(v) ? v : 0
            return h + validValue
          }, 0)
        )
      }, 0),
    [safeTimesheets],
  )

  // Calculate total hours for the current month
  const currentMonthHours = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    return safeTimesheets
      .filter((timesheet) => {
        // Ensure weekStarting is a valid date
        if (!(timesheet.weekStarting instanceof Date) || isNaN(timesheet.weekStarting.getTime())) {
          return false
        }
        return isWithinInterval(timesheet.weekStarting, { start: monthStart, end: monthEnd })
      })
      .reduce((sum, timesheet) => {
        // Check if hours exists and is an array
        if (!timesheet.hours || !Array.isArray(timesheet.hours)) {
          return sum
        }
        return (
          sum +
          timesheet.hours.reduce((h, v) => {
            // Ensure v is a number
            const validValue = typeof v === "number" && !isNaN(v) ? v : 0
            return h + validValue
          }, 0)
        )
      }, 0)
  }, [safeTimesheets])

  const projectHours = useMemo(() => {
    const hours: Record<string, number> = {}
    safeTimesheets.forEach((timesheet) => {
      // Skip if hours is not an array
      if (!timesheet.hours || !Array.isArray(timesheet.hours)) {
        return
      }

      const client = timesheet.client || "Unspecified"
      hours[client] =
        (hours[client] || 0) +
        timesheet.hours.reduce((sum, h) => {
          // Ensure h is a number
          const validValue = typeof h === "number" && !isNaN(h) ? h : 0
          return sum + validValue
        }, 0)
    })
    return Object.entries(hours)
      .map(([client, hours]) => ({ client, hours }))
      .sort((a, b) => b.hours - a.hours)
  }, [safeTimesheets])

  const weeklyHours = useMemo(() => {
    const now = new Date()
    const oneWeekAgo = new Date(now)
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    return safeTimesheets
      .filter((timesheet) => {
        // Ensure weekStarting is a valid date
        if (!(timesheet.weekStarting instanceof Date) || isNaN(timesheet.weekStarting.getTime())) {
          return false
        }
        return timesheet.weekStarting >= oneWeekAgo
      })
      .reduce((sum, timesheet) => {
        // Check if hours exists and is an array
        if (!timesheet.hours || !Array.isArray(timesheet.hours)) {
          return sum
        }
        return (
          sum +
          timesheet.hours.reduce((h, v) => {
            // Ensure v is a number
            const validValue = typeof v === "number" && !isNaN(v) ? v : 0
            return h + validValue
          }, 0)
        )
      }, 0)
  }, [safeTimesheets])

  const approvalStats = useMemo(() => {
    const stats = {
      draft: safeTimesheets.filter((timesheet) => timesheet.status === "draft").length,
      submitted: safeTimesheets.filter((timesheet) => timesheet.status === "submitted").length,
      approved: safeTimesheets.filter((timesheet) => timesheet.status === "approved").length,
      rejected: safeTimesheets.filter((timesheet) => timesheet.status === "rejected").length,
      pending_payment: safeTimesheets.filter((timesheet) => timesheet.status === "pending_payment").length,
      paid: safeTimesheets.filter((timesheet) => timesheet.status === "paid").length,
      draftHours: safeTimesheets
        .filter((timesheet) => timesheet.status === "draft")
        .reduce((sum, timesheet) => {
          // Check if hours exists and is an array
          if (!timesheet.hours || !Array.isArray(timesheet.hours)) {
            return sum
          }
          return (
            sum +
            timesheet.hours.reduce((h, v) => {
              // Ensure v is a number
              const validValue = typeof v === "number" && !isNaN(v) ? v : 0
              return h + validValue
            }, 0)
          )
        }, 0),
      submittedHours: safeTimesheets
        .filter((timesheet) => timesheet.status === "submitted")
        .reduce((sum, timesheet) => {
          // Check if hours exists and is an array
          if (!timesheet.hours || !Array.isArray(timesheet.hours)) {
            return sum
          }
          return (
            sum +
            timesheet.hours.reduce((h, v) => {
              // Ensure v is a number
              const validValue = typeof v === "number" && !isNaN(v) ? v : 0
              return h + validValue
            }, 0)
          )
        }, 0),
      approvedHours: safeTimesheets
        .filter((timesheet) => timesheet.status === "approved")
        .reduce((sum, timesheet) => {
          // Check if hours exists and is an array
          if (!timesheet.hours || !Array.isArray(timesheet.hours)) {
            return sum
          }
          return (
            sum +
            timesheet.hours.reduce((h, v) => {
              // Ensure v is a number
              const validValue = typeof v === "number" && !isNaN(v) ? v : 0
              return h + validValue
            }, 0)
          )
        }, 0),
      rejectedHours: safeTimesheets
        .filter((timesheet) => timesheet.status === "rejected")
        .reduce((sum, timesheet) => {
          // Check if hours exists and is an array
          if (!timesheet.hours || !Array.isArray(timesheet.hours)) {
            return sum
          }
          return (
            sum +
            timesheet.hours.reduce((h, v) => {
              // Ensure v is a number
              const validValue = typeof v === "number" && !isNaN(v) ? v : 0
              return h + validValue
            }, 0)
          )
        }, 0),
      pending_paymentHours: safeTimesheets
        .filter((timesheet) => timesheet.status === "pending_payment")
        .reduce((sum, timesheet) => {
          // Check if hours exists and is an array
          if (!timesheet.hours || !Array.isArray(timesheet.hours)) {
            return sum
          }
          return (
            sum +
            timesheet.hours.reduce((h, v) => {
              // Ensure v is a number
              const validValue = typeof v === "number" && !isNaN(v) ? v : 0
              return h + validValue
            }, 0)
          )
        }, 0),
      paidHours: safeTimesheets
        .filter((timesheet) => timesheet.status === "paid")
        .reduce((sum, timesheet) => {
          // Check if hours exists and is an array
          if (!timesheet.hours || !Array.isArray(timesheet.hours)) {
            return sum
          }
          return (
            sum +
            timesheet.hours.reduce((h, v) => {
              // Ensure v is a number
              const validValue = typeof v === "number" && !isNaN(v) ? v : 0
              return h + validValue
            }, 0)
          )
        }, 0),
    }
    return stats
  }, [safeTimesheets])

  // Get unique employees
  const employees = useMemo(() => {
    const uniqueEmployees = new Set<string>()
    safeTimesheets.forEach((timesheet) => {
      if (timesheet.submittedBy) {
        uniqueEmployees.add(timesheet.submittedBy)
      }
    })
    return Array.from(uniqueEmployees)
  }, [safeTimesheets])

  // Get current month name
  const currentMonthName = new Date().toLocaleString("default", { month: "long" })

  const getEmployeeTimesheetData = (employee: string) => {
    const employeeTimesheets = safeTimesheets.filter((ts) => ts.submittedBy === employee)
    const totalEmployeeHours = employeeTimesheets.reduce((sum, ts) => {
      if (!ts.hours || !Array.isArray(ts.hours)) {
        return sum
      }
      return (
        sum +
        ts.hours.reduce((h, v) => {
          const validValue = typeof v === "number" && !isNaN(v) ? v : 0
          return h + validValue
        }, 0)
      )
    }, 0)

    const employeeCurrentMonthHours = employeeTimesheets
      .filter((timesheet) => {
        if (!(timesheet.weekStarting instanceof Date) || isNaN(timesheet.weekStarting.getTime())) {
          return false
        }
        const now = new Date()
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)
        return isWithinInterval(timesheet.weekStarting, { start: monthStart, end: monthEnd })
      })
      .reduce((sum, ts) => {
        if (!ts.hours || !Array.isArray(ts.hours)) {
          return sum
        }
        return (
          sum +
          ts.hours.reduce((h, v) => {
            const validValue = typeof v === "number" && !isNaN(v) ? v : 0
            return h + validValue
          }, 0)
        )
      }, 0)

    const approvedTimesheetsCount = employeeTimesheets.filter((ts) =>
      ["approved", "pending_payment", "paid"].includes(ts.status),
    ).length

    return {
      totalEmployeeHours,
      employeeCurrentMonthHours,
      approvedTimesheetsCount,
      timesheetCount: employeeTimesheets.length,
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalHours.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground ml-1">hours</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{currentMonthName} Hours</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonthHours.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground ml-1">hours</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Timesheets</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeTimesheets.length}
              <span className="text-sm font-normal text-muted-foreground ml-1">timesheets</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weeklyHours.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground ml-1">hours</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval Status</CardTitle>
          <CardDescription>Overview of timesheet approval status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <Clock className="h-8 w-8 text-gray-500 mb-2" />
              <div className="text-xl font-bold">{approvalStats.draft}</div>
              <div className="text-sm text-muted-foreground">Draft</div>
              <div className="text-sm font-medium mt-2">{approvalStats.draftHours.toFixed(1)} hours</div>
            </div>
            <div className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg">
              <Clock3 className="h-8 w-8 text-yellow-500 mb-2" />
              <div className="text-xl font-bold">{approvalStats.submitted}</div>
              <div className="text-sm text-muted-foreground">Submitted</div>
              <div className="text-sm font-medium mt-2">{approvalStats.submittedHours.toFixed(1)} hours</div>
            </div>
            <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
              <div className="text-xl font-bold">{approvalStats.approved}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
              <div className="text-sm font-medium mt-2">{approvalStats.approvedHours.toFixed(1)} hours</div>
            </div>
            <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-8 w-8 text-red-500 mb-2" />
              <div className="text-xl font-bold">{approvalStats.rejected}</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
              <div className="text-sm font-medium mt-2">{approvalStats.rejectedHours.toFixed(1)} hours</div>
            </div>
            <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
              <CreditCard className="h-8 w-8 text-blue-500 mb-2" />
              <div className="text-xl font-bold">{approvalStats.pending_payment}</div>
              <div className="text-sm text-muted-foreground">Pending Payment</div>
              <div className="text-sm font-medium mt-2">{approvalStats.pending_paymentHours.toFixed(1)} hours</div>
            </div>
            <div className="flex flex-col items-center p-4 bg-green-100 rounded-lg">
              <CircleDollarSign className="h-8 w-8 text-green-600 mb-2" />
              <div className="text-xl font-bold">{approvalStats.paid}</div>
              <div className="text-sm text-muted-foreground">Paid</div>
              <div className="text-sm font-medium mt-2">{approvalStats.paidHours.toFixed(1)} hours</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {safeTimesheets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hours by Client</CardTitle>
            <CardDescription>Breakdown of hours spent on each client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectHours.map(({ client, hours }) => (
                <div key={client} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{client}</div>
                    <div className="text-sm text-muted-foreground">
                      {hours.toFixed(1)} hours ({((hours / (totalHours || 1)) * 100).toFixed(0)}%)
                    </div>
                  </div>
                  <Progress value={(hours / (totalHours || 1)) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isManager && employees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Employee Activity</CardTitle>
            <CardDescription>Recent timesheet submissions and invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employees.map((employee) => {
                const { totalEmployeeHours, employeeCurrentMonthHours, approvedTimesheetsCount, timesheetCount } =
                  getEmployeeTimesheetData(employee)

                return (
                  <div key={employee} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <div className="font-medium">{employee}</div>
                      <div className="text-sm text-gray-500">{timesheetCount} timesheets</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{totalEmployeeHours.toFixed(1)} total hours</div>
                        <div className="text-sm font-medium text-blue-600">
                          {employeeCurrentMonthHours.toFixed(1)} this month
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{approvedTimesheetsCount} approved</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
