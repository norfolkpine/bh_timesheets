"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CustomerForm } from "./customer-form"
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

export type Customer = {
  id: string
  name: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  isActive: boolean
  createdAt: Date
  updatedAt?: Date
}

// Sample customers for demonstration
export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust1",
    name: "ABC Corporation",
    contactName: "Jane Smith",
    email: "jane.smith@abccorp.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, San Francisco, CA 94105",
    notes: "Key client for software development projects",
    isActive: true,
    createdAt: new Date(2023, 0, 15),
  },
  {
    id: "cust2",
    name: "XYZ Industries",
    contactName: "John Johnson",
    email: "john@xyzindustries.com",
    phone: "+1 (555) 987-6543",
    address: "456 Oak St, Chicago, IL 60601",
    notes: "Manufacturing client",
    isActive: true,
    createdAt: new Date(2023, 1, 20),
  },
  {
    id: "cust3",
    name: "Global Healthcare",
    contactName: "Sarah Williams",
    email: "sarah@globalhealthcare.org",
    phone: "+1 (555) 456-7890",
    address: "789 Medical Dr, Boston, MA 02115",
    notes: "Healthcare provider",
    isActive: true,
    createdAt: new Date(2023, 2, 10),
  },
]

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS)
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const handleAddCustomer = () => {
    setIsAddingCustomer(true)
    setEditingCustomer(null)
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsAddingCustomer(false)
  }

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (customerToDelete) {
      setCustomers(customers.filter((c) => c.id !== customerToDelete.id))
      setDeleteDialogOpen(false)
      setCustomerToDelete(null)
    }
  }

  const handleSaveCustomer = (customerData: any) => {
    if (editingCustomer) {
      // Update existing customer
      setCustomers(
        customers.map((customer) =>
          customer.id === editingCustomer.id
            ? {
                ...customer,
                ...customerData,
                updatedAt: new Date(),
              }
            : customer,
        ),
      )
      setEditingCustomer(null)
    } else {
      // Add new customer
      const newCustomer: Customer = {
        id: `cust${customers.length + 1}`,
        ...customerData,
        isActive: customerData.isActive !== undefined ? customerData.isActive : true,
        createdAt: new Date(),
      }
      setCustomers([...customers, newCustomer])
      setIsAddingCustomer(false)
    }
  }

  const handleCancelCustomerForm = () => {
    setIsAddingCustomer(false)
    setEditingCustomer(null)
  }

  // Filter customers based on search query and active tab
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "active") return matchesSearch && customer.isActive
    if (activeTab === "inactive") return matchesSearch && !customer.isActive

    return matchesSearch
  })

  // If we're adding or editing a customer, show the form
  if (isAddingCustomer || editingCustomer) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {editingCustomer ? `Edit Customer: ${editingCustomer.name}` : "Add New Customer"}
          </h2>
          <Button variant="outline" onClick={handleCancelCustomerForm}>
            Back to Customer List
          </Button>
        </div>

        <CustomerForm
          onSave={handleSaveCustomer}
          onCancel={handleCancelCustomerForm}
          initialCustomer={editingCustomer || undefined}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Customer Management</h2>
        <Button onClick={handleAddCustomer}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Customer
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Customers</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredCustomers.length === 0 ? (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-gray-500">No customers found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Contact</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Email/Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building className="h-5 w-5 text-gray-400" />
                          <div className="font-medium">{customer.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{customer.contactName || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {customer.email || "—"}
                        {customer.phone && <div className="text-xs text-gray-500">{customer.phone}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={customer.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {customer.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditCustomer(customer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(customer)}
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
              Are you sure you want to delete the customer "{customerToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
