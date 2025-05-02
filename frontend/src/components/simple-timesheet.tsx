"use client"

import { useState } from "react"
import { TimesheetEntry } from "./timesheet-entry"
import { TimesheetList } from "./timesheet-list"
import { TimesheetApproval } from "./timesheet-approval"
import { TimesheetSummary } from "./timesheet-summary"
import { TimesheetInvoice } from "./timesheet-invoice"
import { UserManagement } from "./user-management"
import { CustomerManagement } from "./customer-management"
import { ProjectManagement } from "./project-management"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { startOfWeek, isSameDay, addWeeks } from "date-fns"
import { Users, Building, Briefcase } from "lucide-react"
import { timesheetService } from "@/services/timesheet"

export type TimesheetStatus = "draft" | "submitted" | "approved" | "rejected" | "paid" | "pending_payment"

export type UserRole = "employee" | "manager"

export interface User {
  email: string
  name: string
  client: string
  location: string
  projectUuid: string
}

export interface TimeDetail {
  day: string
  date: Date
  hours: number
  useDetailedTime: boolean
  startTime?: string
  endTime?: string
  breakDuration?: number
  note?: string
}

export interface Timesheet {
  id: string
  uuid?: string
  weekStarting: Date
  client: string
  location: string
  status: string
  hours: number[]
  timeDetails: TimeDetail[]
  dayNotes: string[]
  notes: string
  submittedBy: string
  project: {
    uuid: string
  }
  submittedAt?: Date
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string
  sentForPaymentAt?: Date
  sentForPaymentBy?: string
  paidAt?: Date
  paidBy?: string
}

// Create a base date for April 7, 2025
const baseDate = new Date(2025, 3, 7)

const INITIAL_TIMESHEETS: Timesheet[] = [
  // Only one future timesheet (one week ahead)
  {
    id: "future-1",
    weekStarting: addWeeks(baseDate, 1), // April 14, 2025
    client: "",
    location: "",
    status: "draft",
    hours: [0, 0, 0, 0, 0, 0, 0],
    timeDetails: Array(7).fill({ useDetailedTime: false }),
    dayNotes: ["", "", "", "", "", "", ""],
    notes: "Future timesheet for next week",
    submittedBy: "John Smith",
  },
  // Current timesheet
  {
    id: "1",
    weekStarting: new Date(2024, 2, 18), // March 18, 2024
    client: "Acme Corp",
    location: "Website Redesign",
    status: "draft",
    hours: [8, 8, 8, 8, 8, 0, 0],
    timeDetails: [
      { day: 0, date: "2024-03-18", useDetailedTime: true, startTime: "09:00", endTime: "17:00", breakMinutes: 60 },
      { day: 1, date: "2024-03-19", useDetailedTime: true, startTime: "09:00", endTime: "17:00", breakMinutes: 60 },
      { day: 2, date: "2024-03-20", useDetailedTime: true, startTime: "09:00", endTime: "17:00", breakMinutes: 60 },
      { day: 3, date: "2024-03-21", useDetailedTime: true, startTime: "09:00", endTime: "17:00", breakMinutes: 60 },
      { day: 4, date: "2024-03-22", useDetailedTime: true, startTime: "09:00", endTime: "17:00", breakMinutes: 60 },
      { day: 5, date: "2024-03-23", useDetailedTime: false },
      { day: 6, date: "2024-03-24", useDetailedTime: false }
    ],
    dayNotes: ["", "", "", "", "", "", ""],
    notes: "",
    submittedBy: "John Smith"
  },
  // Past timesheets
  {
    id: "2",
    weekStarting: new Date(2024, 2, 11), // March 11, 2024
    client: "Tech Solutions",
    location: "API Development",
    status: "submitted",
    hours: [8, 8, 8, 8, 8, 0, 0],
    timeDetails: [
      { day: 0, date: "2024-03-11", useDetailedTime: false },
      { day: 1, date: "2024-03-12", useDetailedTime: false },
      { day: 2, date: "2024-03-13", useDetailedTime: false },
      { day: 3, date: "2024-03-14", useDetailedTime: false },
      { day: 4, date: "2024-03-15", useDetailedTime: false },
      { day: 5, date: "2024-03-16", useDetailedTime: false },
      { day: 6, date: "2024-03-17", useDetailedTime: false }
    ],
    dayNotes: ["", "", "", "", "", "", ""],
    notes: "",
    submittedBy: "John Smith",
    submittedAt: new Date(2024, 2, 15)
  },
  {
    id: "3",
    weekStarting: new Date(2025, 2, 24), // March 24, 2025
    client: "123 Industries",
    location: "Database Migration",
    status: "approved",
    hours: [8, 8, 8, 8, 4, 0, 0],
    timeDetails: [
      { day: 0, date: "2025-03-24", useDetailedTime: false },
      { day: 1, date: "2025-03-25", useDetailedTime: false },
      { day: 2, date: "2025-03-26", useDetailedTime: false },
      { day: 3, date: "2025-03-27", useDetailedTime: false },
      { day: 4, date: "2025-03-28", startTime: "09:00", endTime: "13:00", breakMinutes: 0, useDetailedTime: true },
      { day: 5, date: "2025-03-29", useDetailedTime: false },
      { day: 6, date: "2025-03-30", useDetailedTime: false }
    ],
    dayNotes: ["", "", "", "", "Half day - doctor appointment", "", ""],
    notes: "",
    submittedBy: "Sarah Johnson",
    submittedAt: new Date(2025, 2, 28),
    approvedBy: "Michael Manager",
    approvedAt: new Date(2025, 2, 29),
  },
  {
    id: "4",
    weekStarting: new Date(2025, 2, 17), // March 17, 2025
    client: "Global Tech",
    location: "Cloud Migration",
    status: "pending_payment",
    hours: [8, 8, 8, 8, 8, 0, 0],
    timeDetails: [
      { day: 0, date: "2025-03-17", useDetailedTime: false },
      { day: 1, date: "2025-03-18", useDetailedTime: false },
      { day: 2, date: "2025-03-19", useDetailedTime: false },
      { day: 3, date: "2025-03-20", useDetailedTime: false },
      { day: 4, date: "2025-03-21", useDetailedTime: false },
      { day: 5, date: "2025-03-22", useDetailedTime: false },
      { day: 6, date: "2025-03-23", useDetailedTime: false }
    ],
    dayNotes: ["", "", "", "", "", "", ""],
    notes: "",
    submittedBy: "Sarah Johnson",
    submittedAt: new Date(2025, 2, 21),
    approvedBy: "Michael Manager",
    approvedAt: new Date(2025, 2, 22),
    sentForPaymentAt: new Date(2025, 2, 23),
    sentForPaymentBy: "Michael Manager",
  },
  {
    id: "5",
    weekStarting: new Date(2025, 2, 10), // March 10, 2025
    client: "Local Services",
    location: "Support & Maintenance",
    status: "rejected",
    hours: [8, 8, 4, 8, 8, 0, 0],
    timeDetails: [
      { day: 0, date: "2025-03-10", useDetailedTime: false },
      { day: 1, date: "2025-03-11", useDetailedTime: false },
      { day: 2, date: "2025-03-12", useDetailedTime: false },
      { day: 3, date: "2025-03-13", useDetailedTime: false },
      { day: 4, date: "2025-03-14", useDetailedTime: false },
      { day: 5, date: "2025-03-15", useDetailedTime: false },
      { day: 6, date: "2025-03-16", useDetailedTime: false }
    ],
    dayNotes: ["", "", "Half day - doctor appointment", "", "", "", ""],
    notes: "Worked half day on Wednesday due to doctor appointment",
    submittedBy: "John Smith",
    submittedAt: new Date(2025, 2, 14),
    approvedBy: "Michael Manager",
    approvedAt: new Date(2025, 2, 15),
    rejectionReason: "Please provide documentation for the doctor appointment",
  },
  {
    id: "6",
    weekStarting: new Date(2025, 2, 3), // March 3, 2025
    client: "Tech Solutions",
    location: "API Integration",
    status: "paid",
    hours: [8, 8, 8, 8, 8, 0, 0],
    timeDetails: [
      { day: 0, date: "2025-03-03", useDetailedTime: false },
      { day: 1, date: "2025-03-04", useDetailedTime: false },
      { day: 2, date: "2025-03-05", useDetailedTime: false },
      { day: 3, date: "2025-03-06", useDetailedTime: false },
      { day: 4, date: "2025-03-07", useDetailedTime: false },
      { day: 5, date: "2025-03-08", useDetailedTime: false },
      { day: 6, date: "2025-03-09", useDetailedTime: false }
    ],
    dayNotes: ["", "", "", "", "", "", ""],
    notes: "Completed all tasks ahead of schedule",
    submittedBy: "John Smith",
    submittedAt: new Date(2025, 2, 7),
    approvedBy: "Michael Manager",
    approvedAt: new Date(2025, 2, 8),
    sentForPaymentAt: new Date(2025, 2, 9),
    sentForPaymentBy: "Michael Manager",
    paidAt: new Date(2025, 2, 12),
    paidBy: "Finance Department",
  },
]

export function SimpleTimesheet() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>(INITIAL_TIMESHEETS)
  const [activeTab, setActiveTab] = useState("entries")
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null)
  const [viewingInvoice, setViewingInvoice] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)

  // For demo purposes, toggle between employee and manager roles
  const [currentUser, setCurrentUser] = useState<User>({
    id: "user1",
    name: "John Smith",
    role: "employee",
  })

  const toggleRole = () => {
    setCurrentUser({
      ...currentUser,
      role: currentUser.role === "employee" ? "manager" : "employee",
    })
    // Reset to entries tab when switching roles
    setActiveTab("entries")
    setEditingTimesheet(null)
    setViewingInvoice(false)
  }

  const createNewTimesheet = (date: Date = new Date()) => {
    // Get the Monday of the current week
    const monday = new Date(date)
    monday.setDate(date.getDate() - date.getDay() + 1)
    monday.setHours(0, 0, 0, 0)

    // Check if we're trying to create a timesheet too far in advance
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    if (monday > threeDaysFromNow) {
      alert("Cannot create timesheets more than 3 days in advance")
      return
    }

    // Check if a timesheet already exists for this week
    const existingTimesheet = timesheets.find(
      (t) => t.weekStarting.getTime() === monday.getTime()
    )

    if (existingTimesheet) {
      setEditingTimesheet(existingTimesheet)
      return
    }

    // Create time details for each day of the week
    const timeDetails = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      return {
        day: index.toString(),
        date: date,
        hours: 0,
        useDetailedTime: false
      }
    })

    const newTimesheet: Timesheet = {
      id: `temp-${Date.now()}`,
      weekStarting: monday,
      client: currentUser.client,
      location: currentUser.location,
      status: "draft",
      hours: Array(7).fill(0),
      timeDetails: timeDetails,
      dayNotes: Array(7).fill(""),
      notes: "",
      submittedBy: currentUser.email,
      project: {
        uuid: currentUser.projectUuid
      }
    }

    setTimesheets([newTimesheet, ...timesheets])
    setEditingTimesheet(newTimesheet)
  }

  // Update the editTimesheet function to allow viewing any timesheet, but in read-only mode if needed
  const editTimesheet = (timesheetId: string) => {
    if (timesheetId === "new") {
      createNewTimesheet()
      return
    }

    const timesheet = timesheets.find((ts) => ts.id === timesheetId)
    if (timesheet) {
      // Set the editing timesheet regardless of status
      setEditingTimesheet(timesheet)
      setActiveTab("add")
    }
  }

  const saveTimesheet = async (updatedTimesheet: Timesheet) => {
    try {
      // Convert frontend timesheet to backend format
      const backendData = {
        week_starting: updatedTimesheet.weekStarting.toISOString().split('T')[0],
        project_uuid: updatedTimesheet.project.uuid,
        details_data: updatedTimesheet.timeDetails.map((detail, index) => ({
          day: detail.day,
          date: detail.date.toISOString().split('T')[0],
          hours: updatedTimesheet.hours[index] || 0,
          start_time: detail.startTime,
          end_time: detail.endTime,
          break_minutes: detail.breakDuration,
          use_detailed_time: detail.useDetailedTime,
          note: detail.note || updatedTimesheet.dayNotes[index] || ''
        })),
        notes: updatedTimesheet.notes
      }

      // If the timesheet has a temporary ID (starts with 'temp-'), create it first
      if (updatedTimesheet.id.startsWith('temp-')) {
        const response = await timesheetService.createTimesheet(backendData)
        
        // Update the timesheet with the backend response
        const newTimesheet = {
          ...updatedTimesheet,
          id: response.uuid,
          uuid: response.uuid
        }
        
        setTimesheets(timesheets.map((ts) => (ts.id === updatedTimesheet.id ? newTimesheet : ts)))
      } else {
        // Update existing timesheet
        await timesheetService.updateTimesheet(updatedTimesheet.id, backendData)
      }
      
      setActiveTab("entries")
      setEditingTimesheet(null)
    } catch (error) {
      console.error('Error saving timesheet:', error)
      alert('Failed to save timesheet. Please try again.')
    }
  }

  const submitTimesheet = async (timesheetId: string | Timesheet) => {
    try {
      // Handle both direct timesheet object (from entry form) and timesheet ID (from list)
      const timesheet = typeof timesheetId === "string" 
        ? timesheets.find((ts) => ts.id === timesheetId)
        : timesheetId

      if (!timesheet) return

      // Convert frontend timesheet to backend format
      const backendData = {
        week_starting: timesheet.weekStarting.toISOString().split('T')[0],
        project_uuid: timesheet.project.uuid,
        details_data: timesheet.timeDetails.map((detail, index) => ({
          day: detail.day,
          date: detail.date.toISOString().split('T')[0],
          hours: timesheet.hours[index] || 0,
          start_time: detail.startTime,
          end_time: detail.endTime,
          break_minutes: detail.breakDuration,
          use_detailed_time: detail.useDetailedTime,
          note: detail.note || timesheet.dayNotes[index] || ''
        })),
        notes: timesheet.notes
      }

      await timesheetService.submitTimesheet(timesheet.id)
      
      setTimesheets(
        timesheets.map((ts) =>
          ts.id === timesheet.id
            ? {
                ...timesheet,
                status: "submitted",
                submittedAt: new Date()
              }
            : ts
        )
      )

      if (typeof timesheetId !== "string") {
        setActiveTab("entries")
        setEditingTimesheet(null)
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error)
      alert('Failed to submit timesheet. Please try again.')
    }
  }

  const approveTimesheet = (timesheetId: string) => {
    setTimesheets(
      timesheets.map((ts) =>
        ts.id === timesheetId
          ? {
              ...ts,
              status: "approved" as TimesheetStatus,
              approvedBy: currentUser.name,
              approvedAt: new Date(),
            }
          : ts,
      ),
    )
  }

  const rejectTimesheet = (timesheetId: string, reason: string) => {
    setTimesheets(
      timesheets.map((ts) =>
        ts.id === timesheetId
          ? {
              ...ts,
              status: "rejected" as TimesheetStatus,
              approvedBy: currentUser.name,
              approvedAt: new Date(),
              rejectionReason: reason,
            }
          : ts,
      ),
    )
  }

  const sendForPayment = (timesheetId: string) => {
    setTimesheets(
      timesheets.map((ts) =>
        ts.id === timesheetId
          ? {
              ...ts,
              status: "pending_payment" as TimesheetStatus,
              sentForPaymentBy: currentUser.name,
              sentForPaymentAt: new Date(),
            }
          : ts,
      ),
    )
  }

  const markAsPaid = (timesheetId: string) => {
    setTimesheets(
      timesheets.map((ts) =>
        ts.id === timesheetId
          ? {
              ...ts,
              status: "paid" as TimesheetStatus,
              paidBy: currentUser.name,
              paidAt: new Date(),
            }
          : ts,
      ),
    )
  }

  const undoApproval = (timesheetId: string) => {
    setTimesheets(
      timesheets.map((ts) =>
        ts.id === timesheetId
          ? {
              ...ts,
              status: "submitted" as TimesheetStatus,
              approvedBy: undefined,
              approvedAt: undefined,
            }
          : ts,
      ),
    )
  }

  const cancelEditing = () => {
    setEditingTimesheet(null)
    setActiveTab("entries")
  }

  const viewInvoice = (employeeName?: string) => {
    setSelectedEmployee(employeeName || null)
    setViewingInvoice(true)
  }

  const closeInvoice = () => {
    setViewingInvoice(false)
    setSelectedEmployee(null)
  }

  // Filter timesheets for the current user (or all for managers)
  const userTimesheets = timesheets.filter(
    (ts) => ts.submittedBy === currentUser.name || currentUser.role === "manager",
  )

  // Filter timesheets for a specific employee if selected
  const filteredTimesheets = selectedEmployee
    ? timesheets.filter((ts) => ts.submittedBy === selectedEmployee)
    : userTimesheets

  if (viewingInvoice) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <TimesheetInvoice
          timesheets={filteredTimesheets}
          user={currentUser}
          onBack={closeInvoice}
          employeeName={selectedEmployee || undefined}
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold">BH</div>
          <div className="text-sm text-gray-500">Timesheet System</div>
        </div>
        <div className="text-sm">
          <span className="font-medium">{currentUser.name}</span> ({currentUser.role}) |{" "}
          <button onClick={toggleRole} className="text-blue-500 underline">
            Switch to {currentUser.role === "employee" ? "Manager" : "Employee"}
          </button>{" "}
          |{" "}
          <a href="#" className="text-blue-500">
            Log Out
          </a>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList
          className="grid w-full"
          style={{
            gridTemplateColumns:
              currentUser.role === "manager" ? "repeat(7, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
          }}
        >
          <TabsTrigger value="entries">Time Entries</TabsTrigger>
          <TabsTrigger value="add">{editingTimesheet ? "Edit Entry" : "Add Entry"}</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          {currentUser.role === "manager" && <TabsTrigger value="approval">Approvals</TabsTrigger>}
          {currentUser.role === "manager" && (
            <TabsTrigger value="users" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          )}
          {currentUser.role === "manager" && (
            <TabsTrigger value="customers" className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              Customers
            </TabsTrigger>
          )}
          {currentUser.role === "manager" && (
            <TabsTrigger value="projects" className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              Projects
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="entries">
          <Card className="p-6">
            <TimesheetList timesheets={userTimesheets} onEditTimesheet={editTimesheet} currentUser={currentUser} />
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{editingTimesheet ? "Edit Timesheet" : "Add New Timesheet"}</h2>
            {editingTimesheet ? (
              <TimesheetEntry
                timesheet={editingTimesheet}
                onSave={saveTimesheet}
                onSubmit={submitTimesheet}
                onCancel={cancelEditing}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No timesheet selected for editing.</p>
                <button
                  onClick={() => createNewTimesheet()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create New Timesheet
                </button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <TimesheetSummary
              timesheets={currentUser.role === "manager" ? timesheets : userTimesheets}
              isManager={currentUser.role === "manager"}
            />
          </Card>
        </TabsContent>

        {currentUser.role === "manager" && (
          <TabsContent value="approval">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Timesheet Approvals</h2>
              <TimesheetApproval
                timesheets={timesheets.filter(
                  (ts) =>
                    ts.status === "submitted" ||
                    ts.status === "approved" ||
                    ts.status === "pending_payment" ||
                    ts.status === "paid",
                )}
                onApprove={approveTimesheet}
                onReject={rejectTimesheet}
                onMarkAsPaid={markAsPaid}
                onSendForPayment={sendForPayment}
                onViewInvoice={viewInvoice}
                onUndoApproval={undoApproval}
              />
            </Card>
          </TabsContent>
        )}

        {currentUser.role === "manager" && (
          <TabsContent value="users">
            <Card className="p-6">
              <UserManagement />
            </Card>
          </TabsContent>
        )}

        {currentUser.role === "manager" && (
          <TabsContent value="customers">
            <Card className="p-6">
              <CustomerManagement />
            </Card>
          </TabsContent>
        )}

        {currentUser.role === "manager" && (
          <TabsContent value="projects">
            <Card className="p-6">
              <ProjectManagement />
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
