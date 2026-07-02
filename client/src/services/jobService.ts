import { api } from './api';
import type { JobDescription } from '../types';

export async function fetchJobs() {
  const { data } = await api.get('/jobs');
  return data as { jobs: JobDescription[] };
}

export async function createJob(payload: { title: string; company?: string; location?: string; description: string }) {
  const { data } = await api.post('/jobs', payload);
  return data as { job: JobDescription };
}

export async function updateJob(id: string, payload: { title: string; company?: string; location?: string; description: string }) {
  const { data } = await api.put(`/jobs/${id}`, payload);
  return data as { job: JobDescription };
}

export async function deleteJob(id: string) {
  const { data } = await api.delete(`/jobs/${id}`);
  return data as { message: string };
}
