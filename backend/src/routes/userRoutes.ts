import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { validateBody } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin, requireManager } from '../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// User profile routes
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.put('/password', UserController.changePassword);

// Admin-only routes
router.get('/', requireAdmin, UserController.listUsers);

// Bulk operations (Admin-only) - must come before :id routes
router.put('/bulk/update', requireAdmin, UserController.bulkUpdate);
router.put('/bulk/activate', requireAdmin, UserController.bulkActivate);
router.put('/bulk/deactivate', requireAdmin, UserController.bulkDeactivate);
router.delete('/bulk/delete', requireAdmin, UserController.bulkDelete);

// Individual user operations
router.get('/:id', requireManager, UserController.getUser);
router.put('/:id', requireAdmin, UserController.updateUser);
router.put('/:id/activate', requireAdmin, UserController.activateUser);
router.put('/:id/deactivate', requireAdmin, UserController.deactivateUser);
router.delete('/:id', requireAdmin, UserController.deleteUser);

export default router;