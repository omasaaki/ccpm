import express from 'express';
import { OrganizationController } from '../controllers/organizationController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin, requireManager, requirePermission } from '../middleware/rbac';
import { validateBody } from '../middleware/validation';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createOrganizationSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
});

const updateOrganizationSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(500).optional(),
  isActive: Joi.boolean().optional(),
});

const createDepartmentSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  organizationId: Joi.string().uuid().required(),
  parentId: Joi.string().uuid().optional(),
  managerId: Joi.string().uuid().optional(),
});

const updateDepartmentSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(500).optional(),
  parentId: Joi.string().uuid().optional().allow(null),
  managerId: Joi.string().uuid().optional().allow(null),
  isActive: Joi.boolean().optional(),
});

const assignUserSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  organizationId: Joi.string().uuid().required(),
  departmentId: Joi.string().uuid().optional(),
});

// Organization routes (Admin only)
router.post('/organizations',
  authenticateToken,
  requireAdmin,
  validateBody(createOrganizationSchema),
  OrganizationController.createOrganization
);

router.get('/organizations',
  authenticateToken,
  requireManager, // Manager+ can view organizations
  OrganizationController.listOrganizations
);

router.get('/organizations/:id',
  authenticateToken,
  requireManager,
  OrganizationController.getOrganization
);

router.put('/organizations/:id',
  authenticateToken,
  requireAdmin,
  validateBody(updateOrganizationSchema),
  OrganizationController.updateOrganization
);

router.delete('/organizations/:id',
  authenticateToken,
  requireAdmin,
  OrganizationController.deleteOrganization
);

// Department routes (Manager+ for read, Admin for write)
router.post('/departments',
  authenticateToken,
  requireAdmin,
  validateBody(createDepartmentSchema),
  OrganizationController.createDepartment
);

router.get('/departments',
  authenticateToken,
  requireManager,
  OrganizationController.listDepartments
);

router.get('/departments/:id',
  authenticateToken,
  requireManager,
  OrganizationController.getDepartment
);

router.put('/departments/:id',
  authenticateToken,
  requireAdmin,
  validateBody(updateDepartmentSchema),
  OrganizationController.updateDepartment
);

router.delete('/departments/:id',
  authenticateToken,
  requireAdmin,
  OrganizationController.deleteDepartment
);

router.get('/organizations/:organizationId/hierarchy',
  authenticateToken,
  requireManager,
  OrganizationController.getDepartmentHierarchy
);

// User assignment (Admin only)
router.post('/users/assign',
  authenticateToken,
  requireAdmin,
  validateBody(assignUserSchema),
  OrganizationController.assignUserToOrganization
);

export default router;