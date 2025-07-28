import { Router } from 'express';
import authRoutes from './authRoutes';
import projectRoutes from './projectRoutes';
import taskRoutes from './taskRoutes';
import { config } from '../config/env';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'CCPM API',
    version: config.api.version,
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: `${config.api.prefix}/auth`,
      projects: `${config.api.prefix}/projects`,
      tasks: `${config.api.prefix}/tasks`,
    }
  });
});

export default router;