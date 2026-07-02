import { api } from './api';
import type { Resume } from '../types';

export async function uploadResume(file: File, replaceId?: string | null) {
  const formData = new FormData();
  formData.append('resume', file);
  if (replaceId) {
    formData.append('replaceId', replaceId);
  }
  const { data } = await api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data as { resume: Resume };
}

export async function fetchResumes() {
  const { data } = await api.get('/resume');
  return data as { resumes: Resume[] };
}

export async function deleteResume(id: string) {
  const { data } = await api.delete(`/resume/${id}`);
  return data as { message: string };
}
