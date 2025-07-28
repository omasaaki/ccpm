import { Task } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { CreateTaskRequest, PaginationParams, PaginatedResponse } from '../types/api';

export class TaskService {
  // Create new task
  static async create(projectId: string, userId: string, data: CreateTaskRequest): Promise<Task> {
    // Verify project exists and user owns it
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Verify dependencies exist in the same project
    if (data.dependencies && data.dependencies.length > 0) {
      const dependencyTasks = await prisma.task.findMany({
        where: {
          id: { in: data.dependencies },
          projectId: projectId,
        }
      });

      if (dependencyTasks.length !== data.dependencies.length) {
        throw new AppError('Some dependency tasks not found in this project', 400);
      }
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
        ...(data.dependencies && data.dependencies.length > 0 && {
          dependencies: {
            connect: data.dependencies.map(id => ({ id }))
          }
        })
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        },
        dependencies: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        dependents: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        }
      }
    });

    return task;
  }

  // Get tasks by project
  static async getByProject(projectId: string, userId: string, params: PaginationParams): Promise<PaginatedResponse<Task>> {
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
          },
          dependencies: {
            select: {
              id: true,
              title: true,
              status: true,
            }
          },
          dependents: {
            select: {
              id: true,
              title: true,
              status: true,
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
        },
        dependencies: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        dependents: {
          select: {
            id: true,
            title: true,
            status: true,
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
    // Verify task exists and user has access
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
        },
        dependencies: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        dependents: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        }
      }
    });

    return task;
  }

  // Update task status
  static async updateStatus(taskId: string, userId: string, status: string): Promise<Task> {
    // Verify task exists and user has access
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
        },
        dependencies: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        dependents: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        }
      }
    });

    return task;
  }

  // Delete task
  static async delete(taskId: string, userId: string): Promise<void> {
    // Verify task exists and user has access
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

  // Add task dependency
  static async addDependency(taskId: string, dependencyId: string, userId: string): Promise<Task> {
    // Verify both tasks exist and user has access
    const [task, dependencyTask] = await Promise.all([
      prisma.task.findFirst({
        where: {
          id: taskId,
          project: { ownerId: userId }
        },
        include: { project: true }
      }),
      prisma.task.findFirst({
        where: {
          id: dependencyId,
          project: { ownerId: userId }
        }
      })
    ]);

    if (!task || !dependencyTask) {
      throw new AppError('Task not found', 404);
    }

    // Verify both tasks are in the same project
    if (task.projectId !== dependencyTask.projectId) {
      throw new AppError('Tasks must be in the same project', 400);
    }

    // Check for circular dependency
    const wouldCreateCircle = await this.checkCircularDependency(dependencyId, taskId);
    if (wouldCreateCircle) {
      throw new AppError('This would create a circular dependency', 400);
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        dependencies: {
          connect: { id: dependencyId }
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        },
        dependencies: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        dependents: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        }
      }
    });

    return updatedTask;
  }

  // Remove task dependency
  static async removeDependency(taskId: string, dependencyId: string, userId: string): Promise<Task> {
    // Verify task exists and user has access
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: { ownerId: userId }
      }
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        dependencies: {
          disconnect: { id: dependencyId }
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        },
        dependencies: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        dependents: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        }
      }
    });

    return updatedTask;
  }

  // Check for circular dependency
  private static async checkCircularDependency(startTaskId: string, targetTaskId: string): Promise<boolean> {
    const visited = new Set<string>();
    
    const checkPath = async (currentTaskId: string): Promise<boolean> => {
      if (currentTaskId === targetTaskId) {
        return true;
      }
      
      if (visited.has(currentTaskId)) {
        return false;
      }
      
      visited.add(currentTaskId);
      
      const dependencies = await prisma.task.findUnique({
        where: { id: currentTaskId },
        select: {
          dependencies: {
            select: { id: true }
          }
        }
      });
      
      if (!dependencies) {
        return false;
      }
      
      for (const dep of dependencies.dependencies) {
        if (await checkPath(dep.id)) {
          return true;
        }
      }
      
      return false;
    };
    
    return checkPath(startTaskId);
  }
}