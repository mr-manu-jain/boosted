import { api } from './client';
import type { RunningEntry, TimeEntry } from '../types';

export async function getRunning(): Promise<RunningEntry | null> {
  const { data } = await api.get<{ running: RunningEntry | null }>('/entries/running');
  return data.running;
}

export async function startEntry(input: {
  projectId: string;
  taskId?: string | null;
}): Promise<TimeEntry> {
  const { data } = await api.post<{ entry: TimeEntry }>('/entries/start', input);
  return data.entry;
}

export async function stopEntry(id: string): Promise<TimeEntry> {
  const { data } = await api.post<{ entry: TimeEntry }>(`/entries/${id}/stop`);
  return data.entry;
}

export async function listEntries(params?: {
  from?: string;
  to?: string;
  projectId?: string;
  limit?: number;
}): Promise<TimeEntry[]> {
  const { data } = await api.get<{ entries: TimeEntry[] }>('/entries', { params });
  return data.entries;
}

export async function deleteEntry(id: string): Promise<void> {
  await api.delete(`/entries/${id}`);
}
