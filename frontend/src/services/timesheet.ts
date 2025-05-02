import { api } from './api';
import type { Timesheet, TimesheetResponse, PaginatedResponse } from '@/types/timesheet';
import { format } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface TimesheetCreate {
  week_starting: string;
  project_uuid: string;
  details_data: {
    day: number;
    hours: number;
    note?: string;
  }[];
}

export interface TimesheetUpdate extends Partial<TimesheetCreate> {}

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

  async getTimesheets(): Promise<PaginatedResponse<TimesheetResponse>> {
    const response = await api.get('/api/timesheets/');
    return response.data;
  }

  async getTimesheet(id: string): Promise<TimesheetResponse> {
    const response = await api.get(`/api/timesheets/${id}/`);
    return response.data;
  }

  async createTimesheet(data: Partial<Timesheet>): Promise<TimesheetResponse> {
    const response = await api.post('/api/timesheets/', data);
    return response.data;
  }

  async updateTimesheet(id: string, data: Partial<Timesheet>): Promise<TimesheetResponse> {
    const response = await api.put(`/api/timesheets/${id}/`, data);
    return response.data;
  }

  async deleteTimesheet(id: string): Promise<void> {
    await api.delete(`/api/timesheets/${id}/`);
  }

  async submitTimesheet(id: string): Promise<TimesheetResponse> {
    const response = await api.post(`/api/timesheets/${id}/submit/`);
    return response.data;
  }

  async approveTimesheet(id: string): Promise<TimesheetResponse> {
    const response = await api.post(`/api/timesheets/${id}/approve/`);
    return response.data;
  }

  async rejectTimesheet(id: string, reason: string): Promise<TimesheetResponse> {
    const response = await api.post(`/api/timesheets/${id}/reject/`, { reason });
    return response.data;
  }

  async markAsPaid(id: string): Promise<TimesheetResponse> {
    const response = await api.post(`/api/timesheets/${id}/mark-as-paid/`);
    return response.data;
  }

  async sendForPayment(id: string): Promise<TimesheetResponse> {
    const response = await api.post(`/api/timesheets/${id}/send-for-payment/`);
    return response.data;
  }

  async undoApproval(id: string): Promise<TimesheetResponse> {
    const response = await api.post(`/api/timesheets/${id}/undo-approval/`);
    return response.data;
  }

  // Helper function to convert backend response to frontend format
  convertToFrontendFormat(timesheet: TimesheetResponse) {
    return {
      id: timesheet.uuid,
      weekStarting: new Date(timesheet.week_starting),
      client: timesheet.project.customer.name,
      location: timesheet.project.name,
      status: timesheet.status,
      hours: timesheet.details.map(d => d.hours || 0),
      timeDetails: timesheet.details.map(d => ({
        useDetailedTime: d.use_detailed_time,
        startTime: d.start_time,
        endTime: d.end_time,
        breakMinutes: d.break_minutes,
      })),
      dayNotes: timesheet.details.map(d => d.note || ''),
      notes: timesheet.notes,
      submittedBy: timesheet.user.name,
      submittedAt: timesheet.submitted_at ? new Date(timesheet.submitted_at) : undefined,
      approvedBy: timesheet.approved_by?.name,
      approvedAt: timesheet.approved_at ? new Date(timesheet.approved_at) : undefined,
      rejectionReason: timesheet.rejection_reason,
      sentForPaymentAt: timesheet.sent_for_payment_at ? new Date(timesheet.sent_for_payment_at) : undefined,
      sentForPaymentBy: timesheet.sent_for_payment_by?.name,
      paidAt: timesheet.paid_at ? new Date(timesheet.paid_at) : undefined,
      paidBy: timesheet.paid_by?.name,
    };
  }

  // Helper function to convert frontend format to backend format
  convertToBackendFormat(timesheet: any): TimesheetCreate {
    return {
      week_starting: format(timesheet.weekStarting, 'yyyy-MM-dd'),
      project_uuid: timesheet.project,
      details_data: timesheet.hours.map((hours: number, index: number) => ({
        day: index,
        hours: hours,
        note: timesheet.dayNotes[index],
      })),
    };
  }
}

export const timesheetService = new TimesheetService(); 