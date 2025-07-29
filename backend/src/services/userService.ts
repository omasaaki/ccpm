import { User, UserRole, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AuthUtils } from '../utils/auth';
import { AppError } from '../middleware/errorHandler';
import { AuditLogService } from './auditLogService';

interface ListUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  isActive?: boolean | undefined;
}

interface ListUsersResult {
  users: Omit<User, 'password'>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class UserService {
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
        emailVerified: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  // Update user profile
  static async updateProfile(userId: string, data: { name?: string; username?: string }): Promise<Omit<User, 'password'>> {
    // Check if username is already taken
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        throw new AppError('Username already taken', 409);
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        username: data.username,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    await AuditLogService.log({
      userId,
      action: 'user.profile.updated',
      details: data,
      ip: null,
      userAgent: null,
    });

    return user;
  }

  // Change password
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await AuthUtils.verifyPassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const hashedPassword = await AuthUtils.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    await AuditLogService.log({
      userId,
      action: 'user.password.changed',
      details: {},
      ip: null,
      userAgent: null,
    });
  }

  // List users (Admin function)
  static async listUsers(params: ListUsersParams): Promise<ListUsersResult> {
    const { page, limit, search, role, isActive } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role as UserRole;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get specific user
  static async getUser(userId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        failedLoginAttempts: true,
        lockoutUntil: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  // Update user (Admin function)
  static async updateUser(userId: string, data: Partial<{ name: string; username: string; email: string; role: UserRole }>): Promise<Omit<User, 'password'>> {
    // Check if email/username is already taken
    if (data.email || data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            data.email ? { email: data.email } : {},
            data.username ? { username: data.username } : {}
          ].filter(obj => Object.keys(obj).length > 0),
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        if (data.email && existingUser.email === data.email) {
          throw new AppError('Email already registered', 409);
        }
        if (data.username && existingUser.username === data.username) {
          throw new AppError('Username already taken', 409);
        }
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    await AuditLogService.log({
      userId: null, // Admin action
      action: 'admin.user.updated',
      details: { targetUserId: userId, changes: data },
      ip: null,
      userAgent: null,
    });

    return user;
  }

  // Activate user
  static async activateUser(userId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: true,
        failedLoginAttempts: 0,
        lockoutUntil: null
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    await AuditLogService.log({
      userId: null, // Admin action
      action: 'admin.user.activated',
      details: { targetUserId: userId },
      ip: null,
      userAgent: null,
    });

    return user;
  }

  // Deactivate user
  static async deactivateUser(userId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });

    await AuditLogService.log({
      userId: null, // Admin action
      action: 'admin.user.deactivated',
      details: { targetUserId: userId },
      ip: null,
      userAgent: null,
    });

    return user;
  }

  // Delete user
  static async deleteUser(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId }
    });

    await AuditLogService.log({
      userId: null, // Admin action
      action: 'admin.user.deleted',
      details: { targetUserId: userId },
      ip: null,
      userAgent: null,
    });
  }
}