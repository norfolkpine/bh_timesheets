import apiClient from "@/lib/api-client"
import type { ExtendedUser } from "@/components/user-management"

export const userService = {
  async getUsers(): Promise<ExtendedUser[]> {
    const response = await apiClient.get("/users/")
    return response.data
  },

  async getUserById(id: string): Promise<ExtendedUser> {
    const response = await apiClient.get(`/users/${id}/`)
    return response.data
  },

  async createUser(userData: Partial<ExtendedUser>): Promise<ExtendedUser> {
    const response = await apiClient.post("/users/", userData)
    return response.data
  },

  async updateUser(id: string, userData: Partial<ExtendedUser>): Promise<ExtendedUser> {
    const response = await apiClient.put(`/users/${id}/`, userData)
    return response.data
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}/`)
  },

  async getUserTimesheets(id: string): Promise<any[]> {
    const response = await apiClient.get(`/users/${id}/timesheets/`)
    return response.data
  },

  async getUserSummary(id: string): Promise<any> {
    const response = await apiClient.get(`/users/${id}/summary/`)
    return response.data
  },
}
