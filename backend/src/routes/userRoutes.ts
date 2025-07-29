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
router.get('/:id', requireManager, UserController.getUser);
router.put('/:id', requireAdmin, UserController.updateUser);
router.put('/:id/activate', requireAdmin, UserController.activateUser);
router.put('/:id/deactivate', requireAdmin, UserController.deactivateUser);
router.delete('/:id', requireAdmin, UserController.deleteUser);

export default router;