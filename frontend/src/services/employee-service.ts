import apiClient from "@/lib/api-client"

export interface EmployeeProfile {
  uuid: string
  email: string
  first_name: string
  last_name: string
  role: "employee" | "manager"
  employee_id: string
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
  created_at: string
  updated_at?: string
  name?: string
}

export interface EmployeeFormData {
  first_name: string
  last_name: string
  email: string
  role: "employee" | "manager"
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

export const employeeService = {
  async getEmployees(): Promise<EmployeeProfile[]> {
    try {
      const response = await apiClient.get("/employees/")
      return Array.isArray(response.data) ? response.data : response.data.results || []
    } catch (error) {
      console.error("Failed to load employees:", error)
      throw error
    }
  },

  async getEmployeeById(uuid: string): Promise<EmployeeProfile> {
    try {
      const response = await apiClient.get(`/employees/${uuid}/`)
      return response.data
    } catch (error) {
      console.error(`Error fetching employee with UUID ${uuid}:`, error)
      throw error
    }
  },

  async getCurrentEmployee(): Promise<EmployeeProfile> {
    try {
      const response = await apiClient.get("/employees/me/")
      return response.data
    } catch (error) {
      console.error("Error fetching current employee profile:", error)
      throw error
    }
  },

  async createEmployee(employeeData: EmployeeFormData): Promise<EmployeeProfile> {
    try {
      const response = await apiClient.post("/employees/", employeeData)
      return response.data
    } catch (error) {
      console.error("Error creating employee:", error)
      throw error
    }
  },

  async updateEmployee(uuid: string, employeeData: Partial<EmployeeFormData>): Promise<EmployeeProfile> {
    try {
      const response = await apiClient.put(`/employees/${uuid}/`, employeeData)
      return response.data
    } catch (error) {
      console.error(`Error updating employee with UUID ${uuid}:`, error)
      throw error
    }
  },

  async patchEmployee(uuid: string, employeeData: Partial<EmployeeFormData>): Promise<EmployeeProfile> {
    try {
      const response = await apiClient.patch(`/employees/${uuid}/`, employeeData)
      return response.data
    } catch (error) {
      console.error(`Error patching employee with UUID ${uuid}:`, error)
      throw error
    }
  },

  async deleteEmployee(uuid: string): Promise<void> {
    try {
      await apiClient.delete(`/employees/${uuid}/`)
    } catch (error) {
      console.error(`Error deleting employee with UUID ${uuid}:`, error)
      throw error
    }
  },
}
