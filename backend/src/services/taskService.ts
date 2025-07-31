import { Task } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { CreateTaskRequest, PaginationParams, PaginatedResponse } from '../types/api';

export class TaskService {
  // Create new task
  static async create(projectId: string, userId: string, data: CreateTaskRequest): Promise<Task> {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        priority: data.priority as any || 'MEDIUM',
        duration: data.duration || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        projectId: projectId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return task;
  }

  // Get tasks by project
  static async getByProject(projectId: string, userId: string, params: PaginationParams): Promise<PaginatedResponse<Task>> {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: { projectId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }),
      prisma.task.count({
        where: { projectId }
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: tasks,
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

  // Get task by ID
  static async getById(taskId: string, userId: string): Promise<Task> {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          ownerId: userId,
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          }
        }
      }
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return task;
  }

  // Update task
  static async update(taskId: string, userId: string, data: Partial<CreateTaskRequest>): Promise<Task> {
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          ownerId: userId,
        }
      },
      include: {
        project: true,
      }
    });

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.priority && { priority: data.priority as any }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return task;
  }

  // Update task status
  static async updateStatus(taskId: string, userId: string, status: string): Promise<Task> {
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          ownerId: userId,
        }
      }
    });

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { status: status as any },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return task;
  }

  // Delete task
  static async delete(taskId: string, userId: string): Promise<void> {
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          ownerId: userId,
        }
      }
    });

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    await prisma.task.delete({
      where: { id: taskId }
    });
  }
}