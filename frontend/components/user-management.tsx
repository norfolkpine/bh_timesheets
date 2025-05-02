"use client"

import { useState } from "react"
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

// Extended User type with additional fields
export type ExtendedUser = {
  id: string
  name: string
  email: string
  role: "employee" | "manager"
  employeeId?: string
  department?: string
  position?: string
  hourlyRate?: number
  bankName?: string
  accountNumber?: string
  sortCode?: string
  taxId?: string
  address?: string
  phone?: string
  startDate?: string
  isActive: boolean
  notes?: string
  createdAt: Date
  updatedAt?: Date
}

// Sample users for demonstration
const INITIAL_USERS: ExtendedUser[] = [
  {
    id: "user1",
    name: "John Smith",
    email: "john.smith@example.com",
    role: "employee",
    employeeId: "EMP-001",
    department: "Engineering",
    position: "Software Developer",
    hourlyRate: 25,
    bankName: "Bank of Example",
    accountNumber: "12345678",
    sortCode: "12-34-56",
    taxId: "AB123456C",
    address: "123 Main St, City, State, ZIP",
    phone: "+1 (555) 123-4567",
    startDate: "2023-01-15",
    isActive: true,
    notes: "Full-time employee",
    createdAt: new Date(2023, 0, 15),
  },
  {
    id: "user2",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    role: "employee",
    employeeId: "EMP-002",
    department: "Design",
    position: "UI/UX Designer",
    hourlyRate: 28,
    bankName: "City Bank",
    accountNumber: "87654321",
    sortCode: "65-43-21",
    taxId: "CD987654E",
    address: "456 Oak St, City, State, ZIP",
    phone: "+1 (555) 987-6543",
    startDate: "2023-02-01",
    isActive: true,
    notes: "Part-time employee, works 3 days a week",
    createdAt: new Date(2023, 1, 1),
  },
  {
    id: "user3",
    name: "Michael Manager",
    email: "michael.manager@example.com",
    role: "manager",
    employeeId: "MGR-001",
    department: "Operations",
    position: "Project Manager",
    hourlyRate: 35,
    bankName: "Global Bank",
    accountNumber: "11223344",
    sortCode: "11-22-33",
    taxId: "EF112233G",
    address: "789 Pine St, City, State, ZIP",
    phone: "+1 (555) 456-7890",
    startDate: "2022-11-01",
    isActive: true,
    notes: "Department manager",
    createdAt: new Date(2022, 10, 1),
  },
]

export function UserManagement() {
  const [users, setUsers] = useState<ExtendedUser[]>(INITIAL_USERS)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<ExtendedUser | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const handleAddUser = () => {
    setIsAddingUser(true)
    setEditingUser(null)
  }

  const handleEditUser = (user: ExtendedUser) => {
    setEditingUser(user)
    setIsAddingUser(false)
  }

  const handleDeleteClick = (user: ExtendedUser) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (userToDelete) {
      setUsers(users.filter((u) => u.id !== userToDelete.id))
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const handleSaveUser = (userData: any) => {
    if (editingUser) {
      // Update existing user
      setUsers(
        users.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                ...userData,
                updatedAt: new Date(),
              }
            : user,
        ),
      )
      setEditingUser(null)
    } else {
      // Add new user
      const newUser: ExtendedUser = {
        id: `user${users.length + 1}`,
        ...userData,
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        createdAt: new Date(),
      }
      setUsers([...users, newUser])
      setIsAddingUser(false)
    }
  }

  const handleCancelUserForm = () => {
    setIsAddingUser(false)
    setEditingUser(null)
  }

  // Filter users based on search query and active tab
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.position?.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "employees") return matchesSearch && user.role === "employee"
    if (activeTab === "managers") return matchesSearch && user.role === "manager"
    if (activeTab === "active") return matchesSearch && user.isActive
    if (activeTab === "inactive") return matchesSearch && !user.isActive

    return matchesSearch
  })

  // If we're adding or editing a user, show the form
  if (isAddingUser || editingUser) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{editingUser ? `Edit User: ${editingUser.name}` : "Add New User"}</h2>
          <Button variant="outline" onClick={handleCancelUserForm}>
            Back to User List
          </Button>
        </div>

        <UserForm onSave={handleSaveUser} onCancel={handleCancelUserForm} initialUser={editingUser || undefined} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button onClick={handleAddUser}>
          <Plus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="managers">Managers</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-gray-500">No users found.</p>
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
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.employeeId || "No ID"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            user.role === "manager" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                          }
                        >
                          {user.role === "manager" ? "Manager" : "Employee"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.department || "Not specified"}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {user.hourlyRate ? `$${user.hourlyRate.toFixed(2)}` : "Not set"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(user)}
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
              Are you sure you want to delete the user "{userToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
