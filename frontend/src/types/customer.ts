export interface Customer {
  id: number;
  uuid: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerCreate {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
}

export interface CustomerUpdate extends Partial<CustomerCreate> {} 