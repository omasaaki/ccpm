import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/env';
import { prisma } from './config/database';
import { globalErrorHandler } from './middleware/errorHandler';
import apiRoutes from './routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  if (config.nodeEnv === 'development') {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  }
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

// API routes
app.use(config.api.prefix, apiRoutes);

// Legacy API status endpoint for compatibility
app.get('/api/v1/status', (req, res) => {
  res.status(200).json({
    message: 'CCPM Backend API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      api: config.api.prefix,
      health: '/health',
      docs: `${config.api.prefix}/docs` // Future Swagger docs
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CCPM Backend API Server',
    version: '1.0.0',
    environment: config.nodeEnv,
    api: {
      prefix: config.api.prefix,
      version: config.api.version,
    },
    endpoints: {
      health: '/health',
      api: config.api.prefix,
      status: '/api/v1/status'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    message: 'The requested resource could not be found'
  });
});

// Global error handler
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
const server = app.listen(config.port, () => {
  console.log('🚀 CCPM Backend Server Started');
  console.log(`📍 Port: ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔗 API: http://localhost:${config.port}${config.api.prefix}`);
  console.log(`📊 Health: http://localhost:${config.port}/health`);
  console.log(`📚 API Documentation: ${config.api.prefix}/docs (coming soon)`);
});

// Handle server errors
server.on('error', (error: any) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      console.error(`Port ${config.port} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`Port ${config.port} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

export default app;