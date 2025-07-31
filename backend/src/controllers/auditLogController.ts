import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/auditLogService';
import { ApiResponse } from '../types/api';

export class AuditLogController {
  // Get audit logs
  static async getAuditLogs(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 20,
        userId,
        action,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const logs = await AuditLogService.getAuditLogs({
        page: Number(page),
        limit: Number(limit),
        userId: userId as string,
        action: action as string,
        startDate: startDate ? new Date(startDate as string) : undefined as any,
        endDate: endDate ? new Date(endDate as string) : undefined,
        sortBy: sortBy as 'createdAt',
        sortOrder: sortOrder as 'asc' | 'desc'
      });

      res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      next(error);
    }
  }

  // Get audit log by ID
  static async getAuditLog(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const log = await AuditLogService.getAuditLog(req.params.id);

      res.status(200).json({
        success: true,
        data: log
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user's audit logs
  static async getUserAuditLogs(req: Request<{ userId: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 20,
        action,
        startDate,
        endDate
      } = req.query;

      const logs = await AuditLogService.getAuditLogs({
        page: Number(page),
        limit: Number(limit),
        userId: req.params.userId,
        action: action as string,
        startDate: startDate ? new Date(startDate as string) : undefined as any,
        endDate: endDate ? new Date(endDate as string) : undefined
      });

      res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      next(error);
    }
  }
}