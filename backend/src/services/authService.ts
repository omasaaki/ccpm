import { User } from '@prisma/client';
import { prisma } from '../config/database';
import { AuthUtils } from '../utils/auth';
import { AppError } from '../middleware/errorHandler';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

export class AuthService {
  // Register new user
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new AppError('Email already registered', 409);
      }
      if (existingUser.username === data.username) {
        throw new AppError('Username already taken', 409);
      }
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        name: data.name || null,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
      }
    });

    // Generate tokens
    const tokens = AuthUtils.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user,
      tokens,
    };
  }

  // Login user
  static async login(data: LoginRequest): Promise<AuthResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        password: true,
        isActive: true,
      }
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401);
    }

    // Verify password
    const isPasswordValid = await AuthUtils.verifyPassword(data.password, user.password);
    
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const tokens = AuthUtils.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  // Get user profile
  static async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  // Refresh tokens
  static async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = AuthUtils.verifyRefreshToken(refreshToken);
      
      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, isActive: true }
      });

      if (!user || !user.isActive) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Generate new tokens
      return AuthUtils.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }
}