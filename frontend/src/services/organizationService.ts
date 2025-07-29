import { apiClient } from '../utils/api';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    departments: number;
    users: number;
  };
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  organizationId: string;
  parentId?: string;
  parent?: Department;
  children: Department[];
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    users: number;
  };
}

export interface ListOrganizationsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface ListDepartmentsParams {
  page?: number;
  limit?: number;
  search?: string;
  organizationId?: string;
  isActive?: boolean;
}

export interface CreateOrganizationData {
  name: string;
  description?: string;
}

export interface UpdateOrganizationData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateDepartmentData {
  name: string;
  description?: string;
  organizationId: string;
  parentId?: string;
  managerId?: string;
}

export interface UpdateDepartmentData {
  name?: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface AssignUserData {
  userId: string;
  organizationId: string;
  departmentId?: string;
}

export const organizationService = {
  // Organization management
  async createOrganization(data: CreateOrganizationData) {
    const response = await apiClient.post<{ success: boolean; data: Organization }>('/organizations', data);
    return response.data;
  },

  async listOrganizations(params: ListOrganizationsParams = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

    const response = await apiClient.get<{ 
      success: boolean; 
      data: { 
        organizations: Organization[]; 
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      } 
    }>(`/organizations?${searchParams}`);
    return response.data;
  },

  async getOrganization(id: string) {
    const response = await apiClient.get<{ success: boolean; data: Organization }>(`/organizations/${id}`);
    return response.data;
  },

  async updateOrganization(id: string, data: UpdateOrganizationData) {
    const response = await apiClient.put<{ success: boolean; data: Organization }>(`/organizations/${id}`, data);
    return response.data;
  },

  async deleteOrganization(id: string) {
    const response = await apiClient.delete<{ success: boolean }>(`/organizations/${id}`);
    return response.data;
  },

  // Department management
  async createDepartment(data: CreateDepartmentData) {
    const response = await apiClient.post<{ success: boolean; data: Department }>('/departments', data);
    return response.data;
  },

  async listDepartments(params: ListDepartmentsParams = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.organizationId) searchParams.append('organizationId', params.organizationId);
    if (params.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

    const response = await apiClient.get<{ 
      success: boolean; 
      data: { 
        departments: Department[]; 
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      } 
    }>(`/departments?${searchParams}`);
    return response.data;
  },

  async getDepartment(id: string) {
    const response = await apiClient.get<{ success: boolean; data: Department }>(`/departments/${id}`);
    return response.data;
  },

  async updateDepartment(id: string, data: UpdateDepartmentData) {
    const response = await apiClient.put<{ success: boolean; data: Department }>(`/departments/${id}`, data);
    return response.data;
  },

  async deleteDepartment(id: string) {
    const response = await apiClient.delete<{ success: boolean }>(`/departments/${id}`);
    return response.data;
  },

  async getDepartmentHierarchy(organizationId: string) {
    const response = await apiClient.get<{ success: boolean; data: Department[] }>(`/organizations/${organizationId}/hierarchy`);
    return response.data;
  },

  // User assignment
  async assignUserToOrganization(data: AssignUserData) {
    const response = await apiClient.post<{ success: boolean }>('/users/assign', data);
    return response.data;
  },
};