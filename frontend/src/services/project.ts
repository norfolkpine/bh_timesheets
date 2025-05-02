import api from "./api"
import type { Project } from "@/components/project-management"

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const response = await api.get("/projects/")
    return response.data
  },

  async getProjectById(uuid: string): Promise<Project> {
    const response = await api.get(`/projects/${uuid}/`)
    return response.data
  },

  async createProject(projectData: Partial<Project>): Promise<Project> {
    const response = await api.post("/projects/", projectData)
    return response.data
  },

  async updateProject(uuid: string, projectData: Partial<Project>): Promise<Project> {
    const response = await api.put(`/projects/${uuid}/`, projectData)
    return response.data
  },

  async deleteProject(uuid: string): Promise<void> {
    await api.delete(`/projects/${uuid}/`)
  },

  async getProjectsByCustomer(customerUuid: string): Promise<Project[]> {
    const response = await api.get(`/projects/?customer=${customerUuid}`)
    return response.data
  },
}
