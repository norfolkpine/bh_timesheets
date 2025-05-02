"use client"

import { useState, useEffect } from "react"
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
import { customerService } from "@/services/customer-service"
import { useToast } from "@/hooks/use-toast"

export type Customer = {
  id?: string
  uuid: string
  name: string
  contactName?: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  isActive?: boolean
  is_active?: boolean
  createdAt?: Date
  updatedAt?: Date
}

// Sample customers for demonstration
export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust1",
    uuid: "uuid1",
    name: "ABC Corporation",
    contactName: "Jane Smith",
    email: "jane.smith@abccorp.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, Anytown, USA",
    isActive: true,
    createdAt: new Date(2023, 0, 1),
  },
  {
    id: "cust2",
    uuid: "uuid2",
    name: "XYZ Industries",
    contactName: "John Doe",
    email: "john.doe@xyzind.com",
    phone: "+1 (555) 234-5678",
    address: "456 Elm St, Anytown, USA",
    isActive: true,
    createdAt: new Date(2023, 1, 15),
  },
  {
    id: "cust3",
    uuid: "uuid3",
    name: "PQR Solutions",
    contactName: "Alice Brown",
    email: "alice.brown@pqrsolutions.com",
    phone: "+1 (555) 345-6789",
    address: "789 Oak St, Anytown, USA",
    isActive: false,
    createdAt: new Date(2023, 2, 1),
    updatedAt: new Date(2023, 3, 30),
  },
]

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    setIsLoading(true)
    try {
      console.log("Loading customers...")
      const data = await customerService.getCustomers()
      console.log("Customers loaded:", data)

      // Always ensure we have an array
      setCustomers(Array.isArray(data) ? data : INITIAL_CUSTOMERS)

      if (!Array.isArray(data)) {
        console.warn("Customer data is not an array, using initial customers instead")
        toast({
          title: "Warning",
          description: "Could not load customers from server. Using default data instead.",
          variant: "warning",
        })
      }
    } catch (error) {
      console.error("Failed to load customers:", error)
      // Fall back to initial customers if API call fails
      setCustomers(INITIAL_CUSTOMERS)
      toast({
        title: "Error",
        description: "Failed to load customers. Using default data instead.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCustomer = () => {
    setIsAddingCustomer(true)
    setEditingCustomer(null)
  }

  const handleEditCustomer = async (customer: Customer) => {
    try {
      setIsLoading(true)
      // Fetch the full customer details by UUID
      const customerDetails = await customerService.getCustomerById(customer.uuid)
      console.log("Fetched customer details:", customerDetails)

      // Create a properly formatted customer object for the form
      const customerToEdit = {
        uuid: customerDetails.uuid,
        name: customerDetails.name || "",
        contactName: customerDetails.contact_name || "",
        email: customerDetails.email || "",
        phone: customerDetails.phone || "",
        address: customerDetails.address || "",
        notes: customerDetails.notes || "",
        isActive: customerDetails.is_active !== undefined ? customerDetails.is_active : true,
      }

      setEditingCustomer(customerToEdit)
      setIsAddingCustomer(false)
    } catch (error) {
      console.error("Failed to fetch customer details:", error)
      toast({
        title: "Error",
        description: "Failed to load customer details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (customerToDelete) {
      try {
        await customerService.deleteCustomer(customerToDelete.uuid)
        // Refresh the customer list instead of filtering locally
        await loadCustomers()
        toast({
          title: "Success",
          description: "Customer deleted successfully",
        })
      } catch (error) {
        console.error("Failed to delete customer:", error)
        toast({
          title: "Error",
          description: "Failed to delete customer. Please try again.",
          variant: "destructive",
        })
      } finally {
        setDeleteDialogOpen(false)
        setCustomerToDelete(null)
      }
    }
  }

  const handleSaveCustomer = async (customerData: any) => {
    try {
      if (editingCustomer) {
        // Format the data for the API
        const apiCustomerData = {
          name: customerData.name,
          contact_name: customerData.contactName,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          notes: customerData.notes,
          is_active: customerData.isActive,
        }

        // Update existing customer
        const updatedCustomer = await customerService.updateCustomer(editingCustomer.uuid, apiCustomerData)

        // Refresh the customer list
        await loadCustomers()

        toast({
          title: "Success",
          description: "Customer updated successfully",
        })
      } else {
        // Format the data for the API
        const apiCustomerData = {
          name: customerData.name,
          contact_name: customerData.contactName,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          notes: customerData.notes,
          is_active: customerData.isActive,
        }

        // Add new customer
        await customerService.createCustomer(apiCustomerData)

        // Refresh the customer list
        await loadCustomers()

        toast({
          title: "Success",
          description: "Customer created successfully",
        })
      }
      setEditingCustomer(null)
      setIsAddingCustomer(false)
    } catch (error) {
      console.error("Failed to save customer:", error)
      toast({
        title: "Error",
        description: "Failed to save customer. Please try again.",
        variant: "destructive",
      })
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
    if (activeTab === "active") return matchesSearch && (customer.isActive === true || customer.is_active === true)
    if (activeTab === "inactive") return matchesSearch && (customer.isActive === false || customer.is_active === false)

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
          {isLoading ? (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-gray-500">Loading customers...</p>
              </CardContent>
            </Card>
          ) : filteredCustomers.length === 0 ? (
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
                    <tr key={customer.uuid} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building className="h-5 w-5 text-gray-400" />
                          <div className="font-medium">{customer.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {customer.contactName || customer.contact_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {customer.email || "—"}
                        {customer.phone && <div className="text-xs text-gray-500">{customer.phone}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            customer.isActive || customer.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {customer.isActive || customer.is_active ? "Active" : "Inactive"}
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
