import { apiClient } from '../utils/api';
import { AuthResponse, User, LoginForm, RegisterForm } from '../types/auth';

export class AuthService {
  // Login user
  static async login(data: LoginForm): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'ログインに失敗しました');
    }
    
    return response.data;
  }

  // Register new user
  static async register(data: RegisterForm): Promise<AuthResponse> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...registerData } = data;
    const response = await apiClient.post<AuthResponse>('/auth/register', registerData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'ユーザー登録に失敗しました');
    }
    
    return response.data;
  }

  // Get user profile
  static async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'プロフィール取得に失敗しました');
    }
    
    return response.data;
  }

  // Refresh tokens
  static async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'トークン更新に失敗しました');
    }
    
    return response.data;
  }

  // Logout
  static async logout(): Promise<void> {
    const response = await apiClient.post('/auth/logout');
    
    if (!response.success) {
      throw new Error(response.error || 'ログアウトに失敗しました');
    }
  }
}