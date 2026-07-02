import { resumeService } from '../services/resumeService.js';
import { HttpError } from '../utils/httpError.js';

class ResumeController {
  async upload(req, res) {
    if (!req.file) {
      throw new HttpError(400, 'Resume file is required');
    }
    const resume = await resumeService.createResume({
      userId: req.user.sub,
      file: req.file,
      replaceId: req.body.replaceId || req.body.resumeId || null
    });
    return res.status(201).json({ resume });
  }

  async list(req, res) {
    const resumes = await resumeService.listResumes(req.user.sub);
    return res.json({ resumes });
  }

  async remove(req, res) {
    await resumeService.deleteResume(req.user.sub, req.params.id);
    return res.json({ message: 'Resume deleted successfully' });
  }
}

export const resumeController = new ResumeController();
