import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError, PrismaClientValidationError, PrismaClientUnknownRequestError } from '@prisma/client/runtime/library';
import { config } from '../config/env';
import { ApiResponse } from '../types/api';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Error:', err);

  // Prisma validation error
  if (err instanceof PrismaClientValidationError) {
    const message = 'Invalid data provided';
    error = new AppError(message, 400);
  }

  // Prisma known request error
  if (err instanceof PrismaClientKnownRequestError) {
    let message = 'Database operation failed';
    let statusCode = 400;

    switch (err.code) {
      case 'P2002':
        message = 'Duplicate entry found';
        statusCode = 409;
        break;
      case 'P2025':
        message = 'Record not found';
        statusCode = 404;
        break;
      case 'P2003':
        message = 'Foreign key constraint failed';
        statusCode = 400;
        break;
    }

    error = new AppError(message, statusCode);
  }

  // Prisma service error
  if (err instanceof PrismaClientUnknownRequestError) {
    const message = 'Database service error';
    error = new AppError(message, 500);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401);
  }

  // Default operational error
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
  }

  // Programming or unknown error
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(config.nodeEnv === 'development' && { 
      message: err.message,
      stack: err.stack 
    })
  });
};