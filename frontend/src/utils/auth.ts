import { User } from '../types/auth';

export const TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const USER_KEY = 'user';

export class AuthUtils {
  // Token management
  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  static removeTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  // User management
  static getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static removeUser(): void {
    localStorage.removeItem(USER_KEY);
  }

  // Authentication state
  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // JWT token validation
  static isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true;
      }
      const payloadPart = parts[1];
      if (!payloadPart) {
        return true;
      }
      const payload = JSON.parse(atob(payloadPart));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  // Clear all auth data
  static clearAuth(): void {
    this.removeTokens();
    this.removeUser();
  }

  // Login helper
  static setAuthData(user: User, accessToken: string, refreshToken: string): void {
    this.setUser(user);
    this.setToken(accessToken);
    this.setRefreshToken(refreshToken);
  }
}