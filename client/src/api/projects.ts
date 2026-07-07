import { api } from './client';
import type { Project, Task } from '../types';

export async function listProjects(): Promise<Project[]> {
  const { data } = await api.get<{ projects: Project[] }>('/projects');
  return data.projects;
}

export async function createProject(input: { name: string; color: string }): Promise<Project> {
  const { data } = await api.post<{ project: Project }>('/projects', input);
  return data.project;
}

export async function updateProject(
  id: string,
  input: Partial<{ name: string; color: string }>,
): Promise<Project> {
  const { data } = await api.patch<{ project: Project }>(`/projects/${id}`, input);
  return data.project;
}

export async function archiveProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}

export async function projectStats(
  id: string,
): Promise<{ totalSeconds: number; byTask: Record<string, number> }> {
  const { data } = await api.get<{ totalSeconds: number; byTask: Record<string, number> }>(
    `/projects/${id}/stats`,
  );
  return data;
}

export async function listTasks(projectId: string): Promise<Task[]> {
  const { data } = await api.get<{ tasks: Task[] }>(`/projects/${projectId}/tasks`);
  return data.tasks;
}

export async function createTask(projectId: string, name: string): Promise<Task> {
  const { data } = await api.post<{ task: Task }>(`/projects/${projectId}/tasks`, { name });
  return data.task;
}

export async function updateTask(
  id: string,
  input: Partial<{ name: string; completed: boolean }>,
): Promise<Task> {
  const { data } = await api.patch<{ task: Task }>(`/tasks/${id}`, input);
  return data.task;
}

export async function archiveTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}
