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
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    username: string;
    name: string | null;
  };
  _count?: {
    tasks: number;
  };
  tasks?: Task[];
}

export interface Task {
  id: string;
  name: string;
  title?: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  duration: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
  };
  dependencies?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
  dependents?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}

export interface CreateProjectForm {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateTaskForm {
  name: string;
  title?: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  duration?: number;
  startDate?: string;
  endDate?: string;
  dependencies?: string[];
}