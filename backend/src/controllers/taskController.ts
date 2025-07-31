import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/taskService';
import { ApiResponse, CreateTaskRequest, PaginationParams } from '../types/api';
import { AppError } from '../middleware/errorHandler';

export class TaskController {
  // Create new task
  static async create(req: Request<{ projectId: string }, ApiResponse, CreateTaskRequest>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { projectId } = req.params;
      const task = await TaskService.create(projectId, userId, req.body);
      
      res.status(201).json({
        success: true,
        data: task,
        message: 'Task created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get tasks by project
  static async getByProject(req: Request<{ projectId: string }, ApiResponse, {}, PaginationParams>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { projectId } = req.params;
      const result = await TaskService.getByProject(projectId, userId, req.query);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get task by ID
  static async getById(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const task = await TaskService.getById(id, userId);
      
      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  // Update task
  static async update(req: Request<{ id: string }, ApiResponse, Partial<CreateTaskRequest>>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const task = await TaskService.update(id, userId, req.body);
      
      res.status(200).json({
        success: true,
        data: task,
        message: 'Task updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update task status
  static async updateStatus(req: Request<{ id: string }, ApiResponse, { status: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { status } = req.body;
      const task = await TaskService.updateStatus(id, userId, status);
      
      res.status(200).json({
        success: true,
        data: task,
        message: 'Task status updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete task
  static async delete(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      await TaskService.delete(id, userId);
      
      res.status(200).json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Add task dependency
  static async addDependency(req: Request<{ id: string }, ApiResponse, { dependencyId: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { dependencyId } = req.body;
      // const task = await TaskService.addDependency(id, dependencyId, userId);
      throw new AppError('Dependency feature not implemented', 501);
    } catch (error) {
      next(error);
    }
  }

  // Remove task dependency
  static async removeDependency(req: Request<{ id: string; dependencyId: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id, dependencyId } = req.params;
      // const task = await TaskService.removeDependency(id, dependencyId, userId);
      throw new AppError('Dependency feature not implemented', 501);
    } catch (error) {
      next(error);
    }
  }
}