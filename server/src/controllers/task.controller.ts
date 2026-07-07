import type { Request, Response } from 'express';
import { z } from 'zod';
import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { HttpError } from '../middleware/errorHandler.js';

const taskCreate = z.object({
  name: z.string().trim().min(1).max(120),
});

const taskUpdate = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  completed: z.boolean().optional(),
});

function serializeTask(t: {
  _id: unknown;
  project: unknown;
  name: string;
  completed: boolean;
  archived: boolean;
  createdAt?: Date;
}) {
  return {
    id: String(t._id),
    project: String(t.project),
    name: t.name,
    completed: t.completed,
    archived: t.archived,
    createdAt: t.createdAt?.toISOString() ?? null,
  };
}

export async function listTasks(req: Request, res: Response) {
  const tasks = await Task.find({
    user: req.userId,
    project: req.params.projectId,
    archived: false,
  }).sort({ completed: 1, createdAt: 1 });
  res.json({ tasks: tasks.map(serializeTask) });
}

export async function createTask(req: Request, res: Response) {
  const parsed = taskCreate.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid input');
  }
  const project = await Project.findOne({
    _id: req.params.projectId,
    user: req.userId,
    archived: false,
  });
  if (!project) throw new HttpError(404, 'Project not found');

  const task = await Task.create({
    name: parsed.data.name,
    project: project._id,
    user: req.userId,
  });
  res.status(201).json({ task: serializeTask(task) });
}

export async function updateTask(req: Request, res: Response) {
  const parsed = taskUpdate.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid input');
  }
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { $set: parsed.data },
    { new: true },
  );
  if (!task) throw new HttpError(404, 'Task not found');
  res.json({ task: serializeTask(task) });
}

export async function archiveTask(req: Request, res: Response) {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { $set: { archived: true } },
    { new: true },
  );
  if (!task) throw new HttpError(404, 'Task not found');
  res.json({ ok: true });
}
