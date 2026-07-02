import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { HttpError } from '../utils/httpError.js';

const uploadRoot = path.resolve(process.cwd(), 'uploads');
const resumeUploadDir = path.join(uploadRoot, 'resumes');

fs.mkdirSync(resumeUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, resumeUploadDir),
  filename: (_req, file, cb) => {
    const stamp = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${stamp}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
  }
});

function fileFilter(_req, file, cb) {
  const allowed = file.mimetype === 'application/pdf';
  if (!allowed) {
    cb(new HttpError(400, 'Only PDF files are allowed'));
    return;
  }
  cb(null, true);
}

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});
