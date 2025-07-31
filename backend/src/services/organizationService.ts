import { Organization, Department, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuditLogService } from './auditLogService';

// Organization with department count
interface OrganizationWithStats extends Organization {
  _count: {
    departments: number;
    users: number;
  };
}

// Department with hierarchy info
interface DepartmentWithHierarchy extends Department {
  parent?: Department;
  children: Department[];
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    users: number;
  };
}

interface ListOrganizationsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

interface ListDepartmentsParams {
  page?: number;
  limit?: number;
  search?: string;
  organizationId?: string;
  isActive?: boolean;
}

export class OrganizationService {
  // Organization Management
  static async createOrganization(data: { name: string; description?: string }, actorUserId?: string): Promise<Organization> {
    // Check if organization name already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { name: data.name }
    });

    if (existingOrg) {
      throw new AppError('Organization name already exists', 409);
    }

    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        description: data.description,
      }
    });

    await AuditLogService.log({
      userId: actorUserId,
      action: 'organization.created',
      resourceType: 'Organization',
      resourceId: organization.id,
      details: data,
    });

    return organization;
  }

  static async listOrganizations(params: ListOrganizationsParams = {}): Promise<{
    organizations: OrganizationWithStats[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, search, isActive } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.OrganizationWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              departments: true,
              users: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.organization.count({ where })
    ]);

    return {
      organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getOrganization(id: string): Promise<OrganizationWithStats> {
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            departments: true,
            users: true,
          }
        }
      }
    });

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    return organization;
  }

  static async updateOrganization(id: string, data: { name?: string; description?: string; isActive?: boolean }, actorUserId?: string): Promise<Organization> {
    // Check if new name conflicts with existing organization
    if (data.name) {
      const existingOrg = await prisma.organization.findFirst({
        where: {
          name: data.name,
          NOT: { id }
        }
      });

      if (existingOrg) {
        throw new AppError('Organization name already exists', 409);
      }
    }

    const organization = await prisma.organization.update({
      where: { id },
      data
    });

    await AuditLogService.log({
      userId: actorUserId,
      action: 'organization.updated',
      resourceType: 'Organization',
      resourceId: id,
      details: data,
    });

    return organization;
  }

  static async deleteOrganization(id: string, actorUserId?: string): Promise<void> {
    // Check if organization has users or departments
    const orgWithCounts = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            departments: true,
            users: true,
          }
        }
      }
    });

    if (!orgWithCounts) {
      throw new AppError('Organization not found', 404);
    }

    if (orgWithCounts._count.departments > 0 || orgWithCounts._count.users > 0) {
      throw new AppError('Cannot delete organization with existing departments or users', 400);
    }

    await prisma.organization.delete({
      where: { id }
    });

    await AuditLogService.log({
      userId: actorUserId,
      action: 'organization.deleted',
      resourceType: 'Organization',
      resourceId: id,
      details: { organizationName: orgWithCounts.name },
    });
  }

  // Department Management
  static async createDepartment(data: {
    name: string;
    description?: string;
    organizationId: string;
    parentId?: string;
    managerId?: string;
  }, actorUserId?: string): Promise<Department> {
    // Validate organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: data.organizationId }
    });

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    // Check if department name already exists in the organization
    const existingDept = await prisma.department.findFirst({
      where: {
        organizationId: data.organizationId,
        name: data.name
      }
    });

    if (existingDept) {
      throw new AppError('Department name already exists in this organization', 409);
    }

    // Validate parent department if specified
    if (data.parentId) {
      const parentDept = await prisma.department.findFirst({
        where: {
          id: data.parentId,
          organizationId: data.organizationId
        }
      });

      if (!parentDept) {
        throw new AppError('Parent department not found or not in the same organization', 404);
      }
    }

    // Validate manager if specified
    if (data.managerId) {
      const manager = await prisma.user.findFirst({
        where: {
          id: data.managerId,
          organizationId: data.organizationId,
          isActive: true
        }
      });

      if (!manager) {
        throw new AppError('Manager not found or not in the same organization', 404);
      }
    }

    const department = await prisma.department.create({
      data: {
        name: data.name,
        description: data.description,
        organizationId: data.organizationId,
        parentId: data.parentId,
        managerId: data.managerId,
      }
    });

    await AuditLogService.log({
      userId: actorUserId,
      action: 'department.created',
      resourceType: 'Department',
      resourceId: department.id,
      details: data,
    });

    return department;
  }

  static async listDepartments(params: ListDepartmentsParams = {}): Promise<{
    departments: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, search, organizationId, isActive } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.DepartmentWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip,
        take: limit,
        include: {
          parent: true,
          children: true,
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          _count: {
            select: {
              users: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.department.count({ where })
    ]);

    return {
      departments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getDepartment(id: string): Promise<DepartmentWithHierarchy> {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            users: true,
          }
        },
        organization: true,
      }
    });

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    return department as any;
  }

  static async updateDepartment(id: string, data: {
    name?: string;
    description?: string;
    parentId?: string;
    managerId?: string;
    isActive?: boolean;
  }, actorUserId?: string): Promise<Department> {
    const existingDept = await prisma.department.findUnique({
      where: { id },
      include: { organization: true }
    });

    if (!existingDept) {
      throw new AppError('Department not found', 404);
    }

    // Check if new name conflicts within the organization
    if (data.name) {
      const conflictingDept = await prisma.department.findFirst({
        where: {
          organizationId: existingDept.organizationId,
          name: data.name,
          NOT: { id }
        }
      });

      if (conflictingDept) {
        throw new AppError('Department name already exists in this organization', 409);
      }
    }

    // Validate parent department if specified
    if (data.parentId) {
      if (data.parentId === id) {
        throw new AppError('Department cannot be its own parent', 400);
      }

      const parentDept = await prisma.department.findFirst({
        where: {
          id: data.parentId,
          organizationId: existingDept.organizationId
        }
      });

      if (!parentDept) {
        throw new AppError('Parent department not found or not in the same organization', 404);
      }

      // Check for circular reference
      const isCircular = await this.checkCircularReference(id, data.parentId);
      if (isCircular) {
        throw new AppError('Circular reference detected in department hierarchy', 400);
      }
    }

    // Validate manager if specified
    if (data.managerId) {
      const manager = await prisma.user.findFirst({
        where: {
          id: data.managerId,
          organizationId: existingDept.organizationId,
          isActive: true
        }
      });

      if (!manager) {
        throw new AppError('Manager not found or not in the same organization', 404);
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data
    });

    await AuditLogService.log({
      userId: actorUserId,
      action: 'department.updated',
      resourceType: 'Department',
      resourceId: id,
      details: data,
    });

    return department;
  }

  static async deleteDepartment(id: string, actorUserId?: string): Promise<void> {
    // Check if department has users or child departments
    const deptWithCounts = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            children: true,
          }
        }
      }
    });

    if (!deptWithCounts) {
      throw new AppError('Department not found', 404);
    }

    if (deptWithCounts._count.children > 0) {
      throw new AppError('Cannot delete department with child departments', 400);
    }

    if (deptWithCounts._count.users > 0) {
      throw new AppError('Cannot delete department with assigned users', 400);
    }

    await prisma.department.delete({
      where: { id }
    });

    await AuditLogService.log({
      userId: actorUserId,
      action: 'department.deleted',
      resourceType: 'Department',
      resourceId: id,
      details: { departmentName: deptWithCounts.name },
    });
  }

  // Utility Methods
  private static async checkCircularReference(departmentId: string, proposedParentId: string): Promise<boolean> {
    let currentParentId = proposedParentId;

    while (currentParentId) {
      if (currentParentId === departmentId) {
        return true; // Circular reference found
      }

      const parent = await prisma.department.findUnique({
        where: { id: currentParentId },
        select: { parentId: true }
      });

      if (!parent) {
        break;
      }

      currentParentId = parent.parentId || '';
    }

    return false;
  }

  static async getDepartmentHierarchy(organizationId: string): Promise<any[]> {
    const departments = await prisma.department.findMany({
      where: { 
        organizationId,
        isActive: true
      },
      include: {
        parent: true,
        children: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            users: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Build tree structure (root departments first)
    const rootDepartments = departments.filter(dept => !dept.parentId);
    
    return rootDepartments;
  }

  static async assignUserToOrganization(userId: string, organizationId: string, departmentId?: string, actorUserId?: string): Promise<void> {
    // Validate organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    // Validate department if specified
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          organizationId,
          isActive: true
        }
      });

      if (!department) {
        throw new AppError('Department not found or not in the specified organization', 404);
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        organizationId,
        departmentId,
      }
    });

    await AuditLogService.log({
      userId: actorUserId,
      action: 'user.organization.assigned',
      resourceType: 'User',
      resourceId: userId,
      details: { organizationId, departmentId },
    });
  }
}