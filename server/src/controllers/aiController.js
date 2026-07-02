import { HttpError } from '../utils/httpError.js';
import { matchService } from '../services/matchService.js';
import { questionService } from '../services/questionService.js';
import { bulletService } from '../services/bulletService.js';

class AiController {
  async match(req, res) {
    const { resumeId, jobId } = req.body;
    const analysis = await matchService.analyze(req.user.sub, resumeId, jobId);
    return res.json({ analysis });
  }

  async questions(req, res) {
    const { resumeId, jobId } = req.body;
    const questions = await questionService.generate(req.user.sub, resumeId, jobId);
    return res.json({ questions });
  }

  async enhance(req, res) {
    const { bullet } = req.body;
    if (!bullet || !bullet.trim()) {
      throw new HttpError(400, 'Bullet text is required');
    }
    const enhancedBullet = await bulletService.enhance(bullet.trim());
    return res.json({ enhancedBullet });
  }
}

export const aiController = new AiController();
