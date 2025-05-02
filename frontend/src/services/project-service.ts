import apiClient from "@/lib/api-client"
import type { Project } from "@/components/project-management"

const INITIAL_PROJECTS: Project[] = []

export const projectService = {
  async getProjects(): Promise<Project[]> {
    try {
      console.log("Fetching projects from API...")
      const response = await apiClient.get("/projects/")
      console.log("Projects API response:", response.data)

      // Check if the response is an array
      if (Array.isArray(response.data)) {
        return response.data
      } else if (response.data && typeof response.data === "object" && Array.isArray(response.data.results)) {
        // Handle paginated response
        return response.data.results
      } else {
        console.warn("Unexpected projects API response format:", response.data)
        return INITIAL_PROJECTS
      }
    } catch (error) {
      console.error("Failed to load projects:", error)
      // Return initial projects as fallback
      return INITIAL_PROJECTS
    }
  },

  async getProjectById(uuid: string): Promise<Project> {
    try {
      console.log(`Fetching project with UUID: ${uuid}`)
      const response = await apiClient.get(`/projects/${uuid}/`)
      console.log("Project details response:", response.data)
      return response.data
    } catch (error) {
      console.error(`Error fetching project with UUID ${uuid}:`, error)
      throw error
    }
  },

  async createProject(projectData: Partial<Project>): Promise<Project> {
    try {
      console.log("Creating new project:", projectData)
      const response = await apiClient.post("/projects/", projectData)
      console.log("Create project response:", response.data)
      return response.data
    } catch (error) {
      console.error("Error creating project:", error)
      throw error
    }
  },

  async updateProject(uuid: string, projectData: Partial<Project>): Promise<Project> {
    try {
      if (!uuid) {
        throw new Error("Project UUID is required for update")
      }

      console.log(`Updating project with UUID: ${uuid}`, projectData)
      const response = await apiClient.put(`/projects/${uuid}/`, projectData)
      console.log("Update project response:", response.data)
      return response.data
    } catch (error) {
      console.error(`Error updating project with UUID ${uuid}:`, error)
      throw error
    }
  },

  async deleteProject(uuid: string): Promise<void> {
    try {
      console.log(`Deleting project with UUID: ${uuid}`)
      await apiClient.delete(`/projects/${uuid}/`)
      console.log("Project deleted successfully")
    } catch (error) {
      console.error(`Error deleting project with UUID ${uuid}:`, error)
      throw error
    }
  },

  // Make sure the getProjectsByCustomer function is correctly implemented
  // This function should be called when a client is selected to fetch only projects for that client

  // Verify the implementation of getProjectsByCustomer
  async getProjectsByCustomer(customerUuid: string): Promise<Project[]> {
    try {
      console.log(`Fetching projects for customer UUID: ${customerUuid}`)
      const response = await apiClient.get(`/projects/?customer=${customerUuid}`)
      console.log("Projects by customer response:", response.data)

      if (Array.isArray(response.data)) {
        return response.data
      } else if (response.data && typeof response.data === "object" && Array.isArray(response.data.results)) {
        return response.data.results
      } else {
        return []
      }
    } catch (error) {
      console.error(`Error fetching projects for customer ${customerUuid}:`, error)
      return []
    }
  },
}
