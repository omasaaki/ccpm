export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: string;
  duration?: number;
  startDate?: string;
  endDate?: string;
  dependencies?: string[];
}