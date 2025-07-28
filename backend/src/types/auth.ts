export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  name?: string;
  password: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    name: string | null;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}