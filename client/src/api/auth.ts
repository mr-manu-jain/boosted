import { api } from './client';
import type { User } from '../types';

export async function signup(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const { data } = await api.post<{ user: User }>('/auth/signup', { ...input, timezone });
  return data.user;
}

export async function login(input: { email: string; password: string }): Promise<User> {
  const { data } = await api.post<{ user: User }>('/auth/login', input);
  return data.user;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function fetchMe(): Promise<User | null> {
  try {
    const { data } = await api.get<{ user: User }>('/auth/me');
    return data.user;
  } catch {
    return null;
  }
}
