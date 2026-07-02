import { ObjectId } from 'mongodb';
import { textAnalysisService } from './textAnalysisService.js';
import { geminiService } from './geminiService.js';
import { getDb } from '../database/client.js';
import { COLLECTIONS } from '../database/collections.js';
import { HttpError } from '../utils/httpError.js';
import { measure, recordMetric, incrementMetric } from '../utils/metrics.js';

class MatchService {
  resumeCollection() {
    return getDb().collection(COLLECTIONS.resumes);
  }

  jobCollection() {
    return getDb().collection(COLLECTIONS.jobDescriptions);
  }

  analysisCollection() {
    return getDb().collection(COLLECTIONS.resumeAnalysis);
  }

  async getResume(userId, resumeId) {
    const collection = this.resumeCollection();
    const userObjectId = new ObjectId(userId);
    if (resumeId) {
      const byId = await collection.findOne({ _id: new ObjectId(resumeId), userId: userObjectId });
      if (byId) return byId;
    }
    return collection.find({ userId: userObjectId }).sort({ createdAt: -1 }).toArray().then((items) => items[0] || null);
  }

  async getJob(userId, jobId) {
    const collection = this.jobCollection();
    const userObjectId = new ObjectId(userId);
    if (jobId) {
      const byId = await collection.findOne({ _id: new ObjectId(jobId), userId: userObjectId });
      if (byId) return byId;
    }
    return collection.find({ userId: userObjectId }).sort({ createdAt: -1 }).toArray().then((items) => items[0] || null);
  }

  computeScore(resume, job) {
    const resumeSkills = new Set([...(resume.extractedSkills || []), ...(resume.extractedTechnologies || [])]);
    const jobSkills = new Set([...(job.parsedSkills || []), ...(job.parsedTechnologies || [])]);
    const matchedSkills = [...jobSkills].filter((skill) => resumeSkills.has(skill));
    const missingSkills = [...jobSkills].filter((skill) => !resumeSkills.has(skill));

    const skillCoverage = jobSkills.size ? matchedSkills.length / jobSkills.size : 0.5;
    const experienceBonus = Math.min(Number(resume.experience?.years || 0) * 8, 20);
    const educationBonus = resume.education?.terms?.length ? 8 : 0;
    const densityBonus = Math.min(resumeSkills.size * 1.5, 12);
    const overallScore = Math.min(100, Math.round(skillCoverage * 60 + experienceBonus + educationBonus + densityBonus));

    const strengths = [];
    if (matchedSkills.length) strengths.push(`Matches ${matchedSkills.length} of ${jobSkills.size || 1} job skills.`);
    if (resume.experience?.years) strengths.push(`Experience signals suggest about ${resume.experience.years}+ years.`);
    if (resume.education?.terms?.length) strengths.push(`Education section is present.`);

    const weaknesses = [];
    if (missingSkills.length) weaknesses.push(`Missing ${missingSkills.slice(0, 4).join(', ')}.`);
    if (!resume.experience?.years) weaknesses.push('No explicit years of experience detected.');
    if (!resume.education?.terms?.length) weaknesses.push('No clear education markers detected.');

    const suggestions = [];
    if (missingSkills.length) suggestions.push(`Learn or highlight ${missingSkills.slice(0, 5).join(', ')}.`);
    if (!resume.experience?.years) suggestions.push('Add measurable project experience or internship details.');
    if (!resume.education?.terms?.length) suggestions.push('Make education credentials easier to find.');

    return {
      overallScore,
      matchedSkills,
      missingSkills,
      strengths,
      weaknesses,
      suggestions
    };
  }

  async explainScore({ resume, job, matchResult }) {
    try {
      const prompt = `You are an experienced technical recruiter.\n\nGiven\nResume\n${resume.parsedText}\n\nMatched Skills\n${matchResult.matchedSkills.join(', ')}\n\nMissing Skills\n${matchResult.missingSkills.join(', ')}\n\nOverall Score\n${matchResult.overallScore}\n\nExplain\nStrengths\nWeaknesses\nSkills to Learn\n\nKeep response under 200 words.\nReturn JSON only.`;
      const schemaDescription = 'Return an object with a single key "explanation" containing a concise plain-English paragraph.';
      const { result: aiResponse, ms } = await measure('geminiExplain', () => geminiService.generateJson({
        systemInstruction: 'You are an experienced technical recruiter.',
        prompt,
        schemaDescription
      }), (duration) => recordMetric('geminiExplainMs', duration));
      const explanation = aiResponse?.explanation || this.fallbackExplanation(matchResult, job);
      if (!aiResponse?.explanation) incrementMetric('fallbackCount');
      return explanation;
    } catch {
      incrementMetric('fallbackCount');
      return this.fallbackExplanation(matchResult, job);
    }
  }

  fallbackExplanation(matchResult, job) {
    const parts = [];
    parts.push(`This resume matches the role at ${job.title}.`);
    parts.push(`The strongest overlap is ${matchResult.matchedSkills.slice(0, 5).join(', ') || 'limited direct skill overlap'}.`);
    if (matchResult.missingSkills.length) {
      parts.push(`The main gaps are ${matchResult.missingSkills.slice(0, 4).join(', ')}.`);
    }
    parts.push(`Overall, the profile scores ${matchResult.overallScore}/100 based on keyword alignment and experience signals.`);
    return parts.join(' ');
  }

  async analyze(userId, resumeId, jobId) {
    const [resume, job] = await Promise.all([this.getResume(userId, resumeId), this.getJob(userId, jobId)]);

    if (!resume || !job) {
      throw new HttpError(404, 'Resume or job description not found');
    }

    const { result: matchResult, ms } = await measure('skillScore', () => this.computeScore(resume, job), (duration) => recordMetric('skillScoreMs', duration));
    const explanation = await this.explainScore({ resume, job, matchResult });
    const payload = {
      userId: new ObjectId(userId),
      resumeId: resume._id,
      jobId: job._id,
      ...matchResult,
      explanation,
      createdAt: new Date()
    };

    const result = await this.analysisCollection().insertOne(payload);
    return this.analysisCollection().findOne({ _id: result.insertedId });
  }
}

export const matchService = new MatchService();
