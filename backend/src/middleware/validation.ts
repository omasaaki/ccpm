import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponse } from '../types/api';

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): Response<ApiResponse> | void => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errors: Record<string, string[]> = {};
      
      error.details.forEach((detail) => {
        const field = detail.path.join('.');
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(detail.message);
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors
      });
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): Response<ApiResponse> | void => {
    const { error, value } = schema.validate(req.query, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errors: Record<string, string[]> = {};
      
      error.details.forEach((detail) => {
        const field = detail.path.join('.');
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(detail.message);
      });

      return res.status(400).json({
        success: false,
        error: 'Query validation failed',
        errors
      });
    }

    req.query = value;
    next();
  };
};