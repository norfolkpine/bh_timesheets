"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserForm } from "./user-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { employeeService, type EmployeeProfile } from "@/services/employee-service"
import { useToast } from "@/hooks/use-toast"

export interface ExtendedUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: "employee" | "manager"
  is_staff: boolean
  department?: string
  position?: string
  hourly_rate?: number
  bank_name?: string
  account_number?: string
  sort_code?: string
  tax_id?: string
  address?: string
  phone?: string
  start_date?: string
  is_active: boolean
  notes?: string
}

export function UserManagement() {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([])
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [editingUser, setEditingUser] = useState<EmployeeProfile | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<EmployeeProfile | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    setIsLoading(true)
    try {
      const data = await employeeService.getEmployees()
      setEmployees(data)
    } catch (error) {
      console.error("Failed to load employees:", error)
      toast({
        title: "Error",
        description: "Failed to load employees. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = () => {
    setIsAddingUser(true)
    setEditingUser(null)
  }

  const handleEditUser = async (employee: EmployeeProfile) => {
    try {
      const employeeDetails = await employeeService.getEmployeeById(employee.uuid)
      setEditingUser(employeeDetails)
      setIsAddingUser(false)
    } catch (error) {
      console.error("Failed to fetch employee details:", error)
      toast({
        title: "Error",
        description: "Failed to load employee details. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (employee: EmployeeProfile) => {
    setUserToDelete(employee)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        await employeeService.deleteEmployee(userToDelete.uuid)
        setEmployees(employees.filter((e) => e.uuid !== userToDelete.uuid))
        toast({
          title: "Success",
          description: "Employee deleted successfully",
        })
      } catch (error) {
        console.error("Failed to delete employee:", error)
        toast({
          title: "Error",
          description: "Failed to delete employee. Please try again.",
          variant: "destructive",
        })
      } finally {
        setDeleteDialogOpen(false)
        setUserToDelete(null)
      }
    }
  }

  const handleSaveUser = async (userData: any) => {
    try {
      if (editingUser) {
        // Update existing employee
        const updatedEmployee = await employeeService.updateEmployee(editingUser.uuid, userData)
        setEmployees(employees.map((employee) => (employee.uuid === editingUser.uuid ? updatedEmployee : employee)))
        toast({
          title: "Success",
          description: "Employee updated successfully",
        })
      } else {
        // Add new employee
        const newEmployee = await employeeService.createEmployee(userData)
        setEmployees([...employees, newEmployee])
        toast({
          title: "Success",
          description: "Employee created successfully",
        })
      }
      setEditingUser(null)
      setIsAddingUser(false)
    } catch (error) {
      console.error("Failed to save employee:", error)
      toast({
        title: "Error",
        description: "Failed to save employee. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCancelUserForm = () => {
    setIsAddingUser(false)
    setEditingUser(null)
  }

  // Filter employees based on search query and active tab
  const filteredEmployees = employees.filter((employee) => {
    const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.toLowerCase()
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      (employee.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.employee_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.department || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.position || "").toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "employees") return matchesSearch && employee.role === "employee"
    if (activeTab === "managers") return matchesSearch && employee.role === "manager"
    if (activeTab === "active") return matchesSearch && employee.is_active
    if (activeTab === "inactive") return matchesSearch && !employee.is_active

    return matchesSearch
  })

  // If we're adding or editing a user, show the form
  if (isAddingUser || editingUser) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {editingUser
              ? `Edit Employee: ${editingUser.first_name || ""} ${editingUser.last_name || ""}`
              : "Add New Employee"}
          </h2>
          <Button variant="outline" onClick={handleCancelUserForm}>
            Back to Employee List
          </Button>
        </div>

        <UserForm onSave={handleSaveUser} onCancel={handleCancelUserForm} initialUser={editingUser || undefined} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employee Management</h2>
        <Button onClick={handleAddUser}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Employee
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Employees</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="managers">Managers</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-gray-500">Loading employees...</p>
              </CardContent>
            </Card>
          ) : filteredEmployees.length === 0 ? (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-gray-500">No employees found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Department</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Hourly Rate</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.uuid} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {`${employee.first_name || ""} ${employee.last_name || ""}`}
                            </div>
                            <div className="text-xs text-gray-500">{employee.employee_id || "No ID"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{employee.email || "No email"}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            employee.role === "manager" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                          }
                        >
                          {employee.role === "manager" ? "Manager" : "Employee"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{employee.department || "Not specified"}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {employee.hourly_rate != null && !isNaN(employee.hourly_rate)
                          ? `$${Number(employee.hourly_rate).toFixed(2)}`
                          : "Not set"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={employee.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          {employee.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(employee)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(employee)}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the employee "
              {userToDelete ? `${userToDelete.first_name || ""} ${userToDelete.last_name || ""}` : "this employee"}
              "? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
