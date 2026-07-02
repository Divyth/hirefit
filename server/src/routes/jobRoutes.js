import { Router } from 'express';
import { body } from 'express-validator';
import { jobController } from '../controllers/jobController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

const jobValidation = [
  body('title').trim().isLength({ min: 2 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters long')
];

router.post('/', requireAuth, jobValidation, validateRequest, asyncHandler((req, res) => jobController.create(req, res)));
router.get('/', requireAuth, asyncHandler((req, res) => jobController.list(req, res)));
router.put('/:id', requireAuth, jobValidation, validateRequest, asyncHandler((req, res) => jobController.update(req, res)));
router.delete('/:id', requireAuth, asyncHandler((req, res) => jobController.remove(req, res)));

export default router;
