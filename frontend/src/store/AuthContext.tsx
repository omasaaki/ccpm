import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginForm, RegisterForm, AuthState } from '../types/auth';
import { AuthService } from '../services/authService';
import { AuthUtils } from '../utils/auth';

interface AuthContextType extends AuthState {
  login: (form: LoginForm) => Promise<void>;
  register: (form: RegisterForm) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      const token = AuthUtils.getToken();
      const refreshToken = AuthUtils.getRefreshToken();
      const user = AuthUtils.getUser();

      if (token && refreshToken && user) {
        // Check if token is not expired
        if (!AuthUtils.isTokenExpired(token)) {
          setState({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // Try to refresh token
          AuthService.refreshTokens(refreshToken)
            .then(({ accessToken, refreshToken: newRefreshToken }) => {
              AuthUtils.setToken(accessToken);
              AuthUtils.setRefreshToken(newRefreshToken);
              setState({
                user,
                token: accessToken,
                refreshToken: newRefreshToken,
                isAuthenticated: true,
                isLoading: false,
              });
            })
            .catch(() => {
              AuthUtils.clearAuth();
              setState({
                user: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
              });
            });
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  const login = async (form: LoginForm) => {
    const response = await AuthService.login(form);
    const { user, tokens } = response;

    AuthUtils.setAuthData(user, tokens.accessToken, tokens.refreshToken);

    setState({
      user,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const register = async (form: RegisterForm) => {
    const response = await AuthService.register(form);
    const { user, tokens } = response;

    AuthUtils.setAuthData(user, tokens.accessToken, tokens.refreshToken);

    setState({
      user,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      AuthUtils.clearAuth();
      setState({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const updateUser = (user: User) => {
    AuthUtils.setUser(user);
    setState(prev => ({ ...prev, user }));
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};