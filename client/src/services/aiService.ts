import { api } from './api';
import type { InterviewQuestions, MatchAnalysis } from '../types';

export async function matchResume(payload: { resumeId: string; jobId: string }) {
  const { data } = await api.post('/ai/match', payload);
  return data as { analysis: MatchAnalysis };
}

export async function generateQuestions(payload: { resumeId: string; jobId: string }) {
  const { data } = await api.post('/ai/questions', payload);
  return data as { questions: InterviewQuestions };
}

export async function enhanceBullet(payload: { bullet: string }) {
  const { data } = await api.post('/ai/enhance', payload);
  return data as { enhancedBullet: string };
}
