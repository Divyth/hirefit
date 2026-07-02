import fs from 'fs/promises';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import { ObjectId } from 'mongodb';
import { getDb } from '../database/client.js';
import { COLLECTIONS } from '../database/collections.js';
import { HttpError } from '../utils/httpError.js';
import { textAnalysisService } from './textAnalysisService.js';
import { measure, recordMetric } from '../utils/metrics.js';

class ResumeService {
  collection() {
    return getDb().collection(COLLECTIONS.resumes);
  }

  async parseFile(filePath) {
    const { result } = await measure('resumeParse', async () => {
      const buffer = await fs.readFile(filePath);
      const parser = new PDFParse({ data: buffer });
      return parser.getText();
    }, (ms) => recordMetric('resumeParseMs', ms));
    return result.text || '';
  }

  async createResume({ userId, file, replaceId = null }) {
    const parsedText = await this.parseFile(file.path);
    const parsed = textAnalysisService.parseResume(parsedText);
    const now = new Date();
    const document = {
      userId: new ObjectId(userId),
      originalName: file.originalname,
      filename: path.basename(file.path),
      filePath: file.path,
      mimeType: file.mimetype,
      size: file.size,
      parsedText,
      extractedSkills: parsed.skills,
      extractedTechnologies: parsed.technologies,
      experience: parsed.experience,
      education: parsed.education,
      createdAt: now,
      updatedAt: now
    };

    if (replaceId) {
      const existing = await this.collection().findOne({ _id: new ObjectId(replaceId), userId: new ObjectId(userId) });
      if (!existing) throw new HttpError(404, 'Resume not found');
      await this.collection().updateOne(
        { _id: existing._id },
        { $set: { ...document, createdAt: existing.createdAt, updatedAt: now } }
      );
      await this.safeDeleteFile(existing.filePath);
      return this.collection().findOne({ _id: existing._id });
    }

    const result = await this.collection().insertOne(document);
    return this.collection().findOne({ _id: result.insertedId });
  }

  async listResumes(userId) {
    return this.collection()
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async deleteResume(userId, resumeId) {
    const resume = await this.collection().findOne({ _id: new ObjectId(resumeId), userId: new ObjectId(userId) });
    if (!resume) throw new HttpError(404, 'Resume not found');
    await this.collection().deleteOne({ _id: resume._id });
    await this.safeDeleteFile(resume.filePath);
    return resume;
  }

  async getResumeById(userId, resumeId) {
    return this.collection().findOne({ _id: new ObjectId(resumeId), userId: new ObjectId(userId) });
  }

  async safeDeleteFile(filePath) {
    if (!filePath) return;
    try {
      await fs.unlink(filePath);
    } catch {
      // File may already be gone.
    }
  }
}

export const resumeService = new ResumeService();
