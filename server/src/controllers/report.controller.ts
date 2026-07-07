import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TimeEntry } from '../models/TimeEntry.js';
import { Project } from '../models/Project.js';
import { HttpError } from '../middleware/errorHandler.js';
import { shiftDayKey } from '../utils/dateKey.js';

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseRange(req: Request): { from: string; to: string } {
  const { from, to } = req.query as Record<string, string | undefined>;
  if (!from || !to || !DAY_KEY_RE.test(from) || !DAY_KEY_RE.test(to) || from > to) {
    throw new HttpError(400, 'Provide a valid from/to range (YYYY-MM-DD)');
  }
  return { from, to };
}

interface DayProjectRow {
  _id: { dayKey: string; project: mongoose.Types.ObjectId };
  seconds: number;
  tasks: Array<mongoose.Types.ObjectId | null>;
}

async function aggregateByDayAndProject(
  userId: string,
  from: string,
  to: string,
  projectId?: string,
): Promise<DayProjectRow[]> {
  const match: Record<string, unknown> = {
    user: new mongoose.Types.ObjectId(userId),
    endTime: { $ne: null },
    dayKey: { $gte: from, $lte: to },
  };
  if (projectId) match.project = new mongoose.Types.ObjectId(projectId);

  return TimeEntry.aggregate<DayProjectRow>([
    { $match: match },
    {
      $group: {
        _id: { dayKey: '$dayKey', project: '$project' },
        seconds: { $sum: '$durationSeconds' },
        tasks: { $addToSet: '$task' },
      },
    },
    { $sort: { '_id.dayKey': 1 } },
  ]);
}

export async function reportSummary(req: Request, res: Response) {
  const { from, to } = parseRange(req);
  const rows = await aggregateByDayAndProject(req.userId, from, to);

  const projects = await Project.find({ user: req.userId }).select('name color');
  const projectMeta = new Map(
    projects.map((p) => [String(p._id), { name: p.name, color: p.color }]),
  );

  const perDay = new Map<string, { totalSeconds: number; byProject: Record<string, number> }>();
  const perProject = new Map<string, number>();
  const taskIds = new Set<string>();
  let totalSeconds = 0;

  for (const row of rows) {
    const dayKey = row._id.dayKey;
    const projectId = String(row._id.project);
    let day = perDay.get(dayKey);
    if (!day) {
      day = { totalSeconds: 0, byProject: {} };
      perDay.set(dayKey, day);
    }
    day.totalSeconds += row.seconds;
    day.byProject[projectId] = (day.byProject[projectId] ?? 0) + row.seconds;
    perProject.set(projectId, (perProject.get(projectId) ?? 0) + row.seconds);
    totalSeconds += row.seconds;
    for (const t of row.tasks) if (t) taskIds.add(String(t));
  }

  const activeDays = perDay.size;
  const durationPerDay = [...perDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dayKey, v]) => ({ dayKey, totalSeconds: v.totalSeconds, byProject: v.byProject }));

  const distribution = [...perProject.entries()]
    .map(([projectId, seconds]) => ({
      projectId,
      name: projectMeta.get(projectId)?.name ?? 'Unknown',
      color: projectMeta.get(projectId)?.color ?? '#898781',
      seconds,
    }))
    .sort((a, b) => b.seconds - a.seconds);

  res.json({
    totalSeconds,
    averageDailySeconds: activeDays > 0 ? Math.round(totalSeconds / activeDays) : 0,
    activeDays,
    projectsTracked: perProject.size,
    tasksTracked: taskIds.size,
    durationPerDay,
    distribution,
  });
}

export async function reportHeatmap(req: Request, res: Response) {
  const { from, to } = parseRange(req);
  const { projectId } = req.query as Record<string, string | undefined>;
  const rows = await aggregateByDayAndProject(req.userId, from, to, projectId);

  const perDay = new Map<string, number>();
  for (const row of rows) {
    perDay.set(row._id.dayKey, (perDay.get(row._id.dayKey) ?? 0) + row.seconds);
  }

  const activeDayKeys = [...perDay.keys()].sort();
  let maxStreak = 0;
  let streak = 0;
  let prev: string | null = null;
  for (const key of activeDayKeys) {
    streak = prev !== null && shiftDayKey(prev, 1) === key ? streak + 1 : 1;
    if (streak > maxStreak) maxStreak = streak;
    prev = key;
  }

  // current streak: consecutive active days ending at the range end (or the day before)
  let currentStreak = 0;
  let cursor = to;
  if (!perDay.has(cursor)) cursor = shiftDayKey(cursor, -1);
  while (perDay.has(cursor)) {
    currentStreak += 1;
    cursor = shiftDayKey(cursor, -1);
  }

  res.json({
    days: activeDayKeys.map((day) => ({ day, value: perDay.get(day) ?? 0 })),
    totalActiveDays: activeDayKeys.length,
    maxStreak,
    currentStreak,
    from,
    to,
  });
}
