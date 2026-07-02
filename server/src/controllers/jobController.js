import { jobService } from '../services/jobService.js';

class JobController {
  async create(req, res) {
    const job = await jobService.createJob(req.user.sub, req.body);
    return res.status(201).json({ job });
  }

  async list(req, res) {
    const jobs = await jobService.listJobs(req.user.sub);
    return res.json({ jobs });
  }

  async update(req, res) {
    const job = await jobService.updateJob(req.user.sub, req.params.id, req.body);
    return res.json({ job });
  }

  async remove(req, res) {
    await jobService.deleteJob(req.user.sub, req.params.id);
    return res.json({ message: 'Job description deleted successfully' });
  }
}

export const jobController = new JobController();
