import { Router } from 'express';
import { body } from 'express-validator';
import { aiController } from '../controllers/aiController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

router.post(
  '/match',
  requireAuth,
  [body('resumeId').isMongoId().withMessage('Valid resumeId is required'), body('jobId').isMongoId().withMessage('Valid jobId is required')],
  validateRequest,
  asyncHandler((req, res) => aiController.match(req, res))
);

router.post(
  '/questions',
  requireAuth,
  [body('resumeId').isMongoId().withMessage('Valid resumeId is required'), body('jobId').isMongoId().withMessage('Valid jobId is required')],
  validateRequest,
  asyncHandler((req, res) => aiController.questions(req, res))
);

router.post('/enhance', requireAuth, [body('bullet').trim().isLength({ min: 5 }).withMessage('Bullet text is required')], validateRequest, asyncHandler((req, res) => aiController.enhance(req, res)));

export default router;
