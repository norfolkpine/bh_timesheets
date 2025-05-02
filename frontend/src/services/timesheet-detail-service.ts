import apiClient from "@/lib/api-client"
import type { TimeDetail } from "@/components/simple-timesheet"

export const timesheetDetailService = {
  async getTimesheetDetails(): Promise<TimeDetail[]> {
    const response = await apiClient.get("/timesheet-details/")
    return response.data
  },

  async getTimesheetDetailById(uuid: string): Promise<TimeDetail> {
    const response = await apiClient.get(`/timesheet-details/${uuid}/`)
    return response.data
  },

  async createTimesheetDetail(detailData: Partial<TimeDetail> & { timesheet: string }): Promise<TimeDetail> {
    const response = await apiClient.post("/timesheet-details/", detailData)
    return response.data
  },

  async updateTimesheetDetail(uuid: string, detailData: Partial<TimeDetail>): Promise<TimeDetail> {
    const response = await apiClient.put(`/timesheet-details/${uuid}/`, detailData)
    return response.data
  },

  async deleteTimesheetDetail(uuid: string): Promise<void> {
    await apiClient.delete(`/timesheet-details/${uuid}/`)
  },

  async getDetailsByTimesheet(timesheetUuid: string): Promise<TimeDetail[]> {
    const response = await apiClient.get(`/timesheet-details/?timesheet=${timesheetUuid}`)
    return response.data
  },
}
