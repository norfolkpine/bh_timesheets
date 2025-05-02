"\"use client"

import { useState } from "react"
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
import { type Customer, INITIAL_CUSTOMERS } from "./customer-management"

export type Project = {
  id: string
  name: string
  customerId: string
  description?: string
  billingType: "hourly" | "daily" | "fixed" | "retainer"
  hourlyRate?: number
  dailyRate?: number
  fixedPrice?: number
  retainerAmount?: number
  isActive: boolean
  createdAt: Date
  updatedAt?: Date
}

// Sample projects for demonstration
export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj1",
    name: "Website Redesign",
    customerId: "cust1",
    description: "Complete overhaul of the corporate website with new branding",
    billingType: "hourly",
    hourlyRate: 85,
    isActive: true,
    createdAt: new Date(2023, 2, 1),
  },
  {
    id: "proj2",
    name: "Mobile App Development",
    customerId: "cust1",
    description: "iOS and Android app for customer engagement",
    billingType: "fixed",
    fixedPrice: 25000,
    isActive: true,
    createdAt: new Date(2023, 3, 15),
  },
  {
    id: "proj3",
    name: "IT Support",
    customerId: "cust2",
    description: "Ongoing technical support and maintenance",
    billingType: "retainer",
    retainerAmount: 2000,
    isActive: true,
    createdAt: new Date(2023, 0, 1),
  },
  {
    id: "proj4",
    name: "Database Migration",
    customerId: "cust3",
    description: "Migrate from legacy system to cloud database",
    billingType: "daily",
    dailyRate: 600,
    isActive: false,
    createdAt: new Date(2023, 1, 15),
    updatedAt: new Date(2023, 3, 30),
  },
]

export function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS)
  const [customers] = useState<Customer[]>(INITIAL_CUSTOMERS)
  const [isAddingProject, setIsAddingProject] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const handleAddProject = () => {
    setIsAddingProject(true)
    setEditingProject(null)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setIsAddingProject(false)
  }

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (projectToDelete) {
      setProjects(projects.filter((p) => p.id !== projectToDelete.id))
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
    }
  }

  const handleSaveProject = (projectData: any) => {
    if (editingProject) {
      // Update existing project
      setProjects(
        projects.map((project) =>
          project.id === editingProject.id
            ? {
                ...project,
                ...projectData,
                updatedAt: new Date(),
              }
            : project,
        ),
      )
      setEditingProject(null)
    } else {
      // Add new project
      const newProject: Project = {
        id: `proj${projects.length + 1}`,
        ...projectData,
        isActive: projectData.isActive !== undefined ? projectData.isActive : true,
        createdAt: new Date(),
      }
      setProjects([...projects, newProject])
      setIsAddingProject(false)
    }
  }

  const handleCancelProjectForm = () => {
    setIsAddingProject(false)
    setEditingProject(null)
  }

  // Get customer name by ID
  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    return customer ? customer.name : "Unknown Customer"
  }

  // Get billing rate display
  const getBillingRateDisplay = (project: Project) => {
    switch (project.billingType) {
      case "hourly":
        return project.hourlyRate ? `$${project.hourlyRate.toFixed(2)}/hr` : "—"
      case "daily":
        return project.dailyRate ? `$${project.dailyRate.toFixed(2)}/day` : "—"
      case "fixed":
        return project.fixedPrice ? `$${project.fixedPrice.toFixed(2)} fixed` : "—"
      case "retainer":
        return project.retainerAmount ? `$${project.retainerAmount.toFixed(2)}/month` : "—"
      default:
        return "—"
    }
  }

  // Filter projects based on search query and active tab
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCustomerName(project.customerId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "active") return matchesSearch && project.isActive
    if (activeTab === "inactive") return matchesSearch && !project.isActive
    if (activeTab === "hourly") return matchesSearch && project.billingType === "hourly"
    if (activeTab === "daily") return matchesSearch && project.billingType === "daily"
    if (activeTab === "fixed") return matchesSearch && project.billingType === "fixed"
    if (activeTab === "retainer") return matchesSearch && project.billingType === "retainer"

    return matchesSearch
  })

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
          {filteredProjects.length === 0 ? (
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
                    <tr key={project.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-gray-400" />
                          <div className="font-medium">{project.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{getCustomerName(project.customerId)}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            project.billingType === "hourly"
                              ? "bg-blue-100 text-blue-800"
                              : project.billingType === "daily"
                                ? "bg-purple-100 text-purple-800"
                                : project.billingType === "fixed"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-100 text-green-800"
                          }
                        >
                          {project.billingType === "hourly"
                            ? "Hourly"
                            : project.billingType === "daily"
                              ? "Day Rate"
                              : project.billingType === "fixed"
                                ? "Fixed Price"
                                : "Retainer"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{getBillingRateDisplay(project)}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={project.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {project.isActive ? "Active" : "Inactive"}
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
