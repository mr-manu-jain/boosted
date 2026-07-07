import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { HttpError } from '../middleware/errorHandler.js';
import { clearAuthCookie, setAuthCookie, signToken } from '../utils/jwt.js';

const signupSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  timezone: z.string().min(1).max(64).default('UTC'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function publicUser(user: { _id: unknown; name: string; email: string; timezone?: string | null }) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    timezone: user.timezone ?? 'UTC',
  };
}

export async function signup(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid input');
  }
  const { name, email, password, timezone } = parsed.data;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, timezone });

  setAuthCookie(res, signToken({ userId: String(user._id) }));
  res.status(201).json({ user: publicUser(user) });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid email or password');
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }

  setAuthCookie(res, signToken({ userId: String(user._id) }));
  res.json({ user: publicUser(user) });
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  res.json({ ok: true });
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) {
    throw new HttpError(401, 'Not authenticated');
  }
  res.json({ user: publicUser(user) });
}
