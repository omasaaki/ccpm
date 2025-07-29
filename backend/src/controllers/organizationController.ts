import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../services/organizationService';
import { ApiResponse } from '../types/api';

export class OrganizationController {
  // Organization Management
  static async createOrganization(
    req: Request<{}, ApiResponse, { name: string; description?: string }>,
    res: Response<ApiResponse>,
    next: NextFunction
  ) {
    try {
      const organization = await OrganizationService.createOrganization(req.body, req.user?.userId);
      
      res.status(201).json({
        success: true,
        data: organization,
        message: 'Organization created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async listOrganizations(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { page, limit, search, isActive } = req.query;
      const result = await OrganizationService.listOrganizations({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
      });
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrganization(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const organization = await OrganizationService.getOrganization(req.params.id);
      
      res.status(200).json({
        success: true,
        data: organization
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrganization(
    req: Request<{ id: string }, ApiResponse, { name?: string; description?: string; isActive?: boolean }>,
    res: Response<ApiResponse>,
    next: NextFunction
  ) {
    try {
      const organization = await OrganizationService.updateOrganization(req.params.id, req.body, req.user?.userId);
      
      res.status(200).json({
        success: true,
        data: organization,
        message: 'Organization updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteOrganization(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      await OrganizationService.deleteOrganization(req.params.id, req.user?.userId);
      
      res.status(200).json({
        success: true,
        message: 'Organization deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Department Management
  static async createDepartment(
    req: Request<{}, ApiResponse, {
      name: string;
      description?: string;
      organizationId: string;
      parentId?: string;
      managerId?: string;
    }>,
    res: Response<ApiResponse>,
    next: NextFunction
  ) {
    try {
      const department = await OrganizationService.createDepartment(req.body, req.user?.userId);
      
      res.status(201).json({
        success: true,
        data: department,
        message: 'Department created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async listDepartments(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { page, limit, search, organizationId, isActive } = req.query;
      const result = await OrganizationService.listDepartments({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        organizationId: organizationId as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
      });
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDepartment(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const department = await OrganizationService.getDepartment(req.params.id);
      
      res.status(200).json({
        success: true,
        data: department
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateDepartment(
    req: Request<{ id: string }, ApiResponse, {
      name?: string;
      description?: string;
      parentId?: string;
      managerId?: string;
      isActive?: boolean;
    }>,
    res: Response<ApiResponse>,
    next: NextFunction
  ) {
    try {
      const department = await OrganizationService.updateDepartment(req.params.id, req.body, req.user?.userId);
      
      res.status(200).json({
        success: true,
        data: department,
        message: 'Department updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteDepartment(req: Request<{ id: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      await OrganizationService.deleteDepartment(req.params.id, req.user?.userId);
      
      res.status(200).json({
        success: true,
        message: 'Department deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDepartmentHierarchy(req: Request<{ organizationId: string }>, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const hierarchy = await OrganizationService.getDepartmentHierarchy(req.params.organizationId);
      
      res.status(200).json({
        success: true,
        data: hierarchy
      });
    } catch (error) {
      next(error);
    }
  }

  static async assignUserToOrganization(
    req: Request<{}, ApiResponse, {
      userId: string;
      organizationId: string;
      departmentId?: string;
    }>,
    res: Response<ApiResponse>,
    next: NextFunction
  ) {
    try {
      await OrganizationService.assignUserToOrganization(
        req.body.userId,
        req.body.organizationId,
        req.body.departmentId,
        req.user?.userId
      );
      
      res.status(200).json({
        success: true,
        message: 'User assigned to organization successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}