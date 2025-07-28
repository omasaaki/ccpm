import Joi from 'joi';

// Auth validation schemas
export const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      'string.alphanum': 'Username can only contain letters and numbers',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required'
    }),
    name: Joi.string().max(100).optional(),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  })
};

// Project validation schemas
export const projectSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(200).required().messages({
      'string.min': 'Project name is required',
      'string.max': 'Project name cannot exceed 200 characters',
      'any.required': 'Project name is required'
    }),
    description: Joi.string().max(1000).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional().messages({
      'date.min': 'End date must be after start date'
    })
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(200).optional(),
    description: Joi.string().max(1000).optional().allow(''),
    status: Joi.string().valid('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  })
};

// Task validation schemas
export const taskSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(200).required().messages({
      'string.min': 'Task title is required',
      'string.max': 'Task title cannot exceed 200 characters',
      'any.required': 'Task title is required'
    }),
    description: Joi.string().max(1000).optional(),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional(),
    duration: Joi.number().integer().min(1).optional().messages({
      'number.min': 'Duration must be at least 1 hour'
    }),
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional().messages({
      'date.min': 'End date must be after start date'
    }),
    dependencies: Joi.array().items(Joi.string()).optional()
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    description: Joi.string().max(1000).optional().allow(''),
    status: Joi.string().valid('TODO', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED').optional(),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional(),
    duration: Joi.number().integer().min(1).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  })
};

// Common query validation
export const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};