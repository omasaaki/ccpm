import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateBody } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { authSchemas } from '../utils/validation';

const router = Router();

// Public routes
router.post('/register', validateBody(authSchemas.register), AuthController.register);
router.post('/login', validateBody(authSchemas.login), AuthController.login);
router.post('/refresh', AuthController.refreshTokens);
router.post('/password-reset/request', AuthController.requestPasswordReset);
router.post('/password-reset/confirm', AuthController.resetPassword);
router.post('/email/verify', AuthController.verifyEmail);
router.post('/email/resend-verification', AuthController.resendVerificationEmail);

// Protected routes
router.use(authenticateToken);
router.get('/profile', AuthController.getProfile);
router.post('/logout', AuthController.logout);

export default router;