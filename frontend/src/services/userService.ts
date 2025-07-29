import { apiClient } from '../utils/api';

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

export interface ListUsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateUserData {
  name?: string;
  username?: string;
  email?: string;
  role?: User['role'];
}

export const userService = {
  // List users with filtering and pagination
  async listUsers(params: ListUsersParams = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.role) searchParams.append('role', params.role);
    if (params.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

    const response = await apiClient.get<{ success: boolean; data: ListUsersResponse }>(`/users?${searchParams}`);
    return response.data;
  },

  // Get specific user
  async getUser(userId: string) {
    const response = await apiClient.get<{ success: boolean; data: User }>(`/users/${userId}`);
    return response.data;
  },

  // Update user
  async updateUser(userId: string, data: UpdateUserData) {
    const response = await apiClient.put<{ success: boolean; data: User }>(`/users/${userId}`, data);
    return response.data;
  },

  // Activate user
  async activateUser(userId: string) {
    const response = await apiClient.put<{ success: boolean; data: User }>(`/users/${userId}/activate`);
    return response.data;
  },

  // Deactivate user
  async deactivateUser(userId: string) {
    const response = await apiClient.put<{ success: boolean; data: User }>(`/users/${userId}/deactivate`);
    return response.data;
  },

  // Delete user
  async deleteUser(userId: string) {
    const response = await apiClient.delete<{ success: boolean }>(`/users/${userId}`);
    return response.data;
  },

  // Get current user profile
  async getProfile() {
    const response = await apiClient.get<{ success: boolean; data: User }>('/users/profile');
    return response.data;
  },

  // Update current user profile
  async updateProfile(data: { name?: string; username?: string }) {
    const response = await apiClient.put<{ success: boolean; data: User }>('/users/profile', data);
    return response.data;
  },

  // Change password
  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const response = await apiClient.put<{ success: boolean }>('/users/password', data);
    return response.data;
  },

  // Bulk update users
  async bulkUpdate(userIds: string[], updates: { role?: User['role'] }) {
    const response = await apiClient.put<{ 
      success: boolean; 
      data: { successCount: number; failureCount: number; errors: any[] }
    }>('/users/bulk/update', { userIds, updates });
    return response.data;
  },

  // Bulk activate users
  async bulkActivate(userIds: string[]) {
    const response = await apiClient.put<{ 
      success: boolean; 
      data: { successCount: number; failureCount: number; errors: any[] }
    }>('/users/bulk/activate', { userIds });
    return response.data;
  },

  // Bulk deactivate users
  async bulkDeactivate(userIds: string[]) {
    const response = await apiClient.put<{ 
      success: boolean; 
      data: { successCount: number; failureCount: number; errors: any[] }
    }>('/users/bulk/deactivate', { userIds });
    return response.data;
  },

  // Bulk delete users
  async bulkDelete(userIds: string[]) {
    const response = await apiClient.delete<{ 
      success: boolean; 
      data: { successCount: number; failureCount: number; errors: any[] }
    }>('/users/bulk/delete', { data: { userIds } });
    return response.data;
  },
};