import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ApiResponse } from '../types/api';

// Define permission structure
export interface Permission {
  resource: string;
  action: string;
}

// Role-based permissions mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admin has all permissions
    { resource: '*', action: '*' },
  ],
  [UserRole.MANAGER]: [
    // Manager permissions
    { resource: 'project', action: 'create' },
    { resource: 'project', action: 'read' },
    { resource: 'project', action: 'update' },
    { resource: 'project', action: 'delete' },
    { resource: 'task', action: 'create' },
    { resource: 'task', action: 'read' },
    { resource: 'task', action: 'update' },
    { resource: 'task', action: 'delete' },
    { resource: 'user', action: 'read' },
    { resource: 'user', action: 'update:own' },
    { resource: 'auditlog', action: 'read' },
  ],
  [UserRole.USER]: [
    // User permissions
    { resource: 'project', action: 'read' },
    { resource: 'project', action: 'create' },
    { resource: 'project', action: 'update:own' },
    { resource: 'project', action: 'delete:own' },
    { resource: 'task', action: 'read' },
    { resource: 'task', action: 'create' },
    { resource: 'task', action: 'update:own' },
    { resource: 'task', action: 'delete:own' },
    { resource: 'user', action: 'read:own' },
    { resource: 'user', action: 'update:own' },
  ],
};

// Check if role has permission
export const hasPermission = (
  role: UserRole,
  resource: string,
  action: string,
  isOwner: boolean = false
): boolean => {
  const permissions = rolePermissions[role] || [];

  return permissions.some(permission => {
    // Check wildcard permissions
    if (permission.resource === '*' && permission.action === '*') return true;
    if (permission.resource === '*' && permission.action === action) return true;
    if (permission.resource === resource && permission.action === '*') return true;

    // Check exact match
    if (permission.resource === resource && permission.action === action) return true;

    // Check ownership-based permissions
    if (isOwner) {
      if (permission.resource === resource && permission.action === `${action}:own`) return true;
    }

    return false;
  });
};

// Middleware to check permissions
export const requirePermission = (resource: string, action: string) => {
  return async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { role, userId } = req.user;

    // For ownership-based permissions, we'll check in the specific route handler
    // This middleware only checks basic role permissions
    const hasBasicPermission = hasPermission(role as UserRole, resource, action);

    if (!hasBasicPermission) {
      // Check if user might have ownership permission
      const hasOwnershipPermission = hasPermission(role as UserRole, resource, action, true);
      
      if (!hasOwnershipPermission) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
        return;
      }
      
      // If user might have ownership permission, let the route handler check ownership
      req.requireOwnership = true;
    }

    next();
  };
};

// Middleware to check if user is admin
export const requireAdmin = (req: Request, res: Response<ApiResponse>, next: NextFunction): Response<ApiResponse> | void => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  next();
};

// Middleware to check if user is at least a manager
export const requireManager = (req: Request, res: Response<ApiResponse>, next: NextFunction): Response<ApiResponse> | void => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.MANAGER) {
    return res.status(403).json({
      success: false,
      error: 'Manager access required',
    });
  }

  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      requireOwnership?: boolean;
    }
  }
}