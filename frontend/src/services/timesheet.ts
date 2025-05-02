import { api } from '@/services/api'

export interface BackendTimeDetail {
  day: number
  date: string
  hours: number
  use_detailed_time: boolean
  start_time?: string
  end_time?: string
  break_minutes?: number
  note?: string
}

export interface BackendTimesheet {
  uuid: string
  user: {
    name: string
  }
  project: {
    uuid: string
    name: string
    customer: {
      name: string
    }
  }
  week_starting: string
  total_hours: number
  status: string
  details: BackendTimeDetail[]
  notes?: string
  submitted_at?: string
  approved_at?: string
  approved_by?: {
    name: string
  }
  rejection_reason?: string
  sent_for_payment_at?: string
  sent_for_payment_by?: {
    name: string
  }
  paid_at?: string
  paid_by?: {
    name: string
  }
}

export interface FrontendTimeDetail {
  day: string
  date: Date
  hours: number
  useDetailedTime: boolean
  startTime?: string
  endTime?: string
  breakDuration?: number
  note?: string
}

export interface FrontendTimesheet {
  id: string
  uuid?: string
  weekStarting: Date
  client: string
  location: string
  status: string
  hours: number[]
  timeDetails: FrontendTimeDetail[]
  dayNotes: string[]
  notes: string
  submittedBy: string
  project: {
    uuid: string
  }
  submittedAt?: Date
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string
  sentForPaymentAt?: Date
  sentForPaymentBy?: string
  paidAt?: Date
  paidBy?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

class TimesheetService {
  private getAuthHeaders() {
    return {
      withCredentials: true,  // Important for cookies
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    };
  }

  // Helper function to convert backend response to frontend format
  convertToFrontendFormat(timesheet: BackendTimesheet): FrontendTimesheet {
    return {
      id: timesheet.uuid,
      uuid: timesheet.uuid,
      weekStarting: new Date(timesheet.week_starting),
      client: timesheet.project.customer.name,
      location: timesheet.project.name,
      status: timesheet.status,
      hours: timesheet.details.map(d => d.hours || 0),
      timeDetails: timesheet.details.map(d => ({
        day: d.day.toString(),
        date: new Date(d.date),
        hours: d.hours || 0,
        useDetailedTime: d.use_detailed_time,
        startTime: d.start_time,
        endTime: d.end_time,
        breakDuration: d.break_minutes,
        note: d.note
      })),
      dayNotes: timesheet.details.map(d => d.note || ''),
      notes: timesheet.notes || '',
      submittedBy: timesheet.user.name,
      project: {
        uuid: timesheet.project.uuid
      },
      submittedAt: timesheet.submitted_at ? new Date(timesheet.submitted_at) : undefined,
      approvedBy: timesheet.approved_by?.name,
      approvedAt: timesheet.approved_at ? new Date(timesheet.approved_at) : undefined,
      rejectionReason: timesheet.rejection_reason,
      sentForPaymentAt: timesheet.sent_for_payment_at ? new Date(timesheet.sent_for_payment_at) : undefined,
      sentForPaymentBy: timesheet.sent_for_payment_by?.name,
      paidAt: timesheet.paid_at ? new Date(timesheet.paid_at) : undefined,
      paidBy: timesheet.paid_by?.name
    }
  }

  // Helper function to convert frontend format to backend format
  convertToBackendFormat(timesheet: FrontendTimesheet) {
    return {
      week_starting: timesheet.weekStarting.toISOString().split('T')[0],
      project_uuid: timesheet.project.uuid,
      details_data: timesheet.timeDetails.map((detail, index) => ({
        day: parseInt(detail.day),
        date: detail.date.toISOString().split('T')[0],
        hours: timesheet.hours[index] || 0,
        start_time: detail.startTime,
        end_time: detail.endTime,
        break_minutes: detail.breakDuration,
        use_detailed_time: detail.useDetailedTime,
        note: detail.note || timesheet.dayNotes[index] || ''
      })),
      notes: timesheet.notes
    }
  }

  async getTimesheets(): Promise<FrontendTimesheet[]> {
    const response = await api.get('/api/timesheets/')
    const data = response.data as PaginatedResponse<BackendTimesheet>
    return data.results.map(timesheet => this.convertToFrontendFormat(timesheet))
  }

  async getTimesheet(id: string): Promise<FrontendTimesheet> {
    const response = await api.get(`/api/timesheets/${id}/`)
    const data = response.data as BackendTimesheet
    return this.convertToFrontendFormat(data)
  }

  async createTimesheet(data: ReturnType<TimesheetService['convertToBackendFormat']>): Promise<FrontendTimesheet> {
    const response = await api.post('/api/timesheets/', data)
    const responseData = response.data as BackendTimesheet
    return this.convertToFrontendFormat(responseData)
  }

  async updateTimesheet(id: string, data: ReturnType<TimesheetService['convertToBackendFormat']>): Promise<FrontendTimesheet> {
    const response = await api.put(`/api/timesheets/${id}/`, data)
    const responseData = response.data as BackendTimesheet
    return this.convertToFrontendFormat(responseData)
  }

  async deleteTimesheet(id: string): Promise<void> {
    await api.delete(`/api/timesheets/${id}/`);
  }

  async submitTimesheet(id: string): Promise<FrontendTimesheet> {
    const response = await api.post(`/api/timesheets/${id}/submit/`)
    const data = response.data as BackendTimesheet
    return this.convertToFrontendFormat(data)
  }

  async approveTimesheet(id: string): Promise<FrontendTimesheet> {
    const response = await api.post(`/api/timesheets/${id}/approve/`)
    const data = response.data as BackendTimesheet
    return this.convertToFrontendFormat(data)
  }

  async rejectTimesheet(id: string, reason: string): Promise<FrontendTimesheet> {
    const response = await api.post(`/api/timesheets/${id}/reject/`, { reason })
    const data = response.data as BackendTimesheet
    return this.convertToFrontendFormat(data)
  }

  async markAsPaid(id: string): Promise<FrontendTimesheet> {
    const response = await api.post(`/api/timesheets/${id}/mark-as-paid/`)
    const data = response.data as BackendTimesheet
    return this.convertToFrontendFormat(data)
  }

  async sendForPayment(id: string): Promise<FrontendTimesheet> {
    const response = await api.post(`/api/timesheets/${id}/send-for-payment/`)
    const data = response.data as BackendTimesheet
    return this.convertToFrontendFormat(data)
  }

  async undoApproval(id: string): Promise<FrontendTimesheet> {
    const response = await api.post(`/api/timesheets/${id}/undo-approval/`)
    const data = response.data as BackendTimesheet
    return this.convertToFrontendFormat(data)
  }
}

export const timesheetService = new TimesheetService() 