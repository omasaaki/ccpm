import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponse } from '../types/api';
import { LoginRequest, RegisterRequest } from '../types/auth';

export class AuthController {
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
      const result = await AuthService.login(req.body);
      
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

  // Logout (client-side token removal)
  static async logout(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }
}