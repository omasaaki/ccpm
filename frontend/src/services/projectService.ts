import { apiClient } from '../utils/api';
import { Project, CreateProjectForm, PaginatedResponse, PaginationParams } from '../types/api';

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
}