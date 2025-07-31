import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { validateBody, validateQuery } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { requireManager } from '../middleware/rbac';
import { projectSchemas, querySchemas } from '../utils/validation';
import Joi from 'joi';

const router = Router();

// Member management schemas
const addMemberSchema = Joi.object({
  userId: Joi.string().required(),
  role: Joi.string().valid('PM', 'MEMBER', 'VIEWER').required(),
  resourceRate: Joi.number().min(0).max(100).optional(),
});

const updateMemberSchema = Joi.object({
  role: Joi.string().valid('PM', 'MEMBER', 'VIEWER').optional(),
  resourceRate: Joi.number().min(0).max(100).optional(),
});

// All project routes require authentication
router.use(authenticateToken);

// Project CRUD routes
router.post('/', requireManager, validateBody(projectSchemas.create), ProjectController.create);
router.get('/', validateQuery(querySchemas.pagination), ProjectController.getByUser);
router.get('/:id', ProjectController.getById);
router.put('/:id', validateBody(projectSchemas.update), ProjectController.update);
router.delete('/:id', ProjectController.delete);

// Archive/Restore
router.put('/:id/archive', ProjectController.archive);
router.put('/:id/restore', ProjectController.restore);

// Project statistics
router.get('/:id/statistics', ProjectController.getStatistics);

// Member management
router.get('/:id/members', ProjectController.getMembers);
router.post('/:id/members', validateBody(addMemberSchema), ProjectController.addMember);
router.put('/:id/members/:memberId', validateBody(updateMemberSchema), ProjectController.updateMember);
router.delete('/:id/members/:memberId', ProjectController.removeMember);

export default router;