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
      const result = await ProjectService.getByUser(userId, req.query);
      
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
      const { id } = req.params;
      const project = await ProjectService.getById(id, userId);
      
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
      const { id } = req.params;
      const project = await ProjectService.update(id, userId, req.body);
      
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
      const { id } = req.params;
      await ProjectService.delete(id, userId);
      
      res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get project statistics
  static async getStatistics(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const statistics = await ProjectService.getStatistics(id, userId);
      
      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }
}