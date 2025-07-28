export interface User {
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  username: string;
  name?: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}