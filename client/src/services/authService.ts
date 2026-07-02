import { api } from './api';
import type { User } from '../types';

export async function registerUser(payload: { name: string; email: string; password: string }) {
  const { data } = await api.post('/auth/register', payload);
  return data as { token: string; user: User };
}

export async function loginUser(payload: { email: string; password: string }) {
  const { data } = await api.post('/auth/login', payload);
  return data as { token: string; user: User };
}

export async function fetchProfile() {
  const { data } = await api.get('/auth/profile');
  return data as { user: User };
}
