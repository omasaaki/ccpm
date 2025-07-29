import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import projectRoutes from './projectRoutes';
import taskRoutes from './taskRoutes';
import auditLogRoutes from './auditLogRoutes';
import organizationRoutes from './organizationRoutes';
import { config } from '../config/env';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/', organizationRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'CCPM API',
    version: config.api.version,
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: `${config.api.prefix}/auth`,
      users: `${config.api.prefix}/users`,
      projects: `${config.api.prefix}/projects`,
      tasks: `${config.api.prefix}/tasks`,
      auditLogs: `${config.api.prefix}/audit-logs`,
      organizations: `${config.api.prefix}/organizations`,
      departments: `${config.api.prefix}/departments`,
    }
  });
});

export default router;