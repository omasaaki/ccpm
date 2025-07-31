import { Project, ProjectRole, ProjectStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { CreateProjectRequest, UpdateProjectRequest, PaginationParams, PaginatedResponse } from '../types/api';
import { AuditLogService } from './auditLogService';

interface AddMemberData {
  userId: string;
  role: ProjectRole;
  resourceRate?: number;
}

interface UpdateMemberData {
  role?: ProjectRole;
  resourceRate?: number;
}

export class ProjectService {
  // Create new project
  static async create(userId: string, data: CreateProjectRequest): Promise<Project> {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        ownerId: userId,
        organizationId: data.organizationId,
        members: {
          create: {
            userId,
            role: 'PM',
            resourceRate: 100,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        },
        organization: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          }
        }
      }
    });

    await AuditLogService.log({
      userId,
      action: 'project.created',
      resourceType: 'Project',
      resourceId: project.id,
      details: { name: project.name },
    });

    return project;
  }

  // Get paginated projects for user
  static async getByUser(userId: string, params: PaginationParams & { status?: ProjectStatus; isArchived?: boolean; search?: string }, userRole: string): Promise<PaginatedResponse<Project>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status, isArchived = false, search } = params;
    const skip = (page - 1) * limit;

    const where: any = { isArchived };

    // Role-based filtering
    if (userRole === 'USER') {
      where.members = {
        some: { userId },
      };
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }


    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              name: true,
            }
          },
          organization: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              tasks: true,
              members: true,
            }
          }
        }
      }),
      prisma.project.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    };
  }

  // Get project by ID
  static async getById(projectId: string, userId: string, userRole: string): Promise<Project> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        },
        organization: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Limit tasks in project detail
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          }
        }
      }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Check access permissions
    if (userRole === 'USER') {
      const isMember = ((project as any).members || []).some((member: any) => member.userId === userId);
      if (!isMember) {
        throw new AppError('Access denied', 403);
      }
    }

    return project;
  }

  // Update project
  static async update(projectId: string, userId: string, data: UpdateProjectRequest, userRole: string): Promise<Project> {
    // Check access
    const project = await this.getById(projectId, userId, userRole);

    // Only PM or ADMIN can update
    if (userRole === 'USER') {
      const member = ((project as any).members || []).find((m: any) => m.userId === userId);
      if (!member || member.role !== 'PM') {
        throw new AppError('Only project manager can update project', 403);
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status as ProjectStatus }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        },
        organization: true,
        _count: {
          select: {
            tasks: true,
            members: true,
          }
        }
      }
    });

    await AuditLogService.log({
      userId,
      action: 'project.updated',
      resourceType: 'Project',
      resourceId: projectId,
      details: data,
    });

    return updatedProject;
  }

  // Delete project
  static async delete(projectId: string, userId: string, userRole: string): Promise<void> {
    // Check access
    const project = await this.getById(projectId, userId, userRole);

    // Only PM or ADMIN can delete
    if (userRole === 'USER') {
      const member = ((project as any).members || []).find((m: any) => m.userId === userId);
      if (!member || member.role !== 'PM') {
        throw new AppError('Only project manager can delete project', 403);
      }
    }

    await prisma.project.delete({
      where: { id: projectId }
    });

    await AuditLogService.log({
      userId,
      action: 'project.deleted',
      resourceType: 'Project',
      resourceId: projectId,
      details: { name: project.name },
    });
  }

  // Archive/Restore project
  static async archiveProject(projectId: string, archive: boolean, userId: string, userRole: string): Promise<Project> {
    const project = await this.getById(projectId, userId, userRole);

    // Only PM or ADMIN can archive
    if (userRole === 'USER') {
      const member = ((project as any).members || []).find((m: any) => m.userId === userId);
      if (!member || member.role !== 'PM') {
        throw new AppError('Only project manager can archive project', 403);
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { isArchived: archive },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        },
        organization: true,
        _count: {
          select: {
            tasks: true,
            members: true,
          }
        }
      }
    });

    await AuditLogService.log({
      userId,
      action: archive ? 'project.archived' : 'project.restored',
      resourceType: 'Project',
      resourceId: projectId,
    });

    return updatedProject;
  }

  // Add member to project
  static async addMember(projectId: string, data: AddMemberData, currentUserId: string, userRole: string): Promise<any> {
    const project = await this.getById(projectId, currentUserId, userRole);

    // Only PM or ADMIN can add members
    if (userRole === 'USER') {
      const member = ((project as any).members || []).find((m: any) => m.userId === currentUserId);
      if (!member || member.role !== 'PM') {
        throw new AppError('Only project manager can add members', 403);
      }
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: data.userId,
        },
      },
    });

    if (existingMember) {
      throw new AppError('User is already a member of this project', 409);
    }

    const newMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId: data.userId,
        role: data.role,
        resourceRate: data.resourceRate || 100,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });

    await AuditLogService.log({
      userId: currentUserId,
      action: 'project.member.added',
      resourceType: 'Project',
      resourceId: projectId,
      details: { memberId: data.userId, role: data.role },
    });

    return newMember;
  }

  // Update member role/resource rate
  static async updateMember(
    projectId: string,
    memberId: string,
    data: UpdateMemberData,
    currentUserId: string,
    userRole: string
  ): Promise<any> {
    const project = await this.getById(projectId, currentUserId, userRole);

    // Only PM or ADMIN can update members
    if (userRole === 'USER') {
      const member = ((project as any).members || []).find((m: any) => m.userId === currentUserId);
      if (!member || member.role !== 'PM') {
        throw new AppError('Only project manager can update members', 403);
      }
    }

    const updatedMember = await prisma.projectMember.update({
      where: { id: memberId },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });

    await AuditLogService.log({
      userId: currentUserId,
      action: 'project.member.updated',
      resourceType: 'Project',
      resourceId: projectId,
      details: { memberId, changes: data },
    });

    return updatedMember;
  }

  // Remove member from project
  static async removeMember(projectId: string, memberId: string, currentUserId: string, userRole: string): Promise<void> {
    const project = await this.getById(projectId, currentUserId, userRole);

    // Only PM or ADMIN can remove members
    if (userRole === 'USER') {
      const member = ((project as any).members || []).find((m: any) => m.userId === currentUserId);
      if (!member || member.role !== 'PM') {
        throw new AppError('Only project manager can remove members', 403);
      }
    }

    // Cannot remove the last PM
    const memberToRemove = await prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (memberToRemove?.role === 'PM') {
      const pmCount = await prisma.projectMember.count({
        where: {
          projectId,
          role: 'PM',
        },
      });

      if (pmCount <= 1) {
        throw new AppError('Cannot remove the last project manager', 400);
      }
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    await AuditLogService.log({
      userId: currentUserId,
      action: 'project.member.removed',
      resourceType: 'Project',
      resourceId: projectId,
      details: { memberId },
    });
  }

  // Get project statistics
  static async getStatistics(projectId: string, userId: string, userRole: string) {
    // Verify project access
    await this.getById(projectId, userId, userRole);

    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      memberStats,
      recentActivity,
    ] = await Promise.all([
      prisma.task.count({ where: { projectId } }),
      prisma.task.count({ where: { projectId, status: 'COMPLETED' } }),
      prisma.task.count({ where: { projectId, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { projectId, status: 'TODO' } }),
      prisma.projectMember.groupBy({
        by: ['role'],
        where: { projectId },
        _count: true,
      }),
      prisma.auditLog.findMany({
        where: {
          entity: 'Project',
          entityId: projectId,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      members: memberStats,
      recentActivity,
    };
  }
}