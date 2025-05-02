import axios from 'axios';
import { format } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface TimesheetResponse {
  uuid: string;
  user: {
    email: string;
    name: string;
  };
  project: {
    uuid: string;
    name: string;
    customer: {
      uuid: string;
      name: string;
    };
  };
  week_starting: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid' | 'pending_payment';
  total_hours: number;
  notes: string;
  submitted_at: string | null;
  approved_by: { email: string; name: string } | null;
  approved_at: string | null;
  rejection_reason: string | null;
  sent_for_payment_at: string | null;
  sent_for_payment_by: { email: string; name: string } | null;
  paid_at: string | null;
  paid_by: { email: string; name: string } | null;
  details: Array<{
    uuid: string;
    day: number;
    hours: number;
    start_time: string | null;
    end_time: string | null;
    break_minutes: number | null;
    use_detailed_time: boolean;
    note: string | null;
  }>;
}

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

  async getTimesheets() {
    try {
      const response = await axios.get<TimesheetResponse[]>(
        `${API_URL}/timesheets/`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      throw error;
    }
  }

  async getTimesheet(uuid: string) {
    try {
      const response = await axios.get<TimesheetResponse>(
        `${API_URL}/timesheets/${uuid}/`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching timesheet ${uuid}:`, error);
      throw error;
    }
  }

  async createTimesheet(data: TimesheetCreate) {
    try {
      const response = await axios.post<TimesheetResponse>(
        `${API_URL}/timesheets/`,
        data,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error creating timesheet:', error);
      throw error;
    }
  }

  async updateTimesheet(uuid: string, data: TimesheetUpdate) {
    try {
      const response = await axios.patch<TimesheetResponse>(
        `${API_URL}/timesheets/${uuid}/`,
        data,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating timesheet ${uuid}:`, error);
      throw error;
    }
  }

  async deleteTimesheet(uuid: string) {
    try {
      await axios.delete(
        `${API_URL}/timesheets/${uuid}/`,
        this.getAuthHeaders()
      );
    } catch (error) {
      console.error(`Error deleting timesheet ${uuid}:`, error);
      throw error;
    }
  }

  async submitTimesheet(uuid: string) {
    try {
      const response = await axios.post<TimesheetResponse>(
        `${API_URL}/timesheets/${uuid}/submit/`,
        {},
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error submitting timesheet ${uuid}:`, error);
      throw error;
    }
  }

  async approveTimesheet(uuid: string) {
    try {
      const response = await axios.post<TimesheetResponse>(
        `${API_URL}/timesheets/${uuid}/approve/`,
        {},
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error approving timesheet ${uuid}:`, error);
      throw error;
    }
  }

  async rejectTimesheet(uuid: string, reason: string) {
    try {
      const response = await axios.post<TimesheetResponse>(
        `${API_URL}/timesheets/${uuid}/reject/`,
        { reason },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error rejecting timesheet ${uuid}:`, error);
      throw error;
    }
  }

  async sendForPayment(uuid: string) {
    try {
      const response = await axios.post<TimesheetResponse>(
        `${API_URL}/timesheets/${uuid}/send-for-payment/`,
        {},
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error sending timesheet ${uuid} for payment:`, error);
      throw error;
    }
  }

  async markAsPaid(uuid: string) {
    try {
      const response = await axios.post<TimesheetResponse>(
        `${API_URL}/timesheets/${uuid}/mark-as-paid/`,
        {},
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error marking timesheet ${uuid} as paid:`, error);
      throw error;
    }
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