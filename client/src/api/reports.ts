import { api } from './client';
import type { GlanceData, HeatmapData, ReportSummary } from '../types';

export async function fetchSummary(from: string, to: string): Promise<ReportSummary> {
  const { data } = await api.get<ReportSummary>('/reports/summary', { params: { from, to } });
  return data;
}

export async function fetchHeatmap(
  from: string,
  to: string,
  projectId?: string,
): Promise<HeatmapData> {
  const { data } = await api.get<HeatmapData>('/reports/heatmap', {
    params: { from, to, ...(projectId ? { projectId } : {}) },
  });
  return data;
}

export async function fetchGlanceDay(date: string): Promise<GlanceData> {
  const { data } = await api.get<{ glance: GlanceData }>('/glance/day', { params: { date } });
  return data.glance;
}

export async function fetchGlanceWeek(weekStart: string): Promise<GlanceData> {
  const { data } = await api.get<{ glance: GlanceData }>('/glance/week', {
    params: { weekStart },
  });
  return data.glance;
}
