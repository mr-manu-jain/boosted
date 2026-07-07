import type { NextFunction, Request, Response } from 'express';
import { COOKIE_NAME, verifyToken } from '../utils/jwt.js';

declare module 'express-serve-static-core' {
  interface Request {
    userId: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  try {
    const { userId } = verifyToken(token);
    req.userId = userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}
