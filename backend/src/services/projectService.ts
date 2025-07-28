import { Project } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { CreateProjectRequest, UpdateProjectRequest, PaginationParams, PaginatedResponse } from '../types/api';

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
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        },
        _count: {
          select: {
            tasks: true,
          }
        }
      }
    });

    return project;
  }

  // Get paginated projects for user
  static async getByUser(userId: string, params: PaginationParams): Promise<PaginatedResponse<Project>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { ownerId: userId },
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
          _count: {
            select: {
              tasks: true,
            }
          }
        }
      }),
      prisma.project.count({
        where: { ownerId: userId }
      })
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
  static async getById(projectId: string, userId: string): Promise<Project> {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Limit tasks in project detail
        },
        _count: {
          select: {
            tasks: true,
          }
        }
      }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    return project;
  }

  // Update project
  static async update(projectId: string, userId: string, data: UpdateProjectRequest): Promise<Project> {
    // Verify project exists and user owns it
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      }
    });

    if (!existingProject) {
      throw new AppError('Project not found', 404);
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status as any }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        },
        _count: {
          select: {
            tasks: true,
          }
        }
      }
    });

    return project;
  }

  // Delete project
  static async delete(projectId: string, userId: string): Promise<void> {
    // Verify project exists and user owns it
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      }
    });

    if (!existingProject) {
      throw new AppError('Project not found', 404);
    }

    await prisma.project.delete({
      where: { id: projectId }
    });
  }

  // Get project statistics
  static async getStatistics(projectId: string, userId: string) {
    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
    ] = await Promise.all([
      prisma.task.count({ where: { projectId } }),
      prisma.task.count({ where: { projectId, status: 'COMPLETED' } }),
      prisma.task.count({ where: { projectId, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { projectId, status: 'TODO' } }),
    ]);

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  }
}