"use client"

import { useMemo } from "react"
import { BarChart, Calendar, Clock, CheckCircle, XCircle, Clock3, CircleDollarSign, CreditCard } from "lucide-react"
import type { Timesheet } from "./simple-timesheet"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns"

interface TimesheetSummaryProps {
  timesheets: Timesheet[]
  isManager: boolean
}

export function TimesheetSummary({ timesheets, isManager }: TimesheetSummaryProps) {
  const totalHours = useMemo(
    () => timesheets.reduce((sum, entry) => sum + entry.hours.reduce((h, v) => h + v, 0), 0),
    [timesheets],
  )

  // Calculate total hours for the current month
  const currentMonthHours = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    return timesheets
      .filter((timesheet) => isWithinInterval(timesheet.weekStarting, { start: monthStart, end: monthEnd }))
      .reduce((sum, timesheet) => sum + timesheet.hours.reduce((h, v) => h + v, 0), 0)
  }, [timesheets])

  const projectHours = useMemo(() => {
    const hours: Record<string, number> = {}
    timesheets.forEach((timesheet) => {
      const client = timesheet.client || "Unspecified"
      hours[client] = (hours[client] || 0) + timesheet.hours.reduce((sum, h) => sum + h, 0)
    })
    return Object.entries(hours)
      .map(([client, hours]) => ({ client, hours }))
      .sort((a, b) => b.hours - a.hours)
  }, [timesheets])

  const weeklyHours = useMemo(() => {
    const now = new Date()
    const oneWeekAgo = new Date(now)
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    return timesheets
      .filter((timesheet) => timesheet.weekStarting >= oneWeekAgo)
      .reduce((sum, timesheet) => sum + timesheet.hours.reduce((h, v) => h + v, 0), 0)
  }, [timesheets])

  const approvalStats = useMemo(() => {
    const stats = {
      draft: timesheets.filter((timesheet) => timesheet.status === "draft").length,
      submitted: timesheets.filter((timesheet) => timesheet.status === "submitted").length,
      approved: timesheets.filter((timesheet) => timesheet.status === "approved").length,
      rejected: timesheets.filter((timesheet) => timesheet.status === "rejected").length,
      pending_payment: timesheets.filter((timesheet) => timesheet.status === "pending_payment").length,
      paid: timesheets.filter((timesheet) => timesheet.status === "paid").length,
      draftHours: timesheets
        .filter((timesheet) => timesheet.status === "draft")
        .reduce((sum, timesheet) => sum + timesheet.hours.reduce((h, v) => h + v, 0), 0),
      submittedHours: timesheets
        .filter((timesheet) => timesheet.status === "submitted")
        .reduce((sum, timesheet) => sum + timesheet.hours.reduce((h, v) => h + v, 0), 0),
      approvedHours: timesheets
        .filter((timesheet) => timesheet.status === "approved")
        .reduce((sum, timesheet) => sum + timesheet.hours.reduce((h, v) => h + v, 0), 0),
      rejectedHours: timesheets
        .filter((timesheet) => timesheet.status === "rejected")
        .reduce((sum, timesheet) => sum + timesheet.hours.reduce((h, v) => h + v, 0), 0),
      pending_paymentHours: timesheets
        .filter((timesheet) => timesheet.status === "pending_payment")
        .reduce((sum, timesheet) => sum + timesheet.hours.reduce((h, v) => h + v, 0), 0),
      paidHours: timesheets
        .filter((timesheet) => timesheet.status === "paid")
        .reduce((sum, timesheet) => sum + timesheet.hours.reduce((h, v) => h + v, 0), 0),
    }
    return stats
  }, [timesheets])

  // Get unique employees
  const employees = useMemo(() => {
    const uniqueEmployees = new Set<string>()
    timesheets.forEach((timesheet) => {
      uniqueEmployees.add(timesheet.submittedBy)
    })
    return Array.from(uniqueEmployees)
  }, [timesheets])

  // Get current month name
  const currentMonthName = new Date().toLocaleString("default", { month: "long" })

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
              {timesheets.length}
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

      {timesheets.length > 0 && (
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
                      {hours.toFixed(1)} hours ({((hours / totalHours) * 100).toFixed(0)}%)
                    </div>
                  </div>
                  <Progress value={(hours / totalHours) * 100} className="h-2" />
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
                const employeeTimesheets = timesheets.filter((ts) => ts.submittedBy === employee)
                const totalEmployeeHours = employeeTimesheets.reduce(
                  (sum, ts) => sum + ts.hours.reduce((h, v) => h + v, 0),
                  0,
                )

                // Calculate employee hours for current month
                const employeeCurrentMonthHours = employeeTimesheets
                  .filter((timesheet) => {
                    const now = new Date()
                    const monthStart = startOfMonth(now)
                    const monthEnd = endOfMonth(now)
                    return isWithinInterval(timesheet.weekStarting, { start: monthStart, end: monthEnd })
                  })
                  .reduce((sum, ts) => sum + ts.hours.reduce((h, v) => h + v, 0), 0)

                return (
                  <div key={employee} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <div className="font-medium">{employee}</div>
                      <div className="text-sm text-gray-500">{employeeTimesheets.length} timesheets</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{totalEmployeeHours.toFixed(1)} total hours</div>
                        <div className="text-sm font-medium text-blue-600">
                          {employeeCurrentMonthHours.toFixed(1)} this month
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {
                          employeeTimesheets.filter((ts) => ["approved", "pending_payment", "paid"].includes(ts.status))
                            .length
                        }{" "}
                        approved
                      </div>
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
