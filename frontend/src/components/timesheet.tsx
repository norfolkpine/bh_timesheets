"use client"

import { useState } from "react"
import { TimesheetEntry } from "@/components/timesheet-entry"
import { TimesheetForm } from "@/components/timesheet-form"
import { TimesheetSummary } from "@/components/timesheet-summary"
import { TimesheetApproval } from "@/components/timesheet-approval"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type ApprovalStatus = "pending" | "approved" | "rejected"

export type Entry = {
  id: string
  date: Date
  project: string
  hours: number
  description: string
  status: ApprovalStatus
  submittedBy?: string
  approvedBy?: string
  approvalDate?: Date
  rejectionReason?: string
}

export function Timesheet() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  // Mock current user - in a real app, this would come from authentication
  const [currentUser] = useState({
    id: "user1",
    name: "John Doe",
    role: "employee", // or "manager"
  })

  // For demo purposes, toggle between employee and manager roles
  const [isManager, setIsManager] = useState(false)

  const addEntry = (entry: Omit<Entry, "id" | "status" | "submittedBy">) => {
    const newEntry = {
      ...entry,
      id: crypto.randomUUID(),
      status: "pending" as ApprovalStatus,
      submittedBy: currentUser.name,
    }
    setEntries([...entries, newEntry])
  }

  const updateEntry = (updatedEntry: Entry) => {
    setEntries(entries.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)))
    setEditingEntry(null)
  }

  const deleteEntry = (id: string) => {
    setEntries(entries.filter((entry) => entry.id !== id))
  }

  const startEditing = (entry: Entry) => {
    setEditingEntry(entry)
  }

  const cancelEditing = () => {
    setEditingEntry(null)
  }

  const approveEntry = (id: string) => {
    setEntries(
      entries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              status: "approved",
              approvedBy: currentUser.name,
              approvalDate: new Date(),
            }
          : entry,
      ),
    )
  }

  const rejectEntry = (id: string, reason: string) => {
    setEntries(
      entries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              status: "rejected",
              approvedBy: currentUser.name,
              approvalDate: new Date(),
              rejectionReason: reason,
            }
          : entry,
      ),
    )
  }

  const toggleRole = () => {
    setIsManager(!isManager)
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">
          Logged in as: <span className="font-bold">{currentUser.name}</span> ({isManager ? "Manager" : "Employee"})
        </h2>
        <button
          onClick={toggleRole}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-md text-sm font-medium transition-colors"
        >
          Switch to {isManager ? "Employee" : "Manager"} View
        </button>
      </div>

      <Tabs defaultValue="entries" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="entries">Time Entries</TabsTrigger>
          <TabsTrigger value="add">Add Entry</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          {isManager && <TabsTrigger value="approval">Approvals</TabsTrigger>}
        </TabsList>
        <TabsContent value="entries">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Time Entries</h2>
            {entries.length === 0 ? (
              <p className="text-muted-foreground">No entries yet. Add your first time entry!</p>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <TimesheetEntry
                    key={entry.id}
                    entry={entry}
                    onEdit={startEditing}
                    onDelete={deleteEntry}
                    isManager={isManager}
                    onApprove={approveEntry}
                    onReject={rejectEntry}
                  />
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
        <TabsContent value="add">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{editingEntry ? "Edit Entry" : "Add New Entry"}</h2>
            <TimesheetForm
              onSubmit={editingEntry ? updateEntry : addEntry}
              initialValues={editingEntry || undefined}
              onCancel={editingEntry ? cancelEditing : undefined}
            />
          </Card>
        </TabsContent>
        <TabsContent value="summary">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <TimesheetSummary entries={entries} />
          </Card>
        </TabsContent>
        {isManager && (
          <TabsContent value="approval">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Timesheet Approvals</h2>
              <TimesheetApproval
                entries={entries.filter((entry) => entry.status === "pending")}
                onApprove={approveEntry}
                onReject={rejectEntry}
              />
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
