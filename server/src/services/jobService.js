import { ObjectId } from 'mongodb';
import { getDb } from '../database/client.js';
import { COLLECTIONS } from '../database/collections.js';
import { HttpError } from '../utils/httpError.js';
import { textAnalysisService } from './textAnalysisService.js';

class JobService {
  collection() {
    return getDb().collection(COLLECTIONS.jobDescriptions);
  }

  async createJob(userId, payload) {
    const descriptionAnalysis = textAnalysisService.parseJobDescription(payload.description);
    const now = new Date();
    const document = {
      userId: new ObjectId(userId),
      title: payload.title,
      company: payload.company || '',
      location: payload.location || '',
      description: payload.description,
      parsedSkills: descriptionAnalysis.skills,
      parsedTechnologies: descriptionAnalysis.technologies,
      createdAt: now,
      updatedAt: now
    };
    const result = await this.collection().insertOne(document);
    return this.collection().findOne({ _id: result.insertedId });
  }

  async listJobs(userId) {
    return this.collection()
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async updateJob(userId, jobId, payload) {
    const job = await this.collection().findOne({ _id: new ObjectId(jobId), userId: new ObjectId(userId) });
    if (!job) throw new HttpError(404, 'Job description not found');
    const description = payload.description ?? job.description;
    const analysis = textAnalysisService.parseJobDescription(description);
    await this.collection().updateOne(
      { _id: job._id },
      {
        $set: {
          title: payload.title ?? job.title,
          company: payload.company ?? job.company,
          location: payload.location ?? job.location,
          description,
          parsedSkills: analysis.skills,
          parsedTechnologies: analysis.technologies,
          updatedAt: new Date()
        }
      }
    );
    return this.collection().findOne({ _id: job._id });
  }

  async deleteJob(userId, jobId) {
    const job = await this.collection().findOne({ _id: new ObjectId(jobId), userId: new ObjectId(userId) });
    if (!job) throw new HttpError(404, 'Job description not found');
    await this.collection().deleteOne({ _id: job._id });
    return job;
  }

  async getJobById(userId, jobId) {
    return this.collection().findOne({ _id: new ObjectId(jobId), userId: new ObjectId(userId) });
  }
}

export const jobService = new JobService();
