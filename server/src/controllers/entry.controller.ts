import type { Request, Response } from 'express';
import { z } from 'zod';
import { TimeEntry } from '../models/TimeEntry.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { HttpError } from '../middleware/errorHandler.js';
import { getDayKey } from '../utils/dateKey.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const startInput = z.object({
  projectId: objectId,
  taskId: objectId.nullish(),
});

const manualInput = z.object({
  projectId: objectId,
  taskId: objectId.nullish(),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  note: z.string().trim().max(500).nullish(),
});

const updateInput = z.object({
  projectId: objectId.optional(),
  taskId: objectId.nullish().optional(),
  startTime: z.string().datetime({ offset: true }).optional(),
  endTime: z.string().datetime({ offset: true }).optional(),
  note: z.string().trim().max(500).nullish().optional(),
});

async function userTimezone(userId: string): Promise<string> {
  const user = await User.findById(userId).select('timezone');
  return user?.timezone ?? 'UTC';
}

interface PopulatedEntry {
  _id: unknown;
  project: { _id: unknown; name: string; color: string } | null;
  task: { _id: unknown; name: string } | null;
  startTime: Date;
  endTime: Date | null;
  durationSeconds: number | null;
  dayKey: string;
  note: string | null;
}

function serializeEntry(e: PopulatedEntry) {
  return {
    id: String(e._id),
    project: e.project
      ? { id: String(e.project._id), name: e.project.name, color: e.project.color }
      : null,
    task: e.task ? { id: String(e.task._id), name: e.task.name } : null,
    startTime: e.startTime.toISOString(),
    endTime: e.endTime?.toISOString() ?? null,
    durationSeconds: e.durationSeconds,
    dayKey: e.dayKey,
    note: e.note ?? null,
  };
}

const populateFields = [
  { path: 'project', select: 'name color' },
  { path: 'task', select: 'name' },
];

async function verifyProjectAndTask(
  userId: string,
  projectId: string,
  taskId: string | null | undefined,
) {
  const project = await Project.findOne({ _id: projectId, user: userId, archived: false });
  if (!project) throw new HttpError(404, 'Project not found');
  if (taskId) {
    const task = await Task.findOne({ _id: taskId, project: projectId, user: userId });
    if (!task) throw new HttpError(404, 'Task not found in this project');
  }
}

/** Close the running entry, if any. Returns the closed entry or null. */
async function stopRunning(userId: string, timezone: string) {
  const running = await TimeEntry.findOne({ user: userId, endTime: null });
  if (!running) return null;
  const now = new Date();
  running.endTime = now;
  running.durationSeconds = Math.max(
    1,
    Math.round((now.getTime() - running.startTime.getTime()) / 1000),
  );
  running.dayKey = getDayKey(running.startTime, timezone);
  await running.save();
  return running;
}

export async function getRunning(req: Request, res: Response) {
  const running = await TimeEntry.findOne({ user: req.userId, endTime: null }).populate(
    populateFields,
  );
  if (!running) {
    res.json({ running: null });
    return;
  }
  const e = running as unknown as PopulatedEntry;
  res.json({
    running: {
      id: String(e._id),
      projectId: e.project ? String(e.project._id) : null,
      projectName: e.project?.name ?? null,
      projectColor: e.project?.color ?? null,
      taskId: e.task ? String(e.task._id) : null,
      taskName: e.task?.name ?? null,
      startTime: e.startTime.toISOString(),
    },
  });
}

export async function startEntry(req: Request, res: Response) {
  const parsed = startInput.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, 'Invalid input');
  const { projectId, taskId } = parsed.data;

  await verifyProjectAndTask(req.userId, projectId, taskId);
  const timezone = await userTimezone(req.userId);
  await stopRunning(req.userId, timezone);

  const now = new Date();
  const entry = await TimeEntry.create({
    user: req.userId,
    project: projectId,
    task: taskId ?? null,
    startTime: now,
    endTime: null,
    durationSeconds: null,
    dayKey: getDayKey(now, timezone),
  });
  const populated = await entry.populate(populateFields);
  res.status(201).json({ entry: serializeEntry(populated as unknown as PopulatedEntry) });
}

export async function stopEntry(req: Request, res: Response) {
  const running = await TimeEntry.findOne({
    _id: req.params.id,
    user: req.userId,
    endTime: null,
  });
  if (!running) throw new HttpError(404, 'No running entry with this id');

  const timezone = await userTimezone(req.userId);
  const now = new Date();
  running.endTime = now;
  running.durationSeconds = Math.max(
    1,
    Math.round((now.getTime() - running.startTime.getTime()) / 1000),
  );
  running.dayKey = getDayKey(running.startTime, timezone);
  await running.save();

  const populated = await running.populate(populateFields);
  res.json({ entry: serializeEntry(populated as unknown as PopulatedEntry) });
}

export async function listEntries(req: Request, res: Response) {
  const { from, to, projectId, limit } = req.query as Record<string, string | undefined>;
  const filter: Record<string, unknown> = { user: req.userId, endTime: { $ne: null } };
  if (projectId && objectId.safeParse(projectId).success) filter.project = projectId;
  if (from || to) {
    const dayKey: Record<string, string> = {};
    if (from) dayKey.$gte = from;
    if (to) dayKey.$lte = to;
    filter.dayKey = dayKey;
  }

  const entries = await TimeEntry.find(filter)
    .sort({ startTime: -1 })
    .limit(Math.min(Number(limit) || 200, 500))
    .populate(populateFields);
  res.json({ entries: entries.map((e) => serializeEntry(e as unknown as PopulatedEntry)) });
}

export async function createManualEntry(req: Request, res: Response) {
  const parsed = manualInput.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, 'Invalid input');
  const { projectId, taskId, startTime, endTime, note } = parsed.data;

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (end <= start) throw new HttpError(400, 'End time must be after start time');
  if (end.getTime() - start.getTime() > 24 * 3600 * 1000) {
    throw new HttpError(400, 'An entry cannot be longer than 24 hours');
  }

  await verifyProjectAndTask(req.userId, projectId, taskId);
  const timezone = await userTimezone(req.userId);

  const entry = await TimeEntry.create({
    user: req.userId,
    project: projectId,
    task: taskId ?? null,
    startTime: start,
    endTime: end,
    durationSeconds: Math.round((end.getTime() - start.getTime()) / 1000),
    dayKey: getDayKey(start, timezone),
    note: note ?? null,
  });
  const populated = await entry.populate(populateFields);
  res.status(201).json({ entry: serializeEntry(populated as unknown as PopulatedEntry) });
}

export async function updateEntry(req: Request, res: Response) {
  const parsed = updateInput.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, 'Invalid input');

  const entry = await TimeEntry.findOne({
    _id: req.params.id,
    user: req.userId,
    endTime: { $ne: null },
  });
  if (!entry) throw new HttpError(404, 'Entry not found');

  const { projectId, taskId, startTime, endTime, note } = parsed.data;
  if (projectId) {
    await verifyProjectAndTask(req.userId, projectId, taskId ?? undefined);
    entry.project = projectId as never;
  }
  if (taskId !== undefined) entry.task = (taskId ?? null) as never;
  if (startTime) entry.startTime = new Date(startTime);
  if (endTime) entry.endTime = new Date(endTime);
  if (note !== undefined) entry.note = note ?? null;

  if (!entry.endTime || entry.endTime <= entry.startTime) {
    throw new HttpError(400, 'End time must be after start time');
  }
  const timezone = await userTimezone(req.userId);
  entry.durationSeconds = Math.round(
    (entry.endTime.getTime() - entry.startTime.getTime()) / 1000,
  );
  entry.dayKey = getDayKey(entry.startTime, timezone);
  await entry.save();

  const populated = await entry.populate(populateFields);
  res.json({ entry: serializeEntry(populated as unknown as PopulatedEntry) });
}

export async function deleteEntry(req: Request, res: Response) {
  const result = await TimeEntry.deleteOne({ _id: req.params.id, user: req.userId });
  if (result.deletedCount === 0) throw new HttpError(404, 'Entry not found');
  res.json({ ok: true });
}
