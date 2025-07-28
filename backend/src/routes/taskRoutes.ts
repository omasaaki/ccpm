import { Router } from 'express';
import { TaskController } from '../controllers/taskController';
import { validateBody, validateQuery } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { taskSchemas, querySchemas } from '../utils/validation';

const router = Router();

// All task routes require authentication
router.use(authenticateToken);

// Task CRUD routes
router.post('/project/:projectId', validateBody(taskSchemas.create), TaskController.create);
router.get('/project/:projectId', validateQuery(querySchemas.pagination), TaskController.getByProject);
router.get('/:id', TaskController.getById);
router.put('/:id', validateBody(taskSchemas.update), TaskController.update);
router.patch('/:id/status', TaskController.updateStatus);
router.delete('/:id', TaskController.delete);

// Task dependency management
router.post('/:id/dependencies', TaskController.addDependency);
router.delete('/:id/dependencies/:dependencyId', TaskController.removeDependency);

export default router;