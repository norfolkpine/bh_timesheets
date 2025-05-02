"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns/format"
import { addDays } from "date-fns/addDays"
import {
  CheckCircle,
  XCircle,
  CircleDollarSign,
  User,
  Eye,
  ArrowLeft,
  CreditCard,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { Timesheet } from "./simple-timesheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface TimesheetApprovalProps {
  timesheets: Timesheet[]
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
  onMarkAsPaid: (id: string) => void
  onSendForPayment: (id: string) => void
  onViewInvoice: (employeeName?: string) => void
  onUndoApproval: (id: string) => void
}

// Add a function to display day notes
const getDayNotes = (timesheet: Timesheet) => {
  const notesWithContent = timesheet.dayNotes.filter((note) => note.trim() !== "")
  if (notesWithContent.length === 0) return null

  return (
    <div className="mt-2 p-2 bg-gray-50 border rounded text-sm">
      <p className="font-medium">Day Notes:</p>
      <ul className="list-disc pl-5 text-gray-600">
        {timesheet.dayNotes.map((note, index) =>
          note.trim() !== "" ? (
            <li key={`day-note-${index}`}>
              {format(addDays(timesheet.weekStarting, index), "EEE")}: {note}
            </li>
          ) : null,
        )}
      </ul>
    </div>
  )
}

// Add a function to display time details
const getTimeDetails = (timesheet: Timesheet) => {
  if (!timesheet.timeDetails) return null

  const daysWithDetails = timesheet.timeDetails.filter((detail) => detail?.useDetailedTime)
  if (daysWithDetails.length === 0) return null

  return (
    <div className="mt-2 p-2 bg-gray-50 border rounded text-sm">
      <p className="font-medium">Time Details:</p>
      <ul className="list-disc pl-5 text-gray-600">
        {timesheet.timeDetails.map((detail, index) =>
          detail?.useDetailedTime ? (
            <li key={`time-detail-${index}`}>
              {format(addDays(timesheet.weekStarting, index), "EEE")}: {detail.startTime} - {detail.endTime}
              {detail.breakMinutes ? ` (${detail.breakMinutes}min break)` : ""}
              {" = "}
              {timesheet.hours[index].toFixed(2)} hours
            </li>
          ) : null,
        )}
      </ul>
    </div>
  )
}

const getTotalHours = (hours: any[]): string => {
  if (!hours || !Array.isArray(hours)) return "0.00"

  const total = hours.reduce((sum, hour) => {
    // Ensure each hour is a valid number
    const validHour = typeof hour === "number" && !isNaN(hour) ? hour : 0
    return sum + validHour
  }, 0)

  return total.toFixed(2)
}

const DEFAULT_HOURLY_RATE = 25

const calculatePaymentAmount = (hours: any[]): string => {
  if (!hours || !Array.isArray(hours)) return "0.00"

  const totalHours = hours.reduce((sum, hour) => {
    const validHour = typeof hour === "number" && !isNaN(hour) ? hour : 0
    return sum + validHour
  }, 0)

  return (totalHours * DEFAULT_HOURLY_RATE).toFixed(2)
}

export function TimesheetApproval({
  timesheets,
  onApprove,
  onReject,
  onMarkAsPaid,
  onSendForPayment,
  onViewInvoice,
  onUndoApproval,
}: TimesheetApprovalProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [detailedViewTimesheet, setDetailedViewTimesheet] = useState<Timesheet | null>(null)
  const [activeTab, setActiveTab] = useState("pending")
  const [undoApprovalDialogOpen, setUndoApprovalDialogOpen] = useState(false)
  const [timesheetToUndoApproval, setTimesheetToUndoApproval] = useState<Timesheet | null>(null)

  // Default hourly rate for calculating payment amounts

  const handleRejectClick = (timesheet: Timesheet) => {
    setSelectedTimesheet(timesheet)
    setRejectionReason("")
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = () => {
    if (selectedTimesheet && rejectionReason.trim()) {
      onReject(selectedTimesheet.id, rejectionReason)
      setRejectDialogOpen(false)
      setSelectedTimesheet(null)
      setRejectionReason("")
    }
  }

  const handleUndoApprovalClick = (timesheet: Timesheet) => {
    setTimesheetToUndoApproval(timesheet)
    setUndoApprovalDialogOpen(true)
  }

  const handleUndoApprovalConfirm = () => {
    if (timesheetToUndoApproval) {
      onUndoApproval(timesheetToUndoApproval.id)
      setUndoApprovalDialogOpen(false)
      setTimesheetToUndoApproval(null)
    }
  }

  const pendingTimesheets = useMemo(() => timesheets.filter((ts) => ts.status === "submitted"), [timesheets])

  const approvedTimesheets = useMemo(() => timesheets.filter((ts) => ts.status === "approved"), [timesheets])

  const pendingPaymentTimesheets = useMemo(
    () => timesheets.filter((ts) => ts.status === "pending_payment"),
    [timesheets],
  )

  const paidTimesheets = useMemo(() => timesheets.filter((ts) => ts.status === "paid"), [timesheets])

  // Get the current timesheet list based on active tab
  const getCurrentTimesheetList = () => {
    switch (activeTab) {
      case "pending":
        return pendingTimesheets
      case "approved":
        return approvedTimesheets
      case "payment":
        return pendingPaymentTimesheets
      case "paid":
        return paidTimesheets
      default:
        return pendingTimesheets
    }
  }

  const viewDetailedTimesheet = (timesheet: Timesheet) => {
    setDetailedViewTimesheet(timesheet)
  }

  const closeDetailedView = () => {
    setDetailedViewTimesheet(null)
  }

  const navigateToNextTimesheet = () => {
    if (!detailedViewTimesheet) return

    const currentList = getCurrentTimesheetList()
    const currentIndex = currentList.findIndex((ts) => ts.id === detailedViewTimesheet.id)

    if (currentIndex < currentList.length - 1) {
      setDetailedViewTimesheet(currentList[currentIndex + 1])
    }
  }

  const navigateToPreviousTimesheet = () => {
    if (!detailedViewTimesheet) return

    const currentList = getCurrentTimesheetList()
    const currentIndex = currentList.findIndex((ts) => ts.id === detailedViewTimesheet.id)

    if (currentIndex > 0) {
      setDetailedViewTimesheet(currentList[currentIndex - 1])
    }
  }

  // Get unique employees with approved, pending_payment, or paid timesheets
  const employeesWithApprovedTimesheets = [
    ...new Set(
      timesheets
        .filter((ts) => ["approved", "pending_payment", "paid"].includes(ts.status))
        .map((ts) => ts.submittedBy),
    ),
  ]

  // Helper function to get badge color based on status
  function getStatusBadgeColor(status: string): string {
    switch (status) {
      case "submitted":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "approved":
        return "bg-green-500 hover:bg-green-600"
      case "rejected":
        return "bg-red-500 hover:bg-red-600"
      case "paid":
        return "bg-green-700 hover:bg-green-800"
      case "pending_payment":
        return "bg-blue-500 hover:bg-blue-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  // Helper function to format status for display
  function formatStatus(status: string): string {
    switch (status) {
      case "pending_payment":
        return "Pending Payment"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  // Detailed day-by-day breakdown view
  if (detailedViewTimesheet) {
    const currentList = getCurrentTimesheetList()
    const currentIndex = currentList.findIndex((ts) => ts.id === detailedViewTimesheet.id)
    const hasPrevious = currentIndex > 0
    const hasNext = currentIndex < currentList.length - 1
    const totalHoursCalc = Array.isArray(detailedViewTimesheet.hours)
      ? detailedViewTimesheet.hours.reduce((sum, hour) => {
          const validHour = typeof hour === "number" && !isNaN(hour) ? hour : 0
          return sum + validHour
        }, 0)
      : 0
    const totalHours = totalHoursCalc.toFixed(2)
    const paymentAmount = Number.parseFloat(totalHours) * DEFAULT_HOURLY_RATE

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={closeDetailedView}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to List
          </Button>
          <h2 className="text-lg font-medium">
            Timesheet - {detailedViewTimesheet.submittedBy} - Week of{" "}
            {format(detailedViewTimesheet.weekStarting, "d MMM, yyyy")}
          </h2>
          <Badge className={`ml-2 ${getStatusBadgeColor(detailedViewTimesheet.status)}`}>
            {formatStatus(detailedViewTimesheet.status)}
          </Badge>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between">
              <div>
                <CardTitle>Timesheet Details</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Client: {detailedViewTimesheet.clientName || "No client specified"}
                  {detailedViewTimesheet.projectName ? ` | Project: ${detailedViewTimesheet.projectName}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">Total: {getTotalHours(detailedViewTimesheet.hours)} hours</p>
                <p className="font-medium text-green-600">${paymentAmount.toFixed(2)}</p>
                {detailedViewTimesheet.submittedAt && (
                  <p className="text-xs text-gray-500">
                    Submitted: {format(detailedViewTimesheet.submittedAt, "d MMM yyyy, h:mm a")}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Day</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Hours</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedViewTimesheet.hours.map((hours, index) => {
                    const date = addDays(detailedViewTimesheet.weekStarting, index)
                    const dayAmount = hours * DEFAULT_HOURLY_RATE
                    return (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-3 font-medium">{format(date, "EEEE")}</td>
                        <td className="px-4 py-3">{format(date, "d MMM yyyy")}</td>
                        <td className="px-4 py-3 font-medium">
                          {typeof hours === "number" ? hours.toFixed(2) : "0.00"}
                        </td>
                        <td className="px-4 py-3 font-medium text-green-600">${dayAmount.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          {detailedViewTimesheet.dayNotes[index] ? (
                            <div className="text-sm">{detailedViewTimesheet.dayNotes[index]}</div>
                          ) : (
                            <span className="text-gray-500 text-sm">No notes</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="border-t bg-gray-50">
                    <td colSpan={2} className="px-4 py-3 font-medium">
                      Total
                    </td>
                    <td className="px-4 py-3 font-medium">{getTotalHours(detailedViewTimesheet.hours)}</td>
                    <td className="px-4 py-3 font-medium text-green-600">${paymentAmount.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {detailedViewTimesheet.notes && (
              <div className="mt-4 p-3 bg-gray-50 border rounded">
                <h3 className="font-medium mb-1">Additional Notes</h3>
                <p>{detailedViewTimesheet.notes}</p>
              </div>
            )}

            {detailedViewTimesheet.status === "submitted" && (
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  className="text-red-500"
                  onClick={() => handleRejectClick(detailedViewTimesheet)}
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  className="text-green-500"
                  onClick={() => onApprove(detailedViewTimesheet.id)}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Approve
                </Button>
              </div>
            )}

            {detailedViewTimesheet.status === "approved" && (
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  className="text-blue-500"
                  onClick={() => onSendForPayment(detailedViewTimesheet.id)}
                >
                  <CreditCard className="mr-1 h-4 w-4" />
                  Send for Payment
                </Button>
                <Button
                  variant="outline"
                  className="text-amber-500"
                  onClick={() => handleUndoApprovalClick(detailedViewTimesheet)}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Undo Approval
                </Button>
              </div>
            )}

            {detailedViewTimesheet.status === "pending_payment" && (
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  className="text-green-500"
                  onClick={() => onMarkAsPaid(detailedViewTimesheet.id)}
                >
                  <CircleDollarSign className="mr-1 h-4 w-4" />
                  Mark as Paid
                </Button>
              </div>
            )}

            {/* Navigation moved to the bottom of the page */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={navigateToPreviousTimesheet} disabled={!hasPrevious}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous Timesheet
              </Button>
              <div className="text-sm text-gray-500">
                {currentIndex + 1} of {currentList.length}
              </div>
              <Button variant="outline" size="sm" onClick={navigateToNextTimesheet} disabled={!hasNext}>
                Next Timesheet
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending">Pending Approval ({pendingTimesheets.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedTimesheets.length})</TabsTrigger>
          <TabsTrigger value="payment">Payment ({pendingPaymentTimesheets.length})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({paidTimesheets.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingTimesheets.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">No timesheets pending approval.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTimesheets.map((timesheet) => {
                const totalHoursCalc = Array.isArray(timesheet.hours)
                  ? timesheet.hours.reduce((sum, hour) => {
                      const validHour = typeof hour === "number" && !isNaN(hour) ? hour : 0
                      return sum + validHour
                    }, 0)
                  : 0
                const totalHours = totalHoursCalc.toFixed(2)
                const paymentAmount = Number.parseFloat(totalHours) * DEFAULT_HOURLY_RATE

                return (
                  <Card key={timesheet.id} className="overflow-hidden">
                    <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-b">
                      <div className="font-medium">Week of {format(timesheet.weekStarting, "d MMM, yyyy")}</div>
                      <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending Approval</Badge>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-gray-500" />
                            <p className="font-medium">{timesheet.submittedBy}</p>
                          </div>
                          <p>
                            {timesheet.clientName || "No client"} / {timesheet.projectName || "No project"}
                          </p>
                          <div className="mt-2 flex items-center gap-4">
                            <p>
                              <span className="font-medium">{getTotalHours(timesheet.hours)}</span> hours
                            </p>
                            <p className="font-medium text-green-600">${paymentAmount.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => viewDetailedTimesheet(timesheet)}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500"
                            onClick={() => handleRejectClick(timesheet)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-500"
                            onClick={() => onApprove(timesheet.id)}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {approvedTimesheets.length === 0 ? (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-gray-500">No approved timesheets.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {approvedTimesheets.map((timesheet) => {
                const totalHoursCalc = Array.isArray(timesheet.hours)
                  ? timesheet.hours.reduce((sum, hour) => {
                      const validHour = typeof hour === "number" && !isNaN(hour) ? hour : 0
                      return sum + validHour
                    }, 0)
                  : 0
                const totalHours = totalHoursCalc.toFixed(2)
                const paymentAmount = Number.parseFloat(totalHours) * DEFAULT_HOURLY_RATE

                return (
                  <Card key={timesheet.id} className="overflow-hidden">
                    <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-b">
                      <div className="font-medium">Week of {format(timesheet.weekStarting, "d MMM, yyyy")}</div>
                      <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-gray-500" />
                            <p className="font-medium">{timesheet.submittedBy}</p>
                          </div>
                          <p>
                            {timesheet.clientName || "No client"} / {timesheet.projectName || "No project"}
                          </p>
                          <div className="mt-2 flex items-center gap-4">
                            <p>
                              <span className="font-medium">{getTotalHours(timesheet.hours)}</span> hours
                            </p>
                            <p className="font-medium text-green-600">${paymentAmount.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => viewDetailedTimesheet(timesheet)}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-500"
                            onClick={() => onSendForPayment(timesheet.id)}
                          >
                            <CreditCard className="mr-1 h-4 w-4" />
                            Send for Payment
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-500"
                            onClick={() => handleUndoApprovalClick(timesheet)}
                          >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Undo Approval
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payment" className="mt-4">
          {pendingPaymentTimesheets.length === 0 ? (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-gray-500">No timesheets pending payment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingPaymentTimesheets.map((timesheet) => {
                const totalHoursCalc = Array.isArray(timesheet.hours)
                  ? timesheet.hours.reduce((sum, hour) => {
                      const validHour = typeof hour === "number" && !isNaN(hour) ? hour : 0
                      return sum + validHour
                    }, 0)
                  : 0
                const totalHours = totalHoursCalc.toFixed(2)
                const paymentAmount = Number.parseFloat(totalHours) * DEFAULT_HOURLY_RATE

                return (
                  <Card key={timesheet.id} className="overflow-hidden">
                    <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-b">
                      <div className="font-medium">Week of {format(timesheet.weekStarting, "d MMM, yyyy")}</div>
                      <Badge className="bg-blue-500 hover:bg-blue-600">Pending Payment</Badge>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-gray-500" />
                            <p className="font-medium">{timesheet.submittedBy}</p>
                          </div>
                          <p>
                            {timesheet.clientName || "No client"} / {timesheet.projectName || "No project"}
                          </p>
                          <div className="mt-2 flex items-center gap-4">
                            <p>
                              <span className="font-medium">{getTotalHours(timesheet.hours)}</span> hours
                            </p>
                            <p className="font-medium text-green-600">${paymentAmount.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => viewDetailedTimesheet(timesheet)}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-500"
                            onClick={() => onMarkAsPaid(timesheet.id)}
                          >
                            <CircleDollarSign className="mr-1 h-4 w-4" />
                            Mark as Paid
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="paid" className="mt-4">
          {paidTimesheets.length === 0 ? (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-gray-500">No paid timesheets.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {paidTimesheets.map((timesheet) => {
                const totalHoursCalc = Array.isArray(timesheet.hours)
                  ? timesheet.hours.reduce((sum, hour) => {
                      const validHour = typeof hour === "number" && !isNaN(hour) ? hour : 0
                      return sum + validHour
                    }, 0)
                  : 0
                const totalHours = totalHoursCalc.toFixed(2)
                const paymentAmount = Number.parseFloat(totalHours) * DEFAULT_HOURLY_RATE

                return (
                  <Card key={timesheet.id} className="overflow-hidden">
                    <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-b">
                      <div className="font-medium">Week of {format(timesheet.weekStarting, "d MMM, yyyy")}</div>
                      <Badge className="bg-green-700 hover:bg-green-800">Paid</Badge>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-gray-500" />
                            <p className="font-medium">{timesheet.submittedBy}</p>
                          </div>
                          <p>
                            {timesheet.clientName || "No client"} / {timesheet.projectName || "No project"}
                          </p>
                          <div className="mt-2 flex items-center gap-4">
                            <p>
                              <span className="font-medium">{getTotalHours(timesheet.hours)}</span> hours
                            </p>
                            <p className="font-medium text-green-600">${paymentAmount.toFixed(2)}</p>
                          </div>
                          {timesheet.paidAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Paid on {format(timesheet.paidAt, "d MMM yyyy")}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => viewDetailedTimesheet(timesheet)}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-500"
                            onClick={() => onViewInvoice(timesheet.submittedBy)}
                          >
                            <FileText className="mr-1 h-4 w-4" />
                            Invoice
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {employeesWithApprovedTimesheets.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No approved timesheets available for invoicing.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Employee Invoices</h3>
                    <Button variant="outline" onClick={() => onViewInvoice()} className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      View All Employees Invoice
                    </Button>
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-4 py-3 text-left font-medium text-gray-500">Employee</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">Approved Timesheets</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">Total Hours</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">Amount</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeesWithApprovedTimesheets.map((employee) => {
                          const employeeTimesheets = timesheets.filter(
                            (ts) =>
                              ts.submittedBy === employee &&
                              ["approved", "pending_payment", "paid"].includes(ts.status),
                          )
                          const totalHoursCalc = employeeTimesheets.reduce(
                            (sum, ts) =>
                              sum +
                              ts.hours.reduce((h, v) => {
                                const validHour = typeof v === "number" && !isNaN(v) ? v : 0
                                return h + validHour
                              }, 0),
                            0,
                          )
                          const totalHours = totalHoursCalc.toFixed(2)
                          const totalAmount = Number.parseFloat(totalHours) * DEFAULT_HOURLY_RATE

                          return (
                            <tr key={employee} className="border-b">
                              <td className="px-4 py-3 font-medium">{employee}</td>
                              <td className="px-4 py-3">{employeeTimesheets.length}</td>
                              <td className="px-4 py-3">{totalHours} hours</td>
                              <td className="px-4 py-3 font-medium text-green-600">${totalAmount.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onViewInvoice(employee)}
                                  className="flex items-center gap-1 ml-auto"
                                >
                                  <FileText className="h-3 w-3" />
                                  View Invoice
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Invoice Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-md border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <h4 className="font-medium">Approved</h4>
                        </div>
                        <p className="text-2xl font-bold">{approvedTimesheets.length}</p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-sm text-gray-600">
                            {approvedTimesheets
                              .reduce(
                                (sum, ts) =>
                                  sum +
                                  ts.hours.reduce((h, v) => {
                                    const validHour = typeof v === "number" && !isNaN(v) ? v : 0
                                    return h + validHour
                                  }, 0),
                                0,
                              )
                              .toFixed(2)}{" "}
                            hours
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            $
                            {(
                              approvedTimesheets.reduce(
                                (sum, ts) =>
                                  sum +
                                  ts.hours.reduce((h, v) => {
                                    const validHour = typeof v === "number" && !isNaN(v) ? v : 0
                                    return h + validHour
                                  }, 0),
                                0,
                              ) * DEFAULT_HOURLY_RATE
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="h-5 w-5 text-blue-500" />
                          <h4 className="font-medium">Pending Payment</h4>
                        </div>
                        <p className="text-2xl font-bold">{pendingPaymentTimesheets.length}</p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-sm text-gray-600">
                            {pendingPaymentTimesheets
                              .reduce(
                                (sum, ts) =>
                                  sum +
                                  ts.hours.reduce((h, v) => {
                                    const validHour = typeof v === "number" && !isNaN(v) ? v : 0
                                    return h + validHour
                                  }, 0),
                                0,
                              )
                              .toFixed(2)}{" "}
                            hours
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            $
                            {(
                              pendingPaymentTimesheets.reduce(
                                (sum, ts) =>
                                  sum +
                                  ts.hours.reduce((h, v) => {
                                    const validHour = typeof v === "number" && !isNaN(v) ? v : 0
                                    return h + validHour
                                  }, 0),
                                0,
                              ) * DEFAULT_HOURLY_RATE
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="bg-green-100 p-4 rounded-md border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CircleDollarSign className="h-5 w-5 text-green-600" />
                          <h4 className="font-medium">Paid</h4>
                        </div>
                        <p className="text-2xl font-bold">{paidTimesheets.length}</p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-sm text-gray-600">
                            {paidTimesheets
                              .reduce(
                                (sum, ts) =>
                                  sum +
                                  ts.hours.reduce((h, v) => {
                                    const validHour = typeof v === "number" && !isNaN(v) ? v : 0
                                    return h + validHour
                                  }, 0),
                                0,
                              )
                              .toFixed(2)}{" "}
                            hours
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            $
                            {(
                              paidTimesheets.reduce(
                                (sum, ts) =>
                                  sum +
                                  ts.hours.reduce((h, v) => {
                                    const validHour = typeof v === "number" && !isNaN(v) ? v : 0
                                    return h + validHour
                                  }, 0),
                                0,
                              ) * DEFAULT_HOURLY_RATE
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Timesheet</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this timesheet.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter rejection reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={!rejectionReason.trim()}>
              Reject Timesheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={undoApprovalDialogOpen} onOpenChange={setUndoApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undo Timesheet Approval</DialogTitle>
            <DialogDescription>
              Are you sure you want to undo the approval for this timesheet? This will change the status back to
              "Submitted".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUndoApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleUndoApprovalConfirm}>
              Confirm Undo Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
