import api from "./api"
import type { TimeDetail } from "@/components/simple-timesheet"

export const timesheetDetailService = {
  async getTimesheetDetails(): Promise<TimeDetail[]> {
    const response = await api.get("/timesheet-details/")
    return response.data
  },

  async getTimesheetDetailById(uuid: string): Promise<TimeDetail> {
    const response = await api.get(`/timesheet-details/${uuid}/`)
    return response.data
  },

  async createTimesheetDetail(detailData: Partial<TimeDetail> & { timesheet: string }): Promise<TimeDetail> {
    const response = await api.post("/timesheet-details/", detailData)
    return response.data
  },

  async updateTimesheetDetail(uuid: string, detailData: Partial<TimeDetail>): Promise<TimeDetail> {
    const response = await api.put(`/timesheet-details/${uuid}/`, detailData)
    return response.data
  },

  async deleteTimesheetDetail(uuid: string): Promise<void> {
    await api.delete(`/timesheet-details/${uuid}/`)
  },

  async getDetailsByTimesheet(timesheetUuid: string): Promise<TimeDetail[]> {
    const response = await api.get(`/timesheet-details/?timesheet=${timesheetUuid}`)
    return response.data
  },
}
