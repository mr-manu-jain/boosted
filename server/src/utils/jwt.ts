import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { env } from '../config/env.js';

const COOKIE_NAME = 'boosted_token';
const MAX_AGE_DAYS = 30;

export interface TokenPayload {
  userId: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.authSecret, { expiresIn: `${MAX_AGE_DAYS}d` });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.authSecret) as TokenPayload;
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    maxAge: MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export { COOKIE_NAME };
