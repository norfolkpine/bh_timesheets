"use client"

import { Clock, List, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { User } from "./simple-timesheet"

interface TimesheetHeaderProps {
  user: User
  onToggleRole: () => void
  onNewTimesheet: () => void
  onViewTimesheets: () => void
  onViewApprovals: () => void
  activeView: "list" | "entry" | "approval"
}

export function TimesheetHeader({
  user,
  onToggleRole,
  onNewTimesheet,
  onViewTimesheets,
  onViewApprovals,
  activeView,
}: TimesheetHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold">BH</div>
          <div className="text-sm text-gray-500">Timesheet System</div>
        </div>
        <div className="text-sm">
          <span className="font-medium">{user.name}</span> ({user.role}) |{" "}
          <button onClick={onToggleRole} className="text-blue-500 underline">
            Switch to {user.role === "employee" ? "Manager" : "Employee"}
          </button>{" "}
          |{" "}
          <a href="#" className="text-blue-500">
            Log Out
          </a>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {activeView === "list"
            ? "My Timesheets"
            : activeView === "approval"
              ? "Timesheet Approvals"
              : "Timesheet Entry"}
        </h1>
        <div className="flex gap-2">
          {activeView === "list" && (
            <>
              <Button onClick={onNewTimesheet}>
                <Clock className="mr-2 h-4 w-4" />
                New Timesheet
              </Button>
              {user.role === "manager" && (
                <Button variant="outline" onClick={onViewApprovals}>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Approvals
                </Button>
              )}
            </>
          )}
          {activeView === "approval" && (
            <Button variant="outline" onClick={onViewTimesheets}>
              <List className="mr-2 h-4 w-4" />
              View Timesheets
            </Button>
          )}
          {activeView === "entry" && (
            <Button variant="outline" onClick={onViewTimesheets}>
              <List className="mr-2 h-4 w-4" />
              View All Timesheets
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
