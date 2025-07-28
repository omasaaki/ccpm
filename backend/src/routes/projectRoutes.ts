import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { validateBody, validateQuery } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { projectSchemas, querySchemas } from '../utils/validation';

const router = Router();

// All project routes require authentication
router.use(authenticateToken);

// Project CRUD routes
router.post('/', validateBody(projectSchemas.create), ProjectController.create);
router.get('/', validateQuery(querySchemas.pagination), ProjectController.getByUser);
router.get('/:id', ProjectController.getById);
router.put('/:id', validateBody(projectSchemas.update), ProjectController.update);
router.delete('/:id', ProjectController.delete);

// Project statistics
router.get('/:id/statistics', ProjectController.getStatistics);

export default router;