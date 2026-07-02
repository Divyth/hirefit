import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/authController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateRequest } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
  ],
  validateRequest,
  asyncHandler((req, res) => authController.register(req, res))
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validateRequest,
  asyncHandler((req, res) => authController.login(req, res))
);

router.get('/profile', requireAuth, asyncHandler((req, res) => authController.profile(req, res)));

router.post('/logout', requireAuth, asyncHandler((_req, res) => res.json({ message: 'Logged out' })));

export default router;
