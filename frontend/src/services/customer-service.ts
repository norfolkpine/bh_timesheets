import apiClient from "@/lib/api-client"
import type { Customer } from "@/components/customer-management"

const INITIAL_CUSTOMERS: Customer[] = []

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    try {
      console.log("Fetching customers from API...")
      const response = await apiClient.get("/customers/")
      console.log("Customers API response:", response.data)

      // Check if the response is an array
      if (Array.isArray(response.data)) {
        return response.data
      } else if (response.data && typeof response.data === "object" && Array.isArray(response.data.results)) {
        // Handle paginated response
        return response.data.results
      } else {
        console.warn("Unexpected customers API response format:", response.data)
        return INITIAL_CUSTOMERS
      }
    } catch (error) {
      console.error("Failed to load customers:", error)
      // Return initial customers as fallback
      return INITIAL_CUSTOMERS
    }
  },

  async getCustomerById(uuid: string): Promise<Customer> {
    try {
      console.log(`Fetching customer with UUID: ${uuid}`)
      const response = await apiClient.get(`/customers/${uuid}/`)
      console.log("Customer details response:", response.data)
      return response.data
    } catch (error) {
      console.error(`Error fetching customer with UUID ${uuid}:`, error)
      throw error
    }
  },

  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    try {
      console.log("Creating new customer:", customerData)
      const response = await apiClient.post("/customers/", customerData)
      console.log("Create customer response:", response.data)
      return response.data
    } catch (error) {
      console.error("Error creating customer:", error)
      throw error
    }
  },

  async updateCustomer(uuid: string, customerData: Partial<Customer>): Promise<Customer> {
    try {
      if (!uuid) {
        throw new Error("Customer UUID is required for update")
      }

      console.log(`Updating customer with UUID: ${uuid}`, customerData)
      const response = await apiClient.put(`/customers/${uuid}/`, customerData)
      console.log("Update customer response:", response.data)
      return response.data
    } catch (error) {
      console.error(`Error updating customer with UUID ${uuid}:`, error)
      throw error
    }
  },

  async deleteCustomer(uuid: string): Promise<void> {
    try {
      console.log(`Deleting customer with UUID: ${uuid}`)
      await apiClient.delete(`/customers/${uuid}/`)
      console.log("Customer deleted successfully")
    } catch (error) {
      console.error(`Error deleting customer with UUID ${uuid}:`, error)
      throw error
    }
  },

  async getCustomerProjects(uuid: string): Promise<any[]> {
    const response = await apiClient.get(`/customers/${uuid}/projects/`)
    return response.data
  },
}
