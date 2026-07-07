import type { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { TimeEntry } from '../models/TimeEntry.js';
import { HttpError } from '../middleware/errorHandler.js';

const projectInput = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export function serializeProject(p: {
  _id: unknown;
  name: string;
  color: string;
  archived: boolean;
  createdAt?: Date;
}) {
  return {
    id: String(p._id),
    name: p.name,
    color: p.color,
    archived: p.archived,
    createdAt: p.createdAt?.toISOString() ?? null,
  };
}

export async function listProjects(req: Request, res: Response) {
  const projects = await Project.find({ user: req.userId, archived: false }).sort({
    createdAt: 1,
  });
  res.json({ projects: projects.map(serializeProject) });
}

export async function createProject(req: Request, res: Response) {
  const parsed = projectInput.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid input');
  }
  const project = await Project.create({ ...parsed.data, user: req.userId });
  res.status(201).json({ project: serializeProject(project) });
}

export async function updateProject(req: Request, res: Response) {
  const parsed = projectInput.partial().safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid input');
  }
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { $set: parsed.data },
    { new: true },
  );
  if (!project) throw new HttpError(404, 'Project not found');
  res.json({ project: serializeProject(project) });
}

export async function projectStats(req: Request, res: Response) {
  const project = await Project.findOne({ _id: req.params.projectId, user: req.userId });
  if (!project) throw new HttpError(404, 'Project not found');

  const rows = await TimeEntry.aggregate<{
    _id: string | null;
    seconds: number;
  }>([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.userId),
        project: project._id,
        endTime: { $ne: null },
      },
    },
    { $group: { _id: '$task', seconds: { $sum: '$durationSeconds' } } },
  ]);

  let totalSeconds = 0;
  const byTask: Record<string, number> = {};
  for (const row of rows) {
    totalSeconds += row.seconds;
    if (row._id) byTask[String(row._id)] = row.seconds;
  }
  res.json({ totalSeconds, byTask });
}

export async function archiveProject(req: Request, res: Response) {
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { $set: { archived: true } },
    { new: true },
  );
  if (!project) throw new HttpError(404, 'Project not found');
  res.json({ ok: true });
}
