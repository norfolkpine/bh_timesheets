import apiClient from "@/lib/api-client"
import type { Timesheet } from "@/components/simple-timesheet"

export const timesheetService = {
  // Helper function to extract data from paginated responses
  extractData<T>(response: any): T[] {
    // If response has results property (paginated response)
    if (response && typeof response === "object" && response.results && Array.isArray(response.results)) {
      return response.results
    }

    // If response is already an array
    if (Array.isArray(response)) {
      return response
    }

    // Default to empty array
    console.warn("Unexpected API response format:", response)
    return []
  },

  async getTimesheets(): Promise<Timesheet[]> {
    try {
      const response = await apiClient.get("/timesheets/")
      console.log("Timesheets API response:", response)
      const data = this.extractData<any>(response.data)
      return data.map((ts) => this.mapApiResponseToTimesheet(ts))
    } catch (error) {
      console.error("Error fetching timesheets:", error)
      return []
    }
  },

  async getTimesheetById(uuid: string): Promise<Timesheet> {
    if (!uuid) {
      throw new Error("Invalid timesheet ID: ID cannot be empty or undefined")
    }

    try {
      console.log(`Fetching timesheet with UUID: ${uuid}`)
      const response = await apiClient.get(`/timesheets/${uuid}/`)
      console.log("Timesheet details response:", response.data)
      return this.mapApiResponseToTimesheet(response.data)
    } catch (error) {
      console.error(`Error fetching timesheet with UUID ${uuid}:`, error)
      throw error
    }
  },

  async createTimesheet(timesheetData: Partial<Timesheet>): Promise<Timesheet> {
    // Format the data according to what the serializer expects
    const formattedData = {
      // Format date as YYYY-MM-DD string
      week_starting:
        timesheetData.weekStarting instanceof Date
          ? timesheetData.weekStarting.toISOString().split("T")[0]
          : timesheetData.weekStarting,
      project_uuid: timesheetData.location || null, // Allow null for initial creation
      status: timesheetData.status || "draft",
      notes: timesheetData.notes || "",
      details_data:
        timesheetData.timeDetails
          ?.map((detail, index) => {
            // Only include time fields if useDetailedTime is true
            const timeFields = detail?.useDetailedTime
              ? {
                  start_time: detail?.startTime || null,
                  end_time: detail?.endTime || null,
                  break_minutes: detail?.breakMinutes || 0,
                }
              : {
                  start_time: null,
                  end_time: null,
                  break_minutes: 0,
                }

            return {
              day: index, // Changed from day_index to day to match backend model
              hours: timesheetData.hours?.[index] || 0,
              note: timesheetData.dayNotes?.[index] || "", // Changed from notes to note to match backend model
              use_detailed_time: detail?.useDetailedTime || false,
              ...timeFields,
            }
          })
          .filter((detail) => detail !== null) || [],
    }

    console.log("Creating timesheet with data:", formattedData)

    try {
      const response = await apiClient.post("/timesheets/", formattedData)
      console.log("Create timesheet response:", response.data)
      return this.mapApiResponseToTimesheet(response.data)
    } catch (error) {
      console.error("Error creating timesheet:", error)
      if (error.response) {
        console.error("Response data:", error.response.data)
        console.error("Response status:", error.response.status)
      }
      throw error
    }
  },

  async updateTimesheet(uuid: string, timesheetData: Partial<Timesheet>): Promise<Timesheet> {
    // Format the data according to what the serializer expects
    const formattedData = {
      // Format date as YYYY-MM-DD string
      week_starting:
        timesheetData.weekStarting instanceof Date
          ? timesheetData.weekStarting.toISOString().split("T")[0]
          : timesheetData.weekStarting,
      project_uuid: timesheetData.location || null, // Allow null for drafts
      status: timesheetData.status,
      notes: timesheetData.notes || "",
      details_data: Array.isArray(timesheetData.timeDetails)
        ? timesheetData.timeDetails
            .map((detail, index) => {
              // Only include time fields if useDetailedTime is true
              const timeFields = detail?.useDetailedTime
                ? {
                    start_time: detail?.startTime || null,
                    end_time: detail?.endTime || null,
                    break_minutes: detail?.breakMinutes || 0,
                  }
                : {
                    start_time: null,
                    end_time: null,
                    break_minutes: 0,
                  }

              return {
                day: index, // Changed from day_index to day to match backend model
                hours: Array.isArray(timesheetData.hours) ? timesheetData.hours[index] || 0 : 0,
                note: Array.isArray(timesheetData.dayNotes) ? timesheetData.dayNotes[index] || "" : "", // Changed from notes to note to match backend model
                use_detailed_time: detail?.useDetailedTime || false,
                ...timeFields,
              }
            })
            .filter((detail) => detail !== null)
        : [],
    }

    console.log("Updating timesheet with data:", formattedData)

    try {
      const response = await apiClient.put(`/timesheets/${uuid}/`, formattedData)
      console.log("Update timesheet response:", response.data)
      return this.mapApiResponseToTimesheet(response.data)
    } catch (error) {
      console.error("Error updating timesheet:", error)
      if (error.response) {
        console.error("Response data:", error.response.data)
        console.error("Response status:", error.response.status)
      }
      throw error
    }
  },

  async deleteTimesheet(uuid: string): Promise<void> {
    await apiClient.delete(`/timesheets/${uuid}/`)
  },

  async submitTimesheet(uuid: string): Promise<Timesheet> {
    const response = await apiClient.post(`/timesheets/${uuid}/submit/`)
    return this.mapApiResponseToTimesheet(response.data)
  },

  async approveTimesheet(uuid: string): Promise<Timesheet> {
    const response = await apiClient.post(`/timesheets/${uuid}/approve/`)
    return this.mapApiResponseToTimesheet(response.data)
  },

  async rejectTimesheet(uuid: string, reason: string): Promise<Timesheet> {
    const response = await apiClient.post(`/timesheets/${uuid}/reject/`, { reason })
    return this.mapApiResponseToTimesheet(response.data)
  },

  async sendForPayment(uuid: string): Promise<Timesheet> {
    const response = await apiClient.post(`/timesheets/${uuid}/send_for_payment/`)
    return this.mapApiResponseToTimesheet(response.data)
  },

  async markAsPaid(uuid: string): Promise<Timesheet> {
    const response = await apiClient.post(`/timesheets/${uuid}/mark_as_paid/`)
    return this.mapApiResponseToTimesheet(response.data)
  },

  async undoApproval(uuid: string): Promise<Timesheet> {
    const response = await apiClient.post(`/timesheets/${uuid}/undo_approval/`)
    return this.mapApiResponseToTimesheet(response.data)
  },

  async getTimesheetDetails(uuid: string): Promise<any[]> {
    const response = await apiClient.get(`/timesheets/${uuid}/details/`)
    return response.data
  },

  async getTimesheetInvoice(uuid: string): Promise<any> {
    const response = await apiClient.get(`/timesheets/${uuid}/invoice/`)
    return response.data
  },

  // Add a helper method to map API response to our frontend Timesheet model
  mapApiResponseToTimesheet(data: any): Timesheet {
    if (!data) {
      console.warn("Received null or undefined data in mapApiResponseToTimesheet")
      return {
        id: "",
        weekStarting: new Date(),
        client: "",
        location: "",
        status: "draft",
        hours: Array(7).fill(0),
        timeDetails: Array(7).fill({ useDetailedTime: false }),
        dayNotes: Array(7).fill(""),
        notes: "",
        submittedBy: "",
        totalHours: 0,
        totalAmount: 0,
      }
    }

    // Map details to our frontend model
    const details = Array.isArray(data.details) ? data.details : []
    const hours = Array(7).fill(0)
    const timeDetails = Array(7).fill({ useDetailedTime: false })
    const dayNotes = Array(7).fill("")

    // Fill in the details if they exist
    details.forEach((detail) => {
      const dayIndex = detail.day
      if (dayIndex >= 0 && dayIndex < 7) {
        // Ensure hours is a valid number
        hours[dayIndex] = typeof detail.hours === "number" ? detail.hours : Number.parseFloat(detail.hours) || 0
        timeDetails[dayIndex] = {
          useDetailedTime: detail.use_detailed_time || false,
          startTime: detail.start_time || "",
          endTime: detail.end_time || "",
          breakMinutes: detail.break_minutes || 0,
        }
        dayNotes[dayIndex] = detail.note || ""
      }
    })

    // Get client name instead of UUID when available
    const clientName = data.project?.customer?.name || ""
    const clientUuid = data.project?.customer?.uuid || ""

    // Get project name instead of UUID when available
    const projectName = data.project?.name || ""
    const projectUuid = data.project?.uuid || ""

    // Get total hours from API response or calculate it
    const totalHours = data.total_hours
      ? Number.parseFloat(data.total_hours)
      : hours.reduce((sum, hour) => sum + (typeof hour === "number" ? hour : Number.parseFloat(hour) || 0), 0)

    // Get total amount from API response
    const totalAmount = data.total_amount ? Number.parseFloat(data.total_amount) : 0

    return {
      id: data.uuid || "",
      weekStarting: data.week_starting ? new Date(data.week_starting) : new Date(),
      client: clientUuid, // Keep the UUID for client
      clientName: clientName, // Add the client name for display
      location: projectUuid, // Keep the UUID for location/project
      projectName: projectName, // Add the project name for display
      status: data.status || "draft",
      hours,
      timeDetails,
      dayNotes,
      notes: data.notes || "",
      submittedBy: data.user?.name || data.user?.email || "",
      submittedAt: data.submitted_at ? new Date(data.submitted_at) : undefined,
      approvedBy: data.approved_by?.name || data.approved_by?.email || "",
      approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
      rejectionReason: data.rejection_reason,
      sentForPaymentAt: data.sent_for_payment_at ? new Date(data.sent_for_payment_at) : undefined,
      sentForPaymentBy: data.sent_for_payment_by?.name || data.sent_for_payment_by?.email || "",
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      paidBy: data.paid_by?.name || data.paid_by?.email || "",
      totalHours,
      totalAmount,
      hourlyRate: data.hourly_rate_at_submission ? Number.parseFloat(data.hourly_rate_at_submission) : null,
      dailyRate: data.daily_rate_at_submission ? Number.parseFloat(data.daily_rate_at_submission) : null,
      fixedPrice: data.fixed_price_at_submission ? Number.parseFloat(data.fixed_price_at_submission) : null,
      retainerAmount: data.retainer_amount_at_submission ? Number.parseFloat(data.retainer_amount_at_submission) : null,
    }
  },
}
