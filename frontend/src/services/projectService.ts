import { apiClient } from '../utils/api';
import { Project, CreateProjectForm, PaginatedResponse, PaginationParams } from '../types/api';

export interface ProjectMember {
  id: string;
  role: 'PM' | 'MEMBER' | 'VIEWER';
  resourceRate: number;
  joinedAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
    username: string;
  };
}

export interface AddMemberData {
  userId: string;
  role: 'PM' | 'MEMBER' | 'VIEWER';
  resourceRate?: number;
}

export interface UpdateMemberData {
  role?: 'PM' | 'MEMBER' | 'VIEWER';
  resourceRate?: number;
}

export class ProjectService {
  // Get user's projects
  static async getProjects(params: PaginationParams = {}): Promise<PaginatedResponse<Project>> {
    const response = await apiClient.get<PaginatedResponse<Project>>('/projects', params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'プロジェクト一覧の取得に失敗しました');
    }
    
    return response.data;
  }

  // Get project by ID
  static async getProject(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'プロジェクトの取得に失敗しました');
    }
    
    return response.data;
  }

  // Create new project
  static async createProject(data: CreateProjectForm): Promise<Project> {
    const response = await apiClient.post<Project>('/projects', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'プロジェクトの作成に失敗しました');
    }
    
    return response.data;
  }

  // Update project
  static async updateProject(id: string, data: Partial<CreateProjectForm>): Promise<Project> {
    const response = await apiClient.put<Project>(`/projects/${id}`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'プロジェクトの更新に失敗しました');
    }
    
    return response.data;
  }

  // Delete project
  static async deleteProject(id: string): Promise<void> {
    const response = await apiClient.delete(`/projects/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'プロジェクトの削除に失敗しました');
    }
  }

  // Get project statistics
  static async getProjectStatistics(id: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    completionRate: number;
  }> {
    const response = await apiClient.get<{
      totalTasks: number;
      completedTasks: number;
      inProgressTasks: number;
      todoTasks: number;
      completionRate: number;
    }>(`/projects/${id}/statistics`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'プロジェクト統計の取得に失敗しました');
    }
    
    return response.data;
  }

  // Archive project
  static async archiveProject(id: string): Promise<Project> {
    const response = await apiClient.put<Project>(`/projects/${id}/archive`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'プロジェクトのアーカイブに失敗しました');
    }
    
    return response.data;
  }

  // Restore project
  static async restoreProject(id: string): Promise<Project> {
    const response = await apiClient.put<Project>(`/projects/${id}/restore`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'プロジェクトの復元に失敗しました');
    }
    
    return response.data;
  }

  // Get project members
  static async getProjectMembers(id: string): Promise<ProjectMember[]> {
    const response = await apiClient.get<ProjectMember[]>(`/projects/${id}/members`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'プロジェクトメンバーの取得に失敗しました');
    }
    
    return response.data;
  }

  // Add member to project
  static async addMember(projectId: string, data: AddMemberData): Promise<ProjectMember> {
    const response = await apiClient.post<ProjectMember>(`/projects/${projectId}/members`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'メンバーの追加に失敗しました');
    }
    
    return response.data;
  }

  // Update member
  static async updateMember(projectId: string, memberId: string, data: UpdateMemberData): Promise<ProjectMember> {
    const response = await apiClient.put<ProjectMember>(`/projects/${projectId}/members/${memberId}`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'メンバー情報の更新に失敗しました');
    }
    
    return response.data;
  }

  // Remove member from project
  static async removeMember(projectId: string, memberId: string): Promise<void> {
    const response = await apiClient.delete(`/projects/${projectId}/members/${memberId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'メンバーの削除に失敗しました');
    }
  }
}