"use client"

import { useState, useEffect } from "react"
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
import { startOfWeek } from "date-fns/startOfWeek"
import { isSameDay } from "date-fns/isSameDay"
import { Users, Building, Briefcase, LogOut } from "lucide-react"
import { timesheetService } from "@/services/timesheet-service"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export type TimesheetStatus = "draft" | "submitted" | "approved" | "rejected" | "paid" | "pending_payment"

export type UserRole = "employee" | "manager"

export type User = {
  id: string
  name: string
  role: UserRole
}

export type TimeDetail = {
  id?: string
  startTime?: string
  endTime?: string
  breakMinutes?: number
  useDetailedTime: boolean
  timesheetId?: string
  dayIndex?: number
}

export interface Timesheet {
  id: string
  weekStarting: Date | string
  client: string
  clientName?: string
  location: string
  projectName?: string
  status: string
  hours: number[]
  timeDetails?: TimeDetail[]
  dayNotes: string[]
  notes: string
  submittedBy?: string
  submittedAt?: Date
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string
  sentForPaymentAt?: Date
  sentForPaymentBy?: string
  paidAt?: Date
  paidBy?: string
  totalHours?: number
  totalAmount?: number
  hourlyRate?: number | null
  dailyRate?: number | null
  fixedPrice?: number | null
  retainerAmount?: number | null
}

export function SimpleTimesheet() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [activeTab, setActiveTab] = useState("entries")
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null)
  const [viewingInvoice, setViewingInvoice] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Use the authenticated user from the auth context
  const currentUser: User = {
    id: user?.id || "user1",
    name: user?.name || "John Smith",
    role: user?.role || "employee",
  }

  // Check if user is a manager
  const isManager = currentUser.role === "manager"

  useEffect(() => {
    loadTimesheets()
  }, [])

  const loadTimesheets = async () => {
    setIsLoading(true)
    try {
      const data = await timesheetService.getTimesheets()

      // Ensure data is properly mapped to our frontend model
      const mappedTimesheets = Array.isArray(data)
        ? data.map((ts) => {
            // If the timesheet doesn't have the expected structure, map it
            if (!ts.hours || !Array.isArray(ts.hours) || !ts.timeDetails) {
              return timesheetService.mapApiResponseToTimesheet(ts)
            }
            return ts
          })
        : []

      setTimesheets(mappedTimesheets)
    } catch (error) {
      console.error("Failed to load timesheets:", error)
      toast({
        title: "Error",
        description: "Failed to load timesheets. Please try again.",
        variant: "destructive",
      })
      // Initialize with empty array on error
      setTimesheets([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
      toast({
        title: "Success",
        description: "You have been logged out successfully",
      })
    } catch (error) {
      console.error("Logout failed:", error)
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const createNewTimesheet = (weekStartingDate?: Date) => {
    // If no date is provided, use the current week
    const today = new Date()
    let monday: Date

    if (weekStartingDate) {
      // Use the provided date but ensure it's a Monday
      monday = new Date(weekStartingDate)
      const day = monday.getDay() // 0 is Sunday, 1 is Monday, etc.
      if (day !== 1) {
        // If not Monday, adjust to the nearest Monday
        const daysToSubtract = day === 0 ? 6 : day - 1
        monday.setDate(monday.getDate() - daysToSubtract)
      }
      // Reset to midnight
      monday.setHours(0, 0, 0, 0)
    } else {
      // Find the most recent Monday
      const day = today.getDay() // 0 is Sunday, 1 is Monday, etc.
      const daysToSubtract = day === 0 ? 6 : day - 1
      monday = new Date(today)
      monday.setDate(today.getDate() - daysToSubtract)
      monday.setHours(0, 0, 0, 0)
    }

    // Rest of the function remains the same...
    // Check if a timesheet already exists for this week
    const existingTimesheet = timesheets.find(
      (ts) =>
        ts.submittedBy === currentUser.name && isSameDay(startOfWeek(ts.weekStarting, { weekStartsOn: 1 }), monday),
    )

    if (existingTimesheet) {
      // If a timesheet exists, edit it instead of creating a new one
      setEditingTimesheet(existingTimesheet)
      setActiveTab("add")
      return
    }

    // Create a temporary timesheet object without saving to API yet
    const newTimesheet: Timesheet = {
      id: "temp-" + Date.now(), // Temporary ID that will be replaced when saved
      weekStarting: monday,
      client: "",
      location: "",
      status: "draft",
      hours: [0, 0, 0, 0, 0, 0, 0],
      timeDetails: Array(7).fill({ useDetailedTime: false }),
      dayNotes: ["", "", "", "", "", "", ""],
      notes: "",
      submittedBy: currentUser.name,
    }

    // Set the editing timesheet and switch to the add tab
    setEditingTimesheet(newTimesheet)
    setActiveTab("add")
  }

  const editTimesheet = async (timesheetId: string) => {
    if (timesheetId === "new") {
      createNewTimesheet()
      return
    }

    // Add check to prevent API call with undefined ID
    if (!timesheetId) {
      console.error("Attempted to edit timesheet with undefined ID")
      toast({
        title: "Error",
        description: "Invalid timesheet ID. Cannot edit this timesheet.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log(`Fetching timesheet with ID: ${timesheetId}`)
      const timesheet = await timesheetService.getTimesheetById(timesheetId)

      if (timesheet) {
        console.log("Timesheet loaded successfully:", timesheet)
        // Set the editing timesheet regardless of status
        setEditingTimesheet(timesheet)
        setActiveTab("add")
      } else {
        console.error("Timesheet not found")
        toast({
          title: "Error",
          description: "Timesheet not found",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to get timesheet:", error)
      toast({
        title: "Error",
        description: "Failed to load timesheet. Please try again.",
        variant: "destructive",
      })
    }
  }

  const saveTimesheet = async (updatedTimesheet: Timesheet) => {
    try {
      let savedTimesheet: Timesheet

      // Check if this is a new timesheet (with a temp ID) or an existing one
      const isNewTimesheet = updatedTimesheet.id.startsWith("temp-")

      if (isNewTimesheet) {
        // For new timesheets, use createTimesheet instead of updateTimesheet
        console.log("Creating new timesheet:", updatedTimesheet)
        savedTimesheet = await timesheetService.createTimesheet(updatedTimesheet)
      } else {
        // For existing timesheets, use updateTimesheet as before
        console.log("Updating existing timesheet:", updatedTimesheet)
        savedTimesheet = await timesheetService.updateTimesheet(updatedTimesheet.id, updatedTimesheet)
      }

      // Update the timesheets list
      if (isNewTimesheet) {
        // Add the new timesheet to the list
        setTimesheets([...timesheets, savedTimesheet])
      } else {
        // Update the existing timesheet in the list
        setTimesheets(timesheets.map((ts) => (ts.id === savedTimesheet.id ? savedTimesheet : ts)))
      }

      setActiveTab("entries")
      setEditingTimesheet(null)

      toast({
        title: "Success",
        description: "Timesheet saved successfully",
      })
    } catch (error) {
      console.error("Failed to save timesheet:", error)
      toast({
        title: "Error",
        description: "Failed to save timesheet. Please try again.",
        variant: "destructive",
      })
    }
  }

  const submitTimesheet = async (timesheetId: string | Timesheet) => {
    try {
      // Handle both direct timesheet object (from entry form) and timesheet ID (from list)
      const id = typeof timesheetId === "string" ? timesheetId : timesheetId.id
      let timesheetToSubmit = id

      // If it's a new timesheet with a temp ID, create it first
      if (typeof timesheetId !== "string" && id.startsWith("temp-")) {
        console.log("Creating new timesheet before submitting:", timesheetId)
        const createdTimesheet = await timesheetService.createTimesheet(timesheetId)
        timesheetToSubmit = createdTimesheet.id

        // Update the timesheets list with the newly created timesheet
        setTimesheets([...timesheets, createdTimesheet])
      } else if (typeof timesheetId !== "string") {
        // For existing timesheets, save any changes first
        await timesheetService.updateTimesheet(id, timesheetId)
      }

      // Then submit the timesheet
      const submittedTimesheet = await timesheetService.submitTimesheet(timesheetToSubmit)

      setTimesheets(timesheets.map((ts) => (ts.id === submittedTimesheet.id ? submittedTimesheet : ts)))

      if (typeof timesheetId !== "string") {
        setActiveTab("entries")
        setEditingTimesheet(null)
      }

      toast({
        title: "Success",
        description: "Timesheet submitted successfully",
      })
    } catch (error) {
      console.error("Failed to submit timesheet:", error)
      toast({
        title: "Error",
        description: "Failed to submit timesheet. Please try again.",
        variant: "destructive",
      })
    }
  }

  const approveTimesheet = async (timesheetId: string) => {
    try {
      const approvedTimesheet = await timesheetService.approveTimesheet(timesheetId)
      setTimesheets(timesheets.map((ts) => (ts.id === approvedTimesheet.id ? approvedTimesheet : ts)))

      toast({
        title: "Success",
        description: "Timesheet approved successfully",
      })
    } catch (error) {
      console.error("Failed to approve timesheet:", error)
      toast({
        title: "Error",
        description: "Failed to approve timesheet. Please try again.",
        variant: "destructive",
      })
    }
  }

  const rejectTimesheet = async (timesheetId: string, reason: string) => {
    try {
      const rejectedTimesheet = await timesheetService.rejectTimesheet(timesheetId, reason)
      setTimesheets(timesheets.map((ts) => (ts.id === rejectedTimesheet.id ? rejectedTimesheet : ts)))

      toast({
        title: "Success",
        description: "Timesheet rejected successfully",
      })
    } catch (error) {
      console.error("Failed to reject timesheet:", error)
      toast({
        title: "Error",
        description: "Failed to reject timesheet. Please try again.",
        variant: "destructive",
      })
    }
  }

  const sendForPayment = async (timesheetId: string) => {
    try {
      const pendingPaymentTimesheet = await timesheetService.sendForPayment(timesheetId)
      setTimesheets(timesheets.map((ts) => (ts.id === pendingPaymentTimesheet.id ? pendingPaymentTimesheet : ts)))

      toast({
        title: "Success",
        description: "Timesheet sent for payment successfully",
      })
    } catch (error) {
      console.error("Failed to send timesheet for payment:", error)
      toast({
        title: "Error",
        description: "Failed to send timesheet for payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const markAsPaid = async (timesheetId: string) => {
    try {
      const paidTimesheet = await timesheetService.markAsPaid(timesheetId)
      setTimesheets(timesheets.map((ts) => (ts.id === paidTimesheet.id ? paidTimesheet : ts)))

      toast({
        title: "Success",
        description: "Timesheet marked as paid successfully",
      })
    } catch (error) {
      console.error("Failed to mark timesheet as paid:", error)
      toast({
        title: "Error",
        description: "Failed to mark timesheet as paid. Please try again.",
        variant: "destructive",
      })
    }
  }

  const undoApproval = async (timesheetId: string) => {
    try {
      const submittedTimesheet = await timesheetService.undoApproval(timesheetId)
      setTimesheets(timesheets.map((ts) => (ts.id === submittedTimesheet.id ? submittedTimesheet : ts)))

      toast({
        title: "Success",
        description: "Timesheet approval undone successfully",
      })
    } catch (error) {
      console.error("Failed to undo timesheet approval:", error)
      toast({
        title: "Error",
        description: "Failed to undo timesheet approval. Please try again.",
        variant: "destructive",
      })
    }
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
  const userTimesheets = timesheets.filter((ts) => ts.submittedBy === currentUser.name || isManager)

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

  // Calculate the number of tabs based on user role
  const numTabs = isManager ? 7 : 3

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold">BH</div>
          <div className="text-sm text-gray-500">Timesheet System</div>
        </div>
        <div className="text-sm flex items-center gap-2">
          <span className="font-medium">{currentUser.name}</span>
          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
            {currentUser.role === "manager" ? "Manager" : "Employee"}
          </span>
          <button onClick={handleLogout} className="text-blue-500 flex items-center gap-1">
            <LogOut className="h-3 w-3" />
            Log Out
          </button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(${numTabs}, minmax(0, 1fr))`,
          }}
        >
          <TabsTrigger value="entries">Time Entries</TabsTrigger>
          <TabsTrigger value="add">{editingTimesheet ? "Edit Entry" : "Add Entry"}</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>

          {isManager && <TabsTrigger value="approval">Approvals</TabsTrigger>}
          {isManager && (
            <TabsTrigger value="users" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          )}
          {isManager && (
            <TabsTrigger value="customers" className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              Customers
            </TabsTrigger>
          )}
          {isManager && (
            <TabsTrigger value="projects" className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              Projects
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="entries">
          <Card className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading timesheets...</p>
              </div>
            ) : (
              <TimesheetList timesheets={userTimesheets} onEditTimesheet={editTimesheet} currentUser={currentUser} />
            )}
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
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Creating...
                    </>
                  ) : (
                    "Create New Timesheet"
                  )}
                </button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading summary data...</p>
              </div>
            ) : (
              <TimesheetSummary timesheets={isManager ? timesheets : userTimesheets} isManager={isManager} />
            )}
          </Card>
        </TabsContent>

        {isManager && (
          <TabsContent value="approval">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Timesheet Approvals</h2>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading approval data...</p>
                </div>
              ) : (
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
              )}
            </Card>
          </TabsContent>
        )}

        {isManager && (
          <TabsContent value="users">
            <Card className="p-6">
              <UserManagement />
            </Card>
          </TabsContent>
        )}

        {isManager && (
          <TabsContent value="customers">
            <Card className="p-6">
              <CustomerManagement />
            </Card>
          </TabsContent>
        )}

        {isManager && (
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
