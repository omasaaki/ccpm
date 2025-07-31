import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponse } from '../types/api';
import { LoginRequest, RegisterRequest } from '../types/auth';

export class AuthController {
  // Get client IP address
  private static getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0]!.trim() : (req.socket?.remoteAddress || 'unknown');
    return ip || 'unknown';
  }

  // Get user agent
  private static getUserAgent(req: Request): string {
    return req.headers['user-agent'] || 'unknown';
  }
  // Register new user
  static async register(req: Request<{}, ApiResponse, RegisterRequest>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Login user
  static async login(req: Request<{}, ApiResponse, LoginRequest>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const ip = AuthController.getClientIp(req);
      const userAgent = AuthController.getUserAgent(req);
      const result = await AuthService.login(req.body, ip, userAgent);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user profile
  static async getProfile(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await AuthService.getProfile(userId);
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // Refresh tokens
  static async refreshTokens(req: Request<{}, ApiResponse, { refreshToken: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await AuthService.refreshTokens(refreshToken);
      
      res.status(200).json({
        success: true,
        data: tokens,
        message: 'Tokens refreshed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout
  static async logout(req: Request<{}, ApiResponse, { refreshToken?: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { refreshToken } = req.body;
      await AuthService.logout(userId, refreshToken);
      
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }

  // Request password reset
  static async requestPasswordReset(req: Request<{}, ApiResponse, { email: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { email } = req.body;
      await AuthService.requestPasswordReset(email);
      
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset password
  static async resetPassword(req: Request<{}, ApiResponse, { token: string; newPassword: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      await AuthService.resetPassword(token, newPassword);
      
      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify email
  static async verifyEmail(req: Request<{}, ApiResponse, { token: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { token } = req.body;
      await AuthService.verifyEmail(token);
      
      res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Resend verification email
  static async resendVerificationEmail(req: Request<{}, ApiResponse, { email: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { email } = req.body;
      await AuthService.resendVerificationEmail(email);
      
      res.status(200).json({
        success: true,
        message: 'Verification email sent'
      });
    } catch (error) {
      next(error);
    }
  }
}