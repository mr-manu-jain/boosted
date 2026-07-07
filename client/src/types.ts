export interface User {
  id: string;
  name: string;
  email: string;
  timezone: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  project: string;
  name: string;
  completed: boolean;
  archived: boolean;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  project: { id: string; name: string; color: string };
  task: { id: string; name: string } | null;
  startTime: string;
  endTime: string | null;
  durationSeconds: number | null;
  dayKey: string;
  note: string | null;
}

export interface RunningEntry {
  id: string;
  projectId: string;
  projectName: string;
  projectColor: string;
  taskId: string | null;
  taskName: string | null;
  startTime: string;
}

export interface ReportSummary {
  totalSeconds: number;
  averageDailySeconds: number;
  activeDays: number;
  projectsTracked: number;
  tasksTracked: number;
  durationPerDay: Array<{
    dayKey: string;
    totalSeconds: number;
    byProject: Record<string, number>;
  }>;
  distribution: Array<{
    projectId: string;
    name: string;
    color: string;
    seconds: number;
  }>;
}

export interface HeatmapData {
  days: Array<{ day: string; value: number }>;
  totalActiveDays: number;
  maxStreak: number;
  currentStreak: number;
  from: string;
  to: string;
}

export interface GlanceProjectStat {
  projectId: string;
  name: string;
  color: string;
  seconds: number;
  taskNames: string[];
}

export interface GlanceData {
  periodType: 'day' | 'week';
  periodKey: string;
  label: string;
  totalSeconds: number;
  previousTotalSeconds: number;
  entryCount: number;
  activeDays: number;
  projects: GlanceProjectStat[];
  aiSummary: string | null;
  aiTips: string | null;
}
