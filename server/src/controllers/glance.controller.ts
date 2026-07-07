import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TimeEntry } from '../models/TimeEntry.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { GlanceSummary } from '../models/GlanceSummary.js';
import { HttpError } from '../middleware/errorHandler.js';
import { getDayKey, isoWeekKey, shiftDayKey, weekStartKey } from '../utils/dateKey.js';
import { generateGlanceSummary } from '../services/groq.service.js';

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

interface PeriodStats {
  totalSeconds: number;
  entryCount: number;
  activeDays: number;
  projects: Array<{
    projectId: string;
    name: string;
    color: string;
    seconds: number;
    taskNames: string[];
  }>;
}

async function periodStats(userId: string, from: string, to: string): Promise<PeriodStats> {
  const rows = await TimeEntry.aggregate<{
    _id: mongoose.Types.ObjectId;
    seconds: number;
    entryCount: number;
    days: string[];
    tasks: Array<mongoose.Types.ObjectId | null>;
  }>([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        endTime: { $ne: null },
        dayKey: { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: '$project',
        seconds: { $sum: '$durationSeconds' },
        entryCount: { $sum: 1 },
        days: { $addToSet: '$dayKey' },
        tasks: { $addToSet: '$task' },
      },
    },
    { $sort: { seconds: -1 } },
  ]);

  const projectMeta = new Map(
    (await Project.find({ user: userId }).select('name color')).map((p) => [
      String(p._id),
      { name: p.name, color: p.color },
    ]),
  );

  const allTaskIds = rows.flatMap((r) => r.tasks.filter(Boolean).map(String));
  const taskNames = new Map(
    (await Task.find({ _id: { $in: allTaskIds } }).select('name')).map((t) => [
      String(t._id),
      t.name,
    ]),
  );

  const allDays = new Set<string>();
  let totalSeconds = 0;
  let entryCount = 0;
  const projects = rows.map((row) => {
    totalSeconds += row.seconds;
    entryCount += row.entryCount;
    for (const d of row.days) allDays.add(d);
    const id = String(row._id);
    return {
      projectId: id,
      name: projectMeta.get(id)?.name ?? 'Unknown',
      color: projectMeta.get(id)?.color ?? '#898781',
      seconds: row.seconds,
      taskNames: row.tasks
        .filter(Boolean)
        .map((t) => taskNames.get(String(t)))
        .filter((n): n is string => !!n)
        .slice(0, 6),
    };
  });

  return { totalSeconds, entryCount, activeDays: allDays.size, projects };
}

function statsHash(stats: PeriodStats, prevTotal: number): string {
  return crypto
    .createHash('sha1')
    .update(
      JSON.stringify({
        t: stats.totalSeconds,
        c: stats.entryCount,
        p: stats.projects.map((p) => [p.projectId, p.seconds]),
        prev: prevTotal,
      }),
    )
    .digest('hex');
}

async function buildGlance(
  userId: string,
  periodType: 'day' | 'week',
  from: string,
  to: string,
  prevFrom: string,
  prevTo: string,
  periodKey: string,
  label: string,
) {
  const [stats, prevStats] = await Promise.all([
    periodStats(userId, from, to),
    periodStats(userId, prevFrom, prevTo),
  ]);

  let aiSummary: string | null = null;
  let aiTips: string | null = null;

  if (stats.totalSeconds > 0) {
    const hash = statsHash(stats, prevStats.totalSeconds);
    const cached = await GlanceSummary.findOne({ user: userId, periodType, periodKey });

    if (cached && cached.statsHash === hash && cached.aiSummary) {
      aiSummary = cached.aiSummary;
      aiTips = cached.aiTips ?? null;
    } else {
      const ai = await generateGlanceSummary({
        periodType,
        label,
        totalMinutes: Math.round(stats.totalSeconds / 60),
        previousTotalMinutes: Math.round(prevStats.totalSeconds / 60),
        entryCount: stats.entryCount,
        activeDays: stats.activeDays,
        projects: stats.projects.map((p) => ({
          name: p.name,
          minutes: Math.round(p.seconds / 60),
          taskNames: p.taskNames,
        })),
      });
      if (ai) {
        aiSummary = ai.summary;
        aiTips = ai.tips;
        await GlanceSummary.findOneAndUpdate(
          { user: userId, periodType, periodKey },
          {
            $set: { statsHash: hash, aiSummary, aiTips, generatedAt: new Date() },
          },
          { upsert: true },
        );
      } else if (cached?.aiSummary) {
        // Groq unavailable — serve the stale summary rather than nothing
        aiSummary = cached.aiSummary;
        aiTips = cached.aiTips ?? null;
      }
    }
  }

  return {
    periodType,
    periodKey,
    label,
    totalSeconds: stats.totalSeconds,
    previousTotalSeconds: prevStats.totalSeconds,
    entryCount: stats.entryCount,
    activeDays: stats.activeDays,
    projects: stats.projects,
    aiSummary,
    aiTips,
  };
}

export async function glanceDay(req: Request, res: Response) {
  const user = await User.findById(req.userId).select('timezone');
  const today = getDayKey(new Date(), user?.timezone ?? 'UTC');

  const date = (req.query.date as string | undefined) ?? today;
  if (!DAY_KEY_RE.test(date)) throw new HttpError(400, 'Invalid date');

  const isToday = date === today;
  const label = isToday ? 'Today' : date === shiftDayKey(today, -1) ? 'Yesterday' : date;

  res.json({
    glance: await buildGlance(
      req.userId,
      'day',
      date,
      date,
      shiftDayKey(date, -1),
      shiftDayKey(date, -1),
      date,
      label,
    ),
  });
}

export async function glanceWeek(req: Request, res: Response) {
  const user = await User.findById(req.userId).select('timezone');
  const today = getDayKey(new Date(), user?.timezone ?? 'UTC');

  const requested = (req.query.weekStart as string | undefined) ?? weekStartKey(today);
  if (!DAY_KEY_RE.test(requested)) throw new HttpError(400, 'Invalid weekStart');
  const start = weekStartKey(requested);
  const end = shiftDayKey(start, 6);
  const label =
    start === weekStartKey(today)
      ? 'This week'
      : start === shiftDayKey(weekStartKey(today), -7)
        ? 'Last week'
        : `Week of ${start}`;

  res.json({
    glance: await buildGlance(
      req.userId,
      'week',
      start,
      end,
      shiftDayKey(start, -7),
      shiftDayKey(start, -1),
      isoWeekKey(start),
      label,
    ),
  });
}
