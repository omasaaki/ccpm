import { User, UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { AuthUtils } from '../utils/auth';
import { AppError } from '../middleware/errorHandler';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';
import { EmailService } from './emailService';
import { AuditLogService } from './auditLogService';
import { config } from '../config/env';
import { randomBytes } from 'crypto';

export class AuthService {
  // Generate secure token
  private static generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }
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

    // Generate email verification token
    const emailVerificationToken = this.generateSecureToken();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        name: data.name || null,
        password: hashedPassword,
        emailVerificationToken,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
      }
    });

    // Send verification email
    await EmailService.sendVerificationEmail(user.email, emailVerificationToken);

    // Log registration
    await AuditLogService.log({
      userId: user.id,
      action: 'user.register',
      details: { email: user.email, username: user.username },
      ip: null, // Will be set by controller
      userAgent: null, // Will be set by controller
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
  static async login(data: LoginRequest, ip?: string, userAgent?: string): Promise<AuthResponse> {
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
        emailVerified: true,
        failedLoginAttempts: true,
        lockoutUntil: true,
        lastLoginAt: true,
      }
    });

    if (!user) {
      // Log failed login attempt for non-existent user
      await AuditLogService.log({
        userId: null,
        action: 'auth.login.failed',
        details: { email: data.email, reason: 'user_not_found' },
        ip,
        userAgent,
      });
      throw new AppError('Invalid email or password', 401);
    }

    // Check if account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      await AuditLogService.log({
        userId: user.id,
        action: 'auth.login.failed',
        details: { reason: 'account_locked' },
        ip,
        userAgent,
      });
      throw new AppError('Account is locked. Please try again later.', 401);
    }

    if (!user.isActive) {
      await AuditLogService.log({
        userId: user.id,
        action: 'auth.login.failed',
        details: { reason: 'account_deactivated' },
        ip,
        userAgent,
      });
      throw new AppError('Account is deactivated', 401);
    }

    if (!user.emailVerified) {
      await AuditLogService.log({
        userId: user.id,
        action: 'auth.login.failed',
        details: { reason: 'email_not_verified' },
        ip,
        userAgent,
      });
      throw new AppError('Email not verified. Please check your email.', 401);
    }

    // Verify password
    const isPasswordValid = await AuthUtils.verifyPassword(data.password, user.password);
    
    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const lockoutUntil = failedAttempts >= config.auth.lockoutThreshold
        ? new Date(Date.now() + config.auth.lockoutDuration)
        : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockoutUntil,
        }
      });

      // Send notification if account is locked
      if (lockoutUntil) {
        await EmailService.sendAccountLockNotification(user.email);
      }

      await AuditLogService.log({
        userId: user.id,
        action: 'auth.login.failed',
        details: { reason: 'invalid_password', failedAttempts },
        ip,
        userAgent,
      });

      throw new AppError('Invalid email or password', 401);
    }

    // Reset failed login attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date(),
      }
    });

    // Generate tokens
    const tokens = AuthUtils.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    // Log successful login
    await AuditLogService.log({
      userId: user.id,
      action: 'auth.login.success',
      details: {},
      ip,
      userAgent,
    });

    // Remove sensitive fields from response
    const { password, ...userWithoutPassword } = user as any;

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

    return user as any;
  }

  // Refresh tokens
  static async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = AuthUtils.verifyRefreshToken(refreshToken);
      
      // Verify refresh token exists and is valid
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
        throw new AppError('Invalid refresh token', 401);
      }

      const user = storedToken.user;

      if (!user || !user.isActive) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Revoke old refresh token
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() }
      });

      // Generate new tokens
      const tokens = AuthUtils.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Store new refresh token
      await prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
      });

      return tokens;
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  // Request password reset
  static async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true }
    });

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    // Generate reset token
    const resetToken = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + config.auth.passwordResetExpiration);

    // Store reset token
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      }
    });

    // Send reset email
    await EmailService.sendPasswordResetEmail(user.email, resetToken);

    // Log password reset request
    await AuditLogService.log({
      userId: user.id,
      action: 'auth.password_reset.requested',
      details: {},
      ip: null,
      userAgent: null,
    });
  }

  // Reset password
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Hash new password
    const hashedPassword = await AuthUtils.hashPassword(newPassword);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() }
      })
    ]);

    // Send confirmation email
    await EmailService.sendPasswordResetConfirmation(resetToken.user.email);

    // Log password reset
    await AuditLogService.log({
      userId: resetToken.userId,
      action: 'auth.password_reset.completed',
      details: {},
      ip: null,
      userAgent: null,
    });
  }

  // Verify email
  static async verifyEmail(token: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerified: false,
      }
    });

    if (!user) {
      throw new AppError('Invalid verification token', 400);
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
      }
    });

    // Send welcome email
    await EmailService.sendWelcomeEmail(user.email, user.name || user.username);

    // Log email verification
    await AuditLogService.log({
      userId: user.id,
      action: 'auth.email.verified',
      details: {},
      ip: null,
      userAgent: null,
    });
  }

  // Resend verification email
  static async resendVerificationEmail(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        emailVerificationToken: true,
      }
    });

    if (!user || user.emailVerified) {
      throw new AppError('Email already verified or user not found', 400);
    }

    // Generate new token if needed
    let verificationToken = user.emailVerificationToken;
    if (!verificationToken) {
      verificationToken = this.generateSecureToken();
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationToken: verificationToken }
      });
    }

    // Send verification email
    await EmailService.sendVerificationEmail(user.email, verificationToken);

    // Log resend
    await AuditLogService.log({
      userId: user.id,
      action: 'auth.email.verification_resent',
      details: {},
      ip: null,
      userAgent: null,
    });
  }

  // Logout (revoke refresh tokens)
  static async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Revoke specific refresh token
      await prisma.refreshToken.updateMany({
        where: {
          token: refreshToken,
          userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() }
      });
    } else {
      // Revoke all refresh tokens for user
      await prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() }
      });
    }

    // Log logout
    await AuditLogService.log({
      userId,
      action: 'auth.logout',
      details: { allTokens: !refreshToken },
      ip: null,
      userAgent: null,
    });
  }
}