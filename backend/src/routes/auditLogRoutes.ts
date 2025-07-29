import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLogController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin, requireManager } from '../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Admin and Manager routes
router.get('/', requireManager, AuditLogController.getAuditLogs);
router.get('/:id', requireManager, AuditLogController.getAuditLog);
router.get('/user/:userId', requireManager, AuditLogController.getUserAuditLogs);

export default router;