import { apiClient } from '../utils/api';
import { Task, CreateTaskForm, PaginatedResponse, PaginationParams } from '../types/api';

export class TaskService {
  // Get tasks by project
  static async getTasksByProject(projectId: string, params: PaginationParams = {}): Promise<PaginatedResponse<Task>> {
    const response = await apiClient.get<PaginatedResponse<Task>>(`/tasks/project/${projectId}`, params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'タスク一覧の取得に失敗しました');
    }
    
    return response.data;
  }

  // Get task by ID
  static async getTask(id: string): Promise<Task> {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'タスクの取得に失敗しました');
    }
    
    return response.data;
  }

  // Create new task
  static async createTask(projectId: string, data: CreateTaskForm): Promise<Task> {
    const response = await apiClient.post<Task>(`/tasks/project/${projectId}`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'タスクの作成に失敗しました');
    }
    
    return response.data;
  }

  // Update task
  static async updateTask(id: string, data: Partial<CreateTaskForm>): Promise<Task> {
    const response = await apiClient.put<Task>(`/tasks/${id}`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'タスクの更新に失敗しました');
    }
    
    return response.data;
  }

  // Update task status
  static async updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${id}/status`, { status });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'タスクステータスの更新に失敗しました');
    }
    
    return response.data;
  }

  // Delete task
  static async deleteTask(id: string): Promise<void> {
    const response = await apiClient.delete(`/tasks/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'タスクの削除に失敗しました');
    }
  }

  // Add task dependency
  static async addTaskDependency(taskId: string, dependencyId: string): Promise<Task> {
    const response = await apiClient.post<Task>(`/tasks/${taskId}/dependencies`, { dependencyId });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || '依存関係の追加に失敗しました');
    }
    
    return response.data;
  }

  // Remove task dependency
  static async removeTaskDependency(taskId: string, dependencyId: string): Promise<Task> {
    const response = await apiClient.delete<Task>(`/tasks/${taskId}/dependencies/${dependencyId}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || '依存関係の削除に失敗しました');
    }
    
    return response.data;
  }
}