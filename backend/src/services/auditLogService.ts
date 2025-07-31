import { prisma } from '../config/database';
import { Prisma, AuditLog } from '@prisma/client';

interface AuditLogParams {
  userId?: string | null;
  action: string;
  details?: any;
  resourceType?: string;
  resourceId?: string;
  ip?: string | null;
  userAgent?: string | null;
}

interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

interface GetAuditLogsResult {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class AuditLogService {
  // Create audit log entry
  static async log(params: AuditLogParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          action: params.action,
          entity: params.resourceType || 'System',
          entityId: params.resourceId || null,
          newValue: params.details || {},
          ipAddress: params.ip || null,
          userAgent: params.userAgent || null,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error for audit logging to prevent disrupting main operations
    }
  }

  // Get audit logs with pagination and filters
  static async getAuditLogs(params: GetAuditLogsParams): Promise<GetAuditLogsResult> {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    const skip = (page - 1) * limit;
    const where: Prisma.AuditLogWhereInput = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get single audit log by ID
  static async getAuditLog(id: string): Promise<AuditLog | null> {
    return prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }
}