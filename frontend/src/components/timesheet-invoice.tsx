"use client"

import { useState, useRef } from "react"
import { format, startOfMonth, endOfMonth, isWithinInterval, addMonths, subMonths } from "date-fns"
import { Printer, ChevronLeft, ChevronRight, Download, ArrowLeft } from "lucide-react"
import type { Timesheet, User } from "./simple-timesheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TimesheetInvoiceProps {
  timesheets: Timesheet[]
  user: User
  onBack: () => void
  employeeName?: string
}

export function TimesheetInvoice({ timesheets, user, onBack, employeeName }: TimesheetInvoiceProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [hourlyRate, setHourlyRate] = useState("25.00")
  const [companyName, setCompanyName] = useState("Your Company Name")
  const [companyAddress, setCompanyAddress] = useState("123 Business St, City, State, ZIP")
  const [companyEmail, setCompanyEmail] = useState("billing@yourcompany.com")
  const [companyPhone, setCompanyPhone] = useState("(555) 123-4567")
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`)
  const [showSettings, setShowSettings] = useState(false)

  const invoiceRef = useRef<HTMLDivElement>(null)

  // Get the start and end of the current month
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  // Filter timesheets for the current month
  const monthTimesheets = timesheets.filter(
    (timesheet) =>
      isWithinInterval(timesheet.weekStarting, { start: monthStart, end: monthEnd }) &&
      // Only include submitted, approved, pending_payment, or paid timesheets
      ["submitted", "approved", "pending_payment", "paid"].includes(timesheet.status),
  )

  // Group timesheets by client/project
  const timesheetsByProject: Record<
    string,
    {
      client: string
      project: string
      hours: number
      timesheets: Timesheet[]
    }
  > = {}

  monthTimesheets.forEach((timesheet) => {
    const key = `${timesheet.client}-${timesheet.location}`
    if (!timesheetsByProject[key]) {
      timesheetsByProject[key] = {
        client: timesheet.client,
        project: timesheet.location,
        hours: 0,
        timesheets: [],
      }
    }

    const totalHours = timesheet.hours.reduce((sum, h) => sum + h, 0)
    timesheetsByProject[key].hours += totalHours
    timesheetsByProject[key].timesheets.push(timesheet)
  })

  // Calculate total hours and amount
  const totalHours = Object.values(timesheetsByProject).reduce((sum, group) => sum + group.hours, 0)
  const totalAmount = totalHours * Number.parseFloat(hourlyRate || "0")

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const handlePrint = () => {
    const printContent = invoiceRef.current?.innerHTML || ""
    const printWindow = window.open("", "_blank")

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${format(currentMonth, "MMMM yyyy")}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background-color: #f8f9fa; }
              .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
              .invoice-details { margin-top: 20px; }
              .invoice-total { margin-top: 30px; text-align: right; }
              .invoice-meta { margin-bottom: 30px; }
              .invoice-meta div { margin-bottom: 5px; }
              @media print {
                button { display: none !important; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? "Hide Settings" : "Invoice Settings"}
          </Button>
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium">{format(currentMonth, "MMMM yyyy")}</div>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Input
                    id="companyAddress"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input id="companyEmail" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="companyPhone">Company Phone</Label>
                  <Input id="companyPhone" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input id="invoiceNumber" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div ref={invoiceRef}>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">INVOICE</h1>
                <div className="mt-4 space-y-1">
                  <p className="font-bold">{companyName}</p>
                  <p className="text-sm text-gray-600">{companyAddress}</p>
                  <p className="text-sm text-gray-600">{companyEmail}</p>
                  <p className="text-sm text-gray-600">{companyPhone}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Invoice #: {invoiceNumber}</div>
                <div className="text-sm text-gray-600">Date: {format(new Date(), "MMMM d, yyyy")}</div>
                <div className="text-sm text-gray-600">
                  Period: {format(monthStart, "MMMM d, yyyy")} - {format(monthEnd, "MMMM d, yyyy")}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-2">Bill To:</h2>
              <div className="space-y-1">
                <p className="font-medium">{employeeName || user.name}</p>
                <p className="text-sm text-gray-600">Employee ID: {user.id}</p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Time Summary</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Client</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Project</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Hours</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600 border-b">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(timesheetsByProject).map((group, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-3">{group.client}</td>
                      <td className="px-4 py-3">{group.project}</td>
                      <td className="px-4 py-3">{group.hours.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        ${(group.hours * Number.parseFloat(hourlyRate || "0")).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {Object.keys(timesheetsByProject).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-center text-gray-500">
                        No timesheet data available for this month
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-medium">
                    <td colSpan={2} className="px-4 py-3 text-right">
                      Total:
                    </td>
                    <td className="px-4 py-3">{totalHours.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">${totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {Object.keys(timesheetsByProject).length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4">Timesheet Details</h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Week Starting</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Client</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Project</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 border-b">Status</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600 border-b">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthTimesheets.map((timesheet) => (
                      <tr key={timesheet.id} className="border-b">
                        <td className="px-4 py-3">{format(timesheet.weekStarting, "MMM d, yyyy")}</td>
                        <td className="px-4 py-3">{timesheet.client}</td>
                        <td className="px-4 py-3">{timesheet.location}</td>
                        <td className="px-4 py-3 capitalize">{timesheet.status.replace("_", " ")}</td>
                        <td className="px-4 py-3 text-right">
                          {timesheet.hours.reduce((sum, h) => sum + h, 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-12 border-t pt-6">
              <div className="text-sm text-gray-600">
                <p className="font-medium">Payment Terms:</p>
                <p>Payment due within 30 days of invoice date.</p>
                <p className="mt-4">Thank you for your business!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
