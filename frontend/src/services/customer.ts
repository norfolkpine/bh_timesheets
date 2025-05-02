import { api } from './api';
import type { Customer, CustomerCreate, CustomerUpdate } from '@/types/customer';

class CustomerService {
  private getAuthHeaders() {
    return {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    };
  }

  async getCustomers(): Promise<Customer[]> {
    const response = await api.get('/api/customers/');
    return response.data;
  }

  async getCustomer(id: number): Promise<Customer> {
    const response = await api.get(`/api/customers/${id}/`);
    return response.data;
  }

  async createCustomer(data: CustomerCreate): Promise<Customer> {
    const response = await api.post('/api/customers/', data);
    return response.data;
  }

  async updateCustomer(id: number, data: CustomerUpdate): Promise<Customer> {
    const response = await api.put(`/api/customers/${id}/`, data);
    return response.data;
  }

  async deleteCustomer(id: number): Promise<void> {
    await api.delete(`/api/customers/${id}/`);
  }
}

export const customerService = new CustomerService(); 