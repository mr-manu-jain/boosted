import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as projectsApi from '../api/projects';
import * as entriesApi from '../api/entries';
import * as reportsApi from '../api/reports';

export function useProjects() {
  return useQuery({ queryKey: ['projects'], queryFn: projectsApi.listProjects });
}

export function useProjectStats(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: () => projectsApi.projectStats(projectId!),
    enabled: !!projectId,
  });
}

export function useTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => projectsApi.listTasks(projectId!),
    enabled: !!projectId,
  });
}

export function useEntries(params?: {
  from?: string;
  to?: string;
  projectId?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['entries', params ?? {}],
    queryFn: () => entriesApi.listEntries(params),
  });
}

export function useReportSummary(from: string, to: string) {
  return useQuery({
    queryKey: ['report', from, to],
    queryFn: () => reportsApi.fetchSummary(from, to),
  });
}

export function useHeatmap(from: string, to: string, projectId?: string) {
  return useQuery({
    queryKey: ['heatmap', from, to, projectId ?? 'all'],
    queryFn: () => reportsApi.fetchHeatmap(from, to, projectId),
  });
}

export function useGlance(periodType: 'day' | 'week', key: string) {
  return useQuery({
    queryKey: ['glance', periodType, key],
    queryFn: () =>
      periodType === 'day' ? reportsApi.fetchGlanceDay(key) : reportsApi.fetchGlanceWeek(key),
    staleTime: 5 * 60_000,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; name?: string; color?: string }) =>
      projectsApi.updateProject(id, input),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useArchiveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.archiveProject,
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => projectsApi.createTask(projectId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });
}

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; name?: string; completed?: boolean }) =>
      projectsApi.updateTask(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });
}

export function useArchiveTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.archiveTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: entriesApi.deleteEntry,
    onSuccess: () => qc.invalidateQueries(),
  });
}
