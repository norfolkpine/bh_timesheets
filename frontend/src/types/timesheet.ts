export type UserRole = 'employee' | 'manager';

export interface User {
  id: number;
  uuid: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Customer {
  id: number;
  uuid: string;
  name: string;
  isActive: boolean;
}

export interface Project {
  id: number;
  uuid: string;
  name: string;
  customer: Customer;
  isActive: boolean;
}

export interface TimesheetDetail {
  uuid: string;
  day: number;
  date: string;  // ISO date string
  hours: number;
  start_time?: string;
  end_time?: string;
  break_minutes?: number;
  use_detailed_time: boolean;
  note?: string;
}

export interface Timesheet {
  id: number;
  uuid: string;
  user: User;
  project: Project;
  week_starting: string;
  total_hours: number;
  status: TimesheetStatus;
  details: TimesheetDetail[];
  notes?: string;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: User;
  rejection_reason?: string;
  sent_for_payment_at?: string;
  sent_for_payment_by?: User;
  paid_at?: string;
  paid_by?: User;
}

export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending_payment' | 'paid';

export interface TimesheetResponse {
  id: number;
  uuid: string;
  user: User;
  project: Project;
  week_starting: string;
  total_hours: number;
  status: TimesheetStatus;
  details: TimesheetDetail[];
  notes?: string;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: User;
  rejection_reason?: string;
  sent_for_payment_at?: string;
  sent_for_payment_by?: User;
  paid_at?: string;
  paid_by?: User;
}

export interface TimesheetCreate {
  project_id: number;
  week_starting: string;
  details: Omit<TimesheetDetail, 'uuid'>[];
  notes?: string;
}

export interface TimesheetUpdate {
  project_id?: number;
  week_starting?: string;
  details?: Omit<TimesheetDetail, 'uuid'>[];
  notes?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
} 