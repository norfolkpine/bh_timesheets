"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProjectForm } from "./project-form"
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
import type { Customer } from "./customer-management"
import { projectService } from "@/services/project-service"
import { customerService } from "@/services/customer-service"
import { useToast } from "@/hooks/use-toast"

export type Project = {
  id?: string
  uuid: string
  name: string
  customerId?: string
  customer?: string
  customer_uuid?: string
  description?: string
  billingType?: "hourly" | "daily" | "fixed" | "retainer"
  billing_type?: string
  hourlyRate?: number
  hourly_rate?: number
  dailyRate?: number
  daily_rate?: number
  fixedPrice?: number
  fixed_price?: number
  retainerAmount?: number
  retainer_amount?: number
  isActive?: boolean
  is_active?: boolean
  createdAt?: Date
  updatedAt?: Date
  customer_object?: {
    uuid: string
    name: string
    email?: string
    phone?: string
    contact_name?: string
    address?: string
    notes?: string
    is_active?: boolean
  }
}

// Sample projects for demonstration
export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj1",
    uuid: "project-uuid-1",
    name: "Website Redesign",
    customerId: "cust1",
    description: "Redesign the company website for a modern look and improved user experience.",
    billingType: "hourly",
    hourlyRate: 75.0,
    isActive: true,
  },
  {
    id: "proj2",
    uuid: "project-uuid-2",
    name: "Mobile App Development",
    customerId: "cust2",
    description: "Develop a mobile app for iOS and Android platforms.",
    billingType: "fixed",
    fixedPrice: 15000.0,
    isActive: true,
  },
  {
    id: "proj3",
    uuid: "project-uuid-3",
    name: "Marketing Campaign",
    customerId: "cust3",
    description: "Run a marketing campaign to increase brand awareness.",
    billingType: "retainer",
    retainerAmount: 2000.0,
    isActive: false,
  },
]

export function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isAddingProject, setIsAddingProject] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load both projects and customers
      const [projectsData, customersData] = await Promise.all([
        projectService.getProjects(),
        customerService.getCustomers(),
      ])

      console.log("Projects loaded:", projectsData)
      console.log("Customers loaded:", customersData)

      // Always ensure we have arrays
      setProjects(Array.isArray(projectsData) ? projectsData : INITIAL_PROJECTS)
      setCustomers(Array.isArray(customersData) ? customersData : [])

      if (!Array.isArray(projectsData)) {
        console.warn("Project data is not an array, using initial projects instead")
        toast({
          title: "Warning",
          description: "Could not load projects from server. Using default data instead.",
          variant: "warning",
        })
      }
    } catch (error) {
      console.error("Failed to load data:", error)
      // Fall back to initial data if API calls fail
      setProjects(INITIAL_PROJECTS)
      setCustomers([])
      toast({
        title: "Error",
        description: "Failed to load data. Using default data instead.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProject = () => {
    setIsAddingProject(true)
    setEditingProject(null)
  }

  const handleEditProject = async (project: Project) => {
    try {
      setIsLoading(true)
      // Fetch the full project details by UUID
      const projectDetails = await projectService.getProjectById(project.uuid)
      console.log("Fetched project details:", projectDetails)

      // Create a properly formatted project object for the form
      const customerUuid =
        projectDetails.customer?.uuid || projectDetails.customer || projectDetails.customer_uuid || ""

      const projectToEdit = {
        uuid: projectDetails.uuid,
        name: projectDetails.name || "",
        customerId: customerUuid,
        customer_uuid: customerUuid,
        customer_object: projectDetails.customer,
        description: projectDetails.description || "",
        billingType: projectDetails.billing_type || "hourly",
        billing_type: projectDetails.billing_type || "hourly",
        hourlyRate: projectDetails.hourly_rate,
        hourly_rate: projectDetails.hourly_rate,
        dailyRate: projectDetails.daily_rate,
        daily_rate: projectDetails.daily_rate,
        fixedPrice: projectDetails.fixed_price,
        fixed_price: projectDetails.fixed_price,
        retainerAmount: projectDetails.retainer_amount,
        retainer_amount: projectDetails.retainer_amount,
        isActive: projectDetails.is_active !== undefined ? projectDetails.is_active : true,
        is_active: projectDetails.is_active !== undefined ? projectDetails.is_active : true,
      }

      console.log("Formatted project for editing:", projectToEdit)
      setEditingProject(projectToEdit)
      setIsAddingProject(false)
    } catch (error) {
      console.error("Failed to fetch project details:", error)
      toast({
        title: "Error",
        description: "Failed to load project details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (projectToDelete) {
      try {
        await projectService.deleteProject(projectToDelete.uuid)
        // Refresh the project list instead of filtering locally
        await loadData()
        toast({
          title: "Success",
          description: "Project deleted successfully",
        })
      } catch (error) {
        console.error("Failed to delete project:", error)
        toast({
          title: "Error",
          description: "Failed to delete project. Please try again.",
          variant: "destructive",
        })
      } finally {
        setDeleteDialogOpen(false)
        setProjectToDelete(null)
      }
    }
  }

  const handleSaveProject = async (projectData: any) => {
    try {
      // Format the data for the API
      const apiProjectData = {
        name: projectData.name,
        customer_uuid: projectData.customerId, // API expects 'customer_uuid' field
        description: projectData.description,
        billing_type: projectData.billingType,
        hourly_rate: projectData.billingType === "hourly" ? projectData.hourlyRate : null,
        daily_rate: projectData.billingType === "daily" ? projectData.dailyRate : null,
        fixed_price: projectData.billingType === "fixed" ? projectData.fixedPrice : null,
        retainer_amount: projectData.billingType === "retainer" ? projectData.retainerAmount : null,
        is_active: projectData.isActive,
      }

      if (editingProject) {
        // Update existing project
        await projectService.updateProject(editingProject.uuid, apiProjectData)
      } else {
        // Add new project
        await projectService.createProject(apiProjectData)
      }

      // Refresh the project list
      await loadData()

      setEditingProject(null)
      setIsAddingProject(false)

      toast({
        title: "Success",
        description: editingProject ? "Project updated successfully" : "Project created successfully",
      })
    } catch (error) {
      console.error("Failed to save project:", error)
      toast({
        title: "Error",
        description: "Failed to save project. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCancelProjectForm = () => {
    setIsAddingProject(false)
    setEditingProject(null)
  }

  const getCustomerName = (customerId: string | any): string => {
    // If customerId is actually a customer object
    if (customerId && typeof customerId === "object" && customerId.name) {
      return customerId.name
    }

    // If customerId is a string (UUID)
    const customer = customers.find((c) => c.id === customerId || c.uuid === customerId)

    return customer ? customer.name : "Unknown Customer"
  }

  // Get billing rate display
  const getBillingRateDisplay = (project: Project) => {
    const billingType = project.billingType || project.billing_type

    switch (billingType) {
      case "hourly": {
        const rate = project.hourlyRate || project.hourly_rate
        return rate ? `$${Number(rate).toFixed(2)}/hr` : "—"
      }
      case "daily": {
        const rate = project.dailyRate || project.daily_rate
        return rate ? `$${Number(rate).toFixed(2)}/day` : "—"
      }
      case "fixed": {
        const price = project.fixedPrice || project.fixed_price
        return price ? `$${Number(price).toFixed(2)} fixed` : "—"
      }
      case "retainer": {
        const amount = project.retainerAmount || project.retainer_amount
        return amount ? `$${Number(amount).toFixed(2)}/month` : "—"
      }
      default:
        return "—"
    }
  }

  // Filter projects based on search query and active tab
  const filteredProjects = Array.isArray(projects)
    ? projects.filter((project) => {
        const matchesSearch =
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          getCustomerName(project.customerId || project.customer || project.customer_uuid || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (project.description || "").toLowerCase().includes(searchQuery.toLowerCase())

        const isProjectActive = project.isActive || project.is_active
        const projectBillingType = project.billingType || project.billing_type

        if (activeTab === "all") return matchesSearch
        if (activeTab === "active") return matchesSearch && isProjectActive
        if (activeTab === "inactive") return matchesSearch && !isProjectActive
        if (activeTab === "hourly") return matchesSearch && projectBillingType === "hourly"
        if (activeTab === "daily") return matchesSearch && projectBillingType === "daily"
        if (activeTab === "fixed") return matchesSearch && projectBillingType === "fixed"
        if (activeTab === "retainer") return matchesSearch && projectBillingType === "retainer"

        return matchesSearch
      })
    : []

  // If we're adding or editing a project, show the form
  if (isAddingProject || editingProject) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {editingProject ? `Edit Project: ${editingProject.name}` : "Add New Project"}
          </h2>
          <Button variant="outline" onClick={handleCancelProjectForm}>
            Back to Project List
          </Button>
        </div>

        <ProjectForm
          onSave={handleSaveProject}
          onCancel={handleCancelProjectForm}
          initialProject={editingProject || undefined}
          customers={customers}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Project Management</h2>
        <Button onClick={handleAddProject}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Project
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="hourly">Hourly</TabsTrigger>
          <TabsTrigger value="daily">Day Rate</TabsTrigger>
          <TabsTrigger value="fixed">Fixed Price</TabsTrigger>
          <TabsTrigger value="retainer">Retainer</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-gray-500">Loading projects...</p>
              </CardContent>
            </Card>
          ) : filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-gray-500">No projects found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Project</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Billing Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Rate/Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.uuid} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-gray-400" />
                          <div className="font-medium">{project.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {getCustomerName(project.customerId || project.customer || project.customer_uuid || "")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            (project.billingType || project.billing_type) === "hourly"
                              ? "bg-blue-100 text-blue-800"
                              : (project.billingType || project.billing_type) === "daily"
                                ? "bg-purple-100 text-purple-800"
                                : (project.billingType || project.billing_type) === "fixed"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-100 text-green-800"
                          }
                        >
                          {(project.billingType || project.billing_type) === "hourly"
                            ? "Hourly"
                            : (project.billingType || project.billing_type) === "daily"
                              ? "Day Rate"
                              : (project.billingType || project.billing_type) === "fixed"
                                ? "Fixed Price"
                                : "Retainer"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{getBillingRateDisplay(project)}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            project.isActive || project.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {project.isActive || project.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditProject(project)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(project)}
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
              Are you sure you want to delete the project "{projectToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
