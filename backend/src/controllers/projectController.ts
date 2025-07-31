import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/projectService';
import { ApiResponse, CreateProjectRequest, UpdateProjectRequest, PaginationParams } from '../types/api';

export class ProjectController {
  // Create new project
  static async create(req: Request<{}, ApiResponse, CreateProjectRequest>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const project = await ProjectService.create(userId, req.body);
      
      res.status(201).json({
        success: true,
        data: project,
        message: 'Project created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user's projects
  static async getByUser(req: Request<{}, ApiResponse, {}, PaginationParams>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const { page, limit, sortBy, sortOrder, search, status, isArchived } = req.query;
      
      const result = await ProjectService.getByUser(
        userId,
        {
          page: Number(page) || 1,
          limit: Number(limit) || 10,
          sortBy: sortBy || 'createdAt',
          sortOrder: sortOrder || 'desc',
          search: search as string,
          status: status as any,
          isArchived: typeof isArchived === 'string' && isArchived === 'true',
        },
        userRole
      );
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get project by ID
  static async getById(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const { id } = req.params;
      const project = await ProjectService.getById(id, userId, userRole);
      
      res.status(200).json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  }

  // Update project
  static async update(req: Request<{ id: string }, ApiResponse, UpdateProjectRequest>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const { id } = req.params;
      const project = await ProjectService.update(id, userId, req.body, userRole);
      
      res.status(200).json({
        success: true,
        data: project,
        message: 'Project updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete project
  static async delete(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const { id } = req.params;
      await ProjectService.delete(id, userId, userRole);
      
      res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Archive project
  static async archive(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const { id } = req.params;
      const project = await ProjectService.archiveProject(id, true, userId, userRole);
      
      res.status(200).json({
        success: true,
        data: project,
        message: 'Project archived successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Restore project
  static async restore(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const { id } = req.params;
      const project = await ProjectService.archiveProject(id, false, userId, userRole);
      
      res.status(200).json({
        success: true,
        data: project,
        message: 'Project restored successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get project statistics
  static async getStatistics(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const { id } = req.params;
      const statistics = await ProjectService.getStatistics(id, userId, userRole);
      
      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }

  // Get project members
  static async getMembers(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const { id } = req.params;
      const project = await ProjectService.getById(id, userId, userRole);
      
      res.status(200).json({
        success: true,
        data: (project as any).members || []
      });
    } catch (error) {
      next(error);
    }
  }

  // Add member to project
  static async addMember(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const { id } = req.params;
      const member = await ProjectService.addMember(id, req.body, userId, userRole);
      
      res.status(201).json({
        success: true,
        data: member,
        message: 'Member added successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update member
  static async updateMember(req: Request<{ id: string; memberId: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const { id, memberId } = req.params;
      const member = await ProjectService.updateMember(id, memberId, req.body, userId, userRole);
      
      res.status(200).json({
        success: true,
        data: member,
        message: 'Member updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove member from project
  static async removeMember(req: Request<{ id: string; memberId: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const { id, memberId } = req.params;
      await ProjectService.removeMember(id, memberId, userId, userRole);
      
      res.status(200).json({
        success: true,
        message: 'Member removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}