import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { ApiResponse } from '../types/api';

export class UserController {
  // Get current user profile
  static async getProfile(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await UserService.getProfile(userId);
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // Update current user profile
  static async updateProfile(req: Request<{}, ApiResponse, { name?: string; username?: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await UserService.updateProfile(userId, req.body);
      
      res.status(200).json({
        success: true,
        data: user,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Change password
  static async changePassword(req: Request<{}, ApiResponse, { currentPassword: string; newPassword: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      await UserService.changePassword(userId, req.body.currentPassword, req.body.newPassword);
      
      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // List all users (Admin only)
  static async listUsers(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search, role, isActive } = req.query;
      const users = await UserService.listUsers({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        role: role as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
      });
      
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  // Get specific user (Manager+ only)
  static async getUser(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const user = await UserService.getUser(req.params.id);
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user (Admin only)
  static async updateUser(req: Request<{ id: string }, ApiResponse, any>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const user = await UserService.updateUser(req.params.id, req.body);
      
      res.status(200).json({
        success: true,
        data: user,
        message: 'User updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Activate user (Admin only)
  static async activateUser(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const user = await UserService.activateUser(req.params.id);
      
      res.status(200).json({
        success: true,
        data: user,
        message: 'User activated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Deactivate user (Admin only)
  static async deactivateUser(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const user = await UserService.deactivateUser(req.params.id);
      
      res.status(200).json({
        success: true,
        data: user,
        message: 'User deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete user (Admin only)
  static async deleteUser(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      await UserService.deleteUser(req.params.id);
      
      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk update users (Admin only)
  static async bulkUpdate(req: Request<{}, ApiResponse, { userIds: string[]; updates: any }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const result = await UserService.bulkUpdate(req.body.userIds, req.body.updates);
      
      res.status(200).json({
        success: true,
        data: result,
        message: `Successfully updated ${result.successCount} users`
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk activate users (Admin only)
  static async bulkActivate(req: Request<{}, ApiResponse, { userIds: string[] }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const result = await UserService.bulkActivate(req.body.userIds);
      
      res.status(200).json({
        success: true,
        data: result,
        message: `Successfully activated ${result.successCount} users`
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk deactivate users (Admin only)
  static async bulkDeactivate(req: Request<{}, ApiResponse, { userIds: string[] }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const result = await UserService.bulkDeactivate(req.body.userIds);
      
      res.status(200).json({
        success: true,
        data: result,
        message: `Successfully deactivated ${result.successCount} users`
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk delete users (Admin only)
  static async bulkDelete(req: Request<{}, ApiResponse, { userIds: string[] }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const result = await UserService.bulkDelete(req.body.userIds);
      
      res.status(200).json({
        success: true,
        data: result,
        message: `Successfully deleted ${result.successCount} users`
      });
    } catch (error) {
      next(error);
    }
  }
}