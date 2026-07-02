import { Router } from 'express';
import { resumeController } from '../controllers/resumeController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadResume } from '../middleware/upload.js';

const router = Router();

router.post('/upload', requireAuth, uploadResume.single('resume'), asyncHandler((req, res) => resumeController.upload(req, res)));
router.get('/', requireAuth, asyncHandler((req, res) => resumeController.list(req, res)));
router.delete('/:id', requireAuth, asyncHandler((req, res) => resumeController.remove(req, res)));

export default router;
